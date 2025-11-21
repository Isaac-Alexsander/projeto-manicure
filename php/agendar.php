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
$servico_id = isset($data['servico_id']) ? $data['servico_id'] : null;

if (!$data_str || !$hora) {
    http_response_code(400);
    echo json_encode(['mensagem' => 'Data e hora são obrigatórias.']);
    exit;
}

if (!$servico_id || !is_numeric($servico_id)) {
    http_response_code(400);
    echo json_encode(['mensagem' => 'Selecione um serviço válido antes de agendar.']);
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

// Validar se a data é de segunda a sexta (dia da semana 1-5)
$dateObject = new DateTime($data_sql);
$diaSemana = (int)$dateObject->format('N'); // 1 = Segunda, 7 = Domingo
if ($diaSemana < 1 || $diaSemana > 5) {
    http_response_code(400);
    echo json_encode(['mensagem' => 'Agendamentos são permitidos apenas de segunda a sexta-feira.']);
    exit;
}

$usuario_id = $_SESSION['usuario_id'];

try {
    // Verificar se o serviço existe e está ativo
    $stmt = $pdo->prepare("SELECT id, nome, preco FROM servicos WHERE id = ? AND ativo = TRUE LIMIT 1");
    $stmt->execute([$servico_id]);
    $serv = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$serv) {
        http_response_code(400);
        echo json_encode(['mensagem' => 'Serviço inválido ou indisponível.']);
        exit;
    }

    // Normalizar hora para comparar (apenas HH:MM)
    $hora_norm = substr($hora, 0, 5);

    // Verificar se já existe agendamento para data+hora (exceto recusado e cancelado)
    $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM agendamentos WHERE data_agendamento = ? AND hora_agendamento = ? AND status NOT IN ('recusado', 'cancelado')");
    $stmt->execute([$data_sql, $hora_norm]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && intval($row['cnt']) > 0) {
        http_response_code(409);
        echo json_encode(['mensagem' => 'Horário já agendado. Por favor, escolha outro horário.']);
        exit;
    }

    // Inserir agendamento com servico_id
    $sql = "INSERT INTO agendamentos (usuario_id, servico_id, data_agendamento, hora_agendamento) VALUES (?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$usuario_id, $servico_id, $data_sql, $hora_norm]);

    http_response_code(201);
    echo json_encode(['mensagem' => 'Agendamento solicitado com sucesso! Aguarde a confirmação.']);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro ao processar o agendamento: " . $e->getMessage());
    echo json_encode(['mensagem' => 'Erro ao processar o agendamento.']);
}
?>
