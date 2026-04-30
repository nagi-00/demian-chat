# Demian Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 화자를 등록·편집하고, 폴더로 채팅을 분류하며, Firebase에 실시간 백업하는 개인용 스크립트 채팅 에디터를 완성한다.

**Architecture:** Vanilla HTML + CSS + ES Modules (번들러 없음). Firebase SDK를 CDN 모듈 URL로 직접 import. 기능별로 JS 모듈을 분리하고 `js/app.js`가 진입점 역할을 한다.

**Tech Stack:** HTML5, CSS3 (custom properties), ES Modules, Firebase Realtime Database 10.x, Firebase Anonymous Auth, GitHub Pages

---

## 파일 구조 (전체)

```
demian-chat/
├── index.html                      ← 앱 셸, <script type="module" src="js/app.js">
├── style.css                       ← 전체 스타일, CSS custom properties
├── firebase-config.js              ← gitignore됨 (사용자가 직접 작성)
├── firebase-config.example.js      ← 구조만 담긴 예시 (커밋용)
├── fonts/
│   └── HJSS.ttf
├── js/
│   ├── app.js          ← 초기화 진입점: auth → 모듈 연결
│   ├── auth.js         ← signInAnonymously, uid export
│   ├── speakers.js     ← 화자 CRUD + onValue 실시간 구독
│   ├── messages.js     ← 메시지 전송, 렌더링, undoStack, 드래그
│   ├── folders.js      ← 폴더·채팅 CRUD + 사이드바 렌더링
│   ├── settings.js     ← localStorage: 테마색/말풍선/폰트
│   └── ui.js           ← 패널 토글, 모드 탭, 사이드바 토글
├── .gitignore
└── docs/
    └── superpowers/
        ├── specs/2026-04-30-demian-chat-design.md
        └── plans/2026-04-30-demian-chat.md
```

---

## Task 1: 프로젝트 초기 구조 + GitHub 리포

**Files:**
- Create: `index.html`
- Create: `.gitignore`
- Create: `firebase-config.example.js`
- Create: `style.css` (빈 파일)
- Create: `js/app.js` (빈 파일)

- [ ] **Step 1: 디렉토리 생성**

```bash
cd "C:/Users/mxgin/OneDrive/Desktop/2ternity/01.Projects/nagi/demian-chat"
mkdir -p js fonts
```

- [ ] **Step 2: .gitignore 작성**

```
firebase-config.js
*.env
.env
node_modules/
.superpowers/
```

- [ ] **Step 3: firebase-config.example.js 작성**

```js
// firebase-config.js 파일을 이 내용으로 작성하고 실제 값으로 채워주세요.
// 이 파일은 GitHub에 올려도 됩니다. firebase-config.js는 절대 올리지 마세요.
export const firebaseConfig = {
  apiKey: "여기에_API_KEY",
  authDomain: "여기에_AUTH_DOMAIN",
  databaseURL: "여기에_DATABASE_URL",
  projectId: "여기에_PROJECT_ID",
  storageBucket: "여기에_STORAGE_BUCKET",
  messagingSenderId: "여기에_SENDER_ID",
  appId: "여기에_APP_ID"
};
```

- [ ] **Step 4: 빈 파일 생성**

```bash
touch style.css js/app.js js/auth.js js/speakers.js js/messages.js js/folders.js js/settings.js js/ui.js
```

- [ ] **Step 5: GitHub 리포 생성 및 초기 커밋**

```bash
git init
git add .gitignore firebase-config.example.js
git commit -m "chore: initial project structure"
gh repo create demian-chat --public --source=. --remote=origin --push
```

---

## Task 2: HTML 셸 + 폰트 + CSS 변수

**Files:**
- Modify: `index.html`
- Modify: `style.css`

- [ ] **Step 1: index.html 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>demian chat</title>
  <link rel="stylesheet" href="style.css">
