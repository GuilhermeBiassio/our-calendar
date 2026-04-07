// Datas hardcoded
const dataInicial = new Date(2026, 3, 6); // Abril 6, 2026
const dataFinal = new Date(2026, 5, 1); // Junho 1, 2026
const dataDesejo = new Date(2026, 5, 1); // Junho 1, 2026

function updateCountdown() {
    const now = new Date().getTime();
    const distance = dataDesejo.getTime() - now;

    if (distance < 0) {
        document.getElementById('timer').innerHTML = '00:00:00:00';
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('timer').innerHTML =
        `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function renderAllCalendars() {
    const calendarContainer = document.getElementById('calendar');
    calendarContainer.innerHTML = '';

    const startMonth = dataInicial.getMonth();
    const endMonth = dataFinal.getMonth();
    const year = dataInicial.getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let month = startMonth; month <= endMonth; month++) {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'bg-white bg-opacity-80 rounded-lg p-4 shadow-md w-64';

        const monthTitle = document.createElement('h3');
        monthTitle.className = 'text-xl font-bold text-gray-800 mb-2 text-center';
        monthTitle.textContent = `${new Date(year, month).toLocaleString('pt-BR', { month: 'long' })} ${year}`;
        monthDiv.appendChild(monthTitle);

        const daysHeader = document.createElement('div');
        daysHeader.className = 'grid grid-cols-7 gap-1 mb-2';
        const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        daysOfWeek.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'text-center font-bold text-gray-600 text-sm';
            dayHeader.textContent = day;
            daysHeader.appendChild(dayHeader);
        });
        monthDiv.appendChild(daysHeader);

        const calendarDays = document.createElement('div');
        calendarDays.className = 'grid grid-cols-7 gap-1';

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDayOfWeek = firstDay.getDay();

        // Adicionar células vazias para alinhar com os dias da semana
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day';
            calendarDays.appendChild(emptyDiv);
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const day = new Date(year, month, d);

            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day text-center py-1 text-sm cursor-pointer hover:bg-pink-100 rounded';
            dayElement.textContent = d;

            // Verificar se está no período e passada
            if (day >= dataInicial && day <= dataFinal && day < today) {
                dayElement.classList.add('past');
            }

            // Data atual
            if (day.toDateString() === today.toDateString()) {
                dayElement.classList.add('current-day');
                dayElement.innerHTML = '❤️‍🩹';
            }

            // Data desejo
            if (day.toDateString() === dataDesejo.toDateString()) {
                dayElement.classList.add('desire-day');
                dayElement.innerHTML = '💘';
            }

            // Disabled se passou
            if (day < today) {
                dayElement.classList.add('disabled');
            }

            calendarDays.appendChild(dayElement);
        }

        monthDiv.appendChild(calendarDays);
        calendarContainer.appendChild(monthDiv);
    }
}

// Inicializar
renderAllCalendars();
updateCountdown();
setInterval(updateCountdown, 1000);