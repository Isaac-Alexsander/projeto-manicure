<?php
// php/meus_agendamentos.php

session_start();
header('Content-Type: application/json');
$pdo = require 'bd.php';

if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401); // Não autorizado
    echo json_encode(['mensagem' => 'Usuário não está logado.']);
    exit;
}

// Apenas clientes podem consultar seus agendamentos
$role = isset($_SESSION['usuario_role']) ? $_SESSION['usuario_role'] : 'cliente';
if ($role !== 'cliente') {
    http_response_code(403);
    echo json_encode(['mensagem' => 'Apenas clientes podem acessar esta informação.']);
    exit;
}

$usuario_id = $_SESSION['usuario_id'];

try {
    $sql = "SELECT data_agendamento, hora_agendamento, servico, status
            FROM agendamentos
            WHERE usuario_id = ?
            ORDER BY data_agendamento DESC, hora_agendamento DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$usuario_id]);
    $agendamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($agendamentos);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro ao buscar meus agendamentos: " . $e->getMessage());
    echo json_encode(['mensagem' => 'Erro ao buscar seus agendamentos.']);
}
?>
