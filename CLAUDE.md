# Demian Chat — CLAUDE.md

> 01.2ternity / nagi studio  
> 스크립트 채팅 에디터 웹앱

---

## 프로젝트 개요

화자를 자유롭게 등록·편집·삭제하고, 폴더로 채팅을 분류하며, Firebase에 실시간 백업하는 **개인용 스크립트 채팅 에디터**. AI 없음. 나기가 양쪽 화자(및 내레이션)를 직접 입력해 채팅처럼 보이는 스크립트를 작성한다.

---

## 기술 스택

- **프론트엔드**: Vanilla HTML + CSS + JS (index.html + style.css + app.js)
- **배포**: GitHub Pages
- **DB**: Firebase Realtime Database
- **인증**: Firebase Anonymous Auth (`signInAnonymously`)
- **폰트**: HJSS.ttf — 리포지토리 `/fonts/HJSS.ttf`, `@font-face`로 연결
- **외부 라이브러리**: Firebase SDK (CDN) 외 추가 금지

---

## 파일 구조

```
demian-chat/
├── index.html
├── style.css
├── app.js
├── fonts/
│   └── HJSS.ttf
├── firebase-config.js      ← .gitignore 처리
└── CLAUDE.md
```

---

## 디자인 원칙

- 상용 앱 수준 UX. Linear, Craft, Bear 계열 참고.
- **이모지 절대 사용 금지.** 모든 아이콘은 인라인 SVG (stroke 기반, stroke-width 1.5, stroke-linecap round).
- CSS custom property 기반 테마. 하드코딩 색상 금지.
- 테두리: `0.5px solid`. 모서리: `border-radius: 8~10px`.
- 모든 텍스트에 HJSS.ttf 우선 적용.

---

## CSS 변수 시스템

```css
:root {
  --theme-color: #7B6FA0;
  --theme-light: color-mix(in srgb, var(--theme-color) 15%, white);
  --theme-mid:   color-mix(in srgb, var(--theme-color) 50%, white);
  --theme-dark:  color-mix(in srgb, var(--theme-color) 75%, black);
  --font-size-base: 15px;
  --sidebar-width: 200px;
}
```

---

## 화면 레이아웃

```
┌─────────────────────────────────────────────────┐
│  HEADER (44px): 햄버거 | 타이틀 | 화자관리 | 설정  │
├─────────────┬───────────────────────────────────┤
│             │                                   │
│  SIDEBAR    │       CHAT AREA                   │
│  (200px)    │  [스크립트] 봄이 오는 어느 날…     │
│             │                                   │
│  + 새 채팅  │  [화자A] 말풍선                    │
│  + 새 폴더  │              [화자B] 말풍선        │
│             │                                   │
│  폴더명     │  [스크립트] 잠시 침묵이 흘렀다.    │
│   · 채팅1   │                                   │
│   · 채팅2   │  [화자A] 말풍선                    │
│             ├───────────────────────────────────┤
│  폴더명2    │  MODE TAB: [대화] [스크립트]       │
│   · 채팅3   │  SPEAKER PILLS (대화 모드만)       │
│             │  TOOLBAR: B I U S                 │
│             │  INPUT + 전송                     │
└─────────────┴───────────────────────────────────┘
```

---

## 기능 명세

### 1. 화자 (Speaker) 시스템

#### Firebase 데이터 구조
`/users/{uid}/speakers/{speakerId}`:
```js
{
  name: string,                    // 중복 허용, 제약 없음
  color: string,                   // HEX
  defaultSide: "left" | "right",   // 제약 없음 (같은 side 여러 명 허용)
  order: number
}
```

#### 화자 관리 패널 (헤더 아이콘 → 슬라이드 오버레이)
- **등록**: 이름 + 컬러 피커 + 정렬(좌/우) + 추가 버튼
  - 유효성 검사 없음. 이름 중복, 동일 side, 빈 이름 모두 허용.
