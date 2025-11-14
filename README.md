# 💅 Daiane Pessoa - Sistema de Agendamentos

> Sistema web para gerenciamento de agendamentos de serviços de manicure e nail design

## 📋 Sobre o Projeto

Projeto acadêmico desenvolvido para automatizar o processo de agendamento de serviços de manicure. O sistema permite que clientes solicitem agendamentos online e oferece um painel administrativo para gerenciar essas solicitações.

### ✨ Funcionalidades Principais

- 🔐 **Autenticação** - Cadastro e login seguro com senhas criptografadas
- 📅 **Agendamento** - Seleção de data, horário e tipo de serviço
- 👥 **Painel do Cliente** - Visualização do status dos agendamentos
- 🛠️ **Painel Administrativo** - Aprovação/rejeição de solicitações
- 📱 **Design Responsivo** - Interface adaptável para diferentes dispositivos

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** PHP 7.4+
- **Banco de Dados:** PostgreSQL 10+
- **Arquitetura:** MVC simplificado

## 📁 Estrutura do Projeto

```
projeto-manicure/
├── 📄 README.md
├── 🗃️ migration/           # Scripts SQL para criação das tabelas
│   ├── create-usuario.sql
│   └── create-agendamento.sql
├── 🐘 php/                 # Backend e APIs
│   ├── bd.php             # Configuração do banco
│   ├── auth/              # Autenticação
│   └── api/               # Endpoints da API
└── 🌐 public/             # Frontend
    ├── *.html             # Páginas principais
    ├── css/               # Estilos organizados por página
    ├── js/                # Scripts organizados por funcionalidade
    └── images/            # Assets visuais
```

## 🚀 Instalação e Configuração

### Pré-requisitos

- PHP 7.4+ com extensões PDO e pgsql
- PostgreSQL 10+
- Servidor web (Apache/Nginx) ou PHP built-in server

### 1. Configuração do Banco de Dados

```bash
# Criar o banco de dados
psql -U postgres -c "CREATE DATABASE db_projeto_manicure;"

# Executar as migrações
psql -U postgres -d db_projeto_manicure -f migration/create-usuario.sql
psql -U postgres -d db_projeto_manicure -f migration/create-agendamento.sql
```

### 2. Configuração das Credenciais

As credenciais do banco estão em `php/bd.php`:

```php
$host = 'localhost';
$db = 'db_projeto_manicure'; 
$user = 'postgres';
$pass = 'postgres';
$port = '5432';
```

> 💡 **Nota:** Para ambiente de produção, use variáveis de ambiente

### 3. Executar o Projeto

```bash
# Servidor PHP built-in (desenvolvimento)
php -S 127.0.0.1:8000 -t public/

# Acesse: http://127.0.0.1:8000
```

## 🎯 Como Usar

### Para Clientes

1. **Cadastro/Login:** Acesse `auth.html` para criar conta ou fazer login
2. **Agendar Serviço:** Em `agendamento.html`, selecione data, horário e serviço
3. **Acompanhar Status:** Veja seus agendamentos em `meus-agendamentos.html`

### Para Administradores

1. **Acesso Admin:** Faça login e acesse `admin-agendamentos.html`
2. **Gerenciar Solicitações:** Aprove ou rejeite agendamentos pendentes
3. **Visualizar Calendário:** Use o calendário para ver disponibilidade


