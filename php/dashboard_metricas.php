<?php
// php/dashboard_metricas.php

header('Content-Type: application/json');
$pdo = require 'bd.php';
session_start();

// Verificar se é admin
$role = isset($_SESSION['usuario_role']) ? $_SESSION['usuario_role'] : 'cliente';
if (!isset($_SESSION['usuario_id']) || $role !== 'admin') {
    http_response_code(403);
    echo json_encode(['mensagem' => 'Acesso negado. Apenas administradores podem acessar.']);
    exit;
}

$periodo = isset($_GET['periodo']) ? $_GET['periodo'] : 'todos';

// Construir filtro de período
function getPeriodoWhere($periodo) {
    switch ($periodo) {
        case 'mes-atual':
            $primeiroDiaMes = date('Y-m-01');
            $ultimoDiaMes = date('Y-m-t'); // Último dia do mês atual
            return "AND a.data_agendamento >= '$primeiroDiaMes' AND a.data_agendamento <= '$ultimoDiaMes'";

        case 'mes-anterior':
            $mesAnterior = date('Y-m-01', strtotime('-1 month'));
            $ultimoDiaMesAnterior = date('Y-m-t', strtotime('-1 month'));
            return "AND a.data_agendamento >= '$mesAnterior' AND a.data_agendamento <= '$ultimoDiaMesAnterior'";

        case 'ultimos-3-meses':
            $tresMesesAtras = date('Y-m-01', strtotime('-3 months'));
            $ultimoDiaMes = date('Y-m-t');
            return "AND a.data_agendamento >= '$tresMesesAtras' AND a.data_agendamento <= '$ultimoDiaMes'";

        case 'ano-atual':
            $anoAtual = date('Y');
            return "AND EXTRACT(YEAR FROM a.data_agendamento) = $anoAtual";

        default:
            return "";
    }
}

$periodoWhere = getPeriodoWhere($periodo);

