// js/meus-agendamentos.js

document.addEventListener('DOMContentLoaded', function() {
    const listaAgendamentos = document.querySelector('.lista-agendamentos');
    if (!listaAgendamentos) return;

    async function carregarMeusAgendamentos() {
        try {
            const res = await fetch('../php/meus_agendamentos.php', { cache: 'no-store' });

            if (res.status === 401) {
                listaAgendamentos.innerHTML = '<p>Você precisa fazer <a href="auth.html">login</a> para ver seus agendamentos.</p>';
                return;
            }

            if (!res.ok) throw new Error('Falha ao carregar seus agendamentos.');

            const agendamentos = await res.json();
            listaAgendamentos.innerHTML = '';

            if (!agendamentos || agendamentos.length === 0) {
                listaAgendamentos.innerHTML = '<p>Você ainda não possui agendamentos.</p>';
                return;
            }

            const statusInfo = {
                pendente: { icon: 'fa-hourglass-half', text: 'Pendente' },
                confirmado: { icon: 'fa-check-circle', text: 'Confirmado' },
                recusado: { icon: 'fa-times-circle', text: 'Recusado' }
            };

            agendamentos.forEach(ag => {
                const dataFormatada = new Date(ag.data_agendamento + 'T00:00:00').toLocaleDateString('pt-BR');
                const horaFormatada = ag.hora_agendamento.substring(0, 5);
                const status = ag.status || 'pendente';
                const info = statusInfo[status] || statusInfo.pendente;

                const item = document.createElement('div');
                item.className = `agendamento-item ${status}`;
                item.innerHTML = `
                    <div class="agendamento-info">
                        <h3>${ag.servico}</h3>
                        <p><i class="fas fa-calendar-alt"></i> Data: ${dataFormatada}</p>
                        <p><i class="fas fa-clock"></i> Horário: ${horaFormatada}</p>
                    </div>
                    <div class="agendamento-status ${status}">
                        <i class="fas ${info.icon}"></i> ${info.text}
                    </div>
                `;
                listaAgendamentos.appendChild(item);
            });

        } catch (err) {
            listaAgendamentos.innerHTML = '<p>Ocorreu um erro ao buscar seus agendamentos.</p>';
            console.error('Erro ao carregar agendamentos:', err);
        }
    }

    carregarMeusAgendamentos();
});
