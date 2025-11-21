// js/agendamento.js

document.addEventListener('DOMContentLoaded', function() {
    const agendamentoForm = document.getElementById('agendamento-form');
    const calendarContainer = document.querySelector('.calendar-container');
    if (!agendamentoForm || !calendarContainer) return;

    // Horários disponíveis por dia
    const ALL_SLOTS = ['09:00', '11:00', '15:00'];
    let agendamentosCache = []; // cache de agendamentos existentes
    let servicoSelecionado = null; // serviço atualmente selecionado

    // Ícones para cada tipo de serviço
    const servicoIcons = {
        'corte': 'fa-scissors',
        'barba': 'fa-user',
        'manutencao': 'fa-gem',
        'alongamento': 'fa-hand-sparkles',
        'esmalte': 'fa-paint-brush',
        'unha': 'fa-hand-sparkles',
        'gel': 'fa-gem',
        'default': 'fa-star'
    };

    function getIconForServico(nome) {
        const nomeLower = nome.toLowerCase();
        for (const [key, icon] of Object.entries(servicoIcons)) {
            if (nomeLower.includes(key)) return icon;
        }
        return servicoIcons.default;
    }

    // Buscar agendamentos existentes
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

    // Buscar e renderizar serviços
    async function fetchServicos() {
        try {
            const res = await fetch('../php/servicos.php', { cache: 'no-store' });
            if (!res.ok) throw new Error('Falha ao carregar serviços');
            const servicos = await res.json();

            const listaServicos = document.getElementById('lista-servicos');

            if (!servicos || servicos.length === 0) {
                listaServicos.innerHTML = '<p class="loading-text">Nenhum serviço disponível no momento.</p>';
                return;
            }

            // Renderizar cards de serviços
            listaServicos.innerHTML = '';
            servicos.forEach(s => {
                const card = document.createElement('div');
                card.className = 'servico-card';
                card.dataset.servicoId = s.id;

                const icon = getIconForServico(s.nome);
                const preco = parseFloat(s.preco).toFixed(2);

                card.innerHTML = `
                    <div class="icon"><i class="fas ${icon}"></i></div>
                    <h4>${s.nome}</h4>
                    <p class="preco">R$ ${preco}</p>
                `;

                card.addEventListener('click', () => selecionarServico(s, card));
                listaServicos.appendChild(card);
            });

        } catch (err) {
            console.error(err);
            document.getElementById('lista-servicos').innerHTML = '<p class="loading-text">Erro ao carregar serviços.</p>';
        }
    }

    function selecionarServico(servico, cardElement) {
        // Remover seleção anterior
        document.querySelectorAll('.servico-card').forEach(c => c.classList.remove('selected'));

        // Adicionar seleção ao card clicado
        cardElement.classList.add('selected');

        // Atualizar serviço selecionado
        servicoSelecionado = servico;

        // Atualizar campo hidden com o ID do serviço
        const servicoInput = document.getElementById('servico');
        servicoInput.value = servico.id;

        // Limpar seleção de data e hora
        document.getElementById('data').value = '';
        document.getElementById('hora').innerHTML = '<option value="">Selecione uma data primeiro</option>';
        document.getElementById('hora').disabled = true;
        document.querySelector('.day.selected')?.classList.remove('selected');
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

        if (s.includes(':')) {
            const parts = s.split(':');
            if (parts.length >= 2) {
                const hh = String(parts[0]).padStart(2, '0');
                const mm = String(parts[1]).padStart(2, '0');
                return `${hh}:${mm}`;
            }
        }

        return s;
    }

    function getBookedSlotsForDate(dateKey) {
        const booked = [];

        agendamentosCache.forEach(a => {
            // Ignorar agendamentos recusados e cancelados (liberam a vaga)
            if (typeof a.status === 'string' && (a.status.toLowerCase() === 'recusado' || a.status.toLowerCase() === 'cancelado')) return;

            if (a.data_agendamento === dateKey) {
                const horaNorm = normalizeTime(a.hora_agendamento);
                if (horaNorm && !booked.includes(horaNorm)) {
                    booked.push(horaNorm);
                }
            }
        });

        return booked;
    }

    function updateAvailableHours(selectedDate) {
        const timeSelect = document.getElementById('hora');
        const bookedSlots = getBookedSlotsForDate(selectedDate);

        // Filtrar horários livres com comparação mais robusta
        const freeSlots = ALL_SLOTS.filter(slot => {
            const normalizedSlot = normalizeTime(slot);
            return !bookedSlots.some(bookedSlot => normalizeTime(bookedSlot) === normalizedSlot);
        });

        // Limpar opções existentes
        timeSelect.innerHTML = '<option value="">Selecione um horário</option>';

        if (freeSlots.length === 0) {
            timeSelect.innerHTML = '<option value="">Nenhum horário disponível</option>';
            timeSelect.disabled = true;
            return;
        }

        // Adicionar apenas horários livres, ordenados
        freeSlots.sort().forEach(slot => {
            const option = document.createElement('option');
            option.value = slot;
            option.textContent = slot;
            timeSelect.appendChild(option);
        });

        timeSelect.disabled = false;
    }

    // Form submit com validação
    agendamentoForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const data = document.getElementById('data').value;
        const hora = document.getElementById('hora').value;
        const servico = document.getElementById('servico').value;

        // Validação do serviço
        if (!servico || servico === '') {
            alert('Por favor, selecione um serviço antes de agendar.');
            return;
        }

        // Validação da data
        if (!data) {
            alert('Por favor, selecione uma data no calendário.');
            return;
        }

        // Validação da hora
        if (!hora) {
            alert('Por favor, selecione um horário.');
            return;
        }

        const formData = new FormData();
        formData.append('data', data);
        formData.append('hora', hora);
        formData.append('servico_id', servico); // enviar servico_id

        try {
            const response = await fetch('../php/agendar.php', { method: 'POST', body: formData });
            const result = await response.json();
            alert(result.mensagem);
            if (response.ok) {
                agendamentoForm.reset();
                servicoSelecionado = null;
                document.querySelectorAll('.servico-card').forEach(c => c.classList.remove('selected'));
                document.querySelector('.day.selected')?.classList.remove('selected');
                document.getElementById('hora').disabled = true;
                // Recarregar agendamentos para atualizar disponibilidade
                await fetchAgendamentos();
                renderCalendar();
            }
        } catch (err) {
            alert('Erro de comunicação ao tentar agendar.');
        }
    });

    // Calendar
    const calendarGrid = calendarContainer.querySelector('.calendar-grid');
    const currentMonthYearElement = document.getElementById('current-month-year');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const dateInput = document.getElementById('data');
    let currentDate = new Date();

    function keyForDate(dateObj) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function renderCalendar() {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        currentMonthYearElement.textContent = `${currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`;

        calendarGrid.innerHTML = '<div class="weekday">Dom</div><div class="weekday">Seg</div><div class="weekday">Ter</div><div class="weekday">Qua</div><div class="weekday">Qui</div><div class="weekday">Sex</div><div class="weekday">Sáb</div>';

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0,0,0,0);

        // Preencher células vazias do início do mês
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarGrid.appendChild(document.createElement('div'));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');

            // criar span para o número do dia (para facilitar esconder quando selecionado)
            const dayNumber = document.createElement('span');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);

            const dayDate = new Date(year, month, day);
            const dateKey = keyForDate(dayDate);

            if (dayDate < today || dayDate.getDay() === 0 || dayDate.getDay() === 6) {
                dayElement.classList.add('unavailable');
            } else {
                // Verificar se há horários disponíveis usando a mesma lógica da updateAvailableHours
                const bookedSlots = getBookedSlotsForDate(dateKey);

                // Filtrar horários livres com comparação robusta
                const freeSlots = ALL_SLOTS.filter(slot => {
                    const normalizedSlot = normalizeTime(slot);
                    return !bookedSlots.some(bookedSlot => normalizeTime(bookedSlot) === normalizedSlot);
                });

                if (freeSlots.length > 0) {
                    dayElement.classList.add('bookable');
                    dayElement.classList.add('available');

                    // badge com número de horários livres
                    const badge = document.createElement('span');
                    badge.className = 'day-badge';
                    badge.textContent = freeSlots.length;
                    dayElement.appendChild(badge);
                } else {
                    dayElement.classList.add('booked');
                    dayElement.setAttribute('title', 'Não há horários livres neste dia');
                }
            }

            dayElement.dataset.date = dateKey;
            calendarGrid.appendChild(dayElement);
        }
    }

    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    calendarGrid.addEventListener('click', (event) => {
        const dayEl = event.target.closest('.day');
        if (!dayEl || !dayEl.dataset || !dayEl.dataset.date) return;

        if (dayEl.classList.contains('bookable') && dayEl.classList.contains('available')) {
            // Verificar que há serviço selecionado antes de permitir seleção da data
            if (!servicoSelecionado) {
                alert('Selecione um serviço antes de escolher a data.');
                return;
            }

            document.querySelector('.day.selected')?.classList.remove('selected');
            dayEl.classList.add('selected');

            const selectedDateKey = dayEl.dataset.date;
            const day = String(dayEl.querySelector('.day-number').textContent).padStart(2, '0');
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');

            // Mostrar data no formato DD/MM/YYYY no input
            dateInput.value = `${day}/${month}/${currentDate.getFullYear()}`;

            // Atualizar horários disponíveis para a data selecionada
            updateAvailableHours(selectedDateKey);

        } else if (dayEl.classList.contains('unavailable')) {
            alert('Agendamentos não estão disponíveis para este dia.');
        } else if (dayEl.classList.contains('booked')) {
            alert('Não há horários livres neste dia. Todos os horários já estão ocupados.');
        }
    });

    // Inicialização
    (async () => {
        await fetchAgendamentos();
        await fetchServicos();
        renderCalendar();
    })();
});