</head>
<body data-bubble="classic">

  <!-- HEADER -->
  <header class="app-header">
    <div class="header-left">
      <button class="icon-btn" id="btn-sidebar-toggle" aria-label="사이드바 토글">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/>
        </svg>
      </button>
      <span class="header-title">demian chat</span>
    </div>
    <div class="header-icons">
      <button class="icon-btn" id="btn-speakers-panel" aria-label="화자 관리">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="6" cy="5" r="2.5"/><path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4"/>
          <circle cx="12" cy="6" r="2"/><path d="M14 13c0-1.7-1.3-3-2.8-3"/>
        </svg>
      </button>
      <button class="icon-btn" id="btn-settings-panel" aria-label="설정">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="8" cy="8" r="2"/>
          <path d="M8 2v1M8 13v1M2 8h1M13 8h1M3.5 3.5l.7.7M11.8 11.8l.7.7M3.5 12.5l.7-.7M11.8 4.2l.7-.7"/>
        </svg>
      </button>
    </div>
  </header>

  <!-- BODY -->
  <div class="app-body">

    <!-- SIDEBAR -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-top">
        <button class="sidebar-btn" id="btn-new-chat">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>
          새 채팅
        </button>
        <button class="sidebar-btn" id="btn-new-folder">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5a1 1 0 011-1h4l2 2h4a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1V5z"/></svg>
          새 폴더
        </button>
      </div>
      <div class="sidebar-divider"></div>
      <div class="chat-list" id="chat-list">
        <!-- folders.js가 동적으로 렌더링 -->
      </div>
    </aside>

    <!-- SIDEBAR OVERLAY (모바일) -->
    <div class="sidebar-overlay" id="sidebar-overlay"></div>

    <!-- CHAT AREA -->
    <main class="chat-area" id="chat-area">
      <div class="messages-area" id="messages-area">
        <!-- messages.js가 동적으로 렌더링 -->
        <div class="empty-state" id="empty-state">
          채팅을 선택하거나 새로 만들어줘
        </div>
      </div>

      <!-- INPUT AREA -->
      <div class="input-area" id="input-area">
        <div class="mode-tabs">
          <button class="mode-tab active" data-mode="message">대화</button>
          <button class="mode-tab" data-mode="script">스크립트</button>
        </div>
        <div class="speaker-pills" id="speaker-pills">
          <!-- speakers.js가 동적으로 렌더링 -->
          <button class="icon-btn pill-add-btn" id="btn-add-speaker-from-pills" aria-label="화자 추가">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>
          </button>
        </div>
        <div class="toolbar" id="toolbar">
          <button class="tool-btn" data-cmd="bold"><b>B</b></button>
          <button class="tool-btn" data-cmd="italic"><i>I</i></button>
          <button class="tool-btn" data-cmd="underline"><u>U</u></button>
          <button class="tool-btn" data-cmd="strikeThrough"><s>S</s></button>
        </div>
        <div class="input-row">
          <div class="input-box"
               id="message-input"
               contenteditable="true"
               data-placeholder="메시지 입력..."></div>
          <button class="send-btn" id="btn-send" aria-label="전송">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="14" y1="2" x2="2" y2="8"/><line x1="14" y1="2" x2="8" y2="14"/><line x1="14" y1="2" x2="6" y2="6"/>
            </svg>
          </button>
        </div>
      </div>
    </main>
  </div>

  <!-- OVERLAYS -->
  <div class="panel-overlay" id="speakers-panel">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">화자 관리</span>
        <button class="icon-btn" id="btn-close-speakers">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
        </button>
      </div>
      <div class="panel-body" id="speakers-list">
        <!-- speakers.js 렌더링 -->
      </div>
      <div class="panel-footer">
        <div class="add-speaker-form" id="add-speaker-form">
          <input type="text" id="new-speaker-name" placeholder="화자 이름" class="text-input">
          <input type="color" id="new-speaker-color" value="#7B6FA0" class="color-input">
          <select id="new-speaker-side" class="select-input">
            <option value="left">왼쪽</option>
            <option value="right">오른쪽</option>
          </select>
          <button class="accent-btn" id="btn-add-speaker">추가</button>
        </div>
      </div>
    </div>
  </div>

  <div class="panel-overlay" id="settings-panel">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">설정</span>
        <button class="icon-btn" id="btn-close-settings">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
        </button>
      </div>
      <div class="panel-body">
        <div class="settings-row">
          <label class="settings-label">테마 컬러</label>
          <input type="color" id="setting-theme-color" class="color-input">
        </div>
        <div class="settings-row">
          <label class="settings-label">말풍선 스타일</label>
          <div class="bubble-style-btns">
            <button class="bubble-style-btn" data-style="soft">Soft</button>
            <button class="bubble-style-btn" data-style="classic">Classic</button>
            <button class="bubble-style-btn" data-style="square">Square</button>
          </div>
        </div>
        <div class="settings-row">
          <label class="settings-label">폰트 크기 <span id="font-size-label">15px</span></label>
          <input type="range" id="setting-font-size" min="14" max="20" value="15" class="range-input">
        </div>
      </div>
    </div>
  </div>

  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: style.css 작성 — 기본 변수 + 레이아웃**

