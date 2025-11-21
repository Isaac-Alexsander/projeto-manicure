<?php
// php/cancelar_agendamento.php

session_start();
header('Content-Type: application/json');
$pdo = require 'bd.php';

if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(['mensagem' => 'Usuário não está logado.']);
    exit;
}

$role = isset($_SESSION['usuario_role']) ? $_SESSION['usuario_role'] : 'cliente';
if ($role !== 'cliente') {
    http_response_code(403);
    echo json_encode(['mensagem' => 'Apenas clientes podem cancelar seus agendamentos.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$agendamento_id = isset($input['id']) ? intval($input['id']) : 0;

if ($agendamento_id <= 0) {
    http_response_code(400);
    echo json_encode(['mensagem' => 'ID do agendamento inválido.']);
    exit;
}

$usuario_id = $_SESSION['usuario_id'];

try {
    // Verificar se o agendamento pertence ao usuário e se ainda não foi realizado
    $sql = "SELECT id, data_agendamento, hora_agendamento, status 
            FROM agendamentos 
            WHERE id = ? AND usuario_id = ?";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$agendamento_id, $usuario_id]);
    $agendamento = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$agendamento) {
        http_response_code(404);
        echo json_encode(['mensagem' => 'Agendamento não encontrado ou você não tem permissão para cancelá-lo.']);
        exit;
    }

    // Verificar se o agendamento já passou
    $dataAgendamento = new DateTime($agendamento['data_agendamento'] . ' ' . $agendamento['hora_agendamento']);
    $agora = new DateTime();

    if ($dataAgendamento <= $agora) {
        http_response_code(400);
        echo json_encode(['mensagem' => 'Não é possível cancelar um agendamento que já foi realizado ou está em andamento.']);
        exit;
    }

    // Verificar se já está cancelado
    if ($agendamento['status'] === 'cancelado') {
        http_response_code(400);
        echo json_encode(['mensagem' => 'Este agendamento já está cancelado.']);
        exit;
    }

    // Cancelar o agendamento
    $updateSql = "UPDATE agendamentos SET status = 'cancelado' WHERE id = ?";
    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->execute([$agendamento_id]);

    echo json_encode(['mensagem' => 'Agendamento cancelado com sucesso.']);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro ao cancelar agendamento: " . $e->getMessage());
    echo json_encode(['mensagem' => 'Erro ao cancelar agendamento.']);
}
?>

