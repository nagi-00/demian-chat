import { db } from './auth.js';
import {
  ref, push, update, onValue, get
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { getSpeaker, speakersCache, getSelectedSpeakerId } from './speakers.js';

let uid = null;
let currentChatId = null;
let currentMode = 'message';
let messagesUnsub = null;
export const undoStack = [];

export function initMessages(currentUid) {
  uid = currentUid;
  initInputHandlers();
}

export function setCurrentChat(chatId) {
  currentChatId = chatId;
  undoStack.length = 0;
  if (messagesUnsub) { messagesUnsub(); messagesUnsub = null; }
  if (!chatId) {
    document.getElementById('messages-area').innerHTML =
      '<div class="empty-state">채팅을 선택하거나 새로 만들어줘</div>';
    return;
  }
  const msgRef = ref(db, `users/${uid}/chats/${chatId}/messages`);
  messagesUnsub = onValue(msgRef, (snap) => {
    renderMessages(snap.val() || {});
  });
}

export function initDropHandler() {
  window.__onDropSpeaker = async (msgId, targetSpeakerId) => {
    const msgSnap = await get(ref(db, `users/${uid}/chats/${currentChatId}/messages/${msgId}`));
    const msg = msgSnap.val();
    if (!msg) return;
    undoStack.push({ msgId, prevSpeakerId: msg.speakerId, prevSide: msg.side });
    const newSpeaker = getSpeaker(targetSpeakerId);
    await update(ref(db, `users/${uid}/chats/${currentChatId}/messages/${msgId}`), {
      speakerId: targetSpeakerId,
      side: newSpeaker ? newSpeaker.defaultSide : msg.side
    });
  };
}

function initInputHandlers() {
  const input    = document.getElementById('message-input');
  const sendBtn  = document.getElementById('btn-send');
  const modeTabs = document.querySelectorAll('.mode-tab');
  const toolbar  = document.getElementById('toolbar');
  const pills    = document.getElementById('speaker-pills');

  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMode = tab.dataset.mode;
      if (currentMode === 'script') {
        pills.classList.add('hidden');
        toolbar.classList.add('hidden');
        input.classList.add('script-mode');
      } else {
        pills.classList.remove('hidden');
        toolbar.classList.remove('hidden');
        input.classList.remove('script-mode');
      }
      input.focus();
    });
  });

  document.getElementById('toolbar').querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      document.execCommand(btn.dataset.cmd, false, null);
      input.focus();
    });
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && undoStack.length > 0) {
      e.preventDefault();
      const top = undoStack.pop();
      update(ref(db, `users/${uid}/chats/${currentChatId}/messages/${top.msgId}`), {
        speakerId: top.prevSpeakerId,
        side: top.prevSide
      });
    }
  });
}

async function sendMessage() {
  if (!currentChatId) return;
  const input = document.getElementById('message-input');
  const content = input.innerHTML.trim();
  if (!content || content === '<br>') return;

  const order = Date.now();
  const msgRef = ref(db, `users/${uid}/chats/${currentChatId}/messages`);

  if (currentMode === 'script') {
    await push(msgRef, { type: 'script', speakerId: null, side: null, content, timestamp: order, order });
  } else {
    const speakerId = getSelectedSpeakerId();
    if (!speakerId) { alert('화자를 선택해줘'); return; }
    const speaker = getSpeaker(speakerId);
    await push(msgRef, {
      type: 'message',
      speakerId,
      side: speaker.defaultSide,
      content,
      timestamp: order,
      order
    });
  }

  // 첫 메시지일 때 채팅 제목 자동 설정
  const snap = await get(ref(db, `users/${uid}/chats/${currentChatId}/messages`));
  const count = snap.size !== undefined ? snap.size : Object.keys(snap.val() || {}).length;
  if (count <= 1) {
    const plainText = content.replace(/<[^>]+>/g, '').slice(0, 20) || '새 채팅';
    await update(ref(db, `users/${uid}/chats/${currentChatId}`), { title: plainText });
  }

  input.innerHTML = '';
  input.focus();
}

function renderMessages(msgs) {
  const area = document.getElementById('messages-area');
  const sorted = Object.entries(msgs).sort((a, b) => a[1].order - b[1].order);

  if (sorted.length === 0) {
    area.innerHTML = '<div class="empty-state">아직 메시지가 없어요. 첫 메시지를 입력해봐</div>';
    return;
  }

  area.innerHTML = '';
  sorted.forEach(([msgId, msg]) => area.appendChild(createMsgEl(msgId, msg)));
  area.scrollTop = area.scrollHeight;
}

function createMsgEl(msgId, msg) {
  if (msg.type === 'script') {
    const el = document.createElement('div');
    el.className = 'script-line';
    el.dataset.msgId = msgId;
    el.innerHTML = msg.content;
    return el;
  }

  const speaker = msg.speakerId ? getSpeaker(msg.speakerId) : null;
  const name  = speaker ? speaker.name  : '알 수 없음';
  const color = speaker ? speaker.color : '#888888';
  const side  = msg.side || 'left';

  const row = document.createElement('div');
  row.className = `msg-row ${side}`;
  row.dataset.msgId = msgId;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.style.background = color;
  avatar.textContent = name.slice(0, 2);

  const wrap = document.createElement('div');
  wrap.className = 'bubble-wrap';

  const nameLabel = document.createElement('div');
  nameLabel.className = 'speaker-name-label';
  nameLabel.textContent = name;

  const bubble = document.createElement('div');
  bubble.className = `bubble ${side}`;
  bubble.draggable = true;
  if (side === 'left') {
    bubble.style.background = color + '18';
    bubble.style.border = `0.5px solid ${color}33`;
  } else {
    bubble.style.background = color;
  }
  bubble.innerHTML = msg.content;

  bubble.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', msgId);
  });

  wrap.appendChild(nameLabel);
  wrap.appendChild(bubble);
  row.appendChild(avatar);
  row.appendChild(wrap);
  return row;
}
