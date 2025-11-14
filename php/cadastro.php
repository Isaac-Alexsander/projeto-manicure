<?php
// php/cadastro.php

$pdo = require 'bd.php';

header('Content-Type: application/json');

$email = isset($_POST['email']) ? $_POST['email'] : '';
$senha = isset($_POST['senha']) ? $_POST['senha'] : '';

if (!$email || !$senha) {
    http_response_code(400);
    echo json_encode(['mensagem' => 'Email e senha são obrigatórios.']);
    exit;
}

// Criptografa a senha de forma segura
$senhaHash = password_hash($senha, PASSWORD_ARGON2ID);

try {
    // Insere também o papel (role) como 'cliente'
    $sql = "INSERT INTO usuarios (email, senha, role) VALUES (?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$email, $senhaHash, 'cliente']);

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
