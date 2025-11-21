<?php
// php/meus_agendamentos.php
// Retorna os agendamentos do usuário logado

// Limpar qualquer output anterior
ob_start();

require_once 'session.php';

// Limpar output buffer e definir header
ob_end_clean();
header('Content-Type: application/json; charset=utf-8');

// Verificar se o usuário está autenticado
if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Usuário não autenticado.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$pdo = require 'bd.php';
$usuario_id = $_SESSION['usuario_id'];

try {
    // Buscar agendamentos do usuário logado
    $sql = "SELECT 
                a.id,
                a.data_agendamento,
                a.hora_agendamento AS horario,
                a.status,
                a.pago,
                a.data_criacao,
                u.nome AS nome_cliente,
                u.email,
                u.telefone,
                s.id AS servico_id,
                s.nome AS servico_nome,
                s.preco AS servico_preco
            FROM agendamentos a
            JOIN usuarios u ON a.usuario_id = u.id
            LEFT JOIN servicos s ON a.servico_id = s.id
            WHERE a.usuario_id = :usuario_id
            ORDER BY a.data_agendamento DESC, a.hora_agendamento DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['usuario_id' => $usuario_id]);
    $agendamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($agendamentos)) {
        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Você ainda não possui agendamentos.',
            'agendamentos' => []
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode([
        'sucesso' => true,
        'agendamentos' => $agendamentos
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro ao buscar agendamentos do usuário: " . $e->getMessage());
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro ao buscar seus agendamentos. Tente novamente.',
        'erro_detalhes' => $e->getMessage() // Temporário para debug
    ]);
}
?>
