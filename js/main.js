document.addEventListener('DOMContentLoaded', function() {

    const currentMonthYearElement = document.getElementById('current-month-year');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const calendarGrid = document.querySelector('.calendar-grid');

    const dateInput = document.getElementById('data');
    const timeSelect = document.getElementById('hora');

    if (!currentMonthYearElement) {
        return;
    }

    let currentDate = new Date();

    function renderCalendar() {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();

        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        currentMonthYearElement.textContent = `${monthNames[month]} ${year}`;

        while (calendarGrid.children.length > 7) {
            calendarGrid.removeChild(calendarGrid.lastChild);
        }

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDayOfMonth.getDay();
        const totalDays = lastDayOfMonth.getDate();

        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            calendarGrid.appendChild(emptyDay);
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
            const currentlySelected = document.querySelector('.day.selected');
            if (currentlySelected) {
                currentlySelected.classList.remove('selected');
            }

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
});