// js/agendamento.js

document.addEventListener('DOMContentLoaded', function() {
    const agendamentoForm = document.getElementById('agendamento-form');
    const calendarContainer = document.querySelector('.calendar-container');
    if (!agendamentoForm || !calendarContainer) return;

    // Horários disponíveis por dia
    const ALL_SLOTS = ['09:00', '11:00', '15:00'];
    let agendamentosCache = []; // cache de agendamentos existentes

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

    function normalizeTime(t) {
        if (!t) return '';
        const s = String(t).trim();

        // Primeiro tenta extrair HH:MM usando regex
        const m = s.match(/(\d{1,2}):(\d{2})/);
        if (m) {
            const hh = String(m[1]).padStart(2, '0');
            const mm = m[2];
            return `${hh}:${mm}`;
        }

        // Fallback para strings simples
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
            // Ignorar agendamentos recusados (liberam a vaga)
            if (typeof a.status === 'string' && a.status.toLowerCase() === 'recusado') return;

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
            const isBooked = bookedSlots.some(bookedSlot => {
                const normalizedSlot = normalizeTime(slot);
                const normalizedBooked = normalizeTime(bookedSlot);
                return normalizedSlot === normalizedBooked;
            });
            return !isBooked;
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
        if (!servico || servico.trim() === '') {
            alert('Por favor, selecione um serviço antes de agendar.');
            return;
        }

        // Validação da data
        if (!data) {
            alert('Por favor, selecione uma data.');
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
        formData.append('servico', servico);

        try {
            const response = await fetch('../php/agendar.php', { method: 'POST', body: formData });
            const result = await response.json();
            alert(result.mensagem);
            if (response.ok) {
                agendamentoForm.reset();
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
    const timeSelect = document.getElementById('hora');
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
            dayElement.textContent = day;

            const dayDate = new Date(year, month, day);
            const dateKey = keyForDate(dayDate);

            if (dayDate < today || dayDate.getDay() === 0 || dayDate.getDay() === 1) {
                dayElement.classList.add('unavailable');
            } else {
                // Verificar se há horários disponíveis usando a mesma lógica da updateAvailableHours
                const bookedSlots = getBookedSlotsForDate(dateKey);

                // Filtrar horários livres com comparação robusta
                const freeSlots = ALL_SLOTS.filter(slot => {
                    const isBooked = bookedSlots.some(bookedSlot => {
                        const normalizedSlot = normalizeTime(slot);
                        const normalizedBooked = normalizeTime(bookedSlot);
                        return normalizedSlot === normalizedBooked;
                    });
                    return !isBooked;
                });

                if (freeSlots.length > 0) {
                    dayElement.classList.add('bookable');
                    dayElement.classList.add('available');
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
        if (event.target.classList.contains('bookable') && event.target.classList.contains('available')) {
            document.querySelector('.day.selected')?.classList.remove('selected');
            event.target.classList.add('selected');

            const selectedDateKey = event.target.dataset.date;
            const day = event.target.textContent.padStart(2, '0');
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');

            // Mostrar data no formato DD/MM/YYYY no input
            dateInput.value = `${day}/${month}/${currentDate.getFullYear()}`;

            // Atualizar horários disponíveis para a data selecionada
            updateAvailableHours(selectedDateKey);

        } else if (event.target.classList.contains('unavailable')) {
            alert('Agendamentos não estão disponíveis para este dia.');
        } else if (event.target.classList.contains('booked')) {
            alert('Não há horários livres neste dia. Todos os horários já estão ocupados.');
        }
    });

    // Inicialização
    (async () => {
        await fetchAgendamentos();
        renderCalendar();
    })();
});
