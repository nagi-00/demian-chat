import { db } from './auth.js';
import {
  ref, push, update, remove, onValue
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { showContextMenu, showConfirm } from './ui.js';

let uid = null;
export let currentChatId = null;
export let foldersCache = {};
export let chatsCache = {};
let onChatSelectCb = null;

export function initFolders(currentUid, onChatSelect) {
  uid = currentUid;
  onChatSelectCb = onChatSelect;

  onValue(ref(db, `users/${uid}/folders`), (snap) => {
    foldersCache = snap.val() || {};
    renderSidebar();
  });
  onValue(ref(db, `users/${uid}/chats`), (snap) => {
    chatsCache = snap.val() || {};
    renderSidebar();
  });
}

export async function createChat(folderId = null) {
  const chatRef = await push(ref(db, `users/${uid}/chats`), {
    title: '새 채팅',
    folderId,
    createdAt: Date.now()
  });
  selectChat(chatRef.key);
  return chatRef.key;
}

export async function createFolder() {
  const name = prompt('폴더 이름:');
  if (!name) return;
  await push(ref(db, `users/${uid}/folders`), { name, order: Date.now() });
}

export async function renameChat(chatId, currentTitle) {
  const name = prompt('채팅 이름:', currentTitle);
  if (name !== null) await update(ref(db, `users/${uid}/chats/${chatId}`), { title: name });
}

export async function renameFolder(folderId, currentName) {
  const name = prompt('폴더 이름:', currentName);
  if (name !== null) await update(ref(db, `users/${uid}/folders/${folderId}`), { name });
}

export async function deleteChat(chatId) {
  const ok = await showConfirm('채팅 삭제', '이 채팅을 삭제할까요? 복구할 수 없습니다.');
  if (!ok) return;
  if (currentChatId === chatId) { currentChatId = null; clearChatArea(); }
  await remove(ref(db, `users/${uid}/chats/${chatId}`));
}

export async function deleteFolder(folderId) {
  const ok = await showConfirm('폴더 삭제', '폴더를 삭제할까요? 내부 채팅은 폴더 없음으로 이동합니다.');
  if (!ok) return;
  const updates = {};
  Object.entries(chatsCache).forEach(([id, chat]) => {
    if (chat.folderId === folderId) updates[`users/${uid}/chats/${id}/folderId`] = null;
  });
  if (Object.keys(updates).length) await update(ref(db), updates);
  await remove(ref(db, `users/${uid}/folders/${folderId}`));
}

export async function moveChatToFolder(chatId) {
  const folderEntries = Object.entries(foldersCache);
  if (folderEntries.length === 0) { alert('폴더가 없어요. 먼저 폴더를 만들어주세요.'); return; }
  const options = folderEntries.map(([, f], i) => `${i + 1}. ${f.name}`).join('\n');
  const input = prompt(`이동할 폴더 번호:\n${options}\n\n0 입력 시 폴더 없음으로 이동`);
  if (input === null) return;
  const idx = parseInt(input, 10);
  if (idx === 0) {
    await update(ref(db, `users/${uid}/chats/${chatId}`), { folderId: null });
  } else if (idx >= 1 && idx <= folderEntries.length) {
    const folderId = folderEntries[idx - 1][0];
    await update(ref(db, `users/${uid}/chats/${chatId}`), { folderId });
  }
}

export function selectChat(chatId) {
  currentChatId = chatId;
  renderSidebar();
  if (onChatSelectCb) onChatSelectCb(chatId);
}

function clearChatArea() {
  document.getElementById('messages-area').innerHTML =
    '<div class="empty-state">채팅을 선택하거나 새로 만들어줘</div>';
}

const collapsedFolders = new Set();

function renderSidebar() {
  const container = document.getElementById('chat-list');
  container.innerHTML = '';

  const orphans = Object.entries(chatsCache)
    .filter(([, c]) => !c.folderId)
    .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
  orphans.forEach(([id, chat]) => container.appendChild(createChatItem(id, chat, false)));

  Object.entries(foldersCache)
    .sort((a, b) => a[1].order - b[1].order)
    .forEach(([folderId, folder]) => {
      container.appendChild(createFolderHeader(folderId, folder));
      if (!collapsedFolders.has(folderId)) {
        Object.entries(chatsCache)
          .filter(([, c]) => c.folderId === folderId)
          .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0))
          .forEach(([id, chat]) => container.appendChild(createChatItem(id, chat, true)));
      }
    });
}

function createFolderHeader(folderId, folder) {
  const el = document.createElement('div');
  el.className = 'folder-header' + (collapsedFolders.has(folderId) ? ' collapsed' : '');
  el.innerHTML = `
    <svg class="chevron" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="2,3 5,7 8,3"/></svg>
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 5a1 1 0 011-1h4l2 2h4a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1V5z"/></svg>
    <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${folder.name}</span>
    <button class="more-btn">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="4" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/></svg>
    </button>`;
  el.addEventListener('click', (e) => {
    if (e.target.closest('.more-btn')) return;
    collapsedFolders.has(folderId) ? collapsedFolders.delete(folderId) : collapsedFolders.add(folderId);
    renderSidebar();
  });
  el.querySelector('.more-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    showContextMenu(e.clientX, e.clientY, [
      { label: '이름 변경', action: () => renameFolder(folderId, folder.name) },
      { label: '삭제', danger: true, action: () => deleteFolder(folderId) }
    ]);
  });
  return el;
}

function createChatItem(id, chat, indented) {
  const el = document.createElement('div');
  el.className = 'chat-item' + (indented ? ' indented' : '') + (id === currentChatId ? ' active' : '');
  el.innerHTML = `
    <span class="chat-dot"></span>
    <span class="chat-title">${chat.title || '새 채팅'}</span>
    <button class="more-btn">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="4" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/></svg>
    </button>`;
  el.addEventListener('click', (e) => {
    if (e.target.closest('.more-btn')) return;
    selectChat(id);
  });
  el.querySelector('.more-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    showContextMenu(e.clientX, e.clientY, [
      { label: '이름 변경', action: () => renameChat(id, chat.title) },
      { label: '폴더 이동', action: () => moveChatToFolder(id) },
      { label: '삭제', danger: true, action: () => deleteChat(id) }
    ]);
  });
  return el;
}
