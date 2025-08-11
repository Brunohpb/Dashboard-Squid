from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import logging
import re
import csv
import io
from urllib.parse import urlparse
from typing import List


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BLOCKED_FILE = "blocked_sites.txt"

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],  
)

class URLRequest(BaseModel):
    url: str

class BulkURLRequest(BaseModel):
    urls: List[str]

def is_valid_ip(ip):
    """Valida se é um IP válido (IPv4 ou IPv6)"""
    
    ipv4_pattern = r'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
    
    
    ipv6_pattern = r'^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$'
    
    return bool(re.match(ipv4_pattern, ip)) or bool(re.match(ipv6_pattern, ip))

def is_valid_domain(domain):
    """Valida se é um domínio válido"""
    
    if domain.startswith('http://') or domain.startswith('https://'):
        domain = domain.split('://', 1)[1]
    if domain.startswith('www.'):
        domain = domain[4:]
    
    
    domain_pattern = r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'
    
    return bool(re.match(domain_pattern, domain))

def validate_url_entry(entry):
    """Valida uma entrada de URL/IP e retorna o formato limpo"""
    entry = entry.strip()
    
    
    if not entry or entry.startswith('#'):
        return None
    
    
    if is_valid_ip(entry):
        return entry
    
    
    if is_valid_domain(entry):
        
        if entry.startswith('http://') or entry.startswith('https://'):
            domain = entry.split('://', 1)[1]
        else:
            domain = entry
        
        if domain.startswith('www.'):
            domain = domain[4:]
        
        return domain
    
    return None

def is_subdomain(url1, url2):
    """Verifica se url1 é subdomínio de url2"""
    
    def clean_url(url):
        if url.startswith('http://') or url.startswith('https://'):
            url = url.split('://', 1)[1]
        if url.startswith('www.'):
            url = url[4:]
        return url.lower()
    
    clean_url1 = clean_url(url1)
    clean_url2 = clean_url(url2)
    
    
    if clean_url1.endswith('.' + clean_url2) or clean_url1 == clean_url2:
        return True
    
    
    if clean_url2.endswith('.' + clean_url1) or clean_url2 == clean_url1:
        return True
    
    return False

def check_url_conflicts(new_url):
    """Verifica se a nova URL conflita com URLs existentes"""
    try:
        with open(BLOCKED_FILE, "r") as f:
            existing_urls = [line.strip() for line in f if line.strip()]
        
        conflicts = []
        for existing_url in existing_urls:
            if is_subdomain(new_url, existing_url):
                conflicts.append(existing_url)
        
        return conflicts
    except FileNotFoundError:
        return []

