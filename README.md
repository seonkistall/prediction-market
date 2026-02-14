# PredictX - 예측 마켓

BTC, ETH, KOSPI 가격 움직임을 예측하고 수익을 창출하는 바이너리 예측 마켓 플랫폼입니다.

## 주요 기능

- **15분/일간 라운드**: 짧은 주기의 15분 라운드와 일간 라운드 지원
- **실시간 가격**: Binance API를 통한 실시간 암호화폐 가격 제공
- **Web3 지갑 연동**: RainbowKit을 통한 MetaMask, WalletConnect 등 지원
- **WebSocket 실시간 업데이트**: 라운드 상태, 가격 변동 실시간 알림
- **Prometheus 메트릭**: 프로덕션 모니터링을 위한 메트릭 엔드포인트

## 기술 스택

### Backend (API)
- **Framework**: NestJS
- **Database**: PostgreSQL (production) / SQLite (development)
- **ORM**: TypeORM
- **Authentication**: JWT + Web3 서명 검증
- **Cache**: Redis (optional)
- **Monitoring**: Prometheus, Sentry

### Frontend (Web)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Web3**: wagmi, viem, RainbowKit
- **State**: TanStack Query

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
│   │   │   ├── components/  # React 컴포넌트
│   │   │   ├── contexts/    # React Context (WebSocket 등)
│   │   │   ├── hooks/       # Custom Hooks
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

## 라이선스

MIT License
