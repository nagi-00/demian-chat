# Demian Chat — Design Spec
> 작성일: 2026-04-30  
> 프로젝트: 01.2ternity / nagi studio

---

## 1. 개요

화자를 자유롭게 등록·편집·삭제하고, 폴더로 채팅을 분류하며, Firebase에 실시간 백업하는 **개인용 스크립트 채팅 에디터**.  
AI 없음. 나기가 양쪽 화자(및 내레이션)를 직접 입력해 채팅처럼 보이는 스크립트를 작성한다.

---

## 2. 기술 스택

| 항목 | 결정 |
|------|------|
| 프론트엔드 | Vanilla HTML + CSS + **ES Modules** (index.html + style.css + 모듈 분리된 JS) |
| 배포 | GitHub Pages (public repo: `demian-chat`) |
| DB | Firebase Realtime Database (신규 프로젝트 생성) |
| 인증 | Firebase Anonymous Auth (`signInAnonymously`) |
| 폰트 | HJSS.ttf (`@font-face`) |
| 외부 라이브러리 | Firebase SDK (CDN) 외 추가 금지 |

---

## 3. 파일 구조

```
demian-chat/
├── index.html
├── style.css
├── firebase-config.js          ← .gitignore 처리 (절대 커밋 금지)
├── firebase-config.example.js  ← 키 없는 예시 파일
├── fonts/
│   └── HJSS.ttf
├── js/
│   ├── app.js          ← 진입점, 초기화, 라우팅
│   ├── auth.js         ← Firebase Anonymous Auth
│   ├── speakers.js     ← 화자 CRUD + 실시간 구독
│   ├── messages.js     ← 메시지 전송, 렌더링, undo 스택
│   ├── folders.js      ← 폴더 + 채팅 목록 CRUD
│   ├── settings.js     ← 테마/말풍선/폰트 localStorage 설정
│   └── ui.js           ← 패널 토글, 사이드바, 모드 탭 등 UI 조작
├── .gitignore
└── docs/
    └── superpowers/specs/
        └── 2026-04-30-demian-chat-design.md
```

---

## 4. 레이아웃 구조

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

- 모바일: 사이드바는 overlay 방식 토글 (z-index로 채팅 위에 덮기)

---

## 5. 디자인 시스템

### CSS 변수
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

- 테두리: `0.5px solid`  
- 모서리: `border-radius: 8~10px` (카드 20px)  
- 모든 텍스트: HJSS.ttf 우선 적용  
- 이모지 절대 사용 금지 — 아이콘은 인라인 SVG (stroke 기반, stroke-width 1.5)

### 말풍선 3종 (`body[data-bubble]`)
| 스타일 | 왼쪽 | 오른쪽 |
|--------|------|--------|
| `soft` | border-radius: 16px | border-radius: 16px |
| `classic` | 4px 16px 16px 16px | 16px 4px 16px 16px |
| `square` | border-radius: 2px | border-radius: 2px |

### 화자별 말풍선 색상
- 왼쪽: `background: {color}18; border: 0.5px solid {color}33;`
- 오른쪽: `background: {color}; color: #fff;`

---

## 6. Firebase 데이터 구조

```
/users/{uid}/
  speakers/{speakerId}
    name: string
    color: string (HEX)
    defaultSide: "left" | "right"
    order: number

  folders/{folderId}
    name: string
    order: number

  chats/{chatId}
    title: string          ← 첫 메시지 앞 20자 (HTML 태그 strip 후 자동 추출)
    folderId: string | null
    createdAt: timestamp

  chats/{chatId}/messages/{msgId}
    type: "message" | "script"
    speakerId: string | null
    side: "left" | "right" | null
    content: string (HTML)
    timestamp: number
    order: number          ← Date.now() 사용
```

### 보안 규칙
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

## 7. 기능 명세 요약

### 화자 시스템
- 등록: 이름 + 컬러 피커 + 정렬(좌/우) + 추가 버튼
- 유효성 검사 없음 (이름 중복, 동일 side, 빈 이름 모두 허용)
- 편집: 인라인 수정 → 저장 → 색상 변경 즉시 전체 채팅 반영
- 삭제: 확인 다이얼로그 → Firebase 삭제. 기존 메시지는 `name: "알 수 없음"`, `color: "#888"`, 기존 side 유지
- 이니셜 아바타: `name.slice(0, 2)` 자동 생성

### 메시지 입력
- 입력창: `contenteditable="true"` div (`<textarea>` 사용 금지)
- `Enter` → 전송, `Shift+Enter` → `<br>` 삽입
- placeholder: CSS `::before`로 처리
- 서식 툴바: `document.execCommand()` 또는 Selection/Range API

### 드래그로 화자 교체
- 각 말풍선 `draggable="true"`
- 드롭 대상: 입력창 speaker pill
- 완료 시 Firebase 업데이트 (`speakerId`, `side`)
- **Ctrl+Z Undo**: 전역 `undoStack[]` — `{ msgId, prevSpeakerId, prevSide }` push → pop 복원

### 폴더 & 채팅
- 폴더 접기/펼치기
- `···` 버튼: 이름 변경 / 삭제 / 폴더 이동
- 미소속 채팅: 최상단 표시

### 설정 패널
| 항목 | 구현 |
|------|------|
| 테마 컬러 | `<input type="color">` → `--theme-color` 갱신 → localStorage |
| 말풍선 스타일 | Soft / Classic / Square → `body[data-bubble]` → localStorage |
| 폰트 크기 | 슬라이더 14~20px → `--font-size-base` → localStorage |

---

## 8. 초기 설정 가이드 (Firebase + GitHub)

### Firebase CDN + ES Module 사용 방식

번들러(Webpack/Vite)를 사용하지 않으므로 Firebase SDK를 CDN 모듈 URL로 직접 import한다.

```js
// js/auth.js 예시
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
```

`index.html`의 모든 script 태그는 `type="module"`로 선언한다.

```html
<script type="module" src="js/app.js"></script>
```

`firebase-config.js`는 named export로 작성한다.

```js
// firebase-config.js (gitignore됨)
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

---

### Firebase 설정 순서
1. [Firebase Console](https://console.firebase.google.com) → 새 프로젝트 생성
2. Authentication → Anonymous 로그인 활성화
3. Realtime Database → 생성 (지역: asia-southeast1 권장)
4. 보안 규칙 위 JSON으로 교체
5. 프로젝트 설정 → 웹 앱 추가 → SDK config 복사
6. `firebase-config.js` 작성 (`.gitignore`에 추가됨)

### GitHub 설정 순서
1. `demian-chat` public 리포 생성
2. `git init` → `git remote add origin <url>`
3. GitHub Pages → Settings → Pages → Branch: `main`, folder: `/ (root)`

---

## 9. 보안 체크리스트

- [ ] `firebase-config.js` → `.gitignore` 포함 확인
- [ ] `firebase-config.example.js` 커밋 (키 값 없이 구조만)
- [ ] 코드 내 하드코딩된 키 없음 확인
- [ ] `node_modules/` `.gitignore` 포함 (해당 없음 — 번들러 미사용)
