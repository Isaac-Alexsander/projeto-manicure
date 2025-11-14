CREATE TABLE usuarios (
                          id SERIAL PRIMARY KEY,
                          email VARCHAR(255) UNIQUE NOT NULL,
                          senha VARCHAR(255) NOT NULL,
                          role VARCHAR(50) DEFAULT 'cliente',
                          data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);