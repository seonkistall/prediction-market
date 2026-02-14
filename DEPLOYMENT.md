# PredictX 배포 가이드

## 1. 프론트엔드 배포 (Vercel)

### 단계별 가이드

1. **Vercel 접속**: https://vercel.com 에서 GitHub 로그인

2. **프로젝트 Import**:
   - "Add New Project" 클릭
   - GitHub 저장소 `seonkistall/prediction-market` 선택

3. **빌드 설정**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web` 입력
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`

4. **환경 변수 설정**:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.railway.app/api/v1
   NEXT_PUBLIC_WS_URL=https://your-api.railway.app
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id
   NEXT_PUBLIC_CHAIN_ID=11155111
   ```

5. **Deploy** 클릭

---

## 2. 백엔드 배포 (Railway)

### 단계별 가이드

1. **Railway 접속**: https://railway.app 에서 GitHub 로그인

2. **새 프로젝트 생성**:
   - "New Project" → "Deploy from GitHub repo"
   - `seonkistall/prediction-market` 선택

3. **PostgreSQL 추가**:
   - "+ New" → "Database" → "PostgreSQL"
   - 자동으로 `DATABASE_URL` 환경변수가 추가됨

4. **Redis 추가** (선택):
   - "+ New" → "Database" → "Redis"
   - 자동으로 `REDIS_URL` 환경변수가 추가됨

5. **API 서비스 설정**:
   - GitHub 저장소 클릭 → "Settings"
   - **Root Directory**: `apps/api`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `node dist/main.js`

6. **환경 변수 설정**:
   ```
   NODE_ENV=production
   PORT=3000
   DB_TYPE=postgres
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_USERNAME=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   DB_DATABASE=${{Postgres.PGDATABASE}}
   JWT_SECRET=your-secure-jwt-secret-minimum-32-characters-long
   CORS_ORIGINS=https://your-vercel-app.vercel.app
   ```

7. **도메인 생성**:
   - "Settings" → "Networking" → "Generate Domain"

---

## 3. 환경 변수 체크리스트

### Vercel (Frontend)
| 변수 | 설명 | 예시 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | API 서버 URL | `https://api.predictx.app/api/v1` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `https://api.predictx.app` |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect ID | `abc123...` |
| `NEXT_PUBLIC_CHAIN_ID` | 체인 ID | `11155111` (Sepolia) |

### Railway (Backend)
| 변수 | 설명 | 필수 |
|------|------|------|
| `NODE_ENV` | 환경 | Yes |
| `PORT` | 포트 | Yes |
| `DB_TYPE` | postgres | Yes |
| `DB_HOST` | DB 호스트 | Yes |
| `DB_PORT` | DB 포트 | Yes |
| `DB_USERNAME` | DB 사용자 | Yes |
| `DB_PASSWORD` | DB 비밀번호 | Yes |
| `DB_DATABASE` | DB 이름 | Yes |
| `JWT_SECRET` | JWT 시크릿 (32자+) | Yes |
| `CORS_ORIGINS` | 허용 도메인 | Yes |
| `REDIS_HOST` | Redis 호스트 | Optional |
| `REDIS_PORT` | Redis 포트 | Optional |
| `REDIS_PASSWORD` | Redis 비밀번호 | Optional |

---

## 4. 배포 후 확인

1. **Frontend Health**:
   - `https://your-app.vercel.app` 접속
   - UI가 정상 로드되는지 확인

2. **Backend Health**:
   - `https://your-api.railway.app/health` 접속
   - `{"status":"ok"}` 응답 확인

3. **API Docs**:
   - `https://your-api.railway.app/docs` 에서 Swagger UI 확인

---

## 5. 커스텀 도메인 (선택)

### Vercel
1. Project Settings → Domains
2. 도메인 추가 (예: `predictx.app`)
3. DNS 설정: CNAME → `cname.vercel-dns.com`

### Railway
1. Settings → Networking → Custom Domain
2. 도메인 추가 (예: `api.predictx.app`)
3. DNS 설정: CNAME → Railway 제공 값

---

## 빠른 시작 (1-Click Deploy)

### Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/seonkistall/prediction-market&root-directory=apps/web)

### Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/prediction-market)
