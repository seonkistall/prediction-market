# PredictX 배포 진행 상황

## 완료된 작업

### 1. Vercel 프론트엔드 배포 ✅
- **URL**: https://predictx-azure.vercel.app
- **상태**: 정상 작동
- **설정 파일**: `apps/web/vercel.json`

### 2. Railway 설정 ✅
- **GitHub 연동**: 완료
- **PostgreSQL 추가**: 완료
- **도메인 생성**: `prediction-marketcontracts-production.up.railway.app`

### 3. 환경변수 설정 ✅
Railway API 서비스에 설정된 변수:
```
NODE_ENV=production
PORT=3000
DB_TYPE=postgres
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_DATABASE=${{Postgres.PGDATABASE}}
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=predictx-jwt-secret-key-minimum-32-characters
CORS_ORIGINS=https://predictx-azure.vercel.app
```

---

## 진행 중인 작업

### Railway 백엔드 배포 🔄
**문제**: Start command 경로 이슈

**해결 방법**:
1. Railway Settings → Root Directory: `apps/api` 설정
2. `apps/api/railway.json` 파일에 올바른 startCommand 설정됨:
   ```json
   {
     "deploy": {
       "startCommand": "node dist/main.js"
     }
   }
   ```

---

## 다음 단계

1. **Railway Root Directory 설정**
   - Settings → Source/Build → Root Directory: `apps/api`

2. **재배포 후 Healthcheck 확인**
   - `/health/live` 엔드포인트 응답 확인

3. **프론트엔드 API 연결 확인**
   - Vercel 환경변수에 Railway API URL 설정
   - `NEXT_PUBLIC_API_URL=https://prediction-marketcontracts-production.up.railway.app/api/v1`

---

## 배포 URL 요약

| 서비스 | URL | 상태 |
|--------|-----|------|
| Frontend | https://predictx-azure.vercel.app | ✅ 정상 |
| Backend API | https://prediction-marketcontracts-production.up.railway.app | 🔄 배포 중 |
| API Docs | https://prediction-marketcontracts-production.up.railway.app/docs | 🔄 대기 |
| Health Check | https://prediction-marketcontracts-production.up.railway.app/health/live | 🔄 대기 |
