<?php
// php/login.php

$pdo = require 'bd.php';
require 'session.php';

header('Content-Type: application/json');

$email = isset($_POST['email']) ? $_POST['email'] : '';
$senha = isset($_POST['senha']) ? $_POST['senha'] : '';

if (!$email || !$senha) {
    http_response_code(400);
    echo json_encode(['mensagem' => 'Email e senha são obrigatórios.']);
    exit;
}

$sql = "SELECT id, email, senha, role FROM usuarios WHERE email = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute([$email]);
$usuario = $stmt->fetch(PDO::FETCH_ASSOC);

if ($usuario && password_verify($senha, $usuario['senha'])) {
    // Login bem-sucedido - regenerar id da sessão
    session_regenerate_id(true);
    $_SESSION['usuario_id'] = $usuario['id'];
    $_SESSION['usuario_email'] = $usuario['email'];
    $_SESSION['usuario_role'] = isset($usuario['role']) ? $usuario['role'] : 'cliente';
    echo json_encode(['mensagem' => 'Login bem-sucedido!']);
} else {
    // Credenciais inválidas
    http_response_code(401); // Unauthorized
    echo json_encode(['mensagem' => 'Email ou senha inválidos.']);
}
?>
