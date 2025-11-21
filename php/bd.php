<?php
// php/bd.php
// Conexão com banco de dados PostgreSQL

// Carregar configurações de arquivo externo
$config = require __DIR__ . '/config.php';

$host = $config['db']['host'];
$db = $config['db']['dbname'];
$user = $config['db']['user'];
$pass = $config['db']['password'];
$port = $config['db']['port'];

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$db", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
    return $pdo;
} catch (PDOException $e) {
    error_log("Falha na conexão com o banco de dados: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['mensagem' => 'Falha na conexão com o banco de dados.']);
    exit();
}
?>