def run_cmd(cmd):
    logger.info(f"Executando comando: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    logger.info(f"Comando retornou: {result.returncode}")
    if result.stderr:
        logger.error(f"Erro: {result.stderr}")
    return result

def restart_squid():
    """Reinicia o container do Squid"""
    try:
        logger.info("Reiniciando container do Squid...")
        result = run_cmd("docker restart squid")
        if result.returncode != 0:
            logger.error(f"Erro ao reiniciar Squid: {result.stderr}")
            raise HTTPException(status_code=500, detail=f"Erro ao reiniciar Squid: {result.stderr}")
        

        import time
        time.sleep(5)
        logger.info("Squid reiniciado com sucesso")
        return True
    except Exception as e:
        logger.error(f"Exceção ao reiniciar Squid: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

def reload_squid():
    try:
        
        logger.info("Verificando se o Squid está rodando...")
        check_result = run_cmd("docker exec squid ps aux | grep -v grep | grep squid")
        
        if check_result.returncode != 0 or "squid" not in check_result.stdout:
            logger.warning("Squid não está rodando. Tentando iniciar...")
            start_result = run_cmd("docker start squid")
            if start_result.returncode != 0:
                logger.error(f"Erro ao iniciar Squid: {start_result.stderr}")
                raise HTTPException(status_code=500, detail=f"Erro ao iniciar Squid: {start_result.stderr}")
            

            import time
            time.sleep(3)
            logger.info("Squid iniciado com sucesso")
        
        
        logger.info("Recarregando configuração do Squid...")
        result = run_cmd("docker exec squid squid -k reconfigure")
        
       
        if result.stderr and "WARNING" in result.stderr:
            logger.warning(f"Warnings do Squid (não críticos): {result.stderr}")
        
        
        if result.returncode == 0 or (result.stderr and "WARNING" in result.stderr and "ERROR" not in result.stderr):
            logger.info("Squid recarregado com sucesso")
            return

        if result.returncode != 0 and "No running copy" in result.stderr:
            logger.warning("Squid não está rodando. Tentando reiniciar container...")
            return restart_squid()
        

        if result.returncode != 0:
            logger.error(f"Erro ao recarregar Squid: {result.stderr}")
            raise HTTPException(status_code=500, detail=f"Erro ao recarregar Squid: {result.stderr}")
            
    except Exception as e:
        logger.error(f"Exceção ao recarregar Squid: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

def process_txt_file(file_content: str):
    """Processa arquivo TXT e retorna URLs válidas"""
    lines = file_content.split('\n')
    valid_urls = []
    invalid_entries = []
    
    for line_num, line in enumerate(lines, 1):
        entry = line.strip()
        if not entry or entry.startswith('#'):
            continue
            
        validated = validate_url_entry(entry)
        if validated:
            valid_urls.append(validated)
        else:
            invalid_entries.append(f"Linha {line_num}: {entry}")
    
    return valid_urls, invalid_entries

def process_csv_file(file_content: str):
    """Processa arquivo CSV e retorna URLs válidas"""
    valid_urls = []
    invalid_entries = []
    
    try:
        csv_reader = csv.reader(io.StringIO(file_content))
        for row_num, row in enumerate(csv_reader, 1):
            if not row:  
                continue
                
            
            entry = row[0].strip() if row else ""
            if not entry or entry.startswith('#'):
                continue
                
            validated = validate_url_entry(entry)
            if validated:
                valid_urls.append(validated)
            else:
                invalid_entries.append(f"Linha {row_num}: {entry}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar CSV: {str(e)}")
    
    return valid_urls, invalid_entries

def add_urls_in_bulk(urls: List[str]):
    """Adiciona múltiplas URLs verificando conflitos"""
    added_urls = []
    failed_urls = []
    conflicts = []
    
    
    try:
        with open(BLOCKED_FILE, "r") as f:
            existing_urls = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        existing_urls = []
    
    
    for url in urls:
        
        if url in existing_urls:
            failed_urls.append({"url": url, "reason": "Already exists"})
            continue
        
        
        url_conflicts = []
        for existing_url in existing_urls:
            if is_subdomain(url, existing_url):
                url_conflicts.append(existing_url)
        
        if url_conflicts:
            conflicts.append({"url": url, "conflicts": url_conflicts})
            failed_urls.append({"url": url, "reason": f"Conflicts with: {', '.join(url_conflicts)}"})
            continue
        
        
        for other_url in urls:
            if other_url != url and is_subdomain(url, other_url):
                failed_urls.append({"url": url, "reason": f"Conflicts with URL in batch: {other_url}"})
                break
        else:
            added_urls.append(url)
    
    
    if added_urls:
        with open(BLOCKED_FILE, "a") as f:
            for url in added_urls:
                f.write(f"{url}\n")
        
        
        try:
            reload_squid()
        except HTTPException as e:
            
            with open(BLOCKED_FILE, "r") as f:
                lines = f.readlines()
            with open(BLOCKED_FILE, "w") as f:
                f.writelines([line for line in lines if line.strip() not in added_urls])
            
            raise HTTPException(
                status_code=500,
                detail=f"Failed to reload Squid. No URLs were added: {e.detail}"
            )
    
    return {
        "added": added_urls,
        "failed": failed_urls,
        "conflicts": conflicts,
        "total_processed": len(urls),
        "successfully_added": len(added_urls)
    }

@app.post("/api/v1/squid/service/{action}")
def control_service(action: str):
    if action not in ["start", "stop", "restart"]:
        raise HTTPException(status_code=400, detail="Invalid action.")
    
    try:
        result = run_cmd(f"docker {action} squid")
        if result.returncode != 0:
            logger.error(f"Erro ao {action} o Squid: {result.stderr}")
            raise HTTPException(status_code=500, detail=f"Erro ao {action} o Squid: {result.stderr}")
        logger.info(f"Squid {action} com sucesso")
        return {"status": "success", "message": f"Squid service {action}ed."}
    except Exception as e:
        logger.error(f"Exceção ao {action} o Squid: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/api/v1/squid/status")
def get_squid_status():
    """Verifica o status do Squid"""
    try:

        container_result = run_cmd("docker ps --filter name=squid --format '{{.Status}}'")

        process_result = run_cmd("docker exec squid ps aux | grep -v grep | grep squid")

        config_check_result = run_cmd("docker exec squid squid -k parse")

        logs_result = run_cmd("docker logs squid --tail 10")
        
        container_running = container_result.returncode == 0 and "Up" in container_result.stdout
        squid_process_running = process_result.returncode == 0 and "squid" in process_result.stdout
        config_valid = config_check_result.returncode == 0

        config_errors = []
        if not config_valid:
            config_errors.append("Invalid configuration")

        if "ERROR" in logs_result.stdout or "FATAL" in logs_result.stdout:
            config_errors.append("Configuration errors detected in logs")
        
        status = {
            "container_running": container_running,
            "squid_process_running": squid_process_running,
            "config_valid": config_valid,
            "container_status": container_result.stdout.strip() if container_result.returncode == 0 else "Not running",
            "squid_processes": process_result.stdout.strip() if process_result.returncode == 0 else "No processes found",
            "config_errors": config_errors,
            "overall_status": "healthy" if (container_running and squid_process_running and config_valid) else "unhealthy"
        }
        
        return status
    except Exception as e:
        logger.error(f"Erro ao verificar status do Squid: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao verificar status: {str(e)}")

@app.get("/api/v1/squid/blocklist")
def get_blocked_urls():
    try:
        with open(BLOCKED_FILE) as f:
            return {"blocked_urls": [line.strip() for line in f if line.strip()]}
    except FileNotFoundError:
        return {"blocked_urls": []}

@app.post("/api/v1/squid/blocklist")
def add_url(req: URLRequest):

    with open(BLOCKED_FILE, "a+") as f:
        f.seek(0)
        existing_urls = [line.strip() for line in f if line.strip()]
        if req.url in existing_urls:
            raise HTTPException(status_code=409, detail="URL already blocked.")
    

    conflicts = check_url_conflicts(req.url)
    if conflicts:
        raise HTTPException(
            status_code=409, 
            detail=f"URL conflicts with existing blocked sites: {', '.join(conflicts)}"
        )
    

    with open(BLOCKED_FILE, "a") as f:
        f.write(f"{req.url}\n")
    

    try:
        reload_squid()
        return {"status": "success", "message": f"{req.url} blocked."}
    except HTTPException as e:

        with open(BLOCKED_FILE, "r") as f:
            lines = f.readlines()
        with open(BLOCKED_FILE, "w") as f:
            f.writelines([line for line in lines if line.strip() != req.url])
        
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to reload Squid configuration. URL was not added: {e.detail}"
        )

@app.delete("/api/v1/squid/blocklist")
def remove_url(req: URLRequest):
    try:
        with open(BLOCKED_FILE, "r") as f:
            lines = f.readlines()
        with open(BLOCKED_FILE, "w") as f:
            updated = [line for line in lines if line.strip() != req.url]
            if len(updated) == len(lines):
                raise HTTPException(status_code=404, detail="URL not found.")
            f.writelines(updated)
        reload_squid()
        return {"status": "success", "message": f"{req.url} unblocked."}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Blocked list not found.")

@app.delete("/api/v1/squid/blocklist/bulk")
def remove_urls_bulk(req: BulkURLRequest):
    """Remove múltiplas URLs de uma vez"""
    if not req.urls:
        raise HTTPException(status_code=400, detail="Lista de URLs não pode estar vazia")
    
    try:
        
        with open(BLOCKED_FILE, "r") as f:
            lines = f.readlines()
            existing_urls = [line.strip() for line in lines if line.strip()]
        
        
        urls_to_remove = []
        urls_not_found = []
        
        for url in req.urls:
            if url in existing_urls:
                urls_to_remove.append(url)
            else:
                urls_not_found.append(url)
        
        if not urls_to_remove:
            return {
                "status": "error",
                "message": "Nenhuma das URLs fornecidas foi encontrada na lista de bloqueio",
                "not_found": urls_not_found
            }
        
        
        updated_lines = [line for line in lines if line.strip() not in urls_to_remove]
        
        
        with open(BLOCKED_FILE, "w") as f:
            f.writelines(updated_lines)
        
        
        try:
            reload_squid()
        except HTTPException as e:
            
            with open(BLOCKED_FILE, "w") as f:
                f.writelines(lines)
            raise HTTPException(
                status_code=500,
                detail=f"Falha ao recarregar Squid. URLs não foram removidas: {e.detail}"
            )
        
        return {
            "status": "success",
            "message": f"Processamento concluído. {len(urls_to_remove)} URLs removidas.",
            "removed": urls_to_remove,
            "not_found": urls_not_found,
            "total_requested": len(req.urls),
            "successfully_removed": len(urls_to_remove)
        }
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Lista de bloqueio não encontrada.")
    except Exception as e:
        logger.error(f"Erro ao remover URLs em lote: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.post("/api/v1/squid/blocklist/bulk/txt")
async def upload_txt_file(file: UploadFile = File(...)):
    """Upload de arquivo TXT com URLs para bloquear"""
    if not file.filename.endswith('.txt'):
        raise HTTPException(status_code=400, detail="Arquivo deve ser .txt")
    
    try:
        content = await file.read()
        file_content = content.decode('utf-8')
        

        valid_urls, invalid_entries = process_txt_file(file_content)
        
        if not valid_urls:
            return {
                "status": "error",
                "message": "Nenhuma URL válida encontrada no arquivo",
                "invalid_entries": invalid_entries
            }
        

        result = add_urls_in_bulk(valid_urls)
        
        return {
            "status": "success",
            "message": f"Processamento concluído. {result['successfully_added']} URLs adicionadas.",
            "result": result,
            "invalid_entries": invalid_entries
        }
        
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Arquivo deve estar em UTF-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar arquivo: {str(e)}")

@app.post("/api/v1/squid/blocklist/bulk/csv")
async def upload_csv_file(file: UploadFile = File(...)):
    """Upload de arquivo CSV com URLs para bloquear"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Arquivo deve ser .csv")
    
    try:
        content = await file.read()
        file_content = content.decode('utf-8')
        

        valid_urls, invalid_entries = process_csv_file(file_content)
        
        if not valid_urls:
            return {
                "status": "error",
                "message": "Nenhuma URL válida encontrada no arquivo",
                "invalid_entries": invalid_entries
            }
        

        result = add_urls_in_bulk(valid_urls)
        
        return {
            "status": "success",
            "message": f"Processamento concluído. {result['successfully_added']} URLs adicionadas.",
            "result": result,
            "invalid_entries": invalid_entries
        }
        
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Arquivo deve estar em UTF-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar arquivo: {str(e)}")

@app.post("/api/v1/squid/blocklist/bulk/json")
def add_urls_json(req: BulkURLRequest):
    """Adiciona múltiplas URLs via JSON"""
    if not req.urls:
        raise HTTPException(status_code=400, detail="Lista de URLs não pode estar vazia")
    
    # Validar URLs
    valid_urls = []
    invalid_entries = []
    
    for url in req.urls:
        validated = validate_url_entry(url)
        if validated:
            valid_urls.append(validated)
        else:
            invalid_entries.append(url)
    
    if not valid_urls:
        return {
            "status": "error",
            "message": "Nenhuma URL válida fornecida",
            "invalid_entries": invalid_entries
        }
    
    # Adicionar URLs em lote
    result = add_urls_in_bulk(valid_urls)
    
    return {
        "status": "success",
        "message": f"Processamento concluído. {result['successfully_added']} URLs adicionadas.",
        "result": result,
        "invalid_entries": invalid_entries
    }

@app.get("/api/v1/squid/logs/access")
def get_access_logs(lines: int = 100, filter_ip: str = None, filter_url: str = None):
    """Obtém logs de acesso do Squid"""
    try:

        container_check = run_cmd("docker ps --filter name=squid --format '{{.Status}}'")
        if container_check.returncode != 0 or "Up" not in container_check.stdout:
            raise HTTPException(status_code=503, detail="Container do Squid não está rodando")
        

        cmd = f"docker exec squid tail -n {lines} /var/log/squid/access.log"
        

        if filter_ip:
            cmd += f" | grep '{filter_ip}'"
        if filter_url:
            cmd += f" | grep '{filter_url}'"
        
        result = run_cmd(cmd)
        
        if result.returncode != 0:
            if "No such file or directory" in result.stderr:
                raise HTTPException(status_code=404, detail="Arquivo de log de acesso não encontrado")
            elif "Container" in result.stderr and "is not running" in result.stderr:
                raise HTTPException(status_code=503, detail="Container do Squid não está rodando")
            else:
                raise HTTPException(status_code=500, detail=f"Erro ao ler logs: {result.stderr}")
        

        log_entries = []
        for line in result.stdout.strip().split('\n'):
            if line.strip():
                try:

                    parts = line.split()
                    if len(parts) >= 7:
                        log_entry = {
                            "timestamp": f"{parts[0]} {parts[1]}",
                            "duration": parts[2],
                            "client_ip": parts[3],
                            "result_code": parts[4],
                            "bytes": parts[5],
                            "method": parts[6],
                            "url": parts[7] if len(parts) > 7 else "",
                            "user": parts[8] if len(parts) > 8 else "",
                            "hierarchy_code": parts[9] if len(parts) > 9 else "",
                            "content_type": parts[10] if len(parts) > 10 else "",
                            "raw_line": line
                        }
                        log_entries.append(log_entry)
                    else:
                        log_entries.append({"raw_line": line, "parse_error": "Formato inválido"})
                except Exception as e:
                    log_entries.append({"raw_line": line, "parse_error": str(e)})
        
        return {
            "status": "success",
            "log_type": "access",
            "lines_requested": lines,
            "lines_returned": len(log_entries),
            "filters_applied": {
                "ip": filter_ip,
                "url": filter_url
            },
            "logs": log_entries
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter logs de acesso: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/api/v1/squid/logs/cache")
def get_cache_logs(lines: int = 100, filter_level: str = None, filter_message: str = None):
    """Obtém logs de cache do Squid"""
    try:

        container_check = run_cmd("docker ps --filter name=squid --format '{{.Status}}'")
        if container_check.returncode != 0 or "Up" not in container_check.stdout:
            raise HTTPException(status_code=503, detail="Container do Squid não está rodando")
        

        cmd = f"docker exec squid tail -n {lines} /var/log/squid/cache.log"
        

        if filter_level:
            cmd += f" | grep '{filter_level.upper()}'"
        if filter_message:
            cmd += f" | grep '{filter_message}'"
        
        result = run_cmd(cmd)
        
        if result.returncode != 0:
            if "No such file or directory" in result.stderr:
                raise HTTPException(status_code=404, detail="Arquivo de log de cache não encontrado")
            elif "Container" in result.stderr and "is not running" in result.stderr:
                raise HTTPException(status_code=503, detail="Container do Squid não está rodando")
            else:
                raise HTTPException(status_code=500, detail=f"Erro ao ler logs: {result.stderr}")
        
        log_entries = []
        for line in result.stdout.strip().split('\n'):
            if line.strip():
                try:
                    if '|' in line:
                        parts = line.split('|', 2)
                        if len(parts) >= 3:
                            log_entry = {
                                "timestamp": parts[0].strip(),
                                "level": parts[1].strip(),
                                "message": parts[2].strip(),
                                "raw_line": line
                            }
                        else:
                            log_entry = {"raw_line": line, "parse_error": "Formato inválido"}
                    else:
                        parts = line.split()
                        if len(parts) >= 2:
                            log_entry = {
                                "timestamp": f"{parts[0]} {parts[1]}",
                                "level": parts[2] if len(parts) > 2 else "INFO",
                                "message": " ".join(parts[3:]) if len(parts) > 3 else "",
                                "raw_line": line
                            }
                        else:
                            log_entry = {"raw_line": line, "parse_error": "Formato inválido"}
                    
                    log_entries.append(log_entry)
                except Exception as e:
                    log_entries.append({"raw_line": line, "parse_error": str(e)})
        
        return {
            "status": "success",
            "log_type": "cache",
            "lines_requested": lines,
            "lines_returned": len(log_entries),
            "filters_applied": {
                "level": filter_level,
                "message": filter_message
            },
            "logs": log_entries
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter logs de cache: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/api/v1/squid/logs/raw/access")
def get_raw_access_logs(lines: int = 100):
    """Obtém logs de acesso brutos (sem parsing)"""
    try:
        cmd = f"docker exec squid tail -n {lines} /var/log/squid/access.log"
        result = run_cmd(cmd)
        
        if result.returncode != 0:
            if "No such file or directory" in result.stderr:
                raise HTTPException(status_code=404, detail="Arquivo de log de acesso não encontrado")
            else:
                raise HTTPException(status_code=500, detail=f"Erro ao ler logs: {result.stderr}")
        
        return {
            "status": "success",
            "log_type": "access_raw",
            "lines_requested": lines,
            "lines_returned": len(result.stdout.strip().split('\n')),
            "raw_logs": result.stdout.strip().split('\n')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter logs brutos de acesso: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/api/v1/squid/logs/raw/cache")
def get_raw_cache_logs(lines: int = 100):
    """Obtém logs de cache brutos (sem parsing)"""
    try:
        cmd = f"docker exec squid tail -n {lines} /var/log/squid/cache.log"
        result = run_cmd(cmd)
        
        if result.returncode != 0:
            if "No such file or directory" in result.stderr:
                raise HTTPException(status_code=404, detail="Arquivo de log de cache não encontrado")
            else:
                raise HTTPException(status_code=500, detail=f"Erro ao ler logs: {result.stderr}")
        
        return {
            "status": "success",
            "log_type": "cache_raw",
            "lines_requested": lines,
            "lines_returned": len(result.stdout.strip().split('\n')),
            "raw_logs": result.stdout.strip().split('\n')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter logs brutos de cache: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")
