// Listener para garantir que o HTML foi carregado
document.addEventListener('DOMContentLoaded', function() {

  // --- LÓGICA DO CALENDÁRIO ---
  const currentMonthYearElement = document.getElementById('current-month-year');
  if (currentMonthYearElement) { // Executa só se estiver na página de agendamento
      const prevMonthBtn = document.getElementById('prev-month-btn');
      const nextMonthBtn = document.getElementById('next-month-btn');
      const calendarGrid = document.querySelector('.calendar-grid');
      const dateInput = document.getElementById('data');
      const timeSelect = document.getElementById('hora');
      
      let currentDate = new Date();

      function renderCalendar() {
          const month = currentDate.getMonth();
          const year = currentDate.getFullYear();
          const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
          currentMonthYearElement.textContent = `${monthNames[month]} ${year}`;
          while (calendarGrid.children.length > 7) { calendarGrid.removeChild(calendarGrid.lastChild); }
          const firstDayOfMonth = new Date(year, month, 1);
          const lastDayOfMonth = new Date(year, month + 1, 0);
          const firstDayOfWeek = firstDayOfMonth.getDay();
          const totalDays = lastDayOfMonth.getDate();
          for (let i = 0; i < firstDayOfWeek; i++) { calendarGrid.appendChild(document.createElement('div')); }
          for (let day = 1; day <= totalDays; day++) {
              const dayElement = document.createElement('div');
              dayElement.classList.add('day');
              dayElement.textContent = day;
              const dayOfWeek = new Date(year, month, day).getDay();
              if (dayOfWeek > 1 && dayOfWeek < 7) { dayElement.classList.add('bookable'); } 
              else { dayElement.classList.add('unavailable'); }
              calendarGrid.appendChild(dayElement);
          }
      }

      prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
      nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });

      calendarGrid.addEventListener('click', (event) => {
          if (event.target.classList.contains('bookable')) {
              const currentlySelected = document.querySelector('.day.selected');
              if (currentlySelected) { currentlySelected.classList.remove('selected'); }
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
      renderCalendar();
  }

  // --- LÓGICA DO FORMULÁRIO DE LOGIN/CADASTRO ---
  const loginForm = document.getElementById('login-form');
  if (loginForm) { // Executa só se estiver na página de login
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

      loginForm.addEventListener('submit', (event) => {
          event.preventDefault();
          alert('Login simulado com sucesso! Redirecionando...');
          window.location.href = 'index.html';
      });

      cadastroForm.addEventListener('submit', (event) => {
          event.preventDefault();
          alert('Cadastro simulado com sucesso! Redirecionando...');
          window.location.href = 'index.html';
      });
  }

  // --- LÓGICA DO PAINEL ADMIN ---
  const adminLista = document.querySelector('.admin-lista');
  if (adminLista) { // Executa só se estiver na página admin
      
      adminLista.addEventListener('click', function(event) {
          // Pega o item "pai" do botão que foi clicado
          const agendamentoItem = event.target.closest('.agendamento-item');
          if (!agendamentoItem) return;

          // Se clicou em "Confirmar"
          if (event.target.classList.contains('confirmar')) {
              alert('Agendamento confirmado! (O e-mail seria enviado agora)');
              
              // Muda a aparência para "Confirmado"
              agendamentoItem.classList.remove('pendente');
              agendamentoItem.classList.add('confirmado');
              event.target.closest('.admin-acoes').innerHTML = '<p>Confirmado!</p>';
          }

          // Se clicou em "Recusar"
          if (event.target.classList.contains('recusar')) {
              alert('Agendamento recusado.');
              
              // Muda a aparência para "Recusado"
              agendamentoItem.classList.remove('pendente');
              agendamentoItem.classList.add('recusado');
              event.target.closest('.admin-acoes').innerHTML = '<p>Recusado.</p>';
          }
      });
  }
});