```css
@font-face {
  font-family: 'HJSS';
  src: url('./fonts/HJSS.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --theme-color: #7B6FA0;
  --theme-light: color-mix(in srgb, var(--theme-color) 15%, white);
  --theme-mid:   color-mix(in srgb, var(--theme-color) 50%, white);
  --theme-dark:  color-mix(in srgb, var(--theme-color) 75%, black);
  --font-size-base: 15px;
  --sidebar-width: 200px;

  --bg-primary:   #F8F6F2;
  --bg-secondary: #EEEAE3;
  --bg-sidebar:   #F2EFE9;
  --border:       #D6D0C8;
  --text-primary:   #2C2825;
  --text-secondary: #8C8680;
  --text-muted:     #B8B2AA;
  --shadow-light: #FFFFFF;
  --shadow-dark:  #D6D0C8;
}

html, body {
  height: 100%;
  font-family: 'HJSS', 'Inter', sans-serif;
  font-size: var(--font-size-base);
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
}

/* ─── Header ─── */
.app-header {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 0.5px solid var(--border);
  background: var(--bg-primary);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.header-title { font-size: 13px; font-weight: 600; letter-spacing: 0.02em; }
.header-icons { display: flex; align-items: center; gap: 6px; }

/* ─── Body ─── */
.app-body {
  display: flex;
  height: calc(100vh - 44px);
  position: relative;
  overflow: hidden;
}

/* ─── Sidebar ─── */
.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-sidebar);
  border-right: 0.5px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  transition: transform 0.22s ease;
}
.sidebar.hidden { transform: translateX(-100%); }

@media (max-width: 640px) {
  .sidebar {
    position: absolute;
    top: 0; left: 0;
    height: 100%;
    z-index: 50;
    transform: translateX(-100%);
  }
  .sidebar.open { transform: translateX(0); }
  .sidebar-overlay {
    display: block;
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.25);
    z-index: 49;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.22s;
  }
  .sidebar-overlay.visible { opacity: 1; pointer-events: auto; }
}

@media (min-width: 641px) {
  .sidebar-overlay { display: none; }
}

.sidebar-top {
  padding: 12px 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.sidebar-btn {
  height: 30px;
  display: flex; align-items: center; gap: 8px;
  padding: 0 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.15s;
}
.sidebar-btn:hover { background: var(--bg-secondary); }

.sidebar-divider {
  height: 0.5px;
  background: var(--border);
  margin: 4px 12px;
  flex-shrink: 0;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 12px;
}

/* ─── Chat Area ─── */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.messages-area {
  flex: 1;
  padding: 20px 20px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
}

/* ─── Input Area ─── */
.input-area {
  border-top: 0.5px solid var(--border);
  background: var(--bg-primary);
  flex-shrink: 0;
}

.mode-tabs {
  display: flex;
  padding: 8px 16px 0;
  gap: 2px;
}
.mode-tab {
  padding: 4px 14px;
  border-radius: 6px 6px 0 0;
  border: 0.5px solid transparent;
  border-bottom: none;
  background: transparent;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s;
}
.mode-tab.active {
  color: var(--theme-color);
  background: var(--bg-primary);
  border-color: var(--border);
}

.speaker-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px 0;
  flex-wrap: wrap;
  min-height: 40px;
}
.speaker-pills.hidden { display: none; }

.pill {
  height: 26px;
  display: flex; align-items: center; gap: 5px;
  padding: 0 10px;
  border-radius: 13px;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 500;
  border: 0.5px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.pill.active {
  border-color: var(--theme-color);
  background: var(--theme-light);
  color: var(--theme-color);
}
.pill-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.pill-add-btn {
  width: 26px; height: 26px;
  border-radius: 50%;
  border: 0.5px dashed var(--border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: border-color 0.15s, color 0.15s;
}
.pill-add-btn:hover { border-color: var(--theme-color); color: var(--theme-color); }

.toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 16px 0;
}
.toolbar.hidden { display: none; }
.tool-btn {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  border: none;
  border-radius: 5px;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.tool-btn:hover { background: var(--bg-secondary); color: var(--text-primary); }

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 16px 14px;
}
.input-box {
  flex: 1;
  min-height: 36px;
  max-height: 120px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 0.5px solid var(--border);
  background: var(--bg-secondary);
  font-family: inherit;
  font-size: var(--font-size-base);
  color: var(--text-primary);
  overflow-y: auto;
  outline: none;
  line-height: 1.5;
  transition: border-color 0.15s;
}
.input-box:focus { border-color: var(--theme-color); }
.input-box:empty::before {
  content: attr(data-placeholder);
  color: var(--text-muted);
  pointer-events: none;
}
.input-box.script-mode:empty::before {
  font-style: italic;
  content: '지문 또는 내레이션 입력...';
}

.send-btn {
  width: 34px; height: 34px;
  border-radius: 8px;
  border: none;
  background: var(--theme-color);
  color: white;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}
.send-btn:hover { background: var(--theme-dark); }

/* ─── Messages ─── */
.msg-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.msg-row.right { flex-direction: row-reverse; }

.avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 600;
  color: white;
  flex-shrink: 0;
  user-select: none;
}

.bubble-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 62%;
}
.msg-row.right .bubble-wrap { align-items: flex-end; }

.speaker-name-label {
  font-size: 10px;
  color: var(--text-muted);
  padding: 0 4px;
}

.bubble {
  padding: 8px 12px;
  font-size: var(--font-size-base);
  line-height: 1.55;
  word-break: break-word;
  cursor: grab;
  transition: opacity 0.15s;
}
.bubble:active { opacity: 0.7; cursor: grabbing; }

/* Bubble styles */
[data-bubble="soft"] .bubble { border-radius: 16px; }
[data-bubble="classic"] .bubble.left  { border-radius: 4px 16px 16px 16px; }
[data-bubble="classic"] .bubble.right { border-radius: 16px 4px 16px 16px; }
[data-bubble="square"] .bubble { border-radius: 2px; }

.bubble.left  { color: var(--text-primary); }
.bubble.right { color: white; }

/* Script line */
.script-line {
  text-align: center;
  font-size: calc(var(--font-size-base) - 2px);
  font-style: italic;
  color: var(--text-muted);
  padding: 4px 40px;
  user-select: text;
}

/* ─── Panels ─── */
.panel-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: none;
  align-items: flex-start;
  justify-content: flex-end;
}
.panel-overlay.open {
  display: flex;
}

.panel {
  width: 300px;
  height: 100vh;
  background: var(--bg-primary);
  border-left: 0.5px solid var(--border);
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0,0,0,0.08);
  animation: slideIn 0.2s ease;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

.panel-header {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 0.5px solid var(--border);
  flex-shrink: 0;
}
.panel-title { font-size: 13px; font-weight: 600; }

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-footer {
  border-top: 0.5px solid var(--border);
  padding: 14px 16px;
  flex-shrink: 0;
}

/* ─── Speaker item ─── */
.speaker-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 0.5px solid var(--border);
  background: var(--bg-secondary);
}
.speaker-avatar {
  width: 30px; height: 30px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600;
  color: white;
  flex-shrink: 0;
}
.speaker-info { flex: 1; min-width: 0; }
.speaker-name { font-size: 13px; font-weight: 500; }
.speaker-meta { font-size: 11px; color: var(--text-muted); }
.speaker-actions { display: flex; gap: 4px; }
.text-btn {
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 5px;
  border: 0.5px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.15s;
}
.text-btn:hover { background: var(--bg-primary); }
.text-btn.danger { color: #c0392b; border-color: #e8c0bb; }
.text-btn.danger:hover { background: #fdf0ef; }

/* ─── Add speaker form ─── */
.add-speaker-form {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}
.text-input {
  flex: 1;
  min-width: 80px;
  height: 32px;
  padding: 0 10px;
  border: 0.5px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  font-family: inherit;
  font-size: 12.5px;
  color: var(--text-primary);
  outline: none;
}
.text-input:focus { border-color: var(--theme-color); }
.color-input {
  width: 32px; height: 32px;
  border-radius: 8px;
  border: 0.5px solid var(--border);
  padding: 2px;
  cursor: pointer;
  background: var(--bg-secondary);
}
.select-input {
  height: 32px;
  padding: 0 8px;
  border: 0.5px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  font-family: inherit;
  font-size: 12px;
  color: var(--text-primary);
  outline: none;
  cursor: pointer;
}
.accent-btn {
  height: 32px;
  padding: 0 14px;
  border: none;
  border-radius: 8px;
  background: var(--theme-color);
  color: white;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.accent-btn:hover { background: var(--theme-dark); }

/* ─── Settings ─── */
.settings-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.settings-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}
.bubble-style-btns { display: flex; gap: 6px; }
.bubble-style-btn {
  flex: 1;
  height: 32px;
  border: 0.5px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  font-family: inherit;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.bubble-style-btn.active {
  border-color: var(--theme-color);
  background: var(--theme-light);
  color: var(--theme-color);
  font-weight: 500;
}
.range-input {
  width: 100%;
  accent-color: var(--theme-color);
}

/* Drag-over 상태 (pill 위에 말풍선 드래그 시) */
.pill.drag-over {
  border-color: var(--theme-color);
  background: var(--theme-light);
  transform: scale(1.05);
}

/* ─── Sidebar list items ─── */
.folder-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}
.folder-header:hover { background: var(--bg-secondary); }
.folder-header .chevron {
  width: 10px; height: 10px;
  transition: transform 0.15s;
}
.folder-header.collapsed .chevron { transform: rotate(-90deg); }

.chat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  position: relative;
  user-select: none;
}
.chat-item:hover { background: var(--bg-secondary); }
.chat-item.active {
  background: var(--theme-light);
  color: var(--theme-color);
  font-weight: 500;
}
.chat-item.indented { padding-left: 20px; }
.chat-dot { width: 4px; height: 4px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.chat-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.more-btn {
  width: 20px; height: 20px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  opacity: 0;
  transition: opacity 0.1s;
}
.chat-item:hover .more-btn,
.folder-header:hover .more-btn { opacity: 1; }

/* ─── Context menu ─── */
.context-menu {
  position: fixed;
  z-index: 200;
  background: var(--bg-primary);
  border: 0.5px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  padding: 4px;
  min-width: 130px;
}
.context-item {
  padding: 7px 12px;
  font-size: 12.5px;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 5px;
}
.context-item:hover { background: var(--bg-secondary); }
.context-item.danger { color: #c0392b; }

/* ─── Icon button (공통) ─── */
.icon-btn {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.icon-btn:hover { background: var(--bg-secondary); color: var(--text-primary); }

/* ─── Confirm dialog ─── */
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
}
.dialog {
  background: var(--bg-primary);
  border: 0.5px solid var(--border);
  border-radius: 12px;
  padding: 20px 24px;
  max-width: 320px;
  width: 90%;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}
.dialog-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.dialog-msg { font-size: 13px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.5; }
.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; }
```

