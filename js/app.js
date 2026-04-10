/**
 * আগন্তুক — Bengali Spy Party Game
 * Main application logic
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const LS_STATE_KEY   = 'agontuk_config';
const LS_CUSTOM_KEY  = 'agontuk_custom_categories';

const PLAYER_COLORS = [
  '#c9b8ff', '#ffb8cc', '#b8e6ff', '#b8ffcc',
  '#ffe4b8', '#ffd6b8', '#b8fff5', '#f5b8ff',
  '#fefeb8', '#b8d4ff'
];

// ─── Global State ─────────────────────────────────────────────────────────────

let state = {
  screen: 'config',            // config | reveal | game | end
  config: {
    playerCount: 4,
    spyCount: 1,
    timerMinutes: 4,
    playerNames: [],
    selectedCategories: ['foods', 'places'],
    soundEnabled: true
  },
  round: {
    spyIndices: [],
    secretItem: '',
    secretCategoryKey: '',
    secretCategoryName: '',
    currentRevealIndex: 0,
    revealPhase: 'pass',        // pass | card
    cardState: 'face-down'      // face-down | face-up
  },
  timer: {
    totalSeconds: 0,
    remainingSeconds: 0,
    intervalId: null
  },
  customCategories: {}          // id -> { name, items[] }
};

// Track temporary edit for custom category modal
let editingCategoryId = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

// Common emojis for the custom-category emoji picker
const EMOJI_PICKER_OPTIONS = [
  '🍛','🍜','🍕','🍔','🎂','🍩','🍎','🥗',
  '🏙️','🗺️','🏖️','🏔️','🕌','🏡','🌆','🌳',
  '⚽','🏏','🎭','🎬','🎵','🎮','🎨','📚',
  '🐯','🦅','🌸','💡','❤️','⭐','🔥','🌙'
];

document.addEventListener('DOMContentLoaded', () => {
  loadPersistedData();
  sounds.enabled = state.config.soundEnabled;
  buildCategoryGrid();
  buildPlayerNameFields();
  renderConfig();
  buildEmojiGrid();
  showScreen('config');
  document.getElementById('sound-toggle').checked = state.config.soundEnabled;

  // Register service worker for PWA / offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {/* silent fail in dev */});
  }
});

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadPersistedData() {
  try {
    const saved = localStorage.getItem(LS_STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state.config = { ...state.config, ...parsed };
    }
  } catch (e) { /* ignore */ }

  try {
    const customs = localStorage.getItem(LS_CUSTOM_KEY);
    if (customs) {
      state.customCategories = JSON.parse(customs);
    }
  } catch (e) { /* ignore */ }
}

function saveConfig() {
  try {
    localStorage.setItem(LS_STATE_KEY, JSON.stringify(state.config));
  } catch (e) { /* ignore */ }
}

function saveCustomCategories() {
  try {
    localStorage.setItem(LS_CUSTOM_KEY, JSON.stringify(state.customCategories));
  } catch (e) { /* ignore */ }
}

// ─── Screen Management ────────────────────────────────────────────────────────

function showScreen(name) {
  state.screen = name;
  document.querySelectorAll('.screen').forEach(el => {
    el.classList.remove('active');
  });
  const el = document.getElementById('screen-' + name);
  if (el) {
    el.classList.add('active');
  }
}

function returnToConfigScreen() {
  showScreen('config');
  renderConfig();
}

// ─── Config Screen ────────────────────────────────────────────────────────────

function renderConfig() {
  document.getElementById('player-count-display').textContent = state.config.playerCount;
  document.getElementById('spy-count-display').textContent = state.config.spyCount;
  document.getElementById('timer-minutes-display').textContent = state.config.timerMinutes;
  document.getElementById('sound-toggle').checked = state.config.soundEnabled;
  updateCategoryGrid();
  buildPlayerNameFields();
}

function getConfigLimitMessage(key, delta) {
  if (key === 'playerCount') {
    return delta > 0
      ? 'খেলোয়াড়ের সংখ্যা সর্বোচ্চ ১২'
      : 'খেলোয়াড়ের সংখ্যা সর্বনিম্ন ৩';
  }

  if (key === 'spyCount') {
    const maxSpies = Math.floor(state.config.playerCount / 2);
    return delta > 0
      ? `স্পাইয়ের সংখ্যা সর্বোচ্চ ${maxSpies}`
      : 'স্পাইয়ের সংখ্যা সর্বনিম্ন ১';
  }

  if (key === 'timerMinutes') {
    return delta > 0
      ? 'টাইমার সর্বোচ্চ ২০ মিনিট'
      : 'টাইমার সর্বনিম্ন ১ মিনিট';
  }

  return 'মান পরিবর্তন করা যায়নি';
}

