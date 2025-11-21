// js/admin.js

document.addEventListener('DOMContentLoaded', function() {
    const adminLista = document.querySelector('.admin-lista');
    const calendarGrid = document.querySelector('.admin-calendar-container .calendar-grid');
    const currentMonthYearElement = document.getElementById('current-month-year');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const selectedDayInfo = document.getElementById('selected-day-info');

    if (!adminLista || !calendarGrid || !currentMonthYearElement) return;

    const ALL_SLOTS = ['09:00', '11:00', '15:00'];
    let agendamentosCache = [];
    let currentDate = new Date();

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
            if (typeof a.status === 'string' && (a.status.toLowerCase() === 'recusado' || a.status.toLowerCase() === 'cancelado')) return;
            const d = a.data_agendamento;
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

        calendarGrid.innerHTML = '<div class="weekday">Dom</div><div class="weekday">Seg</div><div class="weekday">Ter</div><div class="weekday">Qua</div><div class="weekday">Qui</div><div class="weekday">Sex</div><div class="weekday">Sáb</div>';

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarGrid.appendChild(document.createElement('div'));
        }

        const map = buildMapByDate();
        const today = new Date();
        today.setHours(0,0,0,0);

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');

            const dayNumber = document.createElement('span');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);

            const dayDate = new Date(year, month, day);
            const key = keyForDate(dayDate);

            const booked = (map[key] || []).map(x => x.horaNorm);
            const freeSlots = ALL_SLOTS.filter(s => !booked.includes(s));

            dayElement.setAttribute('title', freeSlots.length > 0 ? `Horários livres: ${freeSlots.join(', ')}` : 'Sem horários livres');

            if (dayDate < today) {
                dayElement.classList.add('unavailable');
            } else {
                if (dayDate.getDay() === 0 || dayDate.getDay() === 6) {
                    dayElement.classList.add('unavailable');
                } else {
                    dayElement.classList.add('admin-bookable');
                    if (freeSlots.length === 0) {
                        dayElement.classList.add('fully-booked');
                    } else {
                        dayElement.classList.add('available');
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
            // Ignorar agendamentos cancelados e recusados ao calcular horários ocupados
            if (typeof i.status === 'string' && (i.status.toLowerCase() === 'recusado' || i.status.toLowerCase() === 'cancelado')) {
                return;
            }
            const h = normalizeTime(i.hora_agendamento);
            bookedByTime[h] = bookedByTime[h] || [];
            bookedByTime[h].push(i);
        });

        let html = `<h3><i class="fas fa-calendar-alt"></i> ${formatDateBR(ymd)}</h3>`;
        html += '<h4><i class="fas fa-check-circle"></i> Horários disponíveis</h4>';
        const free = ALL_SLOTS.filter(s => !Object.keys(bookedByTime).includes(s));
        if (free.length === 0) html += '<p>Nenhum horário livre neste dia.</p>';
        else html += `<ul>${free.map(s => `<li><i class="far fa-clock"></i> ${s}</li>`).join('')}</ul>`;

        html += '<h4><i class="fas fa-list-ul"></i> Agendamentos</h4>';
        if (items.length === 0) html += '<p>Não há agendamentos neste dia.</p>';
        else {
            html += '<ul class="day-appointments">';
            items.sort((a,b) => normalizeTime(a.hora_agendamento).localeCompare(normalizeTime(b.hora_agendamento))).forEach(a => {
                const horaDisplay = normalizeTime(a.hora_agendamento);
                const servicoInfo = a.servico_nome || 'Serviço não especificado';
                const clienteNome = a.cliente_nome || a.email || 'Cliente';
                const emailCliente = a.email || '—';
                const telefoneCliente = a.telefone || '—';
                const statusClass = `status-${a.status.toLowerCase()}`;
                const isPago = a.pago == 1 || a.pago === true;

                const statusPermiteEdicao = a.status !== 'cancelado' && a.status !== 'recusado';
                const checkboxDisabled = !statusPermiteEdicao ? 'disabled' : '';

                html += `<li data-id="${a.id}">
                    <div class="appointment-time"><i class="far fa-clock"></i> ${horaDisplay}</div>
                    <div class="appointment-details">
                        <span class="appointment-service"><i class="fas fa-cut"></i> ${servicoInfo}</span>
                        <span class="appointment-client"><i class="fas fa-user"></i> ${clienteNome}</span>
                        <em class="${statusClass}">${a.status}</em>
                    </div>
                    <div class="appointment-contact">
                        <span class="contact-item"><i class="fas fa-envelope"></i> ${emailCliente}</span>
                        <span class="contact-item"><i class="fas fa-phone"></i> ${telefoneCliente}</span>
                    </div>
                    <div class="appointment-payment ${isPago ? 'payment-paid' : 'payment-pending'}">
                        <label>
                            <input type="checkbox" class="payment-checkbox-detail" ${isPago ? 'checked' : ''} ${checkboxDisabled}>
                            <span class="payment-label">${isPago ? 'Pagamento realizado' : 'Pagamento pendente'}</span>
                        </label>
                    </div>
                </li>`;
            });
            html += '</ul>';
        }

        selectedDayInfo.innerHTML = html;
    }

    calendarGrid.addEventListener('click', (e) => {
        const dayEl = e.target.closest('.day');
        if (!dayEl || !dayEl.dataset || !dayEl.dataset.date) return;
        if (dayEl.classList.contains('unavailable')) return;
        document.querySelector('.admin-calendar-container .day.selected')?.classList.remove('selected');
        dayEl.classList.add('selected');
        const date = dayEl.dataset.date;
        showDayDetails(date);
    });

    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    async function carregarAgendamentos() {
        try {
            const res = await fetch('../php/listar_agendamentos.php', { cache: 'no-store' });
            if (!res.ok) throw new Error('Falha ao carregar dados');
            const agendamentos = await res.json();
            agendamentosCache = agendamentos;

            adminLista.innerHTML = '';
            const pendentes = agendamentos.filter(a => a.status === 'pendente');

            if (pendentes.length === 0) {
                adminLista.innerHTML = '<p><i class="fas fa-check-circle"></i> Nenhum agendamento pendente.</p>';
                return;
            }

            pendentes.forEach(ag => {
                const dataFormatada = new Date(ag.data_agendamento + 'T00:00:00').toLocaleDateString('pt-BR');
                const horaFormatada = ag.hora_agendamento.substring(0,5);
                const item = document.createElement('div');
                item.className = `agendamento-item ${ag.status}`;
                item.dataset.id = ag.id;
                const servicoDisplay = ag.servico_nome || '—';
                const clienteNome = ag.cliente_nome || ag.email;
                const emailCliente = ag.email || '—';
                const telefoneCliente = ag.telefone || '—';

                item.innerHTML = `
                    <div class="admin-info">
                        <p><strong><i class="fas fa-calendar"></i> Data:</strong> <span class="info-value">${dataFormatada}</span></p>
                        <p><strong><i class="far fa-clock"></i> Hora:</strong> <span class="info-value">${horaFormatada}</span></p>
                        <p><strong><i class="fas fa-cut"></i> Serviço:</strong> <span class="info-value">${servicoDisplay}</span></p>
                        <p><strong><i class="fas fa-user"></i> Cliente:</strong> <span class="info-value">${clienteNome}</span></p>
                        <p><strong><i class="fas fa-envelope"></i> Email:</strong> <span class="info-value contact-info">${emailCliente}</span></p>
                        <p><strong><i class="fas fa-phone"></i> Telefone:</strong> <span class="info-value contact-info">${telefoneCliente}</span></p>
                    </div>
                    <div class="admin-acoes">
                        <button class="confirmar"><i class="fas fa-check"></i> Confirmar</button>
                        <button class="recusar"><i class="fas fa-times"></i> Recusar</button>
                    </div>`;
                adminLista.appendChild(item);
            });

            const requestsTitle = document.querySelector('.admin-requests h2');
            if (requestsTitle && pendentes.length > 0) {
                const badge = requestsTitle.querySelector('.pendencias-badge');
                if (badge) badge.remove();
                requestsTitle.innerHTML = `<i class="fas fa-clock"></i> Solicitações Pendentes <span class="pendencias-badge">${pendentes.length}</span>`;
            }

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

    async function atualizarPagamento(id, pago) {
        try {
            const res = await fetch('../php/atualizar_pagamento.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, pago })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.mensagem || 'Erro');
        } catch (err) {
            alert(err.message || 'Erro ao atualizar pagamento');
            console.error(err);
            return false;
        }
        return true;
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

    selectedDayInfo.addEventListener('change', async (e) => {
        if (e.target.classList.contains('payment-checkbox-detail')) {
            const checkbox = e.target;
            const item = checkbox.closest('li');
            const id = item.dataset.id;
            const pago = checkbox.checked;

            const paymentDiv = checkbox.closest('.appointment-payment');
            const span = checkbox.nextElementSibling;

            const success = await atualizarPagamento(id, pago);

            if (success) {
                if (pago) {
                    paymentDiv.classList.remove('payment-pending');
                    paymentDiv.classList.add('payment-paid');
                    span.textContent = 'Pagamento realizado';
                } else {
                    paymentDiv.classList.remove('payment-paid');
                    paymentDiv.classList.add('payment-pending');
                    span.textContent = 'Pagamento pendente';
                }
                await fetchAgendamentos();
            } else {
                checkbox.checked = !pago;
            }
        }
    });

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