- [ ] **Step 3: 브라우저에서 index.html 열어 레이아웃 확인**

브라우저에서 `index.html`을 직접 열거나 로컬 서버 실행:
```bash
# Python이 있다면:
python -m http.server 3000
# 또는 VS Code Live Server 사용
```

확인 사항:
- 헤더 44px 고정
- 사이드바 200px 좌측 배치
- 입력창 하단 고정
- 폰트가 로드되지 않아도 레이아웃 깨지지 않음
- 콘솔 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add index.html style.css
git commit -m "feat: HTML shell and CSS design system"
```

---

## Task 3: Firebase 인증 모듈 (auth.js)

**Files:**
- Create: `firebase-config.js` (로컬, gitignore됨)
- Modify: `js/auth.js`
- Modify: `js/app.js`

> **전제조건:** Firebase Console에서 프로젝트 생성 완료, Anonymous Auth 활성화, Realtime Database 생성, 보안 규칙 적용 후 `firebase-config.js` 작성 완료.

- [ ] **Step 1: firebase-config.js 작성 (실제 키 값으로)**

```js
export const firebaseConfig = {
  apiKey: "실제값",
  authDomain: "실제값",
  databaseURL: "실제값",   // ← 반드시 포함! Realtime DB URL
  projectId: "실제값",
  storageBucket: "실제값",
  messagingSenderId: "실제값",
  appId: "실제값"
};
```

- [ ] **Step 2: js/auth.js 작성**

```js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { firebaseConfig } from '../firebase-config.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export let uid = null;

export function initAuth(onReady) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      uid = user.uid;
      onReady(uid);
    } else {
      signInAnonymously(auth).catch(err => {
        console.error('Auth failed:', err);
      });
    }
  });
}
```

- [ ] **Step 3: js/app.js 작성**

```js
import { initAuth } from './auth.js';

initAuth((uid) => {
  console.log('Authenticated:', uid);
  // 이후 Task에서 모듈 초기화 코드가 여기 추가됨
});
```

- [ ] **Step 4: 브라우저에서 확인**

브라우저 콘솔에서 확인:
- `Authenticated: <uid 문자열>` 출력 확인
- Network 탭에서 Firebase 요청 성공 (200) 확인
- 페이지 새로고침 시 동일 uid 유지 확인 (Anonymous Auth는 로컬에 세션 유지)

- [ ] **Step 5: 커밋**

```bash
git add js/auth.js js/app.js firebase-config.example.js
git commit -m "feat: Firebase anonymous auth"
```

---

## Task 4: 설정 모듈 (settings.js)

**Files:**
- Modify: `js/settings.js`
- Modify: `js/app.js`

- [ ] **Step 1: js/settings.js 작성**

```js
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
```

- [ ] **Step 2: js/app.js에 settings 초기화 추가**

```js
import { initAuth } from './auth.js';
import { loadSettings } from './settings.js';

loadSettings(); // DOM 준비 즉시 실행 (auth 전)

initAuth((uid) => {
  console.log('Authenticated:', uid);
});
```

- [ ] **Step 3: 브라우저에서 확인**

브라우저 콘솔에서:
```js
// 테스트: 테마 컬러 변경
import('./js/settings.js').then(m => m.applyThemeColor('#FF6B6B'))
```
헤더 전송 버튼 색상이 빨간색으로 바뀌면 성공.
`localStorage`에 `themeColor: "#FF6B6B"` 저장 확인.
새로고침 후 색상 유지 확인.

- [ ] **Step 4: 커밋**

```bash
git add js/settings.js js/app.js
git commit -m "feat: settings module with localStorage persistence"
```

---

## Task 5: UI 패널 + 사이드바 토글 (ui.js)

**Files:**
- Modify: `js/ui.js`
- Modify: `js/app.js`

- [ ] **Step 1: js/ui.js 작성**

```js
// 패널 열기/닫기
export function openPanel(id) {
  document.getElementById(id).classList.add('open');
}
export function closePanel(id) {
  document.getElementById(id).classList.remove('open');
}