function showConfigLimitFeedback(key, delta) {
  sounds.limit();
  showToast(getConfigLimitMessage(key, delta), 'warning');
}

function changeConfig(key, delta) {
  if (key === 'playerCount') {
    const nextValue = Math.max(3, Math.min(12, state.config.playerCount + delta));
    if (nextValue === state.config.playerCount) {
      showConfigLimitFeedback(key, delta);
      return;
    }

    state.config.playerCount = nextValue;
    // Ensure spy count stays valid
    const maxSpies = Math.floor(state.config.playerCount / 2);
    state.config.spyCount = Math.min(state.config.spyCount, maxSpies);
    document.getElementById('player-count-display').textContent = state.config.playerCount;
    document.getElementById('spy-count-display').textContent = state.config.spyCount;
    buildPlayerNameFields();
  } else if (key === 'spyCount') {
    const maxSpies = Math.floor(state.config.playerCount / 2);
    const nextValue = Math.max(1, Math.min(maxSpies, state.config.spyCount + delta));
    if (nextValue === state.config.spyCount) {
      showConfigLimitFeedback(key, delta);
      return;
    }

    state.config.spyCount = nextValue;
    document.getElementById('spy-count-display').textContent = state.config.spyCount;
  } else if (key === 'timerMinutes') {
    const nextValue = Math.max(1, Math.min(20, state.config.timerMinutes + delta));
    if (nextValue === state.config.timerMinutes) {
      showConfigLimitFeedback(key, delta);
      return;
    }

    state.config.timerMinutes = nextValue;
    document.getElementById('timer-minutes-display').textContent = state.config.timerMinutes;
  }

  sounds.tap();
  saveConfig();
}

// ─── Player Names ─────────────────────────────────────────────────────────────

function buildPlayerNameFields() {
  const container = document.getElementById('player-names-list');
  if (!container) return;

  // Ensure the array has slots for any newly added players, but keep
  // existing names so they can reappear if the count is increased again.
  while (state.config.playerNames.length < state.config.playerCount) {
    state.config.playerNames.push('');
  }

  container.innerHTML = '';
  for (let i = 0; i < state.config.playerCount; i++) {
    const color = PLAYER_COLORS[i % PLAYER_COLORS.length];
    const div = document.createElement('div');
    div.className = 'player-name-row';
    div.innerHTML = `
      <div class="player-badge" style="background:${color}">
        ${i + 1}
      </div>
      <input
        type="text"
        class="player-name-input"
        placeholder="খেলোয়াড় ${bengaliNumber(i + 1)}"
        maxlength="20"
        value="${escapeHtml(state.config.playerNames[i] || '')}"
        oninput="updatePlayerName(${i}, this.value)"
      >
    `;
    container.appendChild(div);
  }
}

function updatePlayerName(index, value) {
  state.config.playerNames[index] = value.trim();
  saveConfig();
}

function togglePlayerNames() {
  const container = document.getElementById('player-names-container');
  const icon = document.getElementById('names-toggle-icon');
  const isOpen = !container.classList.contains('collapsed');
  if (isOpen) {
    container.classList.add('collapsed');
    icon.textContent = '▼';
  } else {
    container.classList.remove('collapsed');
    icon.textContent = '▲';
  }
  sounds.tap();
}

function getPlayerName(index) {
  return (state.config.playerNames[index] || '').trim() || `খেলোয়াড় ${bengaliNumber(index + 1)}`;
}

// ─── Categories ───────────────────────────────────────────────────────────────

function buildCategoryGrid() {
  updateCategoryGrid();
}

function updateCategoryGrid() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const allCats = getAllCategories();
  for (const [key, cat] of Object.entries(allCats)) {
    const btn = document.createElement('button');
    btn.className = 'category-chip' + (state.config.selectedCategories.includes(key) ? ' selected' : '');
    btn.setAttribute('data-key', key);
    btn.innerHTML = `<span class="cat-icon">${cat.icon || '📋'}</span><span class="cat-name">${cat.name}</span>`;
    btn.onclick = () => toggleCategory(key, btn);
    grid.appendChild(btn);
  }
}

