export function openPanel(id) {
  document.getElementById(id).classList.add('open');
}
export function closePanel(id) {
  document.getElementById(id).classList.remove('open');
}

export function initSidebarToggle() {
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebar-overlay');
  const btnToggle = document.getElementById('btn-sidebar-toggle');
  const isMobile  = () => window.innerWidth <= 640;

  btnToggle.addEventListener('click', () => {
    if (isMobile()) {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('visible');
    } else {
      sidebar.classList.toggle('hidden');
    }
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
  });
}

export function initPanelButtons(onOpenSpeakers) {
  document.getElementById('btn-speakers-panel').addEventListener('click', () => {
    openPanel('speakers-panel');
    if (onOpenSpeakers) onOpenSpeakers();
  });
  document.getElementById('btn-close-speakers').addEventListener('click', () => {
    closePanel('speakers-panel');
  });
  document.getElementById('btn-settings-panel').addEventListener('click', () => {
    openPanel('settings-panel');
  });
  document.getElementById('btn-close-settings').addEventListener('click', () => {
    closePanel('settings-panel');
  });
  document.getElementById('btn-add-speaker-from-pills').addEventListener('click', () => {
    openPanel('speakers-panel');
    if (onOpenSpeakers) onOpenSpeakers();
  });

  document.querySelectorAll('.panel-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
}

export function initSettingsPanel(applyColor, applyBubble, applySize, applyBg) {
  const colorInput  = document.getElementById('setting-theme-color');
  const fontSlider  = document.getElementById('setting-font-size');
  const fontLabel   = document.getElementById('font-size-label');
  const styleBtns   = document.querySelectorAll('.bubble-style-btn');
  const bgPresets   = document.querySelectorAll('.bg-preset-btn');
  const cs = getComputedStyle(document.documentElement);

  colorInput.value = cs.getPropertyValue('--theme-color').trim();
  fontSlider.value = parseInt(cs.getPropertyValue('--font-size-base'), 10);
  fontLabel.textContent = fontSlider.value + 'px';
  styleBtns.forEach(btn => {
    if (btn.dataset.style === document.body.dataset.bubble) btn.classList.add('active');
  });

  const currentBg = localStorage.getItem('bgColor') || '#F8F6F2';
  bgPresets.forEach(btn => {
    if (btn.dataset.color === currentBg) btn.classList.add('active');
    btn.addEventListener('click', () => {
      bgPresets.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyBg(btn.dataset.color);
    });
  });

  colorInput.addEventListener('input', (e) => applyColor(e.target.value));

  styleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      styleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyBubble(btn.dataset.style);
    });
  });

  fontSlider.addEventListener('input', (e) => {
    const size = parseInt(e.target.value, 10);
    fontLabel.textContent = size + 'px';
    applySize(size);
  });
}

export function initMockupToggle() {
  const btn = document.getElementById('btn-mockup-toggle');
  if (localStorage.getItem('mockupMode') === '1') {
    document.body.classList.add('mockup-mode');
    btn.classList.add('active');
  }
  btn.addEventListener('click', () => {
    const on = document.body.classList.toggle('mockup-mode');
    btn.classList.toggle('active', on);
    localStorage.setItem('mockupMode', on ? '1' : '0');
  });
}

export function showContextMenu(x, y, items) {
  removeContextMenu();
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.id = 'context-menu';
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';
  items.forEach(({ label, danger, action }) => {
    const item = document.createElement('div');
    item.className = 'context-item' + (danger ? ' danger' : '');
    item.textContent = label;
    item.addEventListener('click', () => { removeContextMenu(); action(); });
    menu.appendChild(item);
  });
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', removeContextMenu, { once: true }), 0);
}

export function removeContextMenu() {
  document.getElementById('context-menu')?.remove();
}

export function showConfirm(title, message) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    backdrop.innerHTML = `
      <div class="dialog">
        <div class="dialog-title">${title}</div>
        <div class="dialog-msg">${message}</div>
        <div class="dialog-actions">
          <button class="text-btn" id="dlg-cancel">취소</button>
          <button class="text-btn danger" id="dlg-confirm">삭제</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);
    backdrop.querySelector('#dlg-cancel').addEventListener('click', () => {
      backdrop.remove(); resolve(false);
    });
    backdrop.querySelector('#dlg-confirm').addEventListener('click', () => {
      backdrop.remove(); resolve(true);
    });
  });
}
