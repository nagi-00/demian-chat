const DEFAULTS = {
  themeColor: '#7B6FA0',
  bgColor: '#F8F6F2',
  bubbleStyle: 'classic',
  fontSize: 15
};

export function loadSettings() {
  const color    = localStorage.getItem('themeColor')  || DEFAULTS.themeColor;
  const bgColor  = localStorage.getItem('bgColor')     || DEFAULTS.bgColor;
  const bubble   = localStorage.getItem('bubbleStyle') || DEFAULTS.bubbleStyle;
  const fontSize = parseInt(localStorage.getItem('fontSize') || DEFAULTS.fontSize, 10);
  applyThemeColor(color);
  applyBgColor(bgColor);
  applyBubbleStyle(bubble);
  applyFontSize(fontSize);
  return { color, bgColor, bubble, fontSize };
}

export function applyBgColor(color) {
  document.documentElement.style.setProperty('--bg-primary', color);
  localStorage.setItem('bgColor', color);
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
