document.addEventListener('DOMContentLoaded', function() {

    // --- LÓGICA DO CALENDÁRIO ---
const currentMonthYearElement = document.getElementById('current-month-year');

if (currentMonthYearElement) {
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const calendarGrid = document.querySelector('.calendar-grid');
    const dateInput = document.getElementById('data');
    const timeSelect = document.getElementById('hora');
    const servicoSelect = document.getElementById('servico');

    let currentDate = new Date();

    function renderCalendar() {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        currentMonthYearElement.textContent = `${monthNames[month]} ${year}`;

        // Limpa os dias antigos (mantendo os nomes da semana - 7)
        while (calendarGrid.children.length > 7) {
            calendarGrid.removeChild(calendarGrid.lastChild);
        }

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDayOfMonth.getDay();
        const totalDays = lastDayOfMonth.getDate();

        for (let i = 0; i < firstDayOfWeek; i++) {
            calendarGrid.appendChild(document.createElement('div'));
        }

        for (let day = 1; day <= totalDays; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');
            dayElement.textContent = day;

            const dayOfWeek = new Date(year, month, day).getDay();
            if (dayOfWeek > 1 && dayOfWeek < 7) {
                dayElement.classList.add('bookable');
            } else {
                dayElement.classList.add('unavailable');
            }

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
        if (event.target.classList.contains('bookable')) {
            const selected = document.querySelector('.day.selected');
            if (selected) selected.classList.remove('selected');

            const clickedDay = event.target;
            clickedDay.classList.add('selected');

            const day = clickedDay.textContent.padStart(2, '0');
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const year = currentDate.getFullYear();

            dateInput.value = `${day}/${month}/${year}`;
            timeSelect.disabled = false;
        } else if (event.target.classList.contains('unavailable')) {
            alert('Agendamentos não estão disponíveis para Domingos e Segundas.');
        }
    });

    function resetSelection() {
        const selected = document.querySelector('.day.selected');
        if (selected) selected.classList.remove('selected');
        dateInput.value = '';
    }

    renderCalendar();

    // SUBMISSÃO DO FORMULÁRIO DE AGENDAMENTO
    const form = document.querySelector('form');
    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const emailCliente = localStorage.getItem('userEmail') || 'email não encontrado';
        const servico = servicoSelect.value;
        const data = dateInput.value;
        const hora = timeSelect.value;

        if (!data || !hora || !servico) {
            alert("Por favor, selecione data, hora e serviço.");
            return;
        }

        const novoAgendamento = {
            email: emailCliente,
            servico,
            data,
            hora,
            status: 'pendente'
        };

        const agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];
        agendamentos.push(novoAgendamento);
        localStorage.setItem('agendamentos', JSON.stringify(agendamentos));

        alert('Agendamento enviado para aprovação!');

        resetSelection();
        form.reset();
        timeSelect.disabled = true;
    });
}

