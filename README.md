# Room Planner

Next.js App Router 기반의 집/도면 선택 + 평면 편집 MVP입니다.

## 환경 설정

`.env.example`을 복사해서 `.env.local`을 만듭니다.

```bash
cp .env.example .env.local
```

운영용은 `.env.production`을 별도로 둡니다.

```bash
cp .env.production.example .env.production
```

기본값은 아래와 같습니다.

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=room_planner
DB_USER=root
DB_PASSWORD=
DB_AUTO_CREATE_TABLES=true
```

## DB 준비

MariaDB에서 `room_planner` 스키마는 먼저 있어야 합니다.

```sql
CREATE DATABASE IF NOT EXISTS room_planner
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 방식 1. 자동 테이블 생성

- `.env.local`에서 `DB_AUTO_CREATE_TABLES=true`
- 앱이 첫 API 요청 시 `homes`, `floorplans` 테이블을 자동 생성합니다.
- DB 계정에 `CREATE TABLE` 권한이 있어야 합니다.

### 방식 2. 수동 테이블 생성

- `.env.local`에서 `DB_AUTO_CREATE_TABLES=false`
- 루트의 [schema.sql](/Users/e2u/DEV/ghkang/room-planner/schema.sql) 을 DB에 먼저 반영합니다.

예시:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p room_planner < schema.sql
```

운영 환경에서는 보통 수동 방식이 더 안전합니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

포트를 바꾸려면 `.env.local`에 `PORT`를 지정하면 됩니다.

```env
PORT=3100
```

그러면 개발 서버와 프로덕션 서버가 해당 포트로 실행됩니다.

## 환경별 빌드 / 실행

로컬 환경 파일 기준:

```bash
npm run build:local
npm run start:local
```

운영 환경 파일 기준:

```bash
npm run build:prod
npm run start:prod
```

기본 명령:

```bash
npm run build
npm run start
```

기본 명령은 현재 셸에 주입된 환경변수 또는 Next 기본 env 로딩 규칙을 따릅니다.  
환경을 명시적으로 나누고 싶으면 `build:local`, `build:prod`, `start:local`, `start:prod`를 쓰는 편이 안전합니다.

## 현재 서버 구조

- `GET /api/homes`
- `POST /api/homes`
- `PATCH /api/homes/[homeId]`
- `DELETE /api/homes/[homeId]`
- `GET /api/homes/[homeId]/floorplans`
- `POST /api/homes/[homeId]/floorplans`
- `PATCH /api/homes/[homeId]/floorplans/[floorplanId]`
- `DELETE /api/homes/[homeId]/floorplans/[floorplanId]`
- `GET /api/homes/[homeId]/floorplans/[floorplanId]/document`
- `PUT /api/homes/[homeId]/floorplans/[floorplanId]/document`