function getAllCategories() {
  const all = {};
  for (const [k, v] of Object.entries(BUILT_IN_CATEGORIES)) {
    all[k] = v;
  }
  for (const [k, v] of Object.entries(state.customCategories)) {
    all[k] = v;
  }
  return all;
}

function toggleCategory(key, btn) {
  sounds.tap();
  const idx = state.config.selectedCategories.indexOf(key);
  if (idx >= 0) {
    state.config.selectedCategories.splice(idx, 1);
    btn.classList.remove('selected');
  } else {
    state.config.selectedCategories.push(key);
    btn.classList.add('selected');
  }
  saveConfig();
}

function toggleSound() {
  state.config.soundEnabled = document.getElementById('sound-toggle').checked;
  sounds.enabled = state.config.soundEnabled;
  saveConfig();
}

// ─── Game Start & Validation ──────────────────────────────────────────────────

function startGame() {
  sounds.tap();

  // Validation
  if (state.config.playerCount < 3) {
    showToast('কমপক্ষে ৩ জন খেলোয়াড় দরকার!');
    return;
  }
  if (state.config.selectedCategories.length === 0) {
    showToast('কমপক্ষে একটি ক্যাটাগরি নির্বাচন করুন!');
    return;
  }

  // Collect all items from selected categories
  const allItems = collectItems();
  if (allItems.length === 0) {
    showToast('নির্বাচিত ক্যাটাগরিতে কোনো আইটেম নেই!');
    return;
  }

  initRound(allItems);
  showRevealScreen();
}

function collectItems() {
  const allCats = getAllCategories();
  const items = [];
  for (const key of state.config.selectedCategories) {
    const cat = allCats[key];
    if (cat && cat.items && cat.items.length > 0) {
      for (const item of cat.items) {
        items.push({ item, catKey: key, catName: cat.name });
      }
    }
  }
  return items;
}

// ─── Round Initialization ─────────────────────────────────────────────────────

function initRound(allItems) {
  const { playerCount, spyCount } = state.config;

  // Pick random secret item
  const chosen = allItems[secureRandomInt(allItems.length)];

  // Pick random spies
  const indices = Array.from({ length: playerCount }, (_, i) => i);
  shuffleArray(indices);
  const spyIndices = indices.slice(0, spyCount);

  state.round = {
    spyIndices,
    secretItem: chosen.item,
    secretCategoryKey: chosen.catKey,
    secretCategoryName: chosen.catName,
    currentRevealIndex: 0,
    revealPhase: 'pass',
    cardState: 'face-down'
  };
}

// ─── Card Reveal Screen ───────────────────────────────────────────────────────

function showRevealScreen() {
  showScreen('reveal');
  state.round.currentRevealIndex = 0;
  state.round.revealPhase = 'pass';
  renderRevealPassPhase();
}

function renderRevealPassPhase() {
  state.round.revealPhase = 'pass';
  const idx = state.round.currentRevealIndex;
  const name = getPlayerName(idx);
  const total = state.config.playerCount;
  const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];

  // Show pass-device panel, hide card panel
  document.getElementById('reveal-pass-device').classList.add('active');
  document.getElementById('reveal-card').classList.remove('active');

  const passEl = document.getElementById('pass-to-player');
  passEl.innerHTML = `
    <div class="pass-player-badge" style="background:${color}">
      <span class="pass-player-number">${bengaliNumber(idx + 1)}</span>
    </div>
    <span class="pass-player-name">${escapeHtml(name)}</span>
  `;

  document.getElementById('reveal-progress-pass').textContent =
    `${bengaliNumber(idx + 1)} / ${bengaliNumber(total)}`;
}

