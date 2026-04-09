/* =============================================
   NOSSO CALENDÁRIO — APLICAÇÃO PRINCIPAL
   ============================================= */

// ──────────────────────────────────────────────
// ESTADO GLOBAL
// ──────────────────────────────────────────────
let currentUser    = localStorage.getItem('calendarUser');
let selectedDayKey = null;
let todayMessages  = [];
let daysWithNotes  = new Set();

let appConfig = {
  startDate:   '2026-04-06',
  endDate:     '2026-06-01',
  desiredDate: '2026-06-01'
};

// ──────────────────────────────────────────────
// UTILITÁRIOS DE DATA
// ──────────────────────────────────────────────
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ──────────────────────────────────────────────
// BANCO DE DADOS (Firebase ou localStorage)
// ──────────────────────────────────────────────
async function db_loadConfig() {
  if (window.firebaseEnabled) {
    try {
      const snap = await window.db.collection('config').doc('dates').get();
      if (snap.exists) appConfig = { ...appConfig, ...snap.data() };
    } catch (e) { console.error('db_loadConfig:', e); }
  } else {
    const saved = localStorage.getItem('calendarConfig');
    if (saved) appConfig = { ...appConfig, ...JSON.parse(saved) };
  }
}

async function db_saveConfig(config) {
  if (window.firebaseEnabled) {
    await window.db.collection('config').doc('dates').set(config);
  } else {
    localStorage.setItem('calendarConfig', JSON.stringify(config));
  }
}

async function db_loadMessages(dateKey) {
  if (window.firebaseEnabled) {
    try {
      const snap = await window.db.collection('notes').doc(dateKey).get();
      return snap.exists ? (snap.data().messages || []) : [];
    } catch (e) { return []; }
  } else {
    const raw = localStorage.getItem(`notes_${dateKey}`);
    return raw ? JSON.parse(raw) : [];
  }
}

async function db_saveMessage(dateKey, message) {
  if (window.firebaseEnabled) {
    await window.db.collection('notes').doc(dateKey).set(
      { messages: firebase.firestore.FieldValue.arrayUnion(message) },
      { merge: true }
    );
  } else {
    const list = JSON.parse(localStorage.getItem(`notes_${dateKey}`) || '[]');
    list.push(message);
    localStorage.setItem(`notes_${dateKey}`, JSON.stringify(list));
  }
}

async function db_getDaysWithNotes(startDate, endDate) {
  const result = new Set();

  if (window.firebaseEnabled) {
    try {
      const snap = await window.db.collection('notes').get();
      snap.forEach(doc => {
        const date = parseDate(doc.id);
        if (date >= startDate && date <= endDate) {
          if (doc.data().messages?.length > 0) result.add(doc.id);
        }
      });
    } catch (e) { console.error('db_getDaysWithNotes:', e); }
  } else {
    let cur = new Date(startDate);
    while (cur <= endDate) {
      const key = formatDateKey(cur);
      const raw = localStorage.getItem(`notes_${key}`);
      if (raw && JSON.parse(raw).length > 0) result.add(key);
      cur.setDate(cur.getDate() + 1);
    }
  }

  return result;
}

// ──────────────────────────────────────────────
// USUÁRIO
// ──────────────────────────────────────────────
function selectUser(name) {
  currentUser = name;
  localStorage.setItem('calendarUser', name);
  document.getElementById('user-select-overlay').classList.add('hidden');
  _updateUserBadge();
}

function changeUser() {
  document.getElementById('user-select-overlay').classList.remove('hidden');
}

function _updateUserBadge() {
  if (!currentUser) return;
  const badge    = document.getElementById('current-user-badge');
  const avatarEl = document.getElementById('current-user-avatar');
  const nameEl   = document.getElementById('current-user-name');
  avatarEl.src   = `img/avatar-${currentUser}.png`;
  nameEl.textContent = currentUser;
  badge.classList.remove('hidden');
}

