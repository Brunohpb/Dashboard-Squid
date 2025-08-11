#!/bin/bash

echo "🧪 Testando Squid corrigido..."

# Parar containers
echo "🛑 Parando containers..."
docker-compose down

# Rebuildar
echo "🔨 Rebuildando containers..."
docker-compose build --no-cache
docker-compose up -d

# Aguardar inicialização
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# Verificar status do Squid
echo "📊 Verificando status do Squid..."
curl -s http://localhost:8000/api/v1/squid/status | jq .

# Testar Docker CLI
echo "🐳 Testando Docker CLI..."
docker exec squid-api python test_docker.py

# Testar adição de URL
echo "📝 Testando adição de URL..."
curl -s -X POST http://localhost:8000/api/v1/squid/blocklist \
  -H "Content-Type: application/json" \
  -d '{"url": "exemplo.com"}' | jq .

# Verificar se foi adicionado
echo "📋 Verificando lista de bloqueio..."
curl -s http://localhost:8000/api/v1/squid/blocklist | jq .

# Testar remoção de URL
echo "🗑️ Testando remoção de URL..."
curl -s -X DELETE http://localhost:8000/api/v1/squid/blocklist \
  -H "Content-Type: application/json" \
  -d '{"url": "exemplo.com"}' | jq .

# Verificar status final
echo "📊 Status final do Squid..."
curl -s http://localhost:8000/api/v1/squid/status | jq .

echo "✅ Teste concluído!" 