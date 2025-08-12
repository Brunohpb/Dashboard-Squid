# 🦑 Squid Proxy Manager Backend

Uma aplicação para gerenciar o proxy Squid com uma API REST completa, permitindo controle de listas de bloqueio, monitoramento de logs e gerenciamento de serviços.

## 🚀 Visão Geral

O Squid Proxy Manager é uma solução completa que combina o proxy Squid com uma API FastAPI para facilitar o gerenciamento de listas de bloqueio, monitoramento de logs e controle de serviços. A aplicação é containerizada com Docker para fácil implantação e gerenciamento.

## 🏗️ Arquitetura

- **Squid Proxy**: Servidor proxy HTTP/HTTPS na porta 3128
- **API FastAPI**: Interface REST na porta 8000
- **Docker Compose**: Orquestração dos serviços

## 📋 Pré-requisitos

- Docker
- Docker Compose
- Portas 3128 e 8000 disponíveis

## 🚀 Instalação e Execução

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd projeto-squid
```

### 2. Execute com Docker Compose
```bash
docker-compose up -d
```

### 3. Verifique o status
```bash
curl http://localhost:8000/api/v1/squid/status
```

## 🔧 Endpoints da API

### Base URL
```
http://localhost:8000/api/v1/squid
```

### 📊 Status e Controle de Serviço

#### GET `/status`
Retorna o status atual do serviço Squid.

**Resposta:**
```json
{
  "status": "running",
  "pid": 12345,
  "uptime": "2h 30m",
  "version": "4.17",
  "connections": 15
}
```

#### POST `/service/{action}`
Controla o serviço Squid.

**Parâmetros:**
- `action`: `start`, `stop`, `restart`, `reload`

**Exemplo:**
```bash
curl -X POST http://localhost:8000/api/v1/squid/service/restart
```

### 🚫 Gerenciamento de Lista de Bloqueio

#### GET `/blocklist`
Retorna todas as URLs/IPs bloqueados.

**Resposta:**
```json
{
  "blocked_urls": [
    "exemplo.com",
    "192.168.1.100",
    "malicioso.org"
  ],
  "total": 3
}
```

#### POST `/blocklist`
Adiciona uma URL/IP à lista de bloqueio.

**Corpo da requisição:**
```json
{
  "url": "exemplo.com"
}
```

**Resposta:**
```json
{
  "message": "URL adicionada com sucesso",
  "url": "exemplo.com",
  "status": "blocked"
}
```

#### DELETE `/blocklist`
Remove uma URL/IP da lista de bloqueio.

**Corpo da requisição:**
```json
{
  "url": "exemplo.com"
}
```

**Resposta:**
```json
{
  "message": "URL removida com sucesso",
  "url": "exemplo.com",
  "status": "unblocked"
}
```

### 📦 Operações em Lote

#### POST `/blocklist/bulk/json`
Adiciona múltiplas URLs em lote via JSON.

**Corpo da requisição:**
```json
{
  "urls": [
    "site1.com",
    "site2.org",
    "192.168.1.200"
  ]
}
```

**Resposta:**
```json
{
  "message": "URLs processadas em lote",
  "added": 3,
  "skipped": 0,
  "errors": []
}
```

#### POST `/blocklist/bulk/txt`
Faz upload de arquivo TXT com URLs para bloqueio.

**Formato do arquivo:**
```
site1.com
site2.org
192.168.1.200
# Comentários são ignorados
```

**Exemplo:**
```bash
curl -X POST http://localhost:8000/api/v1/squid/blocklist/bulk/txt \
  -F "file=@urls.txt"
```

#### POST `/blocklist/bulk/csv`
Faz upload de arquivo CSV com URLs para bloqueio.

**Formato do arquivo:**
```csv
url,description
site1.com,Site malicioso
site2.org,Spam
192.168.1.200,IP suspeito
```

**Exemplo:**
```bash
curl -X POST http://localhost:8000/api/v1/squid/blocklist/bulk/csv \
  -F "file=@urls.csv"
