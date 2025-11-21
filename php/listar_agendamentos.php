<?php
// php/listar_agendamentos.php

header('Content-Type: application/json');
$pdo = require 'bd.php';

try {
    // A consulta SQL une as tabelas 'agendamentos', 'usuarios' e 'servicos' para obter informações completas.
    $sql = "SELECT a.id, a.data_agendamento, a.hora_agendamento, a.status, a.pago,
                   u.nome as cliente_nome, u.email, u.telefone,
                   s.id AS servico_id, s.nome AS servico_nome, s.preco AS servico_preco
            FROM agendamentos a
            JOIN usuarios u ON a.usuario_id = u.id
            LEFT JOIN servicos s ON a.servico_id = s.id
            ORDER BY a.data_agendamento DESC, a.hora_agendamento DESC";

    $stmt = $pdo->query($sql);
    $agendamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($agendamentos);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro ao listar agendamentos: " . $e->getMessage());
    echo json_encode(['mensagem' => 'Erro ao buscar agendamentos.']);
}
?>
