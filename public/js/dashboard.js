// js/dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    const periodoFiltro = document.getElementById('periodo-filtro');
    const btnRefresh = document.getElementById('btn-refresh');

    // Verificar se é admin
    async function ensureAdmin() {
        try {
            const res = await fetch('../php/verificar_sessao.php', { cache: 'no-store' });
            if (!res.ok) throw new Error('Falha ao verificar sessão');
            const session = await res.json();
            if (!session.logado || session.role !== 'admin') {
                document.body.innerHTML = '<main class="pagina-container"><h2>Acesso negado</h2><p>Você precisa ser administrador para acessar este painel.</p><p><a href="index.html">Voltar</a></p></main>';
                throw new Error('Acesso negado');
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    // Buscar métricas do backend
    async function fetchMetricas(periodo = 'todos') {
        try {
            const res = await fetch(`../php/dashboard_metricas.php?periodo=${periodo}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('Falha ao carregar métricas');
            return await res.json();
        } catch (e) {
            console.error('Erro ao buscar métricas:', e);
            return null;
        }
    }

    // Atualizar cards de métricas
    function atualizarCards(metricas) {
        if (!metricas) return;

        document.getElementById('receita-total').textContent =
            `R$ ${parseFloat(metricas.receita_total || 0).toFixed(2).replace('.', ',')}`;

        document.getElementById('total-agendamentos').textContent =
            metricas.total_agendamentos || 0;

        document.getElementById('ticket-medio').textContent =
            `R$ ${parseFloat(metricas.ticket_medio || 0).toFixed(2).replace('.', ',')}`;

        document.getElementById('clientes-atendidos').textContent =
            metricas.clientes_atendidos || 0;

        // Atualizar cards de pagamento
        const pagamentosRecebidos = parseFloat(metricas.pagamentos_recebidos || 0);
        const pagamentosPendentes = parseFloat(metricas.pagamentos_pendentes || 0);
        const qtdPagos = parseInt(metricas.qtd_pagos || 0);
        const qtdPendentes = parseInt(metricas.qtd_pendentes || 0);
        const totalPagamentos = qtdPagos + qtdPendentes;
        const taxaPagamento = totalPagamentos > 0 ? ((qtdPagos / totalPagamentos) * 100).toFixed(1) : 0;

        document.getElementById('pagamentos-recebidos').textContent =
            `R$ ${pagamentosRecebidos.toFixed(2).replace('.', ',')}`;
        document.getElementById('qtd-pagos').textContent =
            `${qtdPagos} agendamento${qtdPagos !== 1 ? 's' : ''} pago${qtdPagos !== 1 ? 's' : ''}`;

        document.getElementById('pagamentos-pendentes').textContent =
            `R$ ${pagamentosPendentes.toFixed(2).replace('.', ',')}`;
        document.getElementById('qtd-pendentes').textContent =
            `${qtdPendentes} agendamento${qtdPendentes !== 1 ? 's' : ''} pendente${qtdPendentes !== 1 ? 's' : ''}`;

        document.getElementById('taxa-pagamento').textContent = `${taxaPagamento}%`;
    }

    // Atualizar tabela de serviços mais vendidos
    function atualizarTabelaServicos(servicos) {
        const tbody = document.querySelector('#tabela-servicos tbody');
        if (!servicos || servicos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading-cell">Nenhum serviço vendido no período.</td></tr>';
            return;
        }

        const receitaTotal = servicos.reduce((sum, s) => sum + parseFloat(s.receita || 0), 0);

        tbody.innerHTML = servicos.map(s => {
            const percentual = receitaTotal > 0 ? (parseFloat(s.receita) / receitaTotal * 100).toFixed(1) : 0;
            return `
                <tr>
                    <td><strong>${s.nome}</strong></td>
                    <td>${s.quantidade}</td>
                    <td>R$ ${parseFloat(s.receita).toFixed(2).replace('.', ',')}</td>
                    <td>${percentual}%</td>
                </tr>
            `;
        }).join('');
    }

    // Atualizar gráfico de status
    function atualizarGraficoStatus(statusData) {
        if (!statusData) return;

        const total = (statusData.confirmado || 0) + (statusData.pendente || 0) + (statusData.recusado || 0);

        if (total === 0) {
            document.querySelectorAll('.status-fill').forEach(fill => fill.style.width = '0%');
            document.querySelectorAll('.status-valor').forEach(val => val.textContent = '0');
            return;
        }

        // Confirmados
        const percConfirmado = (statusData.confirmado / total * 100).toFixed(1);
        document.querySelector('.status-confirmado').style.width = percConfirmado + '%';
        document.querySelectorAll('.status-valor')[0].textContent = statusData.confirmado || 0;

        // Pendentes
        const percPendente = (statusData.pendente / total * 100).toFixed(1);
        document.querySelector('.status-pendente').style.width = percPendente + '%';
        document.querySelectorAll('.status-valor')[1].textContent = statusData.pendente || 0;

        // Recusados
        const percRecusado = (statusData.recusado / total * 100).toFixed(1);
        document.querySelector('.status-recusado').style.width = percRecusado + '%';
        document.querySelectorAll('.status-valor')[2].textContent = statusData.recusado || 0;
    }

    // Atualizar gráfico de dias da semana
    function atualizarGraficoDiasSemana(diasData) {
        const container = document.getElementById('bars-dias-semana');

        const diasNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const diasAbrev = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        // Criar estrutura completa com todos os dias da semana (0-6)
        const todosOsDias = [0, 1, 2, 3, 4, 5, 6].map(diaSemana => {
            // Verificar se há dados para este dia
            const dadoDia = diasData && diasData.find(d => parseInt(d.dia_semana) === diaSemana);

            return {
                dia_semana: diaSemana,
                receita: dadoDia ? parseFloat(dadoDia.receita) : 0,
                quantidade: dadoDia ? parseInt(dadoDia.quantidade) : 0
            };
        });

        // Calcular totais
        const totalReceita = todosOsDias.reduce((sum, d) => sum + d.receita, 0);
        const totalAgendamentos = todosOsDias.reduce((sum, d) => sum + d.quantidade, 0);
        const diasComReceita = todosOsDias.filter(d => d.receita > 0).length;
        const mediaPorDia = diasComReceita > 0 ? totalReceita / diasComReceita : 0;
        const maxReceita = Math.max(...todosOsDias.map(d => d.receita), 1);

        // Criar HTML com cabeçalho de informações da semana
        let html = `
            <div class="chart-header">
                <div class="chart-stat chart-stat-total">
                    <i class="fas fa-coins"></i>
                    <div class="chart-stat-content">
                        <span class="chart-stat-label">Receita Total</span>
                        <span class="chart-stat-value">R$ ${totalReceita.toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
                <div class="chart-stat chart-stat-media">
                    <i class="fas fa-chart-line"></i>
                    <div class="chart-stat-content">
                        <span class="chart-stat-label">Média por Dia</span>
                        <span class="chart-stat-value">R$ ${mediaPorDia.toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
                <div class="chart-stat chart-stat-atend">
                    <i class="fas fa-calendar-check"></i>
                    <div class="chart-stat-content">
                        <span class="chart-stat-label">Atendimentos</span>
                        <span class="chart-stat-value">${totalAgendamentos}</span>
                    </div>
                </div>
            </div>
            <div class="chart-bars-wrapper">
                <div class="chart-bars">
        `;

        // Adicionar barras para cada dia
        html += todosOsDias.map(d => {
            const altura = maxReceita > 0 ? (d.receita / maxReceita * 100) : 0;
            const receita = d.receita.toFixed(2).replace('.', ',');
            const nomeDia = diasNomes[d.dia_semana];
            const nomeAbrev = diasAbrev[d.dia_semana];
            const percentualDoTotal = totalReceita > 0 ? ((d.receita / totalReceita) * 100).toFixed(1) : 0;

            return `
                <div class="bar-item">
                    <div class="bar-wrapper">
                        <div class="bar" style="height: ${Math.max(altura, 10)}%" 
                             title="${nomeDia}: R$ ${receita} (${d.quantidade} agendamentos${percentualDoTotal > 0 ? ' - ' + percentualDoTotal + '% do total' : ''})">
                            ${d.receita > 0 ? `<span class="bar-value">R$ ${receita}</span>` : ''}
                            ${percentualDoTotal > 0 ? `<span class="bar-percent">${percentualDoTotal}%</span>` : ''}
                        </div>
                    </div>
                    <div class="bar-label" title="${nomeDia}">${nomeAbrev}</div>
                    <div class="bar-count">${d.quantidade} atend.</div>
                </div>
            `;
        }).join('');

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    // Atualizar tabela de últimos agendamentos
    function atualizarTabelaUltimos(agendamentos) {
        const tbody = document.querySelector('#tabela-ultimos tbody');
        if (!agendamentos || agendamentos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Nenhum agendamento encontrado.</td></tr>';
            return;
        }

        tbody.innerHTML = agendamentos.slice(0, 10).map(a => {
            const data = new Date(a.data_agendamento + 'T00:00:00').toLocaleDateString('pt-BR');
            const hora = a.hora_agendamento.substring(0, 5);
            const preco = parseFloat(a.servico_preco || 0).toFixed(2).replace('.', ',');
            const statusClass = a.status ? a.status.toLowerCase() : 'pendente';
            const statusText = a.status || 'pendente';
            const clienteNome = a.cliente_nome || a.email; // Usa nome se disponível, senão email

            return `
                <tr>
                    <td>${data}</td>
                    <td>${hora}</td>
                    <td><strong>${clienteNome}</strong></td>
                    <td>${a.servico_nome || '—'}</td>
                    <td>R$ ${preco}</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                </tr>
            `;
        }).join('');
    }

    // Atualizar tabela de agendamentos não pagos
    function atualizarTabelaNaoPagos(agendamentos) {
        const tbody = document.querySelector('#tabela-nao-pagos tbody');

        if (!tbody) {
            console.error('Erro: elemento tbody não encontrado');
            return;
        }

        if (!agendamentos || agendamentos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">✅ Todos os pagamentos estão em dia!</td></tr>';
            return;
        }

        try {
            let html = '';
            for (let i = 0; i < agendamentos.length; i++) {
                const a = agendamentos[i];

                const data = new Date(a.data_agendamento + 'T00:00:00').toLocaleDateString('pt-BR');
                const hora = a.hora_agendamento.substring(0, 5);
                const preco = parseFloat(a.servico_preco || 0).toFixed(2).replace('.', ',');
                const clienteNome = a.cliente_nome || a.email || 'N/A';
                const telefone = a.telefone || '—';
                const servicoNome = a.servico_nome || '—';

                html += `<tr class="nao-pago-row" data-id="${a.id}">
                    <td>${data}</td>
                    <td>${hora}</td>
                    <td><strong>${clienteNome}</strong></td>
                    <td>${telefone}</td>
                    <td>${servicoNome}</td>
                    <td><strong>R$ ${preco}</strong></td>
                    <td><span class="badge badge-warning">Confirmado - Não Pago</span></td>
                    <td>
                        <button class="btn-marcar-pago" data-id="${a.id}" title="Marcar como pago">
                            <i class="fas fa-check-circle"></i> Marcar Pago
                        </button>
                    </td>
                </tr>`;
            }

            tbody.innerHTML = html;
        } catch (error) {
            console.error('Erro ao processar agendamentos:', error);
            tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">Erro ao carregar dados</td></tr>';
        }
    }

    // Função para marcar agendamento como pago
    async function marcarComoPago(id) {
        try {
            const res = await fetch('../php/atualizar_pagamento.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, pago: true })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.mensagem || 'Erro ao atualizar pagamento');

            // Recarregar dashboard para atualizar os dados
            const periodo = periodoFiltro.value;
            await carregarDashboard(periodo);

            return true;
        } catch (err) {
            alert(err.message || 'Erro ao atualizar pagamento');
            console.error(err);
            return false;
        }
    }

    // Carregar dashboard completo
    async function carregarDashboard(periodo = 'todos') {
        const data = await fetchMetricas(periodo);
        if (!data) {
            alert('Erro ao carregar dados do dashboard.');
            return;
        }

        atualizarCards(data.metricas);
        atualizarTabelaServicos(data.servicos_mais_vendidos);
        atualizarGraficoStatus(data.status_agendamentos);
        atualizarGraficoDiasSemana(data.receita_por_dia);
        atualizarTabelaUltimos(data.ultimos_agendamentos);
        atualizarTabelaNaoPagos(data.agendamentos_nao_pagos); // Adicionado o carregamento da tabela de não pagos
    }

    // Event listeners
    periodoFiltro.addEventListener('change', (e) => {
        carregarDashboard(e.target.value);
    });

    btnRefresh.addEventListener('click', () => {
        const periodo = periodoFiltro.value;
        carregarDashboard(periodo);
    });

    // Event listener para botões de marcar como pago
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-marcar-pago')) {
            const btn = e.target.closest('.btn-marcar-pago');
            const id = btn.dataset.id;

            if (confirm('Confirmar que este agendamento foi pago?')) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

                const sucesso = await marcarComoPago(id);

                if (!sucesso) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-check-circle"></i> Marcar Pago';
                }
            }
        }
    });

    // Inicialização
    (async () => {
        try {
            await ensureAdmin();
            await carregarDashboard('todos'); // Alterado de 'mes-atual' para 'todos'
        } catch (e) {
            // Acesso negado tratado em ensureAdmin
        }
    })();
});
