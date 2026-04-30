import { db } from './auth.js';
import {
  ref, push, update, remove, onValue
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

export let speakersCache = {};
let uid = null;
let onChangeCb = null;

export function initSpeakers(currentUid, onChange) {
  uid = currentUid;
  onChangeCb = onChange;
  const speakersRef = ref(db, `users/${uid}/speakers`);
  onValue(speakersRef, (snap) => {
    speakersCache = snap.val() || {};
    if (onChangeCb) onChangeCb(speakersCache);
  });
}

export function addSpeaker(name, color, defaultSide) {
  const speakersRef = ref(db, `users/${uid}/speakers`);
  const order = Date.now();
  return push(speakersRef, { name, color, defaultSide, order });
}

export function updateSpeaker(speakerId, changes) {
  return update(ref(db, `users/${uid}/speakers/${speakerId}`), changes);
}

export function deleteSpeaker(speakerId) {
  return remove(ref(db, `users/${uid}/speakers/${speakerId}`));
}

export function getSpeaker(speakerId) {
  return speakersCache[speakerId] || null;
}

let selectedSpeakerId = null;
export function getSelectedSpeakerId() { return selectedSpeakerId; }

export function renderSpeakerPills(speakers) {
  const container = document.getElementById('speaker-pills');
  const addBtn = document.getElementById('btn-add-speaker-from-pills');
  container.querySelectorAll('.pill').forEach(p => p.remove());

  const entries = Object.entries(speakers).sort((a, b) => a[1].order - b[1].order);

  if (!selectedSpeakerId && entries.length > 0) {
    selectedSpeakerId = entries[0][0];
  }

  entries.forEach(([id, sp]) => {
    const pill = document.createElement('button');
    pill.className = 'pill' + (id === selectedSpeakerId ? ' active' : '');
    pill.dataset.speakerId = id;
    pill.innerHTML = `<span class="pill-dot" style="background:${sp.color}"></span>${sp.name}`;
    pill.addEventListener('click', () => {
      selectedSpeakerId = id;
      renderSpeakerPills(speakersCache);
    });
    pill.addEventListener('dragover', (e) => { e.preventDefault(); pill.classList.add('drag-over'); });
    pill.addEventListener('dragleave', () => pill.classList.remove('drag-over'));
    pill.addEventListener('drop', (e) => {
      e.preventDefault();
      pill.classList.remove('drag-over');
      const msgId = e.dataTransfer.getData('text/plain');
      if (msgId && window.__onDropSpeaker) window.__onDropSpeaker(msgId, id);
    });
    container.insertBefore(pill, addBtn);
  });
}

export function renderSpeakersList(speakers, onEdit, onDelete) {
  const container = document.getElementById('speakers-list');
  container.innerHTML = '';
  const entries = Object.entries(speakers).sort((a, b) => a[1].order - b[1].order);
  if (entries.length === 0) {
    container.innerHTML = '<p style="font-size:12px;color:var(--text-muted);text-align:center;padding:20px 0">등록된 화자가 없어요</p>';
    return;
  }
  entries.forEach(([id, sp]) => {
    const item = document.createElement('div');
    item.className = 'speaker-item';
    item.innerHTML = `
      <div class="speaker-avatar" style="background:${sp.color}">${sp.name.slice(0, 2)}</div>
      <div class="speaker-info">
        <div class="speaker-name">${sp.name}</div>
        <div class="speaker-meta">${sp.defaultSide === 'left' ? '왼쪽' : '오른쪽'}</div>
      </div>
      <div class="speaker-actions">
        <button class="text-btn edit-btn">편집</button>
        <button class="text-btn danger delete-btn">삭제</button>
      </div>`;

    item.querySelector('.edit-btn').addEventListener('click', () => {
      if (item.classList.contains('editing')) return;
      item.classList.add('editing');

      const actionsDiv = item.querySelector('.speaker-actions');
      const infoDiv    = item.querySelector('.speaker-info');

      const nameInput  = document.createElement('input');
      nameInput.type   = 'text';
      nameInput.value  = sp.name;
      nameInput.className = 'text-input';
      nameInput.style.width = '70px';

      const colorInput = document.createElement('input');
      colorInput.type  = 'color';
      colorInput.value = sp.color;
      colorInput.className = 'color-input';

      const sideSelect = document.createElement('select');
      sideSelect.className = 'select-input';
      sideSelect.style.cssText = 'height:26px;font-size:11px;padding:0 4px';
      sideSelect.innerHTML = `<option value="left"${sp.defaultSide === 'left' ? ' selected' : ''}>왼</option><option value="right"${sp.defaultSide === 'right' ? ' selected' : ''}>오</option>`;

      const saveBtn = document.createElement('button');
      saveBtn.className = 'accent-btn';
      saveBtn.textContent = '저장';
      saveBtn.style.cssText = 'height:26px;padding:0 10px;font-size:11.5px';

      infoDiv.replaceChildren(nameInput, colorInput);
      actionsDiv.replaceChildren(sideSelect, saveBtn);

      saveBtn.addEventListener('click', () => {
        onEdit(id, { name: nameInput.value, color: colorInput.value, defaultSide: sideSelect.value });
      });
    });

    item.querySelector('.delete-btn').addEventListener('click', () => onDelete(id, sp.name));
    container.appendChild(item);
  });
}
