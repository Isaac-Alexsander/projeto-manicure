<?php
// php/atualizar_status.php

header('Content-Type: application/json');
$pdo = require 'bd.php';
session_start();

// Permitir apenas administradores
$role = isset($_SESSION['usuario_role']) ? $_SESSION['usuario_role'] : 'cliente';
if (!isset($_SESSION['usuario_id']) || $role !== 'admin') {
    http_response_code(403);
    echo json_encode(['mensagem' => 'Acesso negado. Apenas administradores podem atualizar o status.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id = isset($data['id']) ? $data['id'] : null;
$status = isset($data['status']) ? $data['status'] : null;

if (!$id || !$status) {
    http_response_code(400);
    echo json_encode(['mensagem' => 'ID do agendamento e status são obrigatórios.']);
    exit;
}

if (!in_array($status, array('confirmado', 'recusado'))) {
    http_response_code(400);
    echo json_encode(['mensagem' => 'Status inválido.']);
    exit;
}

try {
    $sql = "UPDATE agendamentos SET status = ? WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array($status, $id));

    if ($stmt->rowCount() > 0) {
        echo json_encode(['mensagem' => 'Status do agendamento atualizado com sucesso.']);
    } else {
        http_response_code(404);
        echo json_encode(['mensagem' => 'Agendamento não encontrado.']);
    }

} catch (PDOException $e) {
    error_log("Erro ao atualizar status: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['mensagem' => 'Erro no servidor ao atualizar o status.']);
}
?>