// 사이드바 토글 (모바일 overlay 포함)
export function initSidebarToggle() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const btnToggle = document.getElementById('btn-sidebar-toggle');
  const isMobile = () => window.innerWidth <= 640;

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

// 헤더 아이콘 → 패널
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
  // pill의 + 버튼도 화자 패널 열기
  document.getElementById('btn-add-speaker-from-pills').addEventListener('click', () => {
    openPanel('speakers-panel');
    if (onOpenSpeakers) onOpenSpeakers();
  });
}

// 설정 패널 이벤트 (settings.js와 연결)
export function initSettingsPanel(applyColor, applyBubble, applySize) {
  const colorInput   = document.getElementById('setting-theme-color');
  const fontSlider   = document.getElementById('setting-font-size');
  const fontLabel    = document.getElementById('font-size-label');
  const styleBtns    = document.querySelectorAll('.bubble-style-btn');

  // 현재 저장값 반영
  colorInput.value = getComputedStyle(document.documentElement)
    .getPropertyValue('--theme-color').trim();
  fontSlider.value = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--font-size-base'), 10
  );
  fontLabel.textContent = fontSlider.value + 'px';
  styleBtns.forEach(btn => {
    if (btn.dataset.style === document.body.dataset.bubble) btn.classList.add('active');
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

// 컨텍스트 메뉴 (폴더/채팅 ··· 버튼)
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

// 확인 다이얼로그
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
```

- [ ] **Step 2: js/app.js 업데이트**

```js
import { initAuth } from './auth.js';
import { loadSettings, applyThemeColor, applyBubbleStyle, applyFontSize } from './settings.js';
import { initSidebarToggle, initPanelButtons, initSettingsPanel } from './ui.js';

loadSettings();

initSidebarToggle();
initPanelButtons();
initSettingsPanel(applyThemeColor, applyBubbleStyle, applyFontSize);

initAuth((uid) => {
  console.log('Authenticated:', uid);
});
```

- [ ] **Step 3: 브라우저에서 확인**

- 헤더 햄버거 클릭 → 사이드바 숨김/표시 토글
- 화자 관리 아이콘 클릭 → 오른쪽에서 패널 슬라이드인
- 설정 아이콘 클릭 → 설정 패널 열림
- 설정 패널에서 컬러 변경 → 전송 버튼 색상 즉시 변경
- 말풍선 스타일 버튼 클릭 → active 클래스 이동
- 폰트 슬라이더 드래그 → 폰트 크기 레이블 업데이트
- 모바일 너비(640px 이하)로 창 좁히면 사이드바 overlay 방식으로 전환

- [ ] **Step 4: 커밋**

```bash
git add js/ui.js js/app.js
git commit -m "feat: panel/sidebar toggle and settings UI"
```

---

## Task 6: 화자 모듈 (speakers.js)

**Files:**
- Modify: `js/speakers.js`
- Modify: `js/app.js`

- [ ] **Step 1: js/speakers.js 작성**

```js
import { db } from './auth.js';
import {
  ref, push, update, remove, onValue, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

// 현재 세션의 speakers 캐시 (speakerId → speaker 객체)
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

export async function deleteSpeaker(speakerId) {
  return remove(ref(db, `users/${uid}/speakers/${speakerId}`));
}

export function getSpeaker(speakerId) {
  return speakersCache[speakerId] || null;
}

// Pills 렌더링
let selectedSpeakerId = null;
export function getSelectedSpeakerId() { return selectedSpeakerId; }

export function renderSpeakerPills(speakers) {
  const container = document.getElementById('speaker-pills');
  const addBtn = document.getElementById('btn-add-speaker-from-pills');
  // 기존 pill 제거 (addBtn 이전까지)
  const existing = container.querySelectorAll('.pill');
  existing.forEach(p => p.remove());

  const entries = Object.entries(speakers).sort((a, b) => a[1].order - b[1].order);
  entries.forEach(([id, sp]) => {
    const pill = document.createElement('button');
    pill.className = 'pill' + (id === selectedSpeakerId ? ' active' : '');
    pill.dataset.speakerId = id;
    pill.innerHTML = `<span class="pill-dot" style="background:${sp.color}"></span>${sp.name}`;
    pill.addEventListener('click', () => {
      selectedSpeakerId = id;
      renderSpeakerPills(speakersCache);
    });
    // 드롭 타겟 (드래그 교체)
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

  // 첫 번째 화자 자동 선택
  if (!selectedSpeakerId && entries.length > 0) {
    selectedSpeakerId = entries[0][0];
    renderSpeakerPills(speakers);
  }
}

// 화자 관리 패널 렌더링
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
    item.querySelector('.edit-btn').addEventListener('click', () => onEdit(id, sp));
    item.querySelector('.delete-btn').addEventListener('click', () => onDelete(id, sp.name));
    container.appendChild(item);
  });
}
```

- [ ] **Step 2: js/app.js 업데이트 — speakers 초기화**

```js
import { initAuth } from './auth.js';
import { loadSettings, applyThemeColor, applyBubbleStyle, applyFontSize } from './settings.js';
import { initSidebarToggle, initPanelButtons, initSettingsPanel, showConfirm } from './ui.js';
import {
  initSpeakers, addSpeaker, updateSpeaker, deleteSpeaker,
  renderSpeakerPills, renderSpeakersList, speakersCache
} from './speakers.js';

loadSettings();
initSidebarToggle();

initAuth((uid) => {
  initSpeakers(uid, (speakers) => {
    renderSpeakerPills(speakers);
    renderSpeakersList(speakers, handleEditSpeaker, handleDeleteSpeaker);
  });

  initPanelButtons(() => renderSpeakersList(speakersCache, handleEditSpeaker, handleDeleteSpeaker));
  initSettingsPanel(applyThemeColor, applyBubbleStyle, applyFontSize);

  // 화자 추가
  document.getElementById('btn-add-speaker').addEventListener('click', () => {
    const name  = document.getElementById('new-speaker-name').value;
    const color = document.getElementById('new-speaker-color').value;
    const side  = document.getElementById('new-speaker-side').value;
    addSpeaker(name, color, side);
    document.getElementById('new-speaker-name').value = '';
  });
});

function handleEditSpeaker(id, sp) {
  // 임시 prompt 편집 — Task 7에서 인라인 UI로 교체됨
  const newName = prompt('화자 이름:', sp.name);
  if (newName !== null) updateSpeaker(id, { name: newName });
}

async function handleDeleteSpeaker(id, name) {
  const ok = await showConfirm('화자 삭제', `"${name}"을(를) 삭제할까요? 기존 메시지는 유지됩니다.`);
  if (ok) deleteSpeaker(id);
}
```

> **Note:** handleEditSpeaker는 Task 7에서 인라인 편집 UI로 교체한다. 지금은 `prompt()`로 임시 처리.

- [ ] **Step 3: 브라우저에서 확인**

- 화자 관리 패널 → 이름 입력 → 컬러 선택 → 추가 버튼
- Firebase Console → Realtime Database → `users/{uid}/speakers` 에 데이터 생성 확인
- pills에 화자 표시 확인
- pill 클릭 → active 상태 변경 확인
- 삭제 버튼 → 확인 다이얼로그 → Firebase에서 삭제 확인

- [ ] **Step 4: 커밋**

```bash
git add js/speakers.js js/app.js
git commit -m "feat: speaker CRUD with Firebase realtime sync"
```

---

## Task 7: 화자 편집 UI (인라인)

**Files:**
- Modify: `js/speakers.js`
- Modify: `js/app.js`

- [ ] **Step 1: renderSpeakersList에 인라인 편집 지원 추가**

`js/speakers.js`의 `renderSpeakersList` 내부에서 편집 버튼 클릭 시 인라인 form으로 교체:

```js
// renderSpeakersList 내부 edit-btn 이벤트 핸들러를 아래로 교체
item.querySelector('.edit-btn').addEventListener('click', () => {
  const actionsDiv = item.querySelector('.speaker-actions');
  const infoDiv    = item.querySelector('.speaker-info');
  // 이미 편집 중이면 무시
  if (item.classList.contains('editing')) return;
  item.classList.add('editing');

  const nameInput  = document.createElement('input');
  nameInput.type   = 'text';
  nameInput.value  = sp.name;
  nameInput.className = 'text-input';
  nameInput.style.width = '80px';

  const colorInput = document.createElement('input');
  colorInput.type  = 'color';
  colorInput.value = sp.color;
  colorInput.className = 'color-input';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'accent-btn';
  saveBtn.textContent = '저장';
  saveBtn.style.height = '26px';
  saveBtn.style.padding = '0 10px';
  saveBtn.style.fontSize = '11.5px';

  infoDiv.replaceChildren(nameInput, colorInput);
  actionsDiv.replaceChildren(saveBtn);

  saveBtn.addEventListener('click', () => {
    onEdit(id, { name: nameInput.value, color: colorInput.value });
  });
});
```

`js/app.js`의 `handleEditSpeaker`를 교체:

```js
function handleEditSpeaker(id, changes) {
  updateSpeaker(id, changes);
  // onValue 구독이 speakers 변경을 감지해 자동으로 re-render
}
```

- [ ] **Step 2: 브라우저에서 확인**

- 편집 버튼 클릭 → 이름 input + 컬러 피커로 변환
- 저장 클릭 → Firebase 업데이트 → 패널 목록 자동 갱신
- 색상 변경 후 저장 → 해당 화자의 기존 메시지 bubble 색상 즉시 변경 확인 (Task 10 이후 유효)

- [ ] **Step 3: 커밋**

```bash
git add js/speakers.js js/app.js
git commit -m "feat: inline speaker editor"
```

---

## Task 8: 폴더 & 채팅 목록 (folders.js)

**Files:**
- Modify: `js/folders.js`
- Modify: `js/app.js`

- [ ] **Step 1: js/folders.js 작성**

```js
import { db } from './auth.js';
import {
  ref, push, update, remove, onValue, get
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
  // 폴더 내 채팅의 folderId를 null로
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
  const options = folderEntries.map(([id, f]) => `${id}: ${f.name}`).join('\n');
  const input = prompt(`이동할 폴더 번호 입력:\n${options}\n(비워두면 폴더 없음)`);
  const folderId = input?.split(':')[0]?.trim() || null;
  await update(ref(db, `users/${uid}/chats/${chatId}`), { folderId });
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

// 폴더 접힘 상태
const collapsedFolders = new Set();

function renderSidebar() {
  const container = document.getElementById('chat-list');
  container.innerHTML = '';

  // 폴더 없는 채팅 먼저
  const orphans = Object.entries(chatsCache)
    .filter(([, c]) => !c.folderId)
    .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));

  orphans.forEach(([id, chat]) => {
    container.appendChild(createChatItem(id, chat, false));
  });

  // 폴더별
  Object.entries(foldersCache)
    .sort((a, b) => a[1].order - b[1].order)
    .forEach(([folderId, folder]) => {
      const header = createFolderHeader(folderId, folder);
      container.appendChild(header);
      if (!collapsedFolders.has(folderId)) {
        const children = Object.entries(chatsCache)
          .filter(([, c]) => c.folderId === folderId)
          .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
        children.forEach(([id, chat]) => {
          container.appendChild(createChatItem(id, chat, true));
        });
      }
    });
}

function createFolderHeader(folderId, folder) {
  const el = document.createElement('div');
  const collapsed = collapsedFolders.has(folderId);
  el.className = 'folder-header' + (collapsed ? ' collapsed' : '');
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
```

- [ ] **Step 2: js/app.js 업데이트**

```js
import { initAuth } from './auth.js';
import { loadSettings, applyThemeColor, applyBubbleStyle, applyFontSize } from './settings.js';
import { initSidebarToggle, initPanelButtons, initSettingsPanel, showConfirm } from './ui.js';
import {
  initSpeakers, addSpeaker, updateSpeaker, deleteSpeaker,
  renderSpeakerPills, renderSpeakersList, speakersCache
} from './speakers.js';
import { initFolders, createChat, createFolder, currentChatId } from './folders.js';

loadSettings();
initSidebarToggle();

initAuth((uid) => {
  initSpeakers(uid, (speakers) => {
    renderSpeakerPills(speakers);
    renderSpeakersList(speakers, handleEditSpeaker, handleDeleteSpeaker);
  });

  initFolders(uid, (chatId) => {
    console.log('Chat selected:', chatId);
    // messages.js 연결은 Task 9에서
  });

  document.getElementById('btn-new-chat').addEventListener('click', () => createChat());
  document.getElementById('btn-new-folder').addEventListener('click', () => createFolder());

  initPanelButtons(() => renderSpeakersList(speakersCache, handleEditSpeaker, handleDeleteSpeaker));
  initSettingsPanel(applyThemeColor, applyBubbleStyle, applyFontSize);

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
  const ok = await showConfirm('화자 삭제', `"${name}"을(를) 삭제할까요?`);
  if (ok) deleteSpeaker(id);
}
```

- [ ] **Step 3: 브라우저에서 확인**

- 새 채팅 버튼 → Firebase에 chat 생성 → 사이드바에 표시
- 새 폴더 버튼 → 폴더 생성 → 사이드바에 표시
- 폴더 헤더 클릭 → 접힘/펼침
- `···` 버튼 → 컨텍스트 메뉴 표시
- 이름 변경 → Firebase 업데이트 → 사이드바 자동 갱신
- 삭제 → 확인 다이얼로그 → 삭제 확인

- [ ] **Step 4: 커밋**

```bash
git add js/folders.js js/app.js
git commit -m "feat: folder and chat management"
```

---

## Task 9: 메시지 전송 (messages.js)

**Files:**
- Modify: `js/messages.js`
- Modify: `js/app.js`

- [ ] **Step 1: js/messages.js 작성 (전송 부분)**

```js
import { db } from './auth.js';
import {
  ref, push, update, onValue, get
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { getSpeaker, speakersCache } from './speakers.js';

let uid = null;
let currentChatId = null;
let currentMode = 'message'; // 'message' | 'script'
let messagesUnsub = null;
export const undoStack = [];

export function initMessages(currentUid) {
  uid = currentUid;
  initInputHandlers();
}

export function setCurrentChat(chatId, onMessagesLoaded) {
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
    const msgs = snap.val() || {};
    renderMessages(msgs);
    if (onMessagesLoaded) onMessagesLoaded();
  });
}

function initInputHandlers() {
  const input   = document.getElementById('message-input');
  const sendBtn = document.getElementById('btn-send');
  const modeTabs = document.querySelectorAll('.mode-tab');
  const toolbar  = document.getElementById('toolbar');
  const pills    = document.getElementById('speaker-pills');

  // 모드 탭 전환
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMode = tab.dataset.mode;
      if (currentMode === 'script') {
        pills.classList.add('hidden');
        toolbar.classList.add('hidden');
        input.classList.add('script-mode');
        input.dataset.placeholder = '';
      } else {
        pills.classList.remove('hidden');
        toolbar.classList.remove('hidden');
        input.classList.remove('script-mode');
        input.dataset.placeholder = '메시지 입력...';
      }
      input.focus();
    });
  });

  // 서식 툴바
  document.getElementById('toolbar').querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.execCommand(btn.dataset.cmd);
      input.focus();
    });
  });

  // Enter 전송, Shift+Enter 줄바꿈
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  // Ctrl+Z Undo
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      const top = undoStack[undoStack.length - 1];
      if (top) { e.preventDefault(); undoAction(top); }
    }
  });
}