// ──────────────────────────────────────────────
// CONTAGEM REGRESSIVA
// ──────────────────────────────────────────────
function updateCountdown() {
  const target   = parseDate(appConfig.desiredDate);
  const now      = new Date();
  const distance = target.getTime() - now.getTime();

  if (distance <= 0) {
    ['days', 'hours', 'minutes', 'seconds'].forEach(u =>
      document.getElementById(`timer-${u}`).textContent = '00'
    );
    const lbl = document.querySelector('.countdown-label');
    if (lbl) lbl.textContent = '🎉 Chegou o nosso dia especial! 🎉';
    return;
  }

  const d = Math.floor(distance / 864e5);
  const h = Math.floor((distance % 864e5) / 36e5);
  const m = Math.floor((distance % 36e5) / 6e4);
  const s = Math.floor((distance % 6e4) / 1e3);

  document.getElementById('timer-days').textContent    = String(d).padStart(2, '0');
  document.getElementById('timer-hours').textContent   = String(h).padStart(2, '0');
  document.getElementById('timer-minutes').textContent = String(m).padStart(2, '0');
  document.getElementById('timer-seconds').textContent = String(s).padStart(2, '0');
}

// ──────────────────────────────────────────────
// CALENDÁRIO
// ──────────────────────────────────────────────
async function renderAllCalendars() {
  const container = document.getElementById('calendar');
  container.innerHTML = '<div class="loading">Carregando calendário... 💕</div>';

  const startDate   = parseDate(appConfig.startDate);
  const endDate     = parseDate(appConfig.endDate);
  const desiredDate = parseDate(appConfig.desiredDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  daysWithNotes = await db_getDaysWithNotes(startDate, endDate);
  container.innerHTML = '';

  const startMonth = startDate.getMonth();
  const endMonth   = endDate.getMonth();
  const year       = startDate.getFullYear();

  for (let month = startMonth; month <= endMonth; month++) {
    const card = _buildMonthCard(month, year, startDate, endDate, desiredDate, today);
    container.appendChild(card);
  }
}

function _buildMonthCard(month, year, startDate, endDate, desiredDate, today) {
  const card = document.createElement('div');
  card.className = 'month-card';

  // Título
  const title = document.createElement('h3');
  title.className = 'month-title';
  title.textContent = new Date(year, month).toLocaleString('pt-BR', {
    month: 'long', year: 'numeric'
  });
  card.appendChild(title);

  // Cabeçalho dos dias da semana
  const hdrGrid = document.createElement('div');
  hdrGrid.className = 'calendar-grid days-header';
  ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'day-header';
    el.textContent = d;
    hdrGrid.appendChild(el);
  });
  card.appendChild(hdrGrid);

  // Grade de dias
  const grid = document.createElement('div');
  grid.className = 'calendar-grid';

  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);

  // Células vazias para alinhamento
  for (let i = 0; i < firstDay.getDay(); i++) {
    grid.appendChild(document.createElement('div'));
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const day     = new Date(year, month, d);
    const dateKey = formatDateKey(day);
    const inRange  = day >= startDate && day <= endDate;
    const isPast   = day < today;
    const isToday  = day.toDateString() === today.toDateString();
    const isDesired= day.toDateString() === desiredDate.toDateString();
    const hasNote  = daysWithNotes.has(dateKey);

    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.dataset.date = dateKey;

    if (inRange)           dayEl.classList.add('in-range');
    if (isPast && inRange) dayEl.classList.add('past');
    if (isToday)           dayEl.classList.add('today');
    if (isDesired)         dayEl.classList.add('desired');
    if (!inRange)          dayEl.classList.add('out-of-range');
    if (hasNote)           dayEl.classList.add('has-notes');

    const numEl = document.createElement('span');
    numEl.className = 'day-number';
    numEl.textContent = isToday ? '💝' : isDesired ? '💘' : d;
    dayEl.appendChild(numEl);

    if (hasNote) {
      const dot = document.createElement('span');
      dot.className = 'note-dot';
      dayEl.appendChild(dot);
    }

    if (inRange) {
      const tip = hasNote ? 'Ver mensagens deste dia 💌' : 'Adicionar mensagem neste dia';
      dayEl.setAttribute('title', tip);
      dayEl.addEventListener('click', () => openDayModal(dateKey, day));
    }

    grid.appendChild(dayEl);
  }

  card.appendChild(grid);
  return card;
}

