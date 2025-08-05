import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';

describe('Authentication E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    // Pulisce le tabelle prima di ogni test per garantire l'isolamento
    await dataSource.query(
      'TRUNCATE TABLE "indicators" RESTART IDENTITY CASCADE',
    );
    await dataSource.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    try {
      // Get the enrichment queue instance and close it gracefully
      const queue = app.get<Queue>(getQueueToken('enrichment-queue'));
      await queue.close();
      // Give Redis time to close connections
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn('Failed to close queue:', error.message);
    }
    // Close the app with force flag
    await app.close();
    // Force process exit after timeout
    setTimeout(() => {
      console.warn('Force exiting due to hanging connections');
      process.exit(0);
    }, 1000);
  });

  // =====================================
  // REGISTRATION TESTS (POST /auth/register)
  // =====================================

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'test@cyberforge.com',
        password: 'securepassword123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Verifica che la response contenga i campi attesi
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', registerDto.email);
      expect(response.body).toHaveProperty('role', 'analyst'); // Default role
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('updated_at');

      // Verifica che NON contenga password_hash per sicurezza
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should return 409 when registering user with existing email', async () => {
      const registerDto = {
        email: 'existing@cyberforge.com',
        password: 'password123',
      };

      // Prima registrazione - deve andare a buon fine
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Seconda registrazione con stessa email - deve fallire
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);

      expect(response.body).toHaveProperty(
        'message',
        'Email already registered',
      );
      expect(response.body).toHaveProperty('error', 'Conflict');
      expect(response.body).toHaveProperty('statusCode', 409);
    });

    it('should return 400 when registering with invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'short',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body).toHaveProperty('statusCode', 400);

      // Verifica che ci siano errori di validazione
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('should return 400 when email is missing', async () => {
      const incompleteData = {
        password: 'validpassword123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(incompleteData)
        .expect(400);
    });

    it('should return 400 when password is missing', async () => {
      const incompleteData = {
        email: 'test@cyberforge.com',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(incompleteData)
        .expect(400);
    });
  });

  // =====================================
  // LOGIN TESTS (POST /auth/login)
  // =====================================

  describe('POST /auth/login', () => {
    // Helper function per registrare un utente di test
    const registerTestUser = async (email: string, password: string) => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password })
        .expect(201);
    };

    it('should login successfully with correct credentials', async () => {
      const credentials = {
        email: 'login@cyberforge.com',
        password: 'correctpassword123',
      };

      // Prima registriamo l'utente
      await registerTestUser(credentials.email, credentials.password);

      // Poi facciamo il login
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(200);

      // Verifica che la response contenga il token JWT
      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');
      expect(response.body.accessToken.length).toBeGreaterThan(0);

      // Verifica che il token JWT sia ben formato (tre parti separate da punti)
      const tokenParts = response.body.accessToken.split('.');
      expect(tokenParts).toHaveLength(3);
    });

    it('should return 401 when login with wrong password', async () => {
      const userCredentials = {
        email: 'wrongpass@cyberforge.com',
        password: 'correctpassword123',
      };

      // Registriamo l'utente con la password corretta
      await registerTestUser(userCredentials.email, userCredentials.password);

      // Tentiamo il login con password sbagliata
      const wrongCredentials = {
        email: userCredentials.email,
        password: 'wrongpassword456',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(wrongCredentials)
        .expect(401);

      expect(response.body).toHaveProperty(
        'message',
        'Please check your login credentials',
      );
      expect(response.body).toHaveProperty('error', 'Unauthorized');
      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should return 401 when login with non-existing email', async () => {
      const nonExistingCredentials = {
        email: 'nonexisting@cyberforge.com',
        password: 'anypassword123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(nonExistingCredentials)
        .expect(401);

      expect(response.body).toHaveProperty(
        'message',
        'Please check your login credentials',
      );
      expect(response.body).toHaveProperty('error', 'Unauthorized');
      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should return 400 when login data is invalid', async () => {
      const invalidData = {
        email: 'invalid-email-format',
        password: 'short',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidData)
        .expect(400);
    });
  });

  // =====================================
  // ENDPOINT PROTECTION TESTS
  // =====================================

  describe('Protected Endpoints Security', () => {
    it('should return 401 when accessing protected endpoint without token', async () => {
      // Tentativo di creare un indicatore senza token di autenticazione
      const indicatorData = {
        value: '192.168.1.1',
        type: 'ip',
        threat_level: 'high',
      };

      const response = await request(app.getHttpServer())
        .post('/indicators')
        .send(indicatorData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Unauthorized');
      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should return 401 when accessing protected endpoint with invalid token', async () => {
      const invalidToken = 'invalid.jwt.token';

      const indicatorData = {
        value: 'malicious.com',
        type: 'domain',
        threat_level: 'critical',
      };

      const response = await request(app.getHttpServer())
        .post('/indicators')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send(indicatorData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Unauthorized');
      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should return 401 when accessing protected endpoint with malformed token', async () => {
      const malformedToken = 'this-is-not-a-valid-jwt';

      const response = await request(app.getHttpServer())
        .get('/indicators')
        .set('Authorization', `Bearer ${malformedToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Unauthorized');
      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should return 401 when accessing protected endpoint with expired token', async () => {
      // Token JWT fittizio già scaduto (con exp nel passato)
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJleHAiOjE2MjgwMDAwMDB9.invalid';

      const response = await request(app.getHttpServer())
        .get('/indicators/stats')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should access protected endpoint successfully with valid token', async () => {
      // Registriamo un utente e facciamo login per ottenere un token valido
      const credentials = {
        email: 'validtoken@cyberforge.com',
        password: 'validpassword123',
      };

      // Registrazione
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(credentials)
        .expect(201);

      // Login per ottenere il token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      // Ora accediamo a un endpoint protetto con il token valido
      const response = await request(app.getHttpServer())
        .get('/indicators/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verifica che ricaviamo le statistiche
      expect(response.body).toHaveProperty('newIocs24h');
      expect(response.body).toHaveProperty('criticalAlerts');
      expect(response.body).toHaveProperty('totalActiveIndicators');
    });
  });
});
