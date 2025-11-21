<?php
// php/cadastro.php

$pdo = require 'bd.php';

header('Content-Type: application/json');

$nome = isset($_POST['nome']) ? trim($_POST['nome']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$telefone = isset($_POST['telefone']) ? trim($_POST['telefone']) : null;
$senha = isset($_POST['senha']) ? $_POST['senha'] : '';

if (!$nome || !$email || !$senha) {
    http_response_code(400);
    echo json_encode(['mensagem' => 'Nome, email e senha são obrigatórios.']);
    exit;
}

// Validar formato de email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['mensagem' => 'Email inválido.']);
    exit;
}

// Criptografa a senha de forma segura
$senhaHash = password_hash($senha, PASSWORD_ARGON2ID);

try {
    // Insere com nome e telefone
    $sql = "INSERT INTO usuarios (nome, email, telefone, senha, role) VALUES (?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$nome, $email, $telefone, $senhaHash, 'cliente']);

    http_response_code(201);
    echo json_encode(['mensagem' => 'Usuário cadastrado com sucesso!']);

} catch (PDOException $e) {
    // Código '23505' é violação de chave única no PostgreSQL (email duplicado)
    if ($e->getCode() == '23505') {
        http_response_code(409); // Conflict
        echo json_encode(['mensagem' => 'Este email já está cadastrado.']);
    } else {
        http_response_code(500);
        error_log('Erro no cadastro: ' . $e->getMessage());
        echo json_encode(['mensagem' => 'Erro interno ao cadastrar usuário.']);
    }
}
?>