// ──────────────────────────────────────────────
// MODAL DE DIA
// ──────────────────────────────────────────────
async function openDayModal(dateKey, date) {
  selectedDayKey = dateKey;

  const formatted = date.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  document.getElementById('day-modal-title').textContent = formatted + ' 📅';
  document.getElementById('day-modal').classList.remove('hidden');
  document.getElementById('messages-list').innerHTML =
    '<div class="loading">Carregando mensagens... 💕</div>';
  document.getElementById('message-input').value = '';

  const msgs = await db_loadMessages(dateKey);
  _renderMessages(msgs);
}

function closeDayModal() {
  document.getElementById('day-modal').classList.add('hidden');
  document.getElementById('message-input').value = '';
  selectedDayKey = null;
}

function _renderMessages(messages) {
  const list = document.getElementById('messages-list');

  if (!messages.length) {
    list.innerHTML = '<p class="no-messages">Nenhuma mensagem ainda... escreva algo! 💌</p>';
    return;
  }

  list.innerHTML = messages.map(msg => {
    const isOwn = msg.author === currentUser;
    const icon  = msg.author === 'Gui' ? '👨' : '👩';
    const time  = new Date(msg.timestamp).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
    return `
      <div class="message-item ${isOwn ? 'own-message' : ''}">
        <div class="message-author">${icon} ${escapeHtml(msg.author)}</div>
        <div class="message-text">${escapeHtml(msg.text)}</div>
        <div class="message-time">${time}</div>
      </div>`;
  }).join('');

  list.scrollTop = list.scrollHeight;
}

async function sendMessage() {
  if (!currentUser) {
    document.getElementById('user-select-overlay').classList.remove('hidden');
    return;
  }

  const input = document.getElementById('message-input');
  const text  = input.value.trim();
  if (!text) return;

  const sendBtn = document.querySelector('.send-btn');
  sendBtn.disabled = true;
  sendBtn.textContent = '...';

  const message = {
    text,
    author: currentUser,
    timestamp: new Date().toISOString()
  };

  try {
    await db_saveMessage(selectedDayKey, message);
    input.value = '';

    const msgs = await db_loadMessages(selectedDayKey);
    _renderMessages(msgs);

    // Marcar o dia com nota no calendário sem re-renderizar tudo
    if (!daysWithNotes.has(selectedDayKey)) {
      daysWithNotes.add(selectedDayKey);
      const dayEl = document.querySelector(`[data-date="${selectedDayKey}"]`);
      if (dayEl && !dayEl.querySelector('.note-dot')) {
        dayEl.classList.add('has-notes');
        const dot = document.createElement('span');
        dot.className = 'note-dot';
        dayEl.appendChild(dot);
      }
    }

    // Atualizar notificações se for o dia de hoje
    const todayKey = formatDateKey(new Date());
    if (selectedDayKey === todayKey) await checkTodayNotifications();

    showToast('Mensagem enviada! 💌');
  } catch (e) {
    console.error('sendMessage:', e);
    showToast('Erro ao enviar mensagem 😢');
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Enviar 💌';
  }
}

// ──────────────────────────────────────────────
// NOTIFICAÇÕES
// ──────────────────────────────────────────────
async function checkTodayNotifications() {
  const todayKey  = formatDateKey(new Date());
  todayMessages   = await db_loadMessages(todayKey);

  const badge    = document.getElementById('notification-badge');
  const notifBtn = document.getElementById('notification-btn');

  const lastSeen   = Number(localStorage.getItem('notif-last-seen') || 0);
  const unreadCount = todayMessages.filter(m => new Date(m.timestamp).getTime() > lastSeen).length;

  if (unreadCount > 0) {
    badge.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
    badge.classList.remove('hidden');
    notifBtn.classList.add('has-notification');
  } else {
    badge.classList.add('hidden');
    notifBtn.classList.remove('has-notification');
  }
}

function toggleNotifications() {
  const panel   = document.getElementById('notification-panel');
  const opening = panel.classList.contains('hidden');
  panel.classList.toggle('hidden');
  if (opening) {
    _renderNotifications();
    localStorage.setItem('notif-last-seen', Date.now());
    document.getElementById('notification-badge').classList.add('hidden');
    document.getElementById('notification-btn').classList.remove('has-notification');
  }
}

