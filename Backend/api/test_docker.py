#!/usr/bin/env python3
"""
Script de teste para verificar se o Docker CLI está funcionando no container
"""

import subprocess
import sys

def test_docker():
    print("Testando Docker CLI...")
    

    try:
        result = subprocess.run(["docker", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Docker CLI encontrado: {result.stdout.strip()}")
        else:
            print(f"❌ Docker CLI não encontrado: {result.stderr}")
            return False
    except FileNotFoundError:
        print("❌ Comando 'docker' não encontrado no PATH")
        return False
    

    try:
        result = subprocess.run(["docker", "ps", "--filter", "name=squid", "--format", "{{.Names}}"], 
                              capture_output=True, text=True)
        if result.returncode == 0 and "squid" in result.stdout:
            print("✅ Container 'squid' está rodando")
        else:
            print("❌ Container 'squid' não está rodando")
            print(f"Containers encontrados: {result.stdout}")
            return False
    except Exception as e:
        print(f"❌ Erro ao verificar container squid: {e}")
        return False
    

    try:
        result = subprocess.run(["docker", "exec", "squid", "squid", "-v"], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Comando 'docker exec' funcionando")
            print(f"Versão do Squid: {result.stdout.strip()}")
        else:
            print(f"❌ Erro no comando 'docker exec': {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Erro ao testar docker exec: {e}")
        return False
    
    print("🎉 Todos os testes passaram!")
    return True

if __name__ == "__main__":
    success = test_docker()
    sys.exit(0 if success else 1) 