import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/common/services/prisma.service';

describe('BusinessesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let agencyId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // Register and login a user to get an access token
    const email = `test-business-${Date.now()}@test.com`;
    const password = 'password';
    
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
        agencyName: 'Business Test Agency',
        agencySlug: `business-test-agency-${Date.now()}`,
      });
    
    accessToken = registerResponse.body.accessToken;
    agencyId = registerResponse.body.user.agency.id;
  });

  afterAll(async () => {
    // Clean up the created agency and user
    await prisma.agency.delete({ where: { id: agencyId } });
    await app.close();
  });

  describe('/businesses (POST)', () => {
    it('should create a new business', async () => {
      const response = await request(app.getHttpServer())
        .post('/businesses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Business',
          address: '123 Test St',
        })
        .expect(201);

      expect(response.body.name).toEqual('Test Business');
    });
  });

  describe('/businesses (GET)', () => {
    it('should get all businesses for the agency', async () => {
      const response = await request(app.getHttpServer())
        .get('/businesses')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

});