function closeNotifications() {
  document.getElementById('notification-panel').classList.add('hidden');
}

function _renderNotifications() {
  const list = document.getElementById('notification-list');

  if (!todayMessages.length) {
    list.innerHTML = '<p class="no-messages">Sem mensagens hoje 📭</p>';
    return;
  }

  list.innerHTML = todayMessages.map(msg => {
    const icon = msg.author === 'Gui' ? '👨' : '👩';
    const time = new Date(msg.timestamp).toLocaleString('pt-BR', {
      hour: '2-digit', minute: '2-digit'
    });
    return `
      <div class="notification-item">
        <span class="notif-author">${icon} ${escapeHtml(msg.author)}:</span>
        ${escapeHtml(msg.text)}
        <span class="notif-date">${time}</span>
      </div>`;
  }).join('');
}

// ──────────────────────────────────────────────
// CONFIGURAÇÕES
// ──────────────────────────────────────────────
function openSettings() {
  document.getElementById('input-start').value   = appConfig.startDate;
  document.getElementById('input-end').value     = appConfig.endDate;
  document.getElementById('input-desire').value  = appConfig.desiredDate;
  document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
}

async function saveSettings() {
  const start   = document.getElementById('input-start').value;
  const end     = document.getElementById('input-end').value;
  const desired = document.getElementById('input-desire').value;

  if (!start || !end || !desired) {
    showToast('Preencha todas as datas! 📅');
    return;
  }
  if (new Date(start) > new Date(end)) {
    showToast('Data de início deve ser antes do término 📅');
    return;
  }

  appConfig = { startDate: start, endDate: end, desiredDate: desired };

  try {
    await db_saveConfig(appConfig);
    closeSettings();
    renderAllCalendars();
    updateCountdown();
    showToast('Configurações salvas! 💕');
  } catch (e) {
    console.error('saveSettings:', e);
    showToast('Erro ao salvar 😢');
  }
}

// ──────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.add('hidden'), 3200);
}

// ──────────────────────────────────────────────
// CORAÇÕES FLUTUANTES
// ──────────────────────────────────────────────
function _startFloatingHearts() {
  const OPTIONS = ['💕', '💗', '💖', '💝', '💓', '🌸', '✨'];
  setInterval(() => {
    const el = document.createElement('div');
    el.className = 'floating-heart';
    el.textContent = OPTIONS[Math.floor(Math.random() * OPTIONS.length)];
    el.style.left             = `${Math.random() * 100}vw`;
    el.style.animationDuration= `${5 + Math.random() * 6}s`;
    el.style.fontSize         = `${0.7 + Math.random() * 1}rem`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 11000);
  }, 3500);
}

// ──────────────────────────────────────────────
// EVENTOS GLOBAIS
// ──────────────────────────────────────────────
document.addEventListener('click', e => {
  // Fechar modal clicando no overlay
  if (e.target.id === 'settings-modal') closeSettings();
  if (e.target.id === 'day-modal')       closeDayModal();
  // Fechar painel de notificações clicando fora
  const panel  = document.getElementById('notification-panel');
  const notBtn = document.getElementById('notification-btn');
  if (!panel.classList.contains('hidden') &&
      !panel.contains(e.target) &&
      !notBtn.contains(e.target)) {
    closeNotifications();
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeSettings();
    closeDayModal();
    closeNotifications();
  }
  // Ctrl+Enter ou Cmd+Enter para enviar mensagem
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    const modal = document.getElementById('day-modal');
    if (!modal.classList.contains('hidden')) sendMessage();
  }
});

// ──────────────────────────────────────────────
// INICIALIZAÇÃO
// ──────────────────────────────────────────────
async function init() {
  // Mostrar tela de seleção de usuário se necessário
  if (!currentUser) {
    document.getElementById('user-select-overlay').classList.remove('hidden');
  } else {
    _updateUserBadge();
  }

  await db_loadConfig();

  updateCountdown();
  setInterval(updateCountdown, 1000);

  await renderAllCalendars();
  await checkTodayNotifications();

  _startFloatingHearts();
}

init();