function sendMessage() {
  if (!currentChatId) return;
  const input = document.getElementById('message-input');
  const content = input.innerHTML.trim();
  if (!content || content === '<br>') return;

  const msgRef = ref(db, `users/${uid}/chats/${currentChatId}/messages`);
  const order = Date.now();

  if (currentMode === 'script') {
    push(msgRef, { type: 'script', speakerId: null, side: null, content, timestamp: order, order });
  } else {
    const { getSelectedSpeakerId } = window.__speakersModule;
    const speakerId = getSelectedSpeakerId();
    if (!speakerId) { alert('화자를 선택해줘'); return; }
    const speaker = getSpeaker(speakerId);
    push(msgRef, {
      type: 'message',
      speakerId,
      side: speaker.defaultSide,
      content,
      timestamp: order,
      order
    });
  }

  // 채팅 제목 자동 업데이트 (첫 메시지인 경우)
  get(ref(db, `users/${uid}/chats/${currentChatId}/messages`)).then(snap => {
    const count = snap.size || Object.keys(snap.val() || {}).length;
    if (count <= 1) {
      const plainText = content.replace(/<[^>]+>/g, '').slice(0, 20);
      update(ref(db, `users/${uid}/chats/${currentChatId}`), { title: plainText || '새 채팅' });
    }
  });

  input.innerHTML = '';
  input.focus();
}

