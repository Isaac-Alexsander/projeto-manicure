<?php
// php/servicos.php
header('Content-Type: application/json');
$pdo = require 'bd.php';

try {
    $stmt = $pdo->prepare("SELECT id, nome, preco FROM servicos WHERE ativo = TRUE ORDER BY nome");
    $stmt->execute();
    $servicos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($servicos);
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Erro ao listar serviços: ' . $e->getMessage());
    echo json_encode(['mensagem' => 'Erro ao buscar serviços.']);
}
?>
