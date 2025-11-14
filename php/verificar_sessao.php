<?php
// php/verificar_sessao.php

require 'session.php';
header('Content-Type: application/json');

if (isset($_SESSION['usuario_id'])) {
    $role = isset($_SESSION['usuario_role']) ? $_SESSION['usuario_role'] : 'cliente';
    echo json_encode([
        'logado' => true,
        'role' => $role // Assume 'cliente' se o papel não estiver definido
    ]);
} else {
    echo json_encode(['logado' => false]);
}
?>
