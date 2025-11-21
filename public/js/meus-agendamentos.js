// ===================================
// SCRIPT MEUS AGENDAMENTOS
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Página carregada, iniciando verificações...');
    verificarAutenticacao();
    carregarAgendamentos();
    configurarFiltros();
    configurarLogout();
    configurarModais();
});

// Verificar se o usuário está autenticado
function verificarAutenticacao() {
    console.log('Verificando autenticação...');
    fetch('../php/verificar_sessao.php')
        .then(response => {
            console.log('Status verificação sessão:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Dados da sessão:', data);
            if (!data.logado) {
                console.log('Usuário não logado, redirecionando...');
                window.location.href = 'auth.html';
            } else {
                console.log('Usuário autenticado com sucesso!');
            }
        })
        .catch(error => {
            console.error('Erro ao verificar autenticação:', error);
            alert('Erro ao verificar sessão: ' + error.message);
            window.location.href = 'auth.html';
        });
}

// Carregar agendamentos do usuário
function carregarAgendamentos() {
    console.log('Carregando agendamentos...');
    const container = document.getElementById('agendamentos-container');

    if (!container) {
        console.error('Container de agendamentos não encontrado!');
        return;
    }

    fetch('../php/meus_agendamentos.php')
        .then(response => {
            console.log('Status da resposta:', response.status);
            if (!response.ok) {
                throw new Error('Erro HTTP: ' + response.status);
            }
            return response.text();
        })
        .then(text => {
            console.log('Resposta bruta do servidor:', text);
            try {
                const data = JSON.parse(text);
                console.log('Dados parseados:', data);

                if (data.sucesso) {
                    console.log('Agendamentos carregados:', data.agendamentos.length);
                    exibirAgendamentos(data.agendamentos);
                } else {
                    console.error('Erro do servidor:', data.mensagem);
                    if (data.erro_detalhes) {
                        console.error('Detalhes do erro:', data.erro_detalhes);
                    }
                    container.innerHTML = `
                        <div class="mensagem-vazia">
                            <i class="fas fa-calendar-times"></i>
                            <p>${data.mensagem || 'Erro ao carregar agendamentos.'}</p>
                            ${data.erro_detalhes ? `<p style="color: red; font-size: 0.9rem; margin-top: 10px;">Erro: ${data.erro_detalhes}</p>` : ''}
                            <a href="agendamento.html" class="btn-agendar">
                                <i class="fas fa-plus"></i> Fazer um agendamento
                            </a>
                        </div>
                    `;
                }
            } catch (e) {
                console.error('Erro ao parsear JSON:', e);
                console.error('Texto recebido:', text);
                container.innerHTML = `
                    <div class="mensagem-erro">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erro ao processar resposta do servidor.</p>
                        <p style="color: red; font-size: 0.9rem;">Detalhes: ${e.message}</p>
                        <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 0.8rem; overflow: auto; max-height: 200px;">${text}</pre>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Erro ao carregar agendamentos:', error);
            container.innerHTML = `
                <div class="mensagem-erro">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar agendamentos. Tente novamente.</p>
                    <p style="color: red; font-size: 0.9rem;">Erro técnico: ${error.message}</p>
                </div>
            `;
        });
}

// Exibir agendamentos na tela
function exibirAgendamentos(agendamentos) {
    const container = document.getElementById('agendamentos-container');

    if (!agendamentos || agendamentos.length === 0) {
        container.innerHTML = `
            <div class="mensagem-vazia">
                <i class="fas fa-calendar-times"></i>
                <p>Você ainda não possui agendamentos.</p>
                <a href="agendamento.html" class="btn-agendar">
                    <i class="fas fa-plus"></i> Fazer meu primeiro agendamento
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = agendamentos.map(agendamento => {
        // Determinar o status de exibição
        const statusExibicao = getStatusExibicao(agendamento);

        return `
        <div class="agendamento-item" data-status="${statusExibicao}" data-id="${agendamento.id}">
            <div class="agendamento-header">
                <div class="agendamento-info">
                    <h3>
                        <i class="fas fa-calendar-alt"></i>
                        ${formatarData(agendamento.data_agendamento)}
                    </h3>
                    <div class="info-detalhes">
                        <p>
                            <i class="fas fa-clock"></i>
                            <strong>Horário:</strong> ${agendamento.horario}
                        </p>
                        ${agendamento.servico_nome ? `
                        <p>
                            <i class="fas fa-spa"></i>
                            <strong>Serviço:</strong> ${agendamento.servico_nome}
                        </p>
                        ` : ''}
                        ${agendamento.servico_preco ? `
                        <p>
                            <i class="fas fa-money-bill-wave"></i>
                            <strong>Valor:</strong> R$ ${parseFloat(agendamento.servico_preco).toFixed(2)}
                        </p>
                        ` : ''}
                    </div>
                </div>
                <div class="agendamento-status ${statusExibicao}">
                    ${getStatusIcon(statusExibicao)}
                    ${getStatusTexto(statusExibicao)}
                </div>
            </div>

            <!-- AÇÕES -->
            ${podeSerCancelado(agendamento) ? `
            <div class="agendamento-acoes">
                <button class="btn-acao btn-cancelar" onclick="abrirModalCancelar(${agendamento.id})">
                    <i class="fas fa-times-circle"></i>
                    Cancelar Agendamento
                </button>
            </div>
            ` : ''}
        </div>
    `;
    }).join('');
}

// Determinar o status de exibição do agendamento
function getStatusExibicao(agendamento) {
    // Se já está cancelado, continua cancelado
    if (agendamento.status === 'cancelado') {
        return 'cancelado';
    }

    // Se já está marcado como concluído, continua concluído
    if (agendamento.status === 'concluido') {
        return 'concluido';
    }

    // Verificar se a data/hora já passou
    const dataAgendamento = new Date(agendamento.data_agendamento + 'T' + agendamento.horario);
    const agora = new Date();

    // Se confirmado e a data já passou, exibir como concluído
    if (agendamento.status === 'confirmado' && dataAgendamento < agora) {
        return 'concluido';
    }

    // Caso contrário, retorna o status original
    return agendamento.status;
}

// Verificar se o agendamento pode ser cancelado
function podeSerCancelado(agendamento) {
    // Só pode cancelar se o status for pendente ou confirmado
    if (agendamento.status !== 'pendente' && agendamento.status !== 'confirmado') {
        return false;
    }

    // Verificar se a data/hora do agendamento é futura
    const dataAgendamento = new Date(agendamento.data_agendamento + 'T' + agendamento.horario);
    const agora = new Date();

    return dataAgendamento > agora;
}

// Obter ícone do status
function getStatusIcon(status) {
    const icons = {
        'pendente': '<i class="fas fa-clock"></i>',
        'confirmado': '<i class="fas fa-check-circle"></i>',
        'cancelado': '<i class="fas fa-times-circle"></i>',
        'concluido': '<i class="fas fa-check-double"></i>'
    };
    return icons[status] || '<i class="fas fa-question-circle"></i>';
}

// Obter texto do status
function getStatusTexto(status) {
    const textos = {
        'pendente': 'Pendente',
        'confirmado': 'Confirmado',
        'cancelado': 'Cancelado',
        'concluido': 'Concluído'
    };
    return textos[status] || status;
}

// Formatar data
function formatarData(data) {
    const date = new Date(data + 'T00:00:00');
    const opcoes = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return date.toLocaleDateString('pt-BR', opcoes);
}

// Abrir modal de cancelamento
let agendamentoParaCancelar = null;

function abrirModalCancelar(id) {
    agendamentoParaCancelar = id;
    const modal = document.getElementById('modal-cancelar');
    modal.classList.add('active');
}

// Cancelar agendamento
function cancelarAgendamento() {
    if (!agendamentoParaCancelar) return;

    fetch('../php/cancelar_agendamento.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: agendamentoParaCancelar })
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            alert('Agendamento cancelado com sucesso!');
            fecharModais();
            carregarAgendamentos();
        } else {
            alert(data.mensagem || 'Erro ao cancelar agendamento.');
        }
    })
    .catch(error => {
        console.error('Erro ao cancelar agendamento:', error);
        alert('Erro ao cancelar agendamento. Tente novamente.');
    });
}

// Configurar filtros
function configurarFiltros() {
    const botoesFiltro = document.querySelectorAll('.filtro-btn');

    botoesFiltro.forEach(botao => {
        botao.addEventListener('click', function() {
            // Remover active de todos
            botoesFiltro.forEach(btn => btn.classList.remove('active'));
            // Adicionar active no clicado
            this.classList.add('active');

            const filtro = this.dataset.filtro;
            const agendamentos = document.querySelectorAll('.agendamento-item');

            agendamentos.forEach(agendamento => {
                if (filtro === 'todos' || agendamento.dataset.status === filtro) {
                    agendamento.classList.remove('hidden');
                } else {
                    agendamento.classList.add('hidden');
                }
            });
        });
    });
}

// Configurar modais
function configurarModais() {
    // Botões de fechar modal
    const botoesFechar = document.querySelectorAll('.modal-close');
    botoesFechar.forEach(botao => {
        botao.addEventListener('click', fecharModais);
    });

    // Confirmar cancelamento
    const btnConfirmarCancelar = document.getElementById('btn-confirmar-cancelar');
    if (btnConfirmarCancelar) {
        btnConfirmarCancelar.addEventListener('click', cancelarAgendamento);
    }

    // Não cancelar
    const btnNaoCancelar = document.getElementById('btn-nao-cancelar');
    if (btnNaoCancelar) {
        btnNaoCancelar.addEventListener('click', fecharModais);
    }

    // Fechar ao clicar fora do modal
    const modais = document.querySelectorAll('.modal');
    modais.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                fecharModais();
            }
        });
    });
}

// Fechar modais
function fecharModais() {
    const modais = document.querySelectorAll('.modal');
    modais.forEach(modal => modal.classList.remove('active'));
    agendamentoParaCancelar = null;
}

// Configurar logout
function configurarLogout() {
    const btnLogout = document.getElementById('logout-link');
    if (btnLogout) {
        btnLogout.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Deseja realmente sair?')) {
                fetch('../php/logout.php')
                    .then(() => {
                        window.location.href = 'auth.html';
                    })
                    .catch(error => {
                        console.error('Erro ao fazer logout:', error);
                        window.location.href = 'auth.html';
                    });
            }
        });
    }
}
