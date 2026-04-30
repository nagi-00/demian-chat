const DEFAULTS = {
  themeColor: '#7B6FA0',
  bubbleStyle: 'classic',
  fontSize: 15
};

export function loadSettings() {
  const color    = localStorage.getItem('themeColor')  || DEFAULTS.themeColor;
  const bubble   = localStorage.getItem('bubbleStyle') || DEFAULTS.bubbleStyle;
  const fontSize = parseInt(localStorage.getItem('fontSize') || DEFAULTS.fontSize, 10);
  applyThemeColor(color);
  applyBubbleStyle(bubble);
  applyFontSize(fontSize);
  return { color, bubble, fontSize };
}

export function applyThemeColor(color) {
  document.documentElement.style.setProperty('--theme-color', color);
  localStorage.setItem('themeColor', color);
}

export function applyBubbleStyle(style) {
  document.body.dataset.bubble = style;
  localStorage.setItem('bubbleStyle', style);
}

export function applyFontSize(size) {
  document.documentElement.style.setProperty('--font-size-base', size + 'px');
  localStorage.setItem('fontSize', size);
}
