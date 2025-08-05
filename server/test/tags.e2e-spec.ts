import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Tags E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.enableShutdownHooks();

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    // Pulisce le tabelle prima di ogni test per garantire l'isolamento
    await dataSource.query('TRUNCATE TABLE "tags" RESTART IDENTITY CASCADE');
    await dataSource.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');

    // Crea un utente e ottiene il token di accesso per ogni test
    const credentials = {
      email: 'test@cyberforge.com',
      password: 'testpassword123',
    };

    // Registrazione utente
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(credentials);

    // Login per ottenere il token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(200);

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /tags', () => {
    it('should create a new tag successfully', async () => {
      const tagName = 'APT28';
      return request(app.getHttpServer())
        .post('/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: tagName })
        .expect(201)
        .then((res) => {
          expect(res.body).toEqual({
            id: expect.any(String),
            name: tagName,
          });
        });
    });

    it('should return 409 Conflict if tag name already exists', async () => {
      const tagName = 'APT28';
      // Crea il tag la prima volta
      await request(app.getHttpServer())
        .post('/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: tagName });

      // Prova a crearlo di nuovo
      return request(app.getHttpServer())
        .post('/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: tagName })
        .expect(409);
    });

    it('should return 400 Bad Request for invalid data', async () => {
      return request(app.getHttpServer())
        .post('/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '' })
        .expect(400);
    });

    it('should return 401 Unauthorized without token', async () => {
      return request(app.getHttpServer())
        .post('/tags')
        .send({ name: 'APT28' })
        .expect(401);
    });
  });

  describe('GET /tags', () => {
    it('should return an empty array when no tags exist', async () => {
      return request(app.getHttpServer())
        .get('/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body.length).toBe(0);
        });
    });

    it('should return an array of tags', async () => {
      // Crea alcuni tag
      await request(app.getHttpServer())
        .post('/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'APT28' });
      await request(app.getHttpServer())
        .post('/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Phishing' });

      return request(app.getHttpServer())
        .get('/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body.length).toBe(2);
          expect(res.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ name: 'APT28' }),
              expect.objectContaining({ name: 'Phishing' }),
            ])
          );
        });
    });

    it('should return 401 Unauthorized without token', async () => {
      return request(app.getHttpServer())
        .get('/tags')
        .expect(401);
    });
  });
});