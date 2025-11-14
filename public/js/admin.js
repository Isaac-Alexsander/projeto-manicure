// js/admin.js

document.addEventListener('DOMContentLoaded', function() {
    const adminLista = document.querySelector('.admin-lista');
    const calendarGrid = document.querySelector('.admin-calendar-container .calendar-grid');
    const currentMonthYearElement = document.getElementById('current-month-year');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const selectedDayInfo = document.getElementById('selected-day-info');

    if (!adminLista || !calendarGrid || !currentMonthYearElement) return;

    // Horários disponíveis por dia
    const ALL_SLOTS = ['09:00', '11:00', '15:00'];

    let agendamentosCache = []; // array de agendamentos do servidor
    let currentDate = new Date();

    async function ensureAdmin() {
        try {
            const res = await fetch('../php/verificar_sessao.php', { cache: 'no-store' });
            if (!res.ok) throw new Error('Falha ao verificar sessão');
            const session = await res.json();
            if (!session.logado || session.role !== 'admin') {
                // bloquear acesso
                document.body.innerHTML = '<main class="pagina-container"><h2>Acesso negado</h2><p>Você precisa ser administrador para acessar este painel.</p><p><a href="index.html">Voltar</a></p></main>';
                throw new Error('Acesso negado');
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    async function fetchAgendamentos() {
        try {
            const res = await fetch('../php/listar_agendamentos.php', { cache: 'no-store' });
            if (!res.ok) throw new Error('Falha ao carregar agendamentos');
            agendamentosCache = await res.json();
        } catch (e) {
            console.error('Erro ao buscar agendamentos:', e);
            agendamentosCache = [];
        }
    }

    function keyForDate(dateObj) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function normalizeTime(t) {
        if (!t) return '';
        // trim e normaliza
        const s = String(t).trim();
        const m = s.match(/(\d{1,2}):(\d{2})/);
        if (m) {
            const hh = String(m[1]).padStart(2, '0');
            const mm = m[2];
            return `${hh}:${mm}`;
        }
        const sub = s.substring(0,5);
        const parts = sub.split(':');
        if (parts.length === 2) return parts[0].padStart(2,'0') + ':' + parts[1];
        return sub;
    }

    function buildMapByDate() {
        const map = {};
        agendamentosCache.forEach(a => {
            // Ignorar agendamentos recusados (libera a vaga)
            if (typeof a.status === 'string' && a.status.toLowerCase() === 'recusado') return;

            const d = a.data_agendamento; // espera YYYY-MM-DD
            var horaNorm = normalizeTime(a.hora_agendamento);
            var item = Object.assign({}, a, { horaNorm: horaNorm });
            if (!map[d]) map[d] = [];
            map[d].push(item);
        });
        return map;
    }

    function renderCalendar() {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        currentMonthYearElement.textContent = `${currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`;

        // Cabeçalhos dos dias
        calendarGrid.innerHTML = '<div class="weekday">Dom</div><div class="weekday">Seg</div><div class="weekday">Ter</div><div class="weekday">Qua</div><div class="weekday">Qui</div><div class="weekday">Sex</div><div class="weekday">Sáb</div>';

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Preencher primeiras células vazias
        for (let i = 0; i < firstDayOfMonth; i++) { calendarGrid.appendChild(document.createElement('div')); }

        const map = buildMapByDate();
        const today = new Date(); today.setHours(0,0,0,0);

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');

            const dayNumber = document.createElement('span');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);

            const dayDate = new Date(year, month, day);
            const key = keyForDate(dayDate);

            // Disponibilidade
            const booked = (map[key] || []).map(x => x.horaNorm);
            const freeSlots = ALL_SLOTS.filter(s => !booked.includes(s));

            // title para ajudar visibilidade (hover)
            dayElement.setAttribute('title', freeSlots.length > 0 ? `Horários livres: ${freeSlots.join(', ')}` : 'Sem horários livres');

            if (dayDate < today) {
                dayElement.classList.add('unavailable');
            } else {
                if (dayDate.getDay() === 0 || dayDate.getDay() === 1) {
                    // domingo ou segunda não atendemos
                    dayElement.classList.add('unavailable');
                } else {
                    dayElement.classList.add('admin-bookable');
                    if (freeSlots.length === 0) {
                        dayElement.classList.add('fully-booked'); // Vermelho
                    } else {
                        dayElement.classList.add('available'); // Verde
                    }

                    const badge = document.createElement('span');
                    badge.className = 'day-badge';
                    badge.textContent = freeSlots.length;
                    dayElement.appendChild(badge);
                }
            }

            dayElement.dataset.date = key;
            calendarGrid.appendChild(dayElement);
        }
    }

    function formatDateBR(ymd) {
        const parts = ymd.split('-');
        if (parts.length !== 3) return ymd;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    function showDayDetails(ymd) {
        const items = (agendamentosCache || []).filter(a => a.data_agendamento === ymd);
        const bookedByTime = {};
        items.forEach(i => {
            const h = normalizeTime(i.hora_agendamento);
            bookedByTime[h] = bookedByTime[h] || [];
            bookedByTime[h].push(i);
        });

        let html = `<h3>${formatDateBR(ymd)}</h3>`;
        html += '<h4>Horários disponíveis</h4>';
        const free = ALL_SLOTS.filter(s => !Object.keys(bookedByTime).includes(s));
        if (free.length === 0) html += '<p>Nenhum horário livre neste dia.</p>';
        else html += `<ul>${free.map(s => `<li>${s}</li>`).join('')}</ul>`;

        html += '<h4>Agendamentos</h4>';
        if (items.length === 0) html += '<p>Não há agendamentos neste dia.</p>';
        else {
            html += '<ul class="day-appointments">';
            items.sort((a,b) => normalizeTime(a.hora_agendamento).localeCompare(normalizeTime(b.hora_agendamento))).forEach(a => {
                const horaDisplay = normalizeTime(a.hora_agendamento);
                const servicoInfo = a.servico ? ` — ${a.servico}` : '';
                html += `<li><strong>${horaDisplay}</strong>${servicoInfo} — ${a.email} — <em>${a.status}</em></li>`;
            });
            html += '</ul>';
        }

        selectedDayInfo.innerHTML = html;
    }

    calendarGrid.addEventListener('click', (e) => {
        const dayEl = e.target.closest('.day');
        if (!dayEl || !dayEl.dataset || !dayEl.dataset.date) return;
        if (dayEl.classList.contains('unavailable')) return;
        // remover seleção anterior
        document.querySelector('.admin-calendar-container .day.selected')?.classList.remove('selected');
        dayEl.classList.add('selected');
        const date = dayEl.dataset.date;
        showDayDetails(date);
    });

    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });

    // manter listagem de solicitações (pendentes em destaque)
    async function carregarAgendamentos() {
        try {
            const res = await fetch('../php/listar_agendamentos.php', { cache: 'no-store' });
            if (!res.ok) throw new Error('Falha ao carregar dados');
            const agendamentos = await res.json();
            // Atualizar cache também
            agendamentosCache = agendamentos;

            adminLista.innerHTML = '';
            const pendentes = agendamentos.filter(a => a.status === 'pendente');
            if (pendentes.length === 0) {
                adminLista.innerHTML = '<p>Nenhum agendamento pendente.</p>';
                return;
            }
            pendentes.forEach(ag => {
                const dataFormatada = new Date(ag.data_agendamento + 'T00:00:00').toLocaleDateString('pt-BR');
                const horaFormatada = ag.hora_agendamento.substring(0,5);
                const item = document.createElement('div');
                item.className = `agendamento-item ${ag.status}`;
                item.dataset.id = ag.id;
                const acoesHtml = `<button class="confirmar">Confirmar</button><button class="recusar">Recusar</button>`;
                item.innerHTML = `
                    <div class="admin-info">
                        <p><strong>Data:</strong> ${dataFormatada}</p>
                        <p><strong>Hora:</strong> ${horaFormatada}</p>
                        <p><strong>Serviço:</strong> ${ag.servico}</p>
                        <p><strong>Cliente:</strong> ${ag.email}</p>
                    </div>
                    <div class="admin-acoes">${acoesHtml}</div>`;
                adminLista.appendChild(item);
            });

            // Re-render calendar para mostrar badges atualizados
            renderCalendar();

        } catch (err) {
            adminLista.innerHTML = '<p>Erro ao carregar agendamentos.</p>';
            console.error(err);
        }
    }

    async function atualizarStatus(id, status) {
        try {
            const res = await fetch('../php/atualizar_status.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.mensagem || 'Erro');
            await carregarAgendamentos();
        } catch (err) {
            alert(err.message || 'Erro ao atualizar status');
            console.error(err);
        }
    }

    adminLista.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const item = btn.closest('.agendamento-item');
        if (!item) return;
        const id = item.dataset.id;
        if (btn.classList.contains('confirmar')) atualizarStatus(id, 'confirmado');
        if (btn.classList.contains('recusar')) atualizarStatus(id, 'recusado');
    });

    // Inicialização
    (async () => {
        try {
            await ensureAdmin();
            await fetchAgendamentos();
            renderCalendar();
            await carregarAgendamentos();
        } catch (e) {
            // access denied já tratado em ensureAdmin
        }
    })();

});
