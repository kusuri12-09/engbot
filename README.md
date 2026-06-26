# engbot

영어 단어 퀴즈를 제공하는 Discord 봇입니다.

## 준비

```bash
npm install
```

`.env.example`을 참고해 `.env`에 값을 설정합니다.

- `DISCORD_TOKEN`: Discord bot token
- `DISCORD_CLIENT_ID`: Discord application client id
- `DATABASE_URL`: PostgreSQL 연결 문자열

## 데이터베이스 초기화

```bash
npm run db:init
```

## 슬래시 명령어 등록

```bash
npm run deploy:commands
```

명령어는 사용자 설치 전용 전역 명령어로 등록됩니다. OAuth2 설치 방식은 `User Install`을 사용하고, scope는 `applications.commands`를 설정합니다. 명령어를 실행한 사용자 정보는 `discord_user` 테이블에 저장됩니다.

## 실행

```bash
npm start
```

## 명령어

- `/단어 언어:한국어`: 영어 단어를 보고 한국어 뜻을 입력합니다.
- `/단어 언어:영어`: 한국어 뜻을 보고 영어 단어를 입력합니다.
- `/퀴즈`: 아직 구현되지 않은 기능입니다
