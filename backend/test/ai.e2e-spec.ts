import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/services/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { Role } from '@prisma/client';
import { GeminiService } from '../src/common/services/gemini.service';

describe('AIController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let geminiService: GeminiService;
  let token: string;
  let businessId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(GeminiService)
    .useValue({
        generateContent: jest.fn().mockResolvedValue(JSON.stringify([
            {
                field: 'Business Name',
                currentValue: 'Test Business',
                suggestedValue: 'Test Business - Now with AI!',
                reasoning: 'Because AI is cool.'
            }
        ]))
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    authService = app.get<AuthService>(AuthService);
    geminiService = app.get<GeminiService>(GeminiService);

    // Clean up database
    await prisma.business.deleteMany();
    await prisma.agencyMember.deleteMany();
    await prisma.user.deleteMany();
    await prisma.agency.deleteMany();

    // Create test data
    const agency = await prisma.agency.create({ data: { name: 'Test Agency', slug: 'test-agency' } });
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: await authService.hashPassword('password'),
        role: Role.AGENCY_OWNER,
        agencyId: agency.id,
      },
    });
    
    await prisma.agencyMember.create({
        data: {
            agencyId: agency.id,
            userId: user.id,
            role: Role.AGENCY_OWNER,
        }
    });

    const business = await prisma.business.create({
        data: {
            name: 'Test Business',
            address: '123 Test St',
            phone: '555-1234',
            website: 'test.com',
            agencyId: agency.id,
            ownerId: user.id,
        }
    });
    businessId = business.id;

    // Get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /ai/suggestions/business/:businessId', () => {
    it('should return AI-generated suggestions for a business', () => {
      return request(app.getHttpServer())
        .post(`/ai/suggestions/business/${businessId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201)
        .then(response => {
          expect(response.body).toBeInstanceOf(Array);
          expect(response.body.length).toBe(1);
          expect(response.body[0].field).toBe('Business Name');
          expect(geminiService.generateContent).toHaveBeenCalled();
        });
    });

    it('should return 401 for unauthenticated users', () => {
        return request(app.getHttpServer())
            .post(`/ai/suggestions/business/${businessId}`)
            .expect(401);
    });

    it('should return 404 for a business that does not exist', () => {
        return request(app.getHttpServer())
            .post(`/ai/suggestions/business/cl_invalid_id`)
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });
  });
});
