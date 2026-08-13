# 한국어 멘토링 학습지 생성기 + AI 자동분류

## 무엇이 추가됐나요?
- 기존 학습지/숫자 학습지/PDF 직접 생성 기능 유지
- `🤖 AI로 자동 분류하기` 버튼 추가
- 단어를 서버로 보내 Gemini가 의미를 보고 분류
- 결과는 기존 학습지 편집 화면에서 직접 수정 가능
- API 키는 브라우저에 들어가지 않고 서버의 `.env`에만 저장

## 준비
1. Node.js 20 이상 설치
2. Google AI Studio에서 Gemini API 키 발급
3. 이 폴더에서 터미널 실행
4. `npm install`
5. `.env.example`을 복사해서 `.env`로 이름 변경
6. `.env`의 `GEMINI_API_KEY=` 뒤에 API 키 입력
7. `npm start`
8. 브라우저에서 `http://localhost:3000` 접속

## 다른 사람과 공유하려면
이 프로젝트를 Render, Cloud Run 등의 서버에 배포하고 `GEMINI_API_KEY`를 서버의 환경변수/Secret으로 설정하면 됩니다.
API 키를 `public/index.html`에 넣지 마세요.

## 분류 방식
- AI 자동 분류: AI가 단어 의미를 보고 분류
- 내가 정한 분류: 기존 방식
- 분류 안 함: 기존 방식

AI가 분류한 결과도 학습지 만들기 전에 수정할 수 있습니다.


## ⚠️ 중요: AI 자동분류는 HTML 파일을 더블클릭하면 작동하지 않습니다
AI 분류 버튼은 `/api/classify` 서버를 호출합니다. 따라서 ZIP 압축을 푼 폴더에서
터미널로 `npm install` 후 `npm start`를 실행하고, 브라우저에서
`http://localhost:3000`으로 접속해야 합니다.

`public/index.html`을 파일 탐색기에서 직접 열면 `fetch('/api/classify')`가 서버에
연결되지 않기 때문에 AI 분류가 실행되지 않습니다.

### 빠른 실행 순서
1. ZIP 압축 풀기
2. Node.js 20 이상 설치
3. 폴더에서 터미널 열기
4. `npm install`
5. `.env.example`을 `.env`로 복사
6. `.env`의 `GEMINI_API_KEY`에 본인의 Gemini API 키 입력
7. `npm start`
8. 브라우저에서 `http://localhost:3000` 열기
9. 단어 입력 → `🤖 AI로 자동 분류하기`

기본 모델은 `gemini-2.5-flash-lite`이며, 분류처럼 가벼운 대량 작업에 적합한 모델입니다.
