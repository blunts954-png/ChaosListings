import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/common/services/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user and agency', async () => {
        const email = `test-${Date.now()}@test.com`;
        const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'password',
          agencyName: 'Test Agency',
          agencySlug: `test-agency-${Date.now()}`,
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toEqual(email);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login an existing user', async () => {
        const email = `test-${Date.now()}@test.com`;
        const password = 'password';
        
        // First register a user
        await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password,
          agencyName: 'Test Agency',
          agencySlug: `test-agency-${Date.now()}`,
        });

        const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toEqual(email);
    });
  });
});
