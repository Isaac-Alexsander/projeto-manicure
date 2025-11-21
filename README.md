# 💅 Sistema de Agendamento para Manicure

Sistema web para gerenciamento de agendamentos de serviços de manicure/pedicure, desenvolvido como Projeto Integrador do curso de Desenvolvimento Web.

## 📋 Sobre o Projeto

Este sistema permite que clientes agendem serviços de manicure online, enquanto administradores gerenciam os agendamentos, serviços e acompanham métricas do negócio através de um dashboard.

### Funcionalidades

#### Para Clientes
- 🔐 Cadastro e autenticação de usuários
- 📅 Agendamento de serviços
- 👀 Visualização dos próprios agendamentos
- ❌ Cancelamento de agendamentos
- 💳 Acompanhamento de status de pagamento

#### Para Administradores
- 📊 Dashboard com métricas do negócio
- 📋 Gerenciamento de todos os agendamentos
- ✅ Atualização de status dos agendamentos
- 💰 Controle de pagamentos
- 📈 Visualização de estatísticas

## 🚀 Tecnologias Utilizadas

- **Frontend:**
  - HTML5
  - CSS3
  - JavaScript (Vanilla)

- **Backend:**
  - PHP 7.4+
  - PostgreSQL

- **Bibliotecas:**
  - PDO (PHP Data Objects) para conexão com banco de dados

## 📁 Estrutura do Projeto

```
projeto-manicure/
���── migration/              # Scripts SQL para criação do banco
│   ├── create-usuario.sql
│   ├── create-servicos.sql
│   └── create-agendamento.sql
├── php/                    # Backend PHP
│   ├── bd.php             # Conexão com banco de dados
│   ├── config.php         # Configurações do sistema
│   ├── session.php        # Gerenciamento de sessões
│   ├── login.php          # Autenticação
│   ├── cadastro.php       # Registro de usuários
│   ├── agendar.php        # Criar agendamentos
│   ├── servicos.php       # Listar serviços
│   └── ...                # Outros endpoints
└── public/                 # Frontend
    ├── index.html         # Página inicial
    ├── auth.html          # Login/Cadastro
    ├── agendamento.html   # Agendar serviços
    ├── dashboard.html     # Dashboard admin
    ├── css/               # Estilos
    ├── js/                # Scripts
    └── images/            # Imagens
```

## ⚙️ Configuração e Instalação

### Pré-requisitos

- PHP 7.4 ou superior
- PostgreSQL 12 ou superior
- Servidor web (Apache/Nginx)
- Extensão PHP PDO_PGSQL habilitada

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd projeto-manicure
   ```

2. **Configure o banco de dados**
   
   Crie um banco de dados PostgreSQL:
   ```bash
   createdb nome_do_banco
   ```

3. **Execute as migrations**
   
   Execute os scripts SQL na ordem:
   ```bash
   psql -d nome_do_banco -f migration/create-usuario.sql
   psql -d nome_do_banco -f migration/create-servicos.sql
   psql -d nome_do_banco -f migration/create-agendamento.sql
   ```

4. **Configure as credenciais**
   
   Copie o arquivo de configuração de exemplo:
   ```bash
   cp php/config.example.php php/config.php
   ```
   
   Edite o arquivo `php/config.php` com suas credenciais:
   ```php
   return [
       'db' => [
           'host' => 'localhost',
           'port' => '5432',
           'dbname' => 'nome_do_banco',
           'user' => 'seu_usuario',
           'password' => 'sua_senha'
       ]
   ];
   ```

5. **Configure o servidor web**
   
   Aponte o document root para a pasta `public/`

6. **Acesse o sistema**
   
   Abra o navegador em `http://localhost/`

## ���️ Banco de Dados

### Tabelas Principais

- **usuario**: Armazena dados dos usuários (clientes e administradores)
- **servicos**: Catálogo de serviços disponíveis
- **agendamento**: Registros de agendamentos realizados

## 🔒 Segurança

- Senhas criptografadas com hash
- Prepared statements para prevenir SQL Injection
- Validação de sessão em rotas protegidas
- Sanitização de inputs do usuário

## 👥 Tipos de Usuário

- **Cliente**: Pode agendar e visualizar seus próprios agendamentos
- **Administrador**: Acesso total ao sistema e dashboard

## 📱 Páginas

- `/index.html` - Página inicial
- `/auth.html` - Login e cadastro
- `/agendamento.html` - Agendar serviços
- `/meus-agendamentos.html` - Agendamentos do cliente
- `/dashboard.html` - Dashboard administrativo
- `/admin-agendamentos.html` - Gerenciar agendamentos (admin)

## 🛠️ API Endpoints

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/php/login.php` | POST | Autenticação de usuário |
| `/php/cadastro.php` | POST | Registro de novo usuário |
| `/php/servicos.php` | GET | Lista serviços disponíveis |
| `/php/agendar.php` | POST | Criar novo agendamento |
| `/php/meus_agendamentos.php` | GET | Lista agendamentos do usuário |
| `/php/listar_agendamentos.php` | GET | Lista todos agendamentos (admin) |
| `/php/atualizar_status.php` | POST | Atualizar status do agendamento |
| `/php/atualizar_pagamento.php` | POST | Atualizar status de pagamento |
| `/php/cancelar_agendamento.php` | POST | Cancelar agendamento |
| `/php/dashboard_metricas.php` | GET | Obter métricas (admin) |

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais como parte do Projeto Integrador do curso de Desenvolvimento Web - SATC.

## 👨‍💻 Autores

 - Isaac Alexsander Pereira Pessoa 
 - Isabela Madeira José 
 - João Paulo Sigieski Boneti 
 - José Henrique Kurtz Dos Santos 

---

**SATC - Associação Beneficente da Indústria Carbonífera de Santa Catarina**
