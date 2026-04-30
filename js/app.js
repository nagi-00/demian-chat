import { initAuth } from './auth.js';
import { loadSettings, applyThemeColor, applyBubbleStyle, applyFontSize } from './settings.js';
import { initSidebarToggle, initPanelButtons, initSettingsPanel } from './ui.js';

loadSettings();
initSidebarToggle();

initAuth((uid) => {
  console.log('Authenticated:', uid);
  initPanelButtons();
  initSettingsPanel(applyThemeColor, applyBubbleStyle, applyFontSize);
});
