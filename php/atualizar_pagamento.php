<?php
// php/atualizar_pagamento.php

header('Content-Type: application/json');
session_start();

// Verificar se o usuário está logado e é admin
$role = isset($_SESSION['usuario_role']) ? $_SESSION['usuario_role'] : 'cliente';
if (!isset($_SESSION['usuario_id']) || $role !== 'admin') {
    http_response_code(403);
    error_log("Acesso negado - usuario_id: " . ($_SESSION['usuario_id'] ?? 'não definido') . ", role: " . ($role ?? 'não definido'));
    echo json_encode(['mensagem' => 'Acesso negado. Apenas administradores podem atualizar o status de pagamento.']);
}

$pdo = require 'bd.php';

// Receber dados JSON
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id']) || !isset($data['pago'])) {
    http_response_code(400);
    echo json_encode(['mensagem' => 'Dados incompletos.']);
    exit;
}

$agendamento_id = $data['id'];
$pago = $data['pago'] ? 1 : 0;

try {
    $sql = "UPDATE agendamentos SET pago = :pago WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':pago' => $pago,
        ':id' => $agendamento_id
    ]);

    echo json_encode([
        'sucesso' => true,
        'mensagem' => $pago ? 'Marcado como pago.' : 'Marcado como não pago.'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro ao atualizar pagamento: " . $e->getMessage());
    echo json_encode(['mensagem' => 'Erro ao atualizar status de pagamento.']);
}
?>

