# PredictX - 예측 마켓

BTC, ETH, KOSPI 가격 움직임을 예측하고 수익을 창출하는 바이너리 예측 마켓 플랫폼입니다.

![Dark Mode UI](https://img.shields.io/badge/UI-Dark%20Mode-0D0D0D?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=flat-square&logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript)

## 주요 기능

- **15분/일간 라운드**: 짧은 주기의 15분 라운드와 일간 라운드 지원
- **실시간 가격**: Binance API를 통한 실시간 암호화폐 가격 제공
- **Web3 지갑 연동**: RainbowKit을 통한 MetaMask, WalletConnect 등 지원
- **WebSocket 실시간 업데이트**: 라운드 상태, 가격 변동 실시간 알림
- **Prometheus 메트릭**: 프로덕션 모니터링을 위한 메트릭 엔드포인트

## UI/UX 특징 (Linear-Inspired Design)

PredictX는 [Linear](https://linear.app) 스타일의 모던 다크 모드 UI를 채택했습니다.

### 디자인 원칙

| 특징 | 설명 |
|------|------|
| **다크 모드 Only** | `#0D0D0D` 기반의 다크 테마 (토글 없음) |
| **사이드바 네비게이션** | 접이식 사이드바로 마켓 그룹별 탐색 |
| **Command Palette** | `⌘K` (Mac) / `Ctrl+K` (Windows)로 빠른 검색 |
| **키보드 네비게이션** | `J/K` 리스트 이동, `Enter` 선택, `U/D` 포지션 |
| **슬라이드 패널** | 마켓 상세를 오른쪽 패널로 오버레이 |
| **미니멀 애니메이션** | Framer Motion 기반 부드러운 전환 |

### 키보드 단축키

| 단축키 | 액션 |
|--------|------|
| `⌘K` / `Ctrl+K` | Command Palette 열기 |
| `J` / `↓` | 리스트 아래로 이동 |
| `K` / `↑` | 리스트 위로 이동 |
| `Enter` | 선택/열기 |
| `Escape` | 닫기/취소 |
| `U` | UP 포지션 선택 |
| `D` | DOWN 포지션 선택 |
| `1-4` | 빠른 금액 선택 |

### 색상 팔레트

```
배경
├── Primary:   #0D0D0D (메인 배경)
├── Secondary: #151515 (카드 배경)
├── Tertiary:  #1A1A1A (호버 상태)
└── Elevated:  #1F1F1F (모달/패널)

텍스트
├── Primary:   #FFFFFF
├── Secondary: #A0A0A0
├── Tertiary:  #6B6B6B
└── Quaternary:#4B4B4B

액센트
├── Purple:    #5E5CE6 (프라이머리)
├── Green:     #30D158 (UP/성공)
├── Red:       #FF453A (DOWN/에러)
├── Blue:      #0A84FF
└── Yellow:    #FFD60A (경고)
```

## 기술 스택

### Backend (API)
- **Framework**: NestJS 10
- **Database**: PostgreSQL (production) / SQLite (development)
- **ORM**: TypeORM
- **Authentication**: JWT + Web3 서명 검증
- **Cache**: Redis (optional)
- **Monitoring**: Prometheus, Sentry

### Frontend (Web)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Linear Design System
- **Animation**: Framer Motion
- **Web3**: wagmi, viem, RainbowKit
- **State**: TanStack Query, Zustand

### Smart Contracts
- **Framework**: Hardhat
- **Language**: Solidity

## 프로젝트 구조

```
prediction-market/
├── apps/
│   ├── api/                 # NestJS 백엔드
│   │   ├── src/
│   │   │   ├── common/      # 공통 모듈 (필터, 가드, 미들웨어)
│   │   │   ├── config/      # 환경 설정
│   │   │   ├── entities/    # TypeORM 엔티티
│   │   │   └── modules/     # 기능 모듈
│   │   │       ├── auth/        # 인증
│   │   │       ├── markets/     # 마켓 관리
│   │   │       ├── bets/        # 베팅
│   │   │       ├── settlement/  # 정산
│   │   │       ├── health/      # 헬스체크
│   │   │       ├── metrics/     # Prometheus 메트릭
│   │   │       └── websocket/   # WebSocket 게이트웨이
│   │   └── test/
│   ├── web/                 # Next.js 프론트엔드
│   │   ├── src/
│   │   │   ├── app/         # App Router 페이지
│   │   │   ├── components/
│   │   │   │   ├── betting/     # 베팅 관련 컴포넌트
│   │   │   │   ├── command/     # Command Palette
│   │   │   │   ├── layout/      # Sidebar, AppLayout, MobileSheet
│   │   │   │   ├── markets/     # 마켓 리스트, 카드
│   │   │   │   ├── panels/      # 슬라이드 패널
│   │   │   │   ├── stats/       # 통계 컴포넌트
│   │   │   │   └── ui/          # 기본 UI 컴포넌트
│   │   │   ├── contexts/    # React Context (WebSocket 등)
│   │   │   ├── hooks/       # Custom Hooks
│   │   │   │   ├── useKeyboardShortcuts.ts
│   │   │   │   └── useMediaQuery.ts
│   │   │   └── lib/         # 유틸리티
│   │   └── public/
│   └── contracts/           # Solidity 스마트 컨트랙트
├── k8s/                     # Kubernetes 배포 설정
│   ├── base/
│   └── overlays/
├── docker-compose.yml       # 로컬 개발용 Docker 설정
└── docker-compose.prod.yml  # 프로덕션 Docker 설정
```

## 시작하기

### 요구사항

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker (optional)

### 설치

```bash
# 저장소 클론
git clone https://github.com/seonkistall/prediction-market.git
cd prediction-market

# 의존성 설치
pnpm install
```

### 환경 설정

API 환경 변수 파일 생성:

```bash
# apps/api/.env.local
NODE_ENV=development
DB_TYPE=sqlite
DB_DATABASE=prediction_market.db
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars-here
PORT=3000
CORS_ORIGINS=http://localhost:3001

# Redis (선택)
# REDIS_HOST=localhost
# REDIS_PORT=6379

# Sentry (선택)
# SENTRY_DSN=your-sentry-dsn
```

### 개발 서버 실행

```bash
# 전체 개발 서버 실행 (API + Web)
pnpm dev

# API만 실행
pnpm api:dev

# Web만 실행
pnpm web:dev
```

- **API**: http://localhost:3000
- **Web**: http://localhost:3001
- **Swagger Docs**: http://localhost:3000/docs

### 빌드

```bash
pnpm build
```

### 테스트

```bash
pnpm test
```

## Docker 실행

### 개발 환경

```bash
docker-compose up -d
```

### 프로덕션 환경

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Kubernetes 배포

```bash
# 개발 환경
kubectl apply -k k8s/overlays/development

# 프로덕션 환경
kubectl apply -k k8s/overlays/production
```

## API 엔드포인트

### 인증
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/nonce` | 서명용 nonce 요청 |
| POST | `/api/v1/auth/verify` | 서명 검증 및 JWT 발급 |
| GET | `/api/v1/auth/me` | 현재 사용자 정보 |

### 마켓
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/markets` | 마켓 목록 |
| GET | `/api/v1/markets/:symbol` | 마켓 상세 |
| GET | `/api/v1/markets/:symbol/rounds/current` | 현재 라운드 |

### 베팅
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/bets` | 베팅 생성 |
| GET | `/api/v1/bets` | 내 베팅 목록 |
| POST | `/api/v1/bets/claim` | 당첨금 수령 |

### 헬스체크
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | 전체 헬스체크 |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |
| GET | `/metrics` | Prometheus 메트릭 |

## WebSocket 이벤트

### 구독
```typescript
socket.emit('subscribe:market', { symbol: 'BTC' });
socket.emit('subscribe:round', { roundId: 'uuid' });
```

### 수신 이벤트
- `price:update` - 가격 업데이트
- `round:created` - 새 라운드 생성
- `round:locked` - 라운드 베팅 마감
- `round:settled` - 라운드 정산 완료
- `bet:placed` - 베팅 완료

## 지원 마켓

### 암호화폐 (15분/일간)
- BTC (Bitcoin)
- ETH (Ethereum)

### KOSPI (일간)
- 삼성전자, SK하이닉스, LG에너지솔루션
- 삼성바이오로직스, 현대자동차, 삼성SDI
- 네이버, 기아, LG화학, 카카오

## 스크린샷

### 홈 화면 (다크 모드)
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] PredictX              [⌘K 검색...]  [지갑 연결]     │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ MARKETS  │  가격 예측으로 수익 창출                         │
│ ─────────│                                                  │
│ ₿ BTC    │  ┌──────────────────────────────────────────┐   │
│ Ξ ETH    │  │ Market     Price    24h    Pool   Status │   │
│          │  ├──────────────────────────────────────────┤   │
│ KOSPI    │  │ ₿ BTC      -        50/50  0.00   OPEN   │   │
│ ─────────│  │ Ξ ETH      -        50/50  0.00   WAIT   │   │
│ 삼성전자  │  └──────────────────────────────────────────┘   │
│          │                                                  │
│ ──────── │  [J/K 이동] [Enter 선택]                        │
│ ⚙ 설정   │                                                  │
│ 👤 계정  │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### Command Palette
```
┌─────────────────────────────────────────┐
│ 🔍 마켓 검색, 페이지 이동...        ESC │
├─────────────────────────────────────────┤
│ 페이지                                  │
│   🏠 홈                                 │
│   📊 마켓                               │
│   🕐 기록                               │
│                                         │
│ 마켓                                    │
│   ₿ BTC  Bitcoin                       │
│   Ξ ETH  Ethereum                      │
└─────────────────────────────────────────┘
```

## 라이선스

MIT License
