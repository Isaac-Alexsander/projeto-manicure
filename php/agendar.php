<?php
// php/agendar.php

$pdo = require 'bd.php';
require 'session.php';

header('Content-Type: application/json');

// 1. Verificar se o usuário está logado
if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['mensagem' => 'Você precisa estar logado para fazer um agendamento.']);
    exit;
}

// Permitir apenas clientes criarem agendamentos
$role = isset($_SESSION['usuario_role']) ? $_SESSION['usuario_role'] : 'cliente';
if ($role !== 'cliente') {
    http_response_code(403);
    echo json_encode(['mensagem' => 'Apenas clientes podem solicitar agendamentos.']);
    exit;
}

// Suporta requisições com JSON no body ou com form-data / urlencoded
$contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
if (stripos($contentType, 'application/json') !== false) {
    $data = json_decode(file_get_contents('php://input'), true);
} else {
    // Para FormData ou form-urlencoded
    $data = $_POST;
}

$data_str = isset($data['data']) ? $data['data'] : null; // Formato esperado: "DD/MM/YYYY" ou YYYY-MM-DD
$hora = isset($data['hora']) ? $data['hora'] : null;

if (!$data_str || !$hora) {
    http_response_code(400);
    echo json_encode(['mensagem' => 'Data e hora são obrigatórias.']);
    exit;
}

// Detecta formato: se contém '/', assume DD/MM/YYYY, else YYYY-MM-DD
if (strpos($data_str, '/') !== false) {
    $dateObject = DateTime::createFromFormat('d/m/Y', $data_str);
    if ($dateObject === false) {
        http_response_code(400);
        echo json_encode(['mensagem' => 'Formato de data inválido. Use DD/MM/YYYY ou YYYY-MM-DD.']);
        exit;
    }
    $data_sql = $dateObject->format('Y-m-d');
} else {
    $data_sql = $data_str; // espera YYYY-MM-DD
}

$usuario_id = $_SESSION['usuario_id'];
$servico = isset($data['servico']) ? $data['servico'] : null;

try {
    $sql = "INSERT INTO agendamentos (usuario_id, data_agendamento, hora_agendamento, servico) VALUES (?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$usuario_id, $data_sql, $hora, $servico]);

    http_response_code(201);
    echo json_encode(['mensagem' => 'Agendamento solicitado com sucesso! Aguarde a confirmação.']);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro ao processar o agendamento: " . $e->getMessage());
    echo json_encode(['mensagem' => 'Erro ao processar o agendamento.']);
}
?>