async function undoAction({ msgId, prevSpeakerId, prevSide }) {
  undoStack.pop();
  await update(ref(db, `users/${uid}/chats/${currentChatId}/messages/${msgId}`), {
    speakerId: prevSpeakerId,
    side: prevSide
  });
}
```

- [ ] **Step 2: js/app.js 업데이트 — messages 연결**

`app.js`에 아래 추가:

```js
import { initMessages, setCurrentChat } from './messages.js';
// ... (기존 imports 유지)

// window에 speakers module 참조 노출 (messages.js에서 사용)
import * as speakersModule from './speakers.js';
window.__speakersModule = speakersModule;

// initAuth 내부에서:
initMessages(uid);
initFolders(uid, (chatId) => {
  setCurrentChat(chatId);
});
```

- [ ] **Step 3: 브라우저에서 확인**

- 새 채팅 생성 → 화자 선택 → 메시지 입력 → Enter
- Firebase Console에서 `users/{uid}/chats/{chatId}/messages`에 데이터 생성 확인
- 스크립트 탭 클릭 → pills/toolbar 숨김 확인
- 스크립트 탭에서 메시지 전송 → `type: "script"` 확인
- 메시지 전송 후 채팅 제목 자동 업데이트 확인 (사이드바)

- [ ] **Step 4: 커밋**

```bash
git add js/messages.js js/app.js
git commit -m "feat: message input and send with Firebase"
```

---

## Task 10: 메시지 렌더링

**Files:**
- Modify: `js/messages.js`

- [ ] **Step 1: renderMessages 함수 추가** (`js/messages.js`에 추가)

```js
function renderMessages(msgs) {
  const area = document.getElementById('messages-area');
  area.innerHTML = '';

  const sorted = Object.entries(msgs).sort((a, b) => a[1].order - b[1].order);
  if (sorted.length === 0) {
    area.innerHTML = '<div class="empty-state" style="flex:1">아직 메시지가 없어요. 첫 메시지를 입력해봐</div>';
    return;
  }

  sorted.forEach(([msgId, msg]) => {
    area.appendChild(createMsgEl(msgId, msg));
  });

  // 스크롤 최하단
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
  // 왼쪽: 반투명 배경, 오른쪽: solid
  if (side === 'left') {
    bubble.style.background = color + '18';
    bubble.style.border = `0.5px solid ${color}33`;
  } else {
    bubble.style.background = color;
  }
  bubble.innerHTML = msg.content;

  // 드래그 시작
  bubble.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', msgId);
  });

  wrap.appendChild(nameLabel);
  wrap.appendChild(bubble);
  row.appendChild(avatar);
  row.appendChild(wrap);
  return row;
}
```

- [ ] **Step 2: 드롭 핸들러 연결**

`js/messages.js`에 추가:

```js
export function initDropHandler(onDropSpeaker) {
  window.__onDropSpeaker = async (msgId, targetSpeakerId) => {
    const msgSnap = await get(ref(db, `users/${uid}/chats/${currentChatId}/messages/${msgId}`));
    const msg = msgSnap.val();
    if (!msg) return;
    // undo stack에 이전 상태 저장
    undoStack.push({ msgId, prevSpeakerId: msg.speakerId, prevSide: msg.side });
    const newSpeaker = getSpeaker(targetSpeakerId);
    await update(ref(db, `users/${uid}/chats/${currentChatId}/messages/${msgId}`), {
      speakerId: targetSpeakerId,
      side: newSpeaker.defaultSide
    });
    onDropSpeaker && onDropSpeaker();
  };
}
```

`js/app.js`에 추가:
```js
import { initMessages, setCurrentChat, initDropHandler } from './messages.js';
// initAuth 내부에서:
initDropHandler();
```

- [ ] **Step 3: 브라우저에서 확인**

- 메시지 전송 → 화면에 말풍선 렌더링 확인
- 스크립트 전송 → 중앙 이탤릭 텍스트 확인
- 삭제된 화자 메시지 → "알 수 없음", 회색 확인
- 말풍선 색상 화자별로 다름 확인
- Classic/Soft/Square 스타일 전환 시 말풍선 모양 즉시 변경 확인
- 말풍선 드래그 → pill 위에 드롭 → 화자 교체 확인
- Ctrl+Z → 교체 전으로 복원 확인

- [ ] **Step 4: 커밋**

```bash
git add js/messages.js js/app.js
git commit -m "feat: message rendering, drag-to-reassign, undo"
```

---

## Task 11: GitHub Pages 배포

**Files:**
- Verify: `.gitignore`
- GitHub Settings

- [ ] **Step 1: 보안 체크리스트**

```bash
# firebase-config.js가 gitignore에 포함됐는지 확인
cat .gitignore | grep firebase-config