```

#### DELETE `/blocklist/bulk`
Remove múltiplas URLs em lote.

**Corpo da requisição:**
```json
{
  "urls": [
    "site1.com",
    "site2.org"
  ]
}
```

### 📝 Logs e Monitoramento

#### GET `/logs/access`
Retorna logs de acesso filtrados.

**Parâmetros de query:**
- `lines`: Número de linhas (padrão: 100)
- `filter_ip`: Filtrar por IP específico
- `filter_url`: Filtrar por URL específica

**Exemplo:**
```bash
curl "http://localhost:8000/api/v1/squid/logs/access?lines=50&filter_ip=192.168.1.100"
```

#### GET `/logs/cache`
Retorna logs de cache filtrados.

**Parâmetros de query:**
- `lines`: Número de linhas (padrão: 100)
- `filter_level`: Filtrar por nível de log
- `filter_message`: Filtrar por mensagem específica

#### GET `/logs/raw/access`
Retorna logs de acesso brutos.

**Parâmetros de query:**
- `lines`: Número de linhas (padrão: 100)

#### GET `/logs/raw/cache`
Retorna logs de cache brutos.

**Parâmetros de query:**
- `lines`: Número de linhas (padrão: 100)

## 🔍 Validação de URLs

A API valida automaticamente as entradas:

- **Domínios**: Aceita domínios com ou sem protocolo (http/https)
- **IPs**: Suporta IPv4 e IPv6
- **Subdomínios**: Detecta e gerencia conflitos
- **Limpeza**: Remove www. e protocolos automaticamente

## 🧪 Testes

Execute o script de teste para verificar todas as funcionalidades:

```bash
./build+test.sh
```

Este script testa:
- Status do serviço
- Adição/remoção de URLs
- Operações em lote
- Funcionalidade do Docker CLI

## 📁 Estrutura de Arquivos

```
projeto-squid/
├── api/
│   ├── main.py              # API FastAPI
│   ├── requirements.txt     # Dependências Python
│   ├── Dockerfile          # Container da API
│   └── blocked_sites.txt   # Lista de bloqueio
├── squid/
│   ├── squid.conf          # Configuração do Squid
│   └── blocked_page.html   # Página de erro personalizada
├── docker-compose.yml      # Orquestração dos serviços
├── build+test.sh          # Script de teste
└── README.md              # Esta documentação
```

## 🐳 Docker

### Containers
- **squid**: Proxy Squid na porta 3128
- **squid-api**: API FastAPI na porta 8000

### Volumes
- `./squid/squid.conf` → `/etc/squid/squid.conf`
- `./api/blocked_sites.txt` → `/etc/squid/blocked_sites.txt`
- `./squid/blocked_page.html` → `/usr/share/squid/errors/pt-br/ERR_ACCESS_DENIED`

## 🔧 Configuração

### Proxy Squid
Configure o proxy no seu sistema:
- **Servidor**: `localhost`
- **Porta**: `3128`

### API
- **URL Base**: `http://localhost:8000`
- **Versão**: `v1`
- **CORS**: Habilitado para todas as origens

## 🚨 Tratamento de Erros

A API retorna códigos HTTP apropriados:

- `200`: Sucesso
- `400`: Requisição inválida
- `404`: Recurso não encontrado
- `500`: Erro interno do servidor

## 📊 Monitoramento

### Métricas Disponíveis
- Status do serviço
- Número de conexões ativas
- Tempo de atividade
- Logs de acesso e cache
- Lista de URLs bloqueadas

### Logs
- **Access Logs**: Requisições HTTP
- **Cache Logs**: Operações de cache
- **Filtros**: Por IP, URL, nível e mensagem

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a **GNU General Public License v2 (GPLv2)** - a mesma licença utilizada pelo Squid Proxy. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

**Principais características da GPLv2:**
- ✅ **Software Livre**: Você pode usar, modificar e distribuir
- ✅ **Código Aberto**: O código fonte deve estar disponível
- 🔒 **Copyleft**: Derivados devem manter a mesma licença
- ⚠️ **Sem Garantias**: Software é fornecido "como está"

Para mais informações sobre a GPLv2, visite: https://www.gnu.org/licenses/gpl-2.0.html

## 🆘 Suporte

Para suporte e dúvidas:
- Abra uma issue no repositório
- Consulte a documentação da API
- Verifique os logs de erro

---

**Desenvolvido com ❤️ para facilitar o gerenciamento de proxies Squid**
