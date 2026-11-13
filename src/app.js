import { CalcEngine, Mode, Operator, UnaryOperator } from './calc-engine.js';

// Initialize core ViewModel / Engine
const engine = new CalcEngine(Mode.STANDARD);

// DOM Elements
const primaryDisplay = document.getElementById('primary-display');
const expressionDisplay = document.getElementById('expression-display');
const modeTitle = document.getElementById('current-mode-title');
const scientificBar = document.getElementById('scientific-bar');
const calcWindow = document.querySelector('.calculator-window');

// Memory buttons
const btnMC = document.getElementById('btn-mc');
const btnMR = document.getElementById('btn-mr');
const btnMPlus = document.getElementById('btn-mplus');
const btnMMinus = document.getElementById('btn-mminus');
const btnMS = document.getElementById('btn-ms');
const btnMFlyout = document.getElementById('btn-mflyout');

// Navigation & Flyouts
const menuBtn = document.getElementById('menu-btn');
const navDrawer = document.getElementById('nav-drawer');
const navItems = document.querySelectorAll('.nav-item');
const themeToggle = document.getElementById('theme-toggle');
const historyToggle = document.getElementById('history-toggle');
const sidePanel = document.getElementById('side-panel');
const tabHistory = document.getElementById('tab-history');
const tabMemory = document.getElementById('tab-memory');
const historyContent = document.getElementById('history-content');
const memoryContent = document.getElementById('memory-content');
const historyList = document.getElementById('history-list');
const memoryList = document.getElementById('memory-list');
const btnClearHistory = document.getElementById('btn-clear-history');
const btnAngle = document.getElementById('btn-angle');

// Render / Update View
function updateUI() {
  primaryDisplay.textContent = engine.getPrimaryDisplay();
  expressionDisplay.textContent = engine.getExpressionDisplay();

  // Adjust font size dynamically for long numbers
  const len = primaryDisplay.textContent.length;
  if (len > 14) {
    primaryDisplay.style.fontSize = '24px';
  } else if (len > 10) {
    primaryDisplay.style.fontSize = '30px';
  } else {
    primaryDisplay.style.fontSize = '42px';
  }

  // Update Memory buttons status
  const hasMem = engine.hasMemory();
  btnMC.disabled = !hasMem;
  btnMR.disabled = !hasMem;
  btnMFlyout.disabled = !hasMem;

  renderHistory();
  renderMemory();
}

function renderHistory() {
  if (engine.historyItems.length === 0) {
    historyList.innerHTML = '<div class="empty-state">There\'s no history yet</div>';
    btnClearHistory.style.display = 'none';
    return;
  }

  btnClearHistory.style.display = 'block';
  historyList.innerHTML = engine.historyItems
    .map(
      (item, idx) => `
      <div class="history-item" data-index="${idx}">
        <div class="history-item-expr">${item.expression}</div>
        <div class="history-item-res">${item.result}</div>
      </div>
    `
    )
    .join('');

  historyList.querySelectorAll('.history-item').forEach((elem) => {
    elem.addEventListener('click', () => {
      const idx = parseInt(elem.getAttribute('data-index'), 10);
      const item = engine.historyItems[idx];
      if (item) {
        engine.currentInput = item.result;
        engine.hasJustCalculated = true;
        updateUI();
      }
    });
  });
}

function renderMemory() {
  if (engine.memoryItems.length === 0) {
    memoryList.innerHTML = '<div class="empty-state">There\'s nothing saved in memory</div>';
    return;
  }

  memoryList.innerHTML = engine.memoryItems
    .map(
      (val, idx) => `
      <div class="memory-item">
        <span class="memory-item-val">${val.toLocaleString()}</span>
        <div class="memory-item-actions">
          <button class="memory-action-btn" data-action="mc" data-idx="${idx}">MC</button>
          <button class="memory-action-btn" data-action="m+" data-idx="${idx}">M+</button>
          <button class="memory-action-btn" data-action="m-" data-idx="${idx}">M-</button>
        </div>
      </div>
    `
    )
    .join('');

  memoryList.querySelectorAll('.memory-action-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.getAttribute('data-action');
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      if (action === 'mc') {
        engine.memoryItems.splice(idx, 1);
      } else if (action === 'm+') {
        const cur = parseFloat(engine.currentInput) || 0;
        engine.memoryItems[idx] += cur;
      } else if (action === 'm-') {
        const cur = parseFloat(engine.currentInput) || 0;
        engine.memoryItems[idx] -= cur;
      }
      updateUI();
    });
  });
}

// Attach Keypad Button Listeners
document.querySelectorAll('[data-digit]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const digit = parseInt(btn.getAttribute('data-digit'), 10);
    engine.inputDigit(digit);
    updateUI();
  });
});

