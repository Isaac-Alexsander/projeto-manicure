CREATE TABLE agendamentos (
                              id SERIAL PRIMARY KEY,
                              usuario_id INT NOT NULL,
                              data_agendamento DATE NOT NULL,
                              hora_agendamento TIME NOT NULL,
                              servico VARCHAR(100) NOT NULL,
                              status VARCHAR(50) DEFAULT 'pendente', -- pendente, confirmado, recusado
                              data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                              FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
