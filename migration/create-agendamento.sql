CREATE TABLE agendamentos (
                              id SERIAL PRIMARY KEY,
                              usuario_id INT NOT NULL,
                              servico_id INT NOT NULL,
                              data_agendamento DATE NOT NULL,
                              hora_agendamento TIME NOT NULL,
                              status VARCHAR(50) DEFAULT 'pendente',
                              pago BOOLEAN DEFAULT FALSE,
                              data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                              FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                              FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE RESTRICT
);

