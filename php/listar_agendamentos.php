<?php
// php/listar_agendamentos.php

header('Content-Type: application/json');
$pdo = require 'bd.php';

try {
    // A consulta SQL une as tabelas 'agendamentos' e 'usuarios' para obter o email.
    // Ordenamos pelos mais recentes primeiro.
    $sql = "SELECT a.id, a.data_agendamento, a.hora_agendamento, a.servico, a.status, u.email
            FROM agendamentos a
            JOIN usuarios u ON a.usuario_id = u.id
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