- **편집**: "편집" 버튼 → 인라인 수정 → 저장. 색상 변경 즉시 전체 채팅 반영.
- **삭제**: "삭제" 버튼 → 확인 다이얼로그 → Firebase에서 화자 삭제.
  - 해당 speakerId를 가진 기존 메시지: speakerId 보존, 렌더링 시 name: "알 수 없음", color: `#888`, 기존 side 유지.
- 이니셜 아바타: `name.slice(0, 2)` 자동 생성

#### 화자 선택 Pills (입력창 상단)
- 등록된 화자 pill 목록. 선택된 화자 강조.
- 우측 `+` 버튼 → 화자 관리 패널 열기.

---

### 2. 메시지 타입

#### Firebase 데이터 구조
`/users/{uid}/chats/{chatId}/messages/{msgId}`:
```js
{
  type: "message" | "script",
  speakerId: string | null,        // "script"이면 null
  side: "left" | "right" | null,   // "script"이면 null
  content: string,                 // HTML (서식 포함)
  timestamp: number,
  order: number
}
```

#### 렌더링 분기
- `type === "message"`: 말풍선. speakerId로 화자 정보 조회 → 색상·이름·아바타 표시.
- `type === "script"`: **중앙정렬 + color: --color-text-tertiary(옅은 색) + font-style: italic.** 아바타·배경 없음.

---

### 3. 말풍선

#### 스타일 3종 (`body[data-bubble]`로 분기)
```css
/* Soft */
[data-bubble="soft"] .bubble { border-radius: 16px; }

/* Classic (꼬리) */
[data-bubble="classic"] .bubble-left  { border-radius: 4px 16px 16px 16px; }
[data-bubble="classic"] .bubble-right { border-radius: 16px 4px 16px 16px; }

/* Square */
[data-bubble="square"] .bubble { border-radius: 2px; }
```

#### 화자별 색상
- 왼쪽 화자 bubble: `background: {color}18; border: 0.5px solid {color}33;`
- 오른쪽 화자 bubble: `background: {color}; color: #fff;`
- JS에서 speakerId별로 CSS 변수 동적 주입하거나 inline style 적용.

#### 드래그로 speakerId 교체
- 각 말풍선 `draggable="true"` 적용.
- 드래그 시작 → 해당 `msgId` 저장.
- 드롭 대상: 입력창의 speaker pill.
- 드롭 완료:
  ```js
  update(ref(db, `users/${uid}/chats/${chatId}/messages/${msgId}`), {
    speakerId: targetSpeakerId,
    side: speakers[targetSpeakerId].defaultSide
  })
  ```
- **Ctrl+Z Undo**: 전역 `undoStack` 배열에 `{ msgId, prevSpeakerId, prevSide }` push. Ctrl+Z 시 pop → Firebase 복원.

---

### 4. 입력 모드

#### 모드 탭 (입력창 최상단)
`[대화]` | `[스크립트]` 탭 토글.

#### 대화 모드
- 화자 pill 표시.
- 서식 툴바: B (Bold) / I (Italic) / U (Underline) / S (Strikethrough) — `document.execCommand()` 또는 Selection/Range API.
- 입력창: `contenteditable="true"` div. `<textarea>` 사용 금지.
- `Enter` → 전송, `Shift+Enter` → `<br>` 삽입(줄바꿈).
- placeholder: CSS `::before`로 처리.
- 전송 시 `type: "message"`, 선택된 화자의 `speakerId`, `defaultSide`.

#### 스크립트 모드
- 화자 pill 숨김.
- 서식 툴바 숨김.
- placeholder: "지문 또는 내레이션 입력..." (이탤릭체).
- 전송 시 `type: "script"`, `speakerId: null`, `side: null`.

---

### 5. 폴더 & 채팅 목록