try {
    // 1. MÉTRICAS GERAIS (apenas agendamentos confirmados para receita, excluindo cancelados)
    $sql = "SELECT
                COUNT(a.id) as total_agendamentos,
                SUM(CASE WHEN a.status = 'confirmado' THEN s.preco ELSE 0 END) as receita_total,
                AVG(CASE WHEN a.status = 'confirmado' THEN s.preco ELSE NULL END) as ticket_medio,
                COUNT(DISTINCT CASE WHEN a.status = 'confirmado' THEN a.usuario_id ELSE NULL END) as clientes_atendidos,
                SUM(CASE WHEN a.status = 'confirmado' AND a.pago = true THEN s.preco ELSE 0 END) as pagamentos_recebidos,
                SUM(CASE WHEN a.status = 'confirmado' AND (a.pago = false OR a.pago IS NULL) THEN s.preco ELSE 0 END) as pagamentos_pendentes,
                COUNT(CASE WHEN a.status = 'confirmado' AND a.pago = true THEN 1 END) as qtd_pagos,
                COUNT(CASE WHEN a.status = 'confirmado' AND (a.pago = false OR a.pago IS NULL) THEN 1 END) as qtd_pendentes
            FROM agendamentos a
            LEFT JOIN servicos s ON a.servico_id = s.id
            WHERE a.status != 'cancelado' $periodoWhere";

    $stmt = $pdo->query($sql);
    $metricas = $stmt->fetch(PDO::FETCH_ASSOC);

    // 2. SERVIÇOS MAIS VENDIDOS (apenas confirmados, excluindo cancelados)
    $sql = "SELECT
                s.nome,
                COUNT(a.id) as quantidade,
                SUM(s.preco) as receita,
                s.preco
            FROM agendamentos a
            JOIN servicos s ON a.servico_id = s.id
            WHERE a.status = 'confirmado' $periodoWhere
            GROUP BY s.id, s.nome, s.preco
            ORDER BY quantidade DESC
            LIMIT 10";

    $stmt = $pdo->query($sql);
    $servicosMaisVendidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. STATUS DOS AGENDAMENTOS (apenas futuros - não incluir agendamentos passados nem cancelados)
    $dataHoje = date('Y-m-d');
    $horaHoje = date('H:i:s');

    $sql = "SELECT
                SUM(CASE WHEN status = 'confirmado' THEN 1 ELSE 0 END) as confirmado,
                SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendente,
                SUM(CASE WHEN status = 'recusado' THEN 1 ELSE 0 END) as recusado
            FROM agendamentos a
            WHERE (a.data_agendamento > '$dataHoje'
                   OR (a.data_agendamento = '$dataHoje' AND a.hora_agendamento > '$horaHoje'))
            AND a.status != 'cancelado'
            $periodoWhere";

    $stmt = $pdo->query($sql);
    $statusAgendamentos = $stmt->fetch(PDO::FETCH_ASSOC);

    // 4. RECEITA POR DIA DA SEMANA (apenas confirmados) - ÚLTIMA SEMANA COMPLETA
    // Calcular o início e fim da última semana completa (Domingo a Sábado)
    $hoje = new DateTime();
    $diaSemanaHoje = (int)$hoje->format('w'); // 0 = Domingo, 6 = Sábado

    // Calcular quantos dias voltar para chegar ao domingo anterior
    $diasParaDomingoAnterior = $diaSemanaHoje;
    if ($diasParaDomingoAnterior === 0) {
        // Se hoje é domingo, pegar a semana anterior completa
        $diasParaDomingoAnterior = 7;
    }

    // Início da semana (Domingo)
    $inicioSemana = clone $hoje;
    $inicioSemana->modify("-{$diasParaDomingoAnterior} days");
    $inicioSemana->setTime(0, 0, 0);

    // Fim da semana (Sábado)
    $fimSemana = clone $inicioSemana;
    $fimSemana->modify('+6 days');
    $fimSemana->setTime(23, 59, 59);

    $inicioSemanaStr = $inicioSemana->format('Y-m-d');
    $fimSemanaStr = $fimSemana->format('Y-m-d');

    // Dados da semana atual
    $sql = "SELECT
                EXTRACT(DOW FROM a.data_agendamento) as dia_semana,
                COUNT(a.id) as quantidade,
                SUM(s.preco) as receita
            FROM agendamentos a
            JOIN servicos s ON a.servico_id = s.id
            WHERE a.status = 'confirmado'
            AND a.data_agendamento >= '$inicioSemanaStr'
            AND a.data_agendamento <= '$fimSemanaStr'
            GROUP BY dia_semana
            ORDER BY dia_semana";

    $stmt = $pdo->query($sql);
    $receitaPorDia = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calcular médias históricas por dia da semana (últimos 3 meses)
    $tresMesesAtras = date('Y-m-d', strtotime('-3 months'));
    $sql = "SELECT
                EXTRACT(DOW FROM a.data_agendamento) as dia_semana,
                COUNT(DISTINCT DATE_TRUNC('week', a.data_agendamento)) as numero_semanas,
                COUNT(a.id) as total_atendimentos,
                SUM(s.preco) as total_receita,
                ROUND(COUNT(a.id)::numeric / COUNT(DISTINCT DATE_TRUNC('week', a.data_agendamento)), 1) as media_atendimentos,
                ROUND(SUM(s.preco) / COUNT(DISTINCT DATE_TRUNC('week', a.data_agendamento)), 2) as media_receita
            FROM agendamentos a
            JOIN servicos s ON a.servico_id = s.id
            WHERE a.status = 'confirmado'
            AND a.data_agendamento >= '$tresMesesAtras'
            GROUP BY dia_semana
            ORDER BY dia_semana";

    $stmt = $pdo->query($sql);
    $mediaPorDiaSemana = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Informações da semana atual
    $infoSemana = [
        'inicio' => $inicioSemana->format('d/m/Y'),
        'fim' => $fimSemana->format('d/m/Y'),
        'dias_passados' => $diasParaDomingoAnterior,
        'dias_restantes' => 6 - $diasParaDomingoAnterior
    ];

    // 5. ÚLTIMOS AGENDAMENTOS
    $sql = "SELECT
                a.data_agendamento,
                a.hora_agendamento,
                a.status,
                u.nome as cliente_nome,
                u.email,
                u.telefone,
                s.nome as servico_nome,
                s.preco as servico_preco
            FROM agendamentos a
            JOIN usuarios u ON a.usuario_id = u.id
            LEFT JOIN servicos s ON a.servico_id = s.id
            WHERE 1=1 $periodoWhere
            ORDER BY a.data_agendamento DESC, a.hora_agendamento DESC
            LIMIT 20";

    $stmt = $pdo->query($sql);
    $ultimosAgendamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 6. AGENDAMENTOS NÃO PAGOS (confirmados mas não pagos)
    // IMPORTANTE: Aqui NÃO aplicamos filtro de período, pois queremos ver TODAS as pendências
    $sql = "SELECT
                a.id,
                a.data_agendamento,
                a.hora_agendamento,
                a.status,
                u.nome as cliente_nome,
                u.email,
                u.telefone,
                s.nome as servico_nome,
                s.preco as servico_preco,
                a.pago
            FROM agendamentos a
            JOIN usuarios u ON a.usuario_id = u.id
            LEFT JOIN servicos s ON a.servico_id = s.id
            WHERE a.status = 'confirmado' 
            AND (a.pago = false OR a.pago IS NULL)
            ORDER BY a.data_agendamento ASC, a.hora_agendamento ASC
            LIMIT 50";

    $stmt = $pdo->query($sql);
    $agendamentosNaoPagos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Montar resposta JSON
    $response = [
        'metricas' => [
            'receita_total' => $metricas['receita_total'] ?? 0,
            'total_agendamentos' => $metricas['total_agendamentos'] ?? 0,
            'ticket_medio' => $metricas['ticket_medio'] ?? 0,
            'clientes_atendidos' => $metricas['clientes_atendidos'] ?? 0,
            'pagamentos_recebidos' => $metricas['pagamentos_recebidos'] ?? 0,
            'pagamentos_pendentes' => $metricas['pagamentos_pendentes'] ?? 0,
            'qtd_pagos' => $metricas['qtd_pagos'] ?? 0,
            'qtd_pendentes' => $metricas['qtd_pendentes'] ?? 0
        ],
        'servicos_mais_vendidos' => $servicosMaisVendidos,
        'status_agendamentos' => $statusAgendamentos,
        'receita_por_dia' => $receitaPorDia,
        'ultimos_agendamentos' => $ultimosAgendamentos,
        'media_por_dia_semana' => $mediaPorDiaSemana,
        'info_semana_atual' => $infoSemana,
        'agendamentos_nao_pagos' => $agendamentosNaoPagos
    ];

    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro ao buscar métricas do dashboard: " . $e->getMessage());
    echo json_encode(['mensagem' => 'Erro ao buscar métricas.']);
}
?>
