import { initAuth } from './auth.js';
import { loadSettings, applyThemeColor, applyBubbleStyle, applyFontSize } from './settings.js';
import { initSidebarToggle, initPanelButtons, initSettingsPanel, showConfirm } from './ui.js';
import {
  initSpeakers, addSpeaker, updateSpeaker, deleteSpeaker,
  renderSpeakerPills, renderSpeakersList, speakersCache
} from './speakers.js';
import { initFolders, createChat, createFolder } from './folders.js';

loadSettings();
initSidebarToggle();

initAuth((uid) => {
  initSpeakers(uid, (speakers) => {
    renderSpeakerPills(speakers);
    renderSpeakersList(speakers, handleEditSpeaker, handleDeleteSpeaker);
  });

  initPanelButtons(() => renderSpeakersList(speakersCache, handleEditSpeaker, handleDeleteSpeaker));
  initSettingsPanel(applyThemeColor, applyBubbleStyle, applyFontSize);

  initFolders(uid, (chatId) => {
    console.log('Chat selected:', chatId);
    // messages.js will be connected in Task 9
  });

  document.getElementById('btn-new-chat').addEventListener('click', () => createChat());
  document.getElementById('btn-new-folder').addEventListener('click', () => createFolder());

  document.getElementById('btn-add-speaker').addEventListener('click', () => {
    const name  = document.getElementById('new-speaker-name').value;
    const color = document.getElementById('new-speaker-color').value;
    const side  = document.getElementById('new-speaker-side').value;
    addSpeaker(name, color, side);
    document.getElementById('new-speaker-name').value = '';
  });
});

function handleEditSpeaker(id, changes) {
  updateSpeaker(id, changes);
}

async function handleDeleteSpeaker(id, name) {
  const ok = await showConfirm('화자 삭제', `"${name}"을(를) 삭제할까요? 기존 메시지는 유지됩니다.`);
  if (ok) deleteSpeaker(id);
}
