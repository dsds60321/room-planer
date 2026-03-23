# Room Planner

> 집/도면 워크스페이스에서 방 실측값을 입력하고, 평면을 배치하고, 결과 이미지를 내보내는 Next.js 기반 편집 도구입니다.

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2.1-000000?logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2.4-149ECA?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/MariaDB-10.x-003545?logo=mariadb&logoColor=white" alt="MariaDB" />
  <img src="https://img.shields.io/badge/TanStack_Query-5.95.0-FF4154?logo=reactquery&logoColor=white" alt="TanStack Query" />
  <img src="https://img.shields.io/badge/Zustand-5.0.12-443E38?logoColor=white" alt="Zustand" />
  <img src="https://img.shields.io/badge/Konva-10.2.3-0F172A?logoColor=white" alt="Konva" />
</p>

**Room Planner**는 집 단위로 여러 도면을 관리하고, 각 방의 실측 정보와 문의 위치를 입력한 뒤, 캔버스에서 배치와 편집을 거쳐 결과 평면도를 출력하는 프로젝트입니다.

- 집 목록에서 작업 단위를 만들고 검색하고 관리할 수 있습니다.
- 도면별로 방 실측 데이터를 저장하고 자동 저장 기반으로 편집할 수 있습니다.
- 결과 화면에서 치수 요약형과 클린형 렌더 모드, PNG 다운로드, 인쇄 출력을 지원합니다.

## Structure

```mermaid
flowchart LR
    U[User] --> H[Home Workspace]
    H --> F[Floorplan Workspace]
    F --> M[Measure Form]
    M --> E[Floor Plan Editor]
    E --> R[Result Export]

    H --> Q["TanStack Query<br/>server state"]
    F --> Q
    M --> Q
    E --> Z["Zustand<br/>rooms / placements / history"]
    R --> Z

    Q --> A[Next.js Route Handlers]
    Z --> A
    A --> P[project-shell-repo]
    P --> D[(MariaDB)]
```

1. 사용자는 `집 선택 -> 도면 선택 -> 방 측정 -> 평면 편집 -> 결과 보기` 흐름으로 작업합니다.
2. 서버 상태는 TanStack Query, 편집 상태는 Zustand로 분리해서 관리합니다.
3. Next.js Route Handlers가 MariaDB에 도면 문서와 정규화 테이블을 함께 반영합니다.

## ERD

```mermaid
erDiagram
    HOMES ||--o{ FLOORPLANS : contains
    FLOORPLANS ||--o{ ROOMS : has
    ROOMS ||--o{ DOORS : has
    FLOORPLANS ||--o{ PLACEMENTS : arranges
    ROOMS ||--|| PLACEMENTS : positioned_as

    HOMES {
      varchar id PK
      varchar name
      datetime created_at
      datetime updated_at
    }

    FLOORPLANS {
      varchar id PK
      varchar home_id FK
      varchar name
      int room_count
      enum status
      longtext rooms_json
      longtext placements_json
      datetime created_at
      datetime updated_at
    }

    ROOMS {
      varchar id PK
      varchar floorplan_id FK
      varchar room_name
      varchar room_type
      int width
      int depth
      int height
      bigint area
      int wall_thickness
      varchar status
    }

    DOORS {
      varchar id PK
      varchar room_id FK
      varchar wall_side
      int offset_value
      varchar offset_mode
      int width
      varchar swing_direction
      boolean opens_to_inside
    }

    PLACEMENTS {
      varchar room_id PK
      varchar floorplan_id FK
      boolean placed
      int x
      int y
      varchar attached_to
      varchar status
      int rotation
      int z_index
    }
```

1. `homes`는 상위 작업 단위이며 여러 도면을 묶습니다.
2. `floorplans`는 도면 메타데이터와 상태, 문서형 JSON 스냅샷을 함께 보관합니다.
3. `rooms`, `doors`, `placements`는 실측 데이터와 배치 데이터를 분리해서 저장합니다.

## 기술스택

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Konva

### State / Validation

- TanStack Query
- Zustand
- React Hook Form
- Zod

### Data / Runtime

- Next.js Route Handlers
- MariaDB
- Node.js `>=20.9.0`
- Standalone build (`output: "standalone"`)

## Workflow

| Step | Description |
| --- | --- |
| Home Workspace | 집 생성, 검색, 이름 변경, 삭제 |
| Floorplan Workspace | 도면 생성, 상태 확인, 최근 수정 시각 관리 |
| Measure | 방 이름, 유형, 가로, 세로, 높이, 문 위치, 문 폭, 스윙 방향 입력 |
| Editor | 드래그 배치, 줌, 스냅, 미니맵, 복제, 삭제, Undo / Redo |
| Result | 치수 요약 표시, 클린 출력, PNG 다운로드, 인쇄 |

## 주요 기능

- [x] 집 CRUD 및 집별 도면 허브
- [x] 도면 CRUD 및 상태 관리 (`empty`, `draft`, `complete`)
- [x] 방 실측 입력 폼과 문 위치/문 스윙 설정
- [x] 실시간 방 미리보기
- [x] 캔버스 기반 방 배치와 이동
- [x] 자동 저장
- [x] 스냅 On / Off
- [x] 미니맵 기반 전체 배치 확인
- [x] Undo / Redo
- [x] 방 복제 및 삭제
- [x] 결과 화면 PNG 다운로드
- [x] Standalone 산출물 기반 배포 스크립트 제공

## 실행 방법

### 1. 환경 변수

`.env.example`을 복사해서 `.env.local`을 만듭니다.

```bash
cp .env.example .env.local
```

기본 예시는 아래와 같습니다.

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=room_planner
DB_USER=e2u
DB_PASSWORD=12345
DB_AUTO_CREATE_TABLES=true
```

운영 배포 시에는 `.env.production`을 별도로 만들어 `deploy.sh`가 읽도록 두면 됩니다.

### 2. DB 준비

먼저 MariaDB에 `room_planner` 데이터베이스를 생성합니다.

```sql
CREATE DATABASE IF NOT EXISTS room_planner
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

테이블 준비 방식은 두 가지입니다.

1. 자동 생성
   `DB_AUTO_CREATE_TABLES=true`로 두면 첫 API 요청 시 필요한 테이블을 생성합니다.
2. 수동 생성
   `DB_AUTO_CREATE_TABLES=false`로 두고 `schema.sql`을 먼저 반영합니다.

```bash
mysql -h 127.0.0.1 -P 3306 -u e2u -p room_planner < schema.sql
```

### 3. 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

### 4. 빌드 / 실행

```bash
npm run build
npm run start
```

환경 파일을 명시해서 실행할 수도 있습니다.

```bash
npm run build:local
npm run start:local
```

## Standalone 배포

이 프로젝트는 `next.config.ts`에서 `output: "standalone"`을 사용합니다.

운영 배포 산출물은 아래 명령으로 생성합니다.

```bash
npm run build:prod:standalone
```

`prepare-standalone` 스크립트가 `public/`과 `.next/static/`을 `.next/standalone/` 안으로 자동 복사합니다.

배포 시에는 `.next/standalone/` 내부 결과물과 `.env.production`, `deploy.sh`를 같은 서버 디렉터리에 두는 방식으로 운영하면 됩니다.

서버에서 실행:

```bash
chmod +x deploy.sh
./deploy.sh start
```

자주 쓰는 명령:

```bash
./deploy.sh start
./deploy.sh stop
./deploy.sh restart
./deploy.sh status
./deploy.sh logs
```

## API

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