#### Firebase 데이터 구조
```js
// /users/{uid}/folders/{folderId}
{ name: string, order: number }

// /users/{uid}/chats/{chatId}
{
  title: string,          // 첫 메시지 앞 20자 자동 추출 (HTML 태그 strip 후)
  folderId: string | null,
  createdAt: timestamp
}
```

#### 사이드바 동작
- 폴더 목록 + 소속 채팅 (접기/펼치기).
- 폴더 미소속 채팅: 최상단 표시.
- 폴더·채팅 각각 `···` 버튼 → 이름 변경 / 삭제 / (채팅) 폴더 이동.
- 폴더 생성: 사이드바 `+` 버튼.
- 새 채팅: 별도 버튼.

---

### 6. Firebase 연동

```js
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase, ref, push, update, onValue, remove } from 'firebase/database';

// 초기화
signInAnonymously(auth).then(({ user }) => {
  uid = user.uid;
  loadSpeakers();
  loadFolders();
  loadChats();
});

// 화자 실시간 구독
onValue(ref(db, `users/${uid}/speakers`), snap => { /* 렌더링 */ });

// 메시지 저장
push(ref(db, `users/${uid}/chats/${chatId}/messages`), {
  type, speakerId, side, content,
  timestamp: Date.now(), order: Date.now()
});
```

#### 보안 규칙
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    }
  }
}
```

---

### 7. 설정 패널 (헤더 아이콘 → 슬라이드 오버레이)

| 항목 | 구현 |
|------|------|
| 테마 컬러 | `<input type="color">` → `:root` `--theme-color` 갱신 → localStorage |
| 말풍선 스타일 | Soft / Classic / Square 선택 → `body[data-bubble]` 갱신 → localStorage |
| 폰트 크기 | 슬라이더 14~20px → `--font-size-base` 갱신 → localStorage |

---

### 8. 아이콘 시스템

**이모지 절대 금지.** 모든 아이콘은 인라인 SVG.  
공통 속성: `width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`

| 용도 | path |
|------|------|
| 햄버거 | `<line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/>` |
| 추가(+) | `<line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/>` |
| 폴더 | `<path d="M2 5a1 1 0 011-1h4l2 2h4a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1V5z"/>` |
| 화자 관리 | `<circle cx="6" cy="5" r="2.5"/><path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4"/><circle cx="12" cy="6" r="2"/><path d="M14 13c0-1.7-1.3-3-2.8-3"/>` |
| 설정 | `<circle cx="8" cy="8" r="2"/><path d="M8 2v1M8 13v1M2 8h1M13 8h1M3.5 3.5l.7.7M11.8 11.8l.7.7M3.5 12.5l.7-.7M11.8 4.2l.7-.7"/>` |
| 전송 | `<line x1="14" y1="2" x2="2" y2="8"/><line x1="14" y1="2" x2="8" y2="14"/><line x1="14" y1="2" x2="6" y2="6"/>` |
| 좌 화살표 | `<polyline points="9,3 3,8 9,13"/>` |
| 우 화살표 | `<polyline points="7,3 13,8 7,13"/>` |
| 더보기(···) | `<circle cx="4" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/>` |

---

## 개발 주의사항

1. `contenteditable` 입력창은 반드시 `<div>`. `<textarea>` 사용 금지.
2. Undo 스택: 전역 `undoStack = []`. 드래그 교체 시 push. `Ctrl+Z` 시 pop → Firebase 복원.
3. 화자 삭제 후 해당 speakerId 메시지 렌더링: `name: "알 수 없음"`, `color: "#888"`, `side: 기존 side`.
4. `order` 필드: `Date.now()` 사용.
5. `firebase-config.js` → `.gitignore` 에 반드시 추가.
6. 모바일: 사이드바는 overlay 방식 토글 (z-index로 채팅 위에 덮기).
7. 테마 / 말풍선 스타일 / 폰트 크기 → 앱 로드 시 localStorage에서 복원해 즉시 적용.
