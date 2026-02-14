import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Prediction Market API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testWalletAddress: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    testWalletAddress = '0x1234567890123456789012345678901234567890';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/ (GET) - should return 404 (no root endpoint)', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(404);
    });
  });

  describe('Auth Module', () => {
    describe('POST /api/v1/auth/nonce', () => {
      it('should return nonce for valid wallet address', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/nonce')
          .send({ walletAddress: testWalletAddress })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('nonce');
            expect(res.body.nonce).toHaveLength(32);
          });
      });

      it('should return 400 for invalid wallet address', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/nonce')
          .send({ walletAddress: 'invalid' })
          .expect(400);
      });

      it('should return 400 for missing wallet address', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/nonce')
          .send({})
          .expect(400);
      });
    });

    describe('POST /api/v1/auth/verify', () => {
      it('should return 401 for user without nonce', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/verify')
          .send({
            walletAddress: '0x9999999999999999999999999999999999999999',
            signature: '0xfakesignature',
          })
          .expect(401);
      });
    });

    describe('GET /api/v1/auth/me', () => {
      it('should return 401 without token', () => {
        return request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .expect(401);
      });
    });
  });

  describe('Markets Module', () => {
    describe('GET /api/v1/markets', () => {
      it('should return array of active markets', () => {
        return request(app.getHttpServer())
          .get('/api/v1/markets')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });

      it('should filter markets by category', () => {
        return request(app.getHttpServer())
          .get('/api/v1/markets?category=crypto')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            res.body.forEach((market: any) => {
              expect(market.category).toBe('crypto');
            });
          });
      });
    });

    describe('GET /api/v1/markets/:symbol', () => {
      it('should return 404 for non-existent market', () => {
        return request(app.getHttpServer())
          .get('/api/v1/markets/NONEXISTENT')
          .expect(404);
      });
    });
  });

  describe('Bets Module', () => {
    describe('POST /api/v1/bets', () => {
      it('should return 401 without auth token', () => {
        return request(app.getHttpServer())
          .post('/api/v1/bets')
          .send({
            roundId: 'some-round-id',
            position: 'up',
            amount: '100',
          })
          .expect(401);
      });
    });

    describe('GET /api/v1/bets', () => {
      it('should return 401 without auth token', () => {
        return request(app.getHttpServer())
          .get('/api/v1/bets')
          .expect(401);
      });
    });

    describe('POST /api/v1/bets/claim', () => {
      it('should return 401 without auth token', () => {
        return request(app.getHttpServer())
          .post('/api/v1/bets/claim')
          .send({ betIds: ['bet-1', 'bet-2'] })
          .expect(401);
      });
    });
  });

  describe('Admin Endpoints', () => {
    describe('POST /api/v1/markets', () => {
      it('should return 401 without auth token', () => {
        return request(app.getHttpServer())
          .post('/api/v1/markets')
          .send({
            symbol: 'TEST',
            name: 'Test Market',
            category: 'crypto',
            marketType: '15min',
            minBet: '10',
            maxBet: '1000',
          })
          .expect(401);
      });
    });

    describe('PUT /api/v1/markets/:id', () => {
      it('should return 401 without auth token', () => {
        return request(app.getHttpServer())
          .put('/api/v1/markets/some-id')
          .send({ name: 'Updated Name' })
          .expect(401);
      });
    });
  });

  describe('Validation', () => {
    it('should reject requests with extra properties', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/nonce')
        .send({
          walletAddress: testWalletAddress,
          extraField: 'should be rejected',
        })
        .expect(400);
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format', () => {
      return request(app.getHttpServer())
        .get('/api/v1/markets/NONEXISTENT')
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 404);
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('path');
        });
    });
  });
});