//------DAIANE CALENDARIO--------//

  const currentMonthYearElementDaiane = document.getElementById('current-month-year-daiane');
  const prevMonthBtnDaiane = document.getElementById('prev-month-btn-daiane');
  const nextMonthBtnDaiane = document.getElementById('next-month-btn-daiane');
  const calendarGridDaiane = document.querySelector('.calendar-grid-daiane');
  const detalhesAgendamentos = document.getElementById('detalhes-agendamentos');
  const dataSelecionadaSpan = document.getElementById('data-selecionada');
  const listaAgendamentosDiv = document.getElementById('lista-agendamentos');

  let currentDateDaiane = new Date();

  // Carregar agendamentos (pode vir do localStorage)
  let agendamentosDaiane = JSON.parse(localStorage.getItem('agendamentos')) || [];

  // Função para renderizar calendário Daiane
  function renderCalendarDaiane() {
    const month = currentDateDaiane.getMonth();
    const year = currentDateDaiane.getFullYear();
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    currentMonthYearElementDaiane.textContent = `${monthNames[month]} ${year}`;

    // Limpa dias antigos, mantendo cabeçalho
    while (calendarGridDaiane.children.length > 7) {
      calendarGridDaiane.removeChild(calendarGridDaiane.lastChild);
    }

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    // Ajuste para calendário iniciar na segunda
    let startIndex = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Espaços em branco antes do primeiro dia
    for (let i = 0; i < startIndex; i++) {
      calendarGridDaiane.appendChild(document.createElement('div'));
    }

    for (let day = 1; day <= totalDays; day++) {
      const dayElement = document.createElement('div');
      dayElement.classList.add('day');
      dayElement.textContent = day;

      const fullDate = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;

      // Verifica se tem agendamento neste dia
      const agendamentosDoDia = agendamentosDaiane.filter(a => a.data === fullDate);

      if (agendamentosDoDia.length > 0) {
        dayElement.classList.add('booked');
        dayElement.style.cursor = 'unavailable';
        dayElement.dataset.date ='pointer';
      } else {
        dayElement.classList.add('unavailable');
      }

      calendarGridDaiane.appendChild(dayElement);
    }
  }

  // Botões para mudar mês
  prevMonthBtnDaiane.addEventListener('click', () => {
    currentDateDaiane.setMonth(currentDateDaiane.getMonth() - 1);
    renderCalendarDaiane();
    detalhesAgendamentos.classList.add('hidden');
  });

  nextMonthBtnDaiane.addEventListener('click', () => {
    currentDateDaiane.setMonth(currentDateDaiane.getMonth() + 1);
    renderCalendarDaiane();
    detalhesAgendamentos.classList.add('hidden');
  });

  // Clique no calendário para mostrar agendamentos do dia
  calendarGridDaiane.addEventListener('click', (e) => {
    if (!e.target.classList.contains('day')) return;

    // Remove seleção anterior
    const selected = calendarGridDaiane.querySelector('.selected');
    if (selected) selected.classList.remove('selected');
    e.target.classList.add('selected');

    const date = e.target.dataset.date;
    dataSelecionadaSpan.textContent = date;

    const agendamentosDoDia = agendamentosDaiane.filter(a => a.data === date);

    if (agendamentosDoDia.length === 0) {
      listaAgendamentosDiv.innerHTML = `<p>Nenhum agendamento encontrado para este dia (${date}).</p>`;
      detalhesAgendamentos.classList.remove('hidden');  // mostrar a área de detalhes
      return;
    }

    listaAgendamentosDiv.innerHTML = '';

    agendamentosDoDia.forEach((agendamento, index) => {
      const card = document.createElement('div');
      card.classList.add('agendamento-card');
      card.style.cssText = 'border:1px solid #ccc; padding:10px; margin-bottom:10px; border-radius:8px; background:#fff;';

      card.innerHTML = `
        <p><strong>Email:</strong> ${agendamento.email}</p>
        <p><strong>Data:</strong> ${agendamento.data}</p>
        <p><strong>Hora:</strong> ${agendamento.hora}</p>
        <p><strong>Serviço:</strong> ${agendamento.servico}</p>
        <p><strong>Status:</strong> ${agendamento.status}</p>
        <button class="btn-accept" data-index="${index}">Aceitar</button>
        <button class="btn-reject" data-index="${index}">Negar</button>
      `;

      listaAgendamentosDiv.appendChild(card);
    });

    detalhesAgendamentos.classList.remove('hidden');
  });

  // Botões aceitar/negar agendamento
  listaAgendamentosDiv.addEventListener('click', (e) => {
    if (!e.target.classList.contains('btn-accept') && !e.target.classList.contains('btn-reject')) return;

    const index = Number(e.target.dataset.index);
    const date = dataSelecionadaSpan.textContent;
    let agendamentosDoDia = agendamentosDaiane.filter(a => a.data === date);
    const agendamento = agendamentosDoDia[index];
    if (!agendamento) return;

    if (e.target.classList.contains('btn-accept')) {
      agendamento.status = 'aceito';
      alert(`Agendamento de ${agendamento.email} aceito.`);
    } else {
      agendamento.status = 'negado';
      alert(`Agendamento de ${agendamento.email} negado.`);
    }

    // Atualiza agendamento na lista geral
    const geralIndex = agendamentosDaiane.findIndex(a =>
      a.email === agendamento.email &&
      a.data === agendamento.data &&
      a.hora === agendamento.hora
    );
    if (geralIndex > -1) {
      agendamentosDaiane[geralIndex] = agendamento;
    }

    localStorage.setItem('agendamentos', JSON.stringify(agendamentosDaiane));

    renderCalendarDaiane();

    // Atualiza status no card
    e.target.closest('.agendamento-card').querySelector('p:nth-child(5)').textContent = `Status: ${agendamento.status}`;
  });

  renderCalendarDaiane();
});
//-----------LOGIN-------------//

   
const loginForm = document.getElementById('login-form');
if (loginForm) { 
    const cadastroForm = document.getElementById('cadastro-form');
    const showCadastroLink = document.getElementById('show-cadastro');
    const showLoginLink = document.getElementById('show-login');

    showCadastroLink.addEventListener('click', (event) => {
        event.preventDefault(); 
        loginForm.style.display = 'none';
        cadastroForm.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (event) => {
        event.preventDefault();
        cadastroForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    // --- NOVO CÓDIGO ABAIXO ---

    // Listener para a submissão do formulário de LOGIN
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const emailInput = document.getElementById('login-email');
        const email = emailInput.value.trim().toLowerCase();
        const ownerEmail = 'daianepessoa@gmail.com';

        // 🔐 Armazena no localStorage
        localStorage.setItem('userEmail', email);

        if (email === ownerEmail) {
            alert('Bem-vinda, Daiane! Redirecionando para sua área...');
            window.location.href = 'paginadaiane.html';
        } else {
            alert('Login simulado com sucesso! Redirecionando...');
            window.location.href = 'index.html';
        }
    });

    // Listener para a submissão do formulário de CADASTRO
    cadastroForm.addEventListener('submit', (event) => {
        event.preventDefault();

        alert('Cadastro simulado com sucesso! Redirecionando...');

        window.location.href = 'index.html';
    });
}