function readyToReveal() {
  sounds.flip();
  state.round.revealPhase = 'card';
  state.round.cardState = 'face-down';

  const idx = state.round.currentRevealIndex;
  const name = getPlayerName(idx);
  const total = state.config.playerCount;
  const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];

  // Switch panels
  document.getElementById('reveal-pass-device').classList.remove('active');
  document.getElementById('reveal-card').classList.add('active');

  // Progress
  document.getElementById('reveal-progress').textContent =
    `${bengaliNumber(idx + 1)} / ${bengaliNumber(total)}`;
  document.getElementById('reveal-player-name').textContent = name;
  document.getElementById('reveal-player-name').style.color = '#6C63FF';

  // Reset card state
  const card = document.getElementById('game-card');
  card.classList.remove('flipped');
  card.style.borderColor = color;

  // Set card back content based on role
  const isSpy = state.round.spyIndices.includes(idx);
  const backEl = document.getElementById('card-back-content');
  // Set data-role is no longer used (card colour is uniform); remove any stale attribute

  if (isSpy) {
    card.setAttribute('data-type', 'spy');
    backEl.innerHTML = `
      <div class="card-role">
        <div class="card-item">আপনিই আগন্তুক!</div>
        <p class="card-hint">গোপন তথ্য অনুমান করুন!</p>
      </div>
    `;
  } else {
    card.setAttribute('data-type', 'normal');
    backEl.innerHTML = `
      <div class="card-role">
        <div class="card-item">${escapeHtml(state.round.secretItem)}</div>
        <p class="card-category">${escapeHtml(state.round.secretCategoryName)}</p>
        <p class="card-hint">আগন্তুককে খুঁজে বের করুন!</p>
      </div>
    `;
  }

  // Instruction
  document.getElementById('card-instruction').textContent = 'কার্ডটি স্পর্শ করুন';
  document.getElementById('card-instruction').style.display = 'block';

  // Hide next button
  document.getElementById('reveal-next-btn-area').classList.add('hidden');
}

function handleCardTap() {
  const { cardState } = state.round;
  const card = document.getElementById('game-card');

  if (cardState === 'face-down') {
    // Flip to reveal — same sound regardless of role so no audio clue
    sounds.flip();
    setTimeout(() => sounds.reveal(), 300);
    card.classList.add('flipped');
    state.round.cardState = 'face-up';
    document.getElementById('card-instruction').textContent = 'লুকাতে স্পর্শ করুন';

  } else if (cardState === 'face-up') {
    // Flip back — allow re-flipping (don't set 'done'); show Next button
    sounds.flip();
    card.classList.remove('flipped');
    state.round.cardState = 'face-down';
    document.getElementById('card-instruction').textContent = 'আবার দেখতে স্পর্শ করুন';

    // Show next/start button (stays visible even if player re-flips)
    const nextBtn = document.getElementById('reveal-next-btn-area');
    nextBtn.classList.remove('hidden');
    const isLast = state.round.currentRevealIndex === state.config.playerCount - 1;
    document.getElementById('reveal-next-btn').textContent = isLast ? 'খেলা শুরু করুন' : 'পরবর্তী →';
  }
}

function nextReveal() {
  sounds.tap();
  const isLast = state.round.currentRevealIndex === state.config.playerCount - 1;
  if (isLast) {
    startGamePhase();
  } else {
    state.round.currentRevealIndex++;
    renderRevealPassPhase();
  }
}


// ─── Game Phase (Timer) ───────────────────────────────────────────────────────

