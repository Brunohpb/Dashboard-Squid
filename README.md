# 🦑 Squid Proxy Manager

Uma ferramenta completa para gerenciar servidores proxy Squid através de uma interface web moderna e uma API REST.

## 🎯 O que é?

O **Squid Proxy Manager** é uma solução que combina:
- **Backend**: API FastAPI para controle do Squid
- **Frontend**: Dashboard React para gerenciamento visual
- **Proxy**: Servidor Squid configurável

## ✨ Para que serve?

- 🚫 **Bloquear sites** de forma simples e rápida
- 📊 **Monitorar logs** de acesso e cache em tempo real
- 🔧 **Controlar serviços** (iniciar, parar, reiniciar)
- 📁 **Gerenciar listas** de bloqueio em lote
- 🖥️ **Interface web** intuitiva para administradores

## 🚀 Como usar?

# Backend

```bash

cd Backend && docker compose up -d

- API: http://localhost:8000
- Proxy: localhost:3128
```

# Frontend 
```bash 
cd Frontend && npm run dev

- Dashboard: http://localhost:5173

```

## 📚 Documentação

- **Backend**: [Ver README](Backend/Readme.md) - API e endpoints
- **Frontend**: [Ver README](Frontend/Readme.md) - Dashboard e interface

## 🔧 Tecnologias

- **Backend**: FastAPI + Python
- **Frontend**: React + TypeScript + Tailwind
- **Proxy**: Squid
- **Container**: Docker + Docker Compose

## 📄 Licença

GPLv2 - Software livre e código aberto

---

**Uma ferramenta simples para gerenciar proxies Squid de forma profissional** 🚀 