# firebase-config.js가 스테이징에 없는지 확인
git status
# firebase-config.js가 'untracked' 또는 'ignored'로 표시되어야 함. Staged면 안 됨.
```

- [ ] **Step 2: 전체 파일 커밋 후 push**

```bash
git add index.html style.css fonts/ js/ firebase-config.example.js .gitignore docs/
git status  # firebase-config.js 없는지 재확인
git commit -m "feat: complete demian-chat implementation"
git push origin main
```

- [ ] **Step 3: GitHub Pages 설정**

```bash
gh api repos/{owner}/demian-chat \
  --method PATCH \
  --field has_pages=true

# 또는 브라우저에서:
# GitHub 리포 → Settings → Pages → Branch: main, Folder: / (root) → Save
```

- [ ] **Step 4: 배포 URL 확인**

```bash
gh api repos/{owner}/demian-chat/pages
# html_url 필드에 배포 URL 표시
```

브라우저에서 `https://{username}.github.io/demian-chat/` 열어 확인:
- Firebase 연결 정상 (콘솔에 `Authenticated: xxx`)
- 화자 등록, 메시지 전송 동작 확인

- [ ] **Step 5: 최종 커밋**

```bash
git commit --allow-empty -m "chore: verify GitHub Pages deployment"
```

---

## 빠진 기능 체크리스트

구현 완료 후 아래 항목 수동 확인:

- [ ] 화자 추가 후 이름/컬러/정렬 pill 즉시 반영
- [ ] 화자 삭제 후 기존 메시지 "알 수 없음" + 회색 표시
- [ ] Enter 전송, Shift+Enter 줄바꿈
- [ ] B/I/U/S 서식 적용 후 전송
- [ ] 스크립트 모드: 중앙 이탤릭, pill/toolbar 숨김
- [ ] 말풍선 드래그 → pill 드롭 → 화자 변경
- [ ] Ctrl+Z → 교체 전 화자로 복원
- [ ] 말풍선 스타일 Soft/Classic/Square 전환
- [ ] 테마 컬러 변경 즉시 적용 + 새로고침 유지
- [ ] 폰트 크기 슬라이더
- [ ] 폴더 접힘/펼침
- [ ] 채팅 이름 변경, 폴더 이동, 삭제
- [ ] 새 채팅 제목 첫 메시지에서 자동 추출
- [ ] 모바일 사이드바 overlay 토글
