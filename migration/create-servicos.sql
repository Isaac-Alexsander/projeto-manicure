CREATE TABLE servicos (
                          id SERIAL PRIMARY KEY,
                          nome VARCHAR(100) NOT NULL UNIQUE,
                          preco DECIMAL(10, 2) NOT NULL,
                          ativo BOOLEAN DEFAULT TRUE,
                          data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