function startGamePhase() {
  showScreen('game');

  const totalSecs = state.config.timerMinutes * 60;
  state.timer.totalSeconds = totalSecs;
  state.timer.remainingSeconds = totalSecs;

  updateTimerDisplay();
  updateTimerRing();

  // Clear any previous interval
  if (state.timer.intervalId) clearInterval(state.timer.intervalId);

  state.timer.intervalId = setInterval(() => {
    state.timer.remainingSeconds--;

    // Sound feedback
    if (state.timer.remainingSeconds <= 10 && state.timer.remainingSeconds > 0) {
      sounds.tickWarning();
    }

    updateTimerDisplay();
    updateTimerRing();

    if (state.timer.remainingSeconds <= 0) {
      clearInterval(state.timer.intervalId);
      state.timer.intervalId = null;
      endGame();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const secs = Math.max(0, state.timer.remainingSeconds);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const display = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  document.getElementById('timer-display').textContent = display;

  // Change color to red when ≤ 30 seconds
  const timerEl = document.getElementById('timer-display');
  if (secs <= 10) {
    timerEl.classList.add('timer-critical');
    timerEl.classList.remove('timer-warning');
  } else if (secs <= 30) {
    timerEl.classList.add('timer-warning');
    timerEl.classList.remove('timer-critical');
  } else {
    timerEl.classList.remove('timer-warning', 'timer-critical');
  }
}

function updateTimerRing() {
  const circumference = 2 * Math.PI * 54; // r=54
  const progress = state.timer.remainingSeconds / state.timer.totalSeconds;
  const offset = circumference * (1 - Math.max(0, progress));
  const ring = document.getElementById('timer-ring-progress');
  if (ring) {
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = offset;

    // Change ring color near end
    const secs = state.timer.remainingSeconds;
    if (secs <= 10) {
      ring.style.stroke = '#FF4757';
    } else if (secs <= 30) {
      ring.style.stroke = '#FFB347';
    } else {
      ring.style.stroke = 'white';
    }
  }
}

function endGame() {
  sounds.endGame();
  if (state.timer.intervalId) {
    clearInterval(state.timer.intervalId);
    state.timer.intervalId = null;
  }
  showEndScreen();
}

// ─── End Game Screen ──────────────────────────────────────────────────────────

function showEndScreen() {
  showScreen('end');

  // Reveal secret
  document.getElementById('result-secret').textContent = state.round.secretItem;
  document.getElementById('result-category').textContent = state.round.secretCategoryName;

  // Reveal spies
  const spiesEl = document.getElementById('result-spies');
  spiesEl.innerHTML = '';
  for (const idx of state.round.spyIndices) {
    const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
    const span = document.createElement('span');
    span.className = 'spy-badge';
    span.style.background = color;
    span.textContent = getPlayerName(idx);
    spiesEl.appendChild(span);
  }

  // Fire confetti
  setTimeout(() => confetti.start(), 300);
}

// ─── Replay ───────────────────────────────────────────────────────────────────

function quickRematch() {
  sounds.success();
  confetti.stop();

  const allItems = collectItems();
  if (allItems.length === 0) {
    showToast('কোনো আইটেম পাওয়া যায়নি!');
    return;
  }
  initRound(allItems);
  showRevealScreen();
}

function newGame() {
  sounds.tap();
  confetti.stop();
  returnToConfigScreen();
}

function cancelReveal() {
  sounds.tap();
  returnToConfigScreen();
}

// ─── Rules Modal ──────────────────────────────────────────────────────────────

function openRules() {
  sounds.tap();
  document.getElementById('modal-rules').classList.add('open');
}

function closeRules() {
  sounds.tap();
  document.getElementById('modal-rules').classList.remove('open');
}

// ─── Custom Categories ────────────────────────────────────────────────────────

function openCustomCategories() {
  sounds.tap();
  renderCustomCategoriesList();
  document.getElementById('modal-custom').classList.add('open');
}

function closeCustomCategories() {
  sounds.tap();
  document.getElementById('modal-custom').classList.remove('open');
  updateCategoryGrid();
}

function renderCustomCategoriesList() {
  const list = document.getElementById('custom-categories-list');
  list.innerHTML = '';

  const entries = Object.entries(state.customCategories);
  if (entries.length === 0) {
    list.innerHTML = '<p class="empty-state">কোনো কাস্টম ক্যাটাগরি নেই।<br>নিচের বোতাম দিয়ে যোগ করুন!</p>';
    return;
  }

  for (const [id, cat] of entries) {
    const div = document.createElement('div');
    div.className = 'custom-cat-row';
    div.innerHTML = `
      <div class="custom-cat-info">
        <span class="custom-cat-icon">${cat.icon || '📋'}</span>
        <div class="custom-cat-details">
          <strong>${escapeHtml(cat.name)}</strong>
          <small>${bengaliNumber(cat.items.length)}টি আইটেম</small>
        </div>
      </div>
      <div class="custom-cat-actions">
        <button class="btn-icon" title="সম্পাদনা" onclick="editCustomCategory('${escapeHtml(id)}')">✏️</button>
        <button class="btn-icon btn-icon-danger" title="মুছুন" onclick="deleteCustomCategory('${escapeHtml(id)}')">🗑️</button>
      </div>
    `;
    list.appendChild(div);
  }
}

function addCustomCategory() {
  sounds.tap();
  editingCategoryId = null;
  document.getElementById('edit-category-title').textContent = 'নতুন ক্যাটাগরি';
  document.getElementById('edit-category-name').value = '';
  document.getElementById('edit-category-items').value = '';
  document.getElementById('edit-items-count').textContent = '০টি আইটেম';
  setEmojiPickerValue('📋');
  document.getElementById('modal-edit-category').classList.add('open');
}

function editCustomCategory(id) {
  sounds.tap();
  editingCategoryId = id;
  const cat = state.customCategories[id];
  if (!cat) return;
  document.getElementById('edit-category-title').textContent = 'ক্যাটাগরি সম্পাদনা';
  document.getElementById('edit-category-name').value = cat.name;
  document.getElementById('edit-category-items').value = cat.items.join(', ');
  updateEditItemsCount();
  setEmojiPickerValue(cat.icon || '📋');
  document.getElementById('modal-edit-category').classList.add('open');
}

function deleteCustomCategory(id) {
  sounds.tap();
  delete state.customCategories[id];
  // Remove from selected categories if it was selected
  state.config.selectedCategories = state.config.selectedCategories.filter(k => k !== id);
  saveCustomCategories();
  saveConfig();
  renderCustomCategoriesList();
}

function closeEditCategory() {
  sounds.tap();
  document.getElementById('modal-edit-category').classList.remove('open');
}

function saveCustomCategory() {
  sounds.tap();
  const name = document.getElementById('edit-category-name').value.trim();
  const itemsRaw = document.getElementById('edit-category-items').value;
  const items = itemsRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);

  if (!name) {
    showToast('ক্যাটাগরির নাম দিন!');
    return;
  }
  if (items.length === 0) {
    showToast('কমপক্ষে একটি আইটেম দিন!');
    return;
  }

  const id = editingCategoryId || 'custom_' + Date.now();
  const icon = document.getElementById('emoji-preview').textContent.trim() || '📋';
  state.customCategories[id] = { name, icon, items };
  saveCustomCategories();
  closeEditCategory();
  renderCustomCategoriesList();
}

function updateEditItemsCount() {
  const raw = document.getElementById('edit-category-items').value;
  const count = raw.split(',').map(s => s.trim()).filter(s => s.length > 0).length;
  document.getElementById('edit-items-count').textContent = `${bengaliNumber(count)}টি আইটেম`;
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────

function buildEmojiGrid() {
  const grid = document.getElementById('emoji-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (const emoji of EMOJI_PICKER_OPTIONS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'emoji-chip';
    btn.textContent = emoji;
    btn.setAttribute('aria-label', emoji);
    btn.onclick = () => {
      selectEmoji(emoji);
      // sync the text input
      document.getElementById('edit-category-emoji').value = '';
    };
    grid.appendChild(btn);
  }
}

function setEmojiPickerValue(emoji) {
  document.getElementById('emoji-preview').textContent = emoji;
  document.getElementById('edit-category-emoji').value = '';
  // Highlight matching chip if any
  document.querySelectorAll('.emoji-chip').forEach(btn => {
    btn.classList.toggle('selected', btn.textContent === emoji);
  });
}

function selectEmoji(emoji) {
  sounds.tap();
  setEmojiPickerValue(emoji);
}

function setCustomEmoji(val) {
  // Extract first emoji/character cluster from typed input
  const chars = [...val.trim()];
  if (chars.length > 0) {
    document.getElementById('emoji-preview').textContent = chars[0];
    // Deselect all chips
    document.querySelectorAll('.emoji-chip').forEach(btn => btn.classList.remove('selected'));
  }
}

// ─── Toast Notification ───────────────────────────────────────────────────────

let toastHideTimeout = null;

function showToast(message, variant = '') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.className = variant || '';
  toast.textContent = message;
  toast.classList.add('show');
  if (toastHideTimeout) clearTimeout(toastHideTimeout);
  toastHideTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Cryptographically secure random integer in [0, max).
 * Avoids Math.random() for game fairness and to satisfy security linters.
 */
function secureRandomInt(max) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return Math.floor((buf[0] / (0xFFFFFFFF + 1)) * max);
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function bengaliNumber(n) {
  return String(n).split('').map(d => BENGALI_DIGITS[+d] ?? d).join('');
}

// ─── Close modals on backdrop click ──────────────────────────────────────────

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('open');
  }
});

// Prevent zoom on double-tap (iOS)
document.addEventListener('touchend', (e) => {
  // Allow scrolling and normal interaction
}, { passive: true });