document.getElementById('btn-decimal').addEventListener('click', () => {
  engine.inputDecimal();
  updateUI();
});

document.getElementById('btn-backspace').addEventListener('click', () => {
  engine.backspace();
  updateUI();
});

document.getElementById('btn-ce').addEventListener('click', () => {
  engine.clearEntry();
  updateUI();
});

document.getElementById('btn-c').addEventListener('click', () => {
  engine.clear();
  updateUI();
});

document.querySelectorAll('[data-op]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const op = btn.getAttribute('data-op');
    engine.applyOperator(Operator[op.toUpperCase()] || op);
    updateUI();
  });
});

document.querySelectorAll('[data-unary]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const unary = btn.getAttribute('data-unary');
    engine.applyUnary(UnaryOperator[unary.toUpperCase()] || unary);
    updateUI();
  });
});

document.querySelectorAll('[data-constant]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const constant = btn.getAttribute('data-constant');
    if (constant === 'PI') {
      engine.currentInput = Math.PI.toString();
    } else if (constant === 'E') {
      engine.currentInput = Math.E.toString();
    }
    engine.hasJustCalculated = true;
    updateUI();
  });
});

document.getElementById('btn-equals').addEventListener('click', () => {
  engine.calculate();
  updateUI();
});

// Memory bar buttons
btnMC.addEventListener('click', () => { engine.memoryClear(); updateUI(); });
btnMR.addEventListener('click', () => { engine.memoryRecall(); updateUI(); });
btnMPlus.addEventListener('click', () => { engine.memoryAdd(); updateUI(); });
btnMMinus.addEventListener('click', () => { engine.memorySubtract(); updateUI(); });
btnMS.addEventListener('click', () => { engine.memoryStore(); updateUI(); });
btnMFlyout.addEventListener('click', () => {
  sidePanel.classList.remove('hidden');
  tabMemory.click();
});

// Scientific angle button
if (btnAngle) {
  btnAngle.addEventListener('click', () => {
    engine.angleMode = engine.angleMode === 'DEG' ? 'RAD' : 'DEG';
    btnAngle.textContent = engine.angleMode;
  });
}

// Clear History
btnClearHistory.addEventListener('click', () => {
  engine.clearHistory();
  updateUI();
});

// Navigation & Mode Switching
menuBtn.addEventListener('click', () => {
  navDrawer.classList.toggle('hidden');
});

navItems.forEach((item) => {
  item.addEventListener('click', () => {
    navItems.forEach((i) => i.classList.remove('active'));
    item.classList.add('active');
    const selectedMode = item.getAttribute('data-mode');
    modeTitle.textContent = selectedMode;
    navDrawer.classList.add('hidden');

    if (selectedMode === Mode.SCIENTIFIC) {
      engine.setMode(Mode.SCIENTIFIC);
      scientificBar.classList.remove('hidden');
    } else {
      engine.setMode(Mode.STANDARD);
      scientificBar.classList.add('hidden');
    }
    updateUI();
  });
});

// Theme Toggle
themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
});

// History & Memory Flyout
historyToggle.addEventListener('click', () => {
  sidePanel.classList.toggle('hidden');
  calcWindow.classList.toggle('wide', !sidePanel.classList.contains('hidden'));
});

tabHistory.addEventListener('click', () => {
  tabHistory.classList.add('active');
  tabMemory.classList.remove('active');
  historyContent.classList.remove('hidden');
  memoryContent.classList.add('hidden');
});

tabMemory.addEventListener('click', () => {
  tabMemory.classList.add('active');
  tabHistory.classList.remove('active');
  memoryContent.classList.remove('hidden');
  historyContent.classList.add('hidden');
});

// Full Keyboard Support
window.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') {
    engine.inputDigit(parseInt(e.key, 10));
  } else if (e.key === '.') {
    engine.inputDecimal();
  } else if (e.key === '+' || e.key === '-') {
    engine.applyOperator(e.key === '+' ? Operator.ADD : Operator.SUBTRACT);
  } else if (e.key === '*') {
    engine.applyOperator(Operator.MULTIPLY);
  } else if (e.key === '/') {
    e.preventDefault();
    engine.applyOperator(Operator.DIVIDE);
  } else if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault();
    engine.calculate();
  } else if (e.key === 'Backspace') {
    engine.backspace();
  } else if (e.key === 'Escape') {
    engine.clear();
  } else if (e.key === 'Delete') {
    engine.clearEntry();
  } else if (e.key === '%') {
    engine.applyUnary(UnaryOperator.PERCENT);
  }
  updateUI();
});

// Initial Render
updateUI();
