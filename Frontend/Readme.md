# 🦑 Squid Proxy Dashboard 

## 📋 Descrição

O **Squid Proxy Dashboard** é uma aplicação web moderna desenvolvida em React + TypeScript para gerenciar e monitorar servidores Squid Proxy. O dashboard oferece uma interface intuitiva para controle de serviços, gerenciamento de blocklists e visualização de logs em tempo real.

## 🚀 Funcionalidades

### 🔧 Controle de Serviços
- **Status do Sistema**: Monitoramento em tempo real do container e processos do Squid
- **Controle de Serviços**: Iniciar, parar e reiniciar o serviço do Squid
- **Validação de Configuração**: Verificação automática de erros na configuração

### 🛡️ Gerenciamento de Blocklist
- **Adicionar URLs**: Inclusão individual de URLs para bloqueio
- **Remoção de URLs**: Exclusão de URLs específicas da blocklist
- **Upload em Lote**: Importação de múltiplas URLs via arquivo TXT
- **Remoção em Lote**: Exclusão de múltiplas URLs simultaneamente

### 📊 Visualização de Logs
- **Logs Brutos de Acesso**: Visualização direta dos logs de acesso do Squid
- **Logs Brutos de Cache**: Monitoramento dos logs de cache do sistema
- **Filtros Configuráveis**: Controle do número de linhas exibidas
- **Interface Terminal**: Visualização em formato similar ao terminal

## 🏗️ Arquitetura

### Frontend
- **React 18** com TypeScript
- **Tailwind CSS** para estilização
- **Vite** como bundler
- **Lucide React** para ícones
- **Axios** para requisições HTTP

### Estrutura do Projeto
```
src/
├── components/           # Componentes React
│   ├── StatusCard.tsx   # Card de status do sistema
│   ├── ServiceControl.tsx # Controle de serviços
│   ├── BlocklistManager.tsx # Gerenciador de blocklist
│   ├── LogsViewer.tsx   # Visualizador de logs
│   └── ui/              # Componentes de interface
├── hooks/               # Hooks personalizados
├── services/            # Serviços e APIs
├── types/               # Definições TypeScript
└── App.tsx             # Componente principal
```

## 🔌 Endpoints da API

### Sistema
```http
GET    /api/v1/squid/status              # Status do sistema
POST   /api/v1/squid/service/start       # Iniciar serviço
POST   /api/v1/squid/service/stop        # Parar serviço
POST   /api/v1/squid/service/restart     # Reiniciar serviço
```

### Blocklist
```http
GET    /api/v1/squid/blocklist                    # Listar URLs bloqueadas
POST   /api/v1/squid/blocklist                    # Adicionar URL
DELETE /api/v1/squid/blocklist                    # Remover URL
POST   /api/v1/squid/blocklist/bulk/txt          # Upload em lote (TXT)
DELETE /api/v1/squid/blocklist/bulk               # Remoção em lote
```

### Logs
```http
GET    /api/v1/squid/logs/raw/access?lines=100   # Logs brutos de acesso
GET    /api/v1/squid/logs/raw/cache?lines=100    # Logs brutos de cache
```

## ⚙️ Configuração

### URL Base da API

Para alterar a URL base da API, edite o arquivo `src/services/api.ts`:

```typescript
// Altere esta linha para sua URL do servidor Squid
const API_BASE_URL = 'http://seu-servidor:porta/api/v1/squid';
```

**Exemplos de configuração:**

```typescript
// Servidor local
const API_BASE_URL = 'http://localhost:8000/api/v1/squid';

// Servidor remoto
const API_BASE_URL = 'http://192.168.1.100:8000/api/v1/squid';

// Servidor com HTTPS
const API_BASE_URL = 'https://squid.company.com/api/v1/squid';

// Servidor com porta customizada
const API_BASE_URL = 'http://squid-server:9000/api/v1/squid';
```

### Variáveis de Ambiente

Para maior flexibilidade, você pode usar variáveis de ambiente:

1. Crie um arquivo `.env` na raiz do projeto:
```env
VITE_API_BASE_URL=http://seu-servidor:8000/api/v1/squid
```

2. Modifique `src/services/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1/squid';
```

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalação
```bash
# Clone o repositório
git clone <url-do-repositorio>
cd project

# Instale as dependências
npm install

# Configure a URL da API (veja seção Configuração)
# Edite src/services/api.ts

# Execute em modo desenvolvimento
npm run dev

# Ou construa para produção
npm run build
npm run preview
```

## 📱 Uso

### 1. Status do Sistema
- Acesse a aba "Status do Sistema" para ver o estado atual
- O dashboard mostra automaticamente se o Squid está rodando
- Verifique se há erros de configuração

### 2. Controle de Serviços
- Use a aba "Controle de Serviço" para gerenciar o Squid
- Inicie, pare ou reinicie o serviço conforme necessário
- Monitore o status em tempo real

### 3. Gerenciar Blocklist
- Acesse "Gerenciar Blocklist" para controlar URLs bloqueadas
- Adicione URLs individuais ou faça upload de arquivo TXT
- Remova URLs específicas ou em lote

### 4. Visualizar Logs
- Use "Visualizar Logs" para monitorar atividade
- Escolha entre logs de acesso ou cache
- Configure o número de linhas a exibir

## 🔧 Desenvolvimento

### Scripts Disponíveis
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Verificação de código
npm run type-check   # Verificação de tipos TypeScript
```

### Estrutura de Componentes
- **StatusCard**: Exibe status do sistema e validação de configuração
- **ServiceControl**: Controles para iniciar/parar/reiniciar serviços
- **BlocklistManager**: Interface para gerenciar URLs bloqueadas
- **LogsViewer**: Visualização de logs brutos do sistema
- **Toast**: Sistema de notificações para feedback do usuário

## 🐛 Troubleshooting

### Problemas Comuns

**API não responde:**
- Verifique se a URL base está correta em `src/services/api.ts`
- Confirme se o servidor Squid está rodando
- Verifique se a porta está acessível

**Erro de CORS:**
- Configure o servidor Squid para permitir requisições do frontend
- Verifique se as origens estão configuradas corretamente

**Logs não carregam:**
- Confirme se os endpoints de logs estão funcionando
- Verifique se há permissões para acessar os arquivos de log

## 📈 Próximas Funcionalidades

- [ ] Gráficos de uso e estatísticas
- [ ] Exportação de logs para CSV/JSON
- [ ] Alertas configuráveis
- [ ] Histórico de ações
- [ ] Múltiplos servidores Squid
- [ ] Autenticação e autorização
- [ ] Backup e restauração de configurações

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a **GNU General Public License v2 (GPLv2)** - a mesma licença utilizada pelo Squid Proxy. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

**Principais características da GPLv2:**
- ✅ **Software Livre**: Você pode usar, modificar e distribuir
- ✅ **Código Aberto**: O código fonte deve estar disponível
- 🔒 **Copyleft**: Derivados devem manter a mesma licença
- ⚠️ **Sem Garantias**: Software é fornecido "como está"

Para mais informações sobre a GPLv2, visite: https://www.gnu.org/licenses/gpl-2.0.html

## 📞 Suporte

Para suporte ou dúvidas:
- Abra uma issue no repositório
- Consulte a documentação da API do Squid
- Verifique os logs do servidor para debugging

---

**Desenvolvido com ❤️ para a comunidade Squid Proxy**

*Este projeto segue os mesmos princípios de software livre do Squid Proxy.*
