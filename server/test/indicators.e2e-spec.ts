import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Indicators E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    // Pulisce le tabelle prima di ogni test per garantire l'isolamento
    await dataSource.query('TRUNCATE TABLE "indicators" RESTART IDENTITY CASCADE');
    await dataSource.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');

    // Crea un utente e ottiene il token di accesso per ogni test
    const credentials = {
      email: 'test@cyberforge.com',
      password: 'testpassword123'
    };

    // Registrazione utente
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(credentials)
      .expect(201);

    // Login per ottenere il token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(200);

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // =====================================
  // INDICATORS CREATION TESTS (POST /indicators)
  // =====================================

  describe('POST /indicators', () => {
    it('should create a new indicator successfully with valid data', async () => {
      const indicatorData = {
        value: '192.168.1.1',
        type: 'ip',
        threat_level: 'high'
      };

      const response = await request(app.getHttpServer())
        .post('/indicators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(indicatorData)
        .expect(201);

      // Verifica che la response contenga i campi attesi
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('value', indicatorData.value);
      expect(response.body).toHaveProperty('type', indicatorData.type);
      expect(response.body).toHaveProperty('threat_level', indicatorData.threat_level);
      expect(response.body).toHaveProperty('is_active', true);
      expect(response.body).toHaveProperty('first_seen');
      expect(response.body).toHaveProperty('last_seen');
      
      // Verifica che la relazione created_by sia popolata
      expect(response.body).toHaveProperty('created_by');
      expect(response.body.created_by).toHaveProperty('id');
      expect(response.body.created_by).toHaveProperty('email', 'test@cyberforge.com');
      expect(response.body.created_by).toHaveProperty('role', 'analyst');
    });

    it('should create indicator with different types and threat levels', async () => {
      const testCases = [
        { value: 'malicious.com', type: 'domain', threat_level: 'critical' },
        { value: 'https://malicious.com/path', type: 'url', threat_level: 'medium' },
        { value: 'sha256:abcd1234...', type: 'file_hash', threat_level: 'low' },
        { value: 'attacker@evil.com', type: 'email', threat_level: 'high' }
      ];

      for (const indicatorData of testCases) {
        const response = await request(app.getHttpServer())
          .post('/indicators')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(indicatorData)
          .expect(201);

        expect(response.body.value).toBe(indicatorData.value);
        expect(response.body.type).toBe(indicatorData.type);
        expect(response.body.threat_level).toBe(indicatorData.threat_level);
      }
    });

    it('should return 400 when creating indicator with invalid type', async () => {
      const invalidData = {
        value: '192.168.1.1',
        type: 'invalid_type',
        threat_level: 'high'
      };

      const response = await request(app.getHttpServer())
        .post('/indicators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('should return 400 when creating indicator with invalid threat_level', async () => {
      const invalidData = {
        value: '192.168.1.1',
        type: 'ip',
        threat_level: 'invalid_level'
      };

      const response = await request(app.getHttpServer())
        .post('/indicators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 when value is empty or missing', async () => {
      const invalidData = {
        value: '',
        type: 'ip',
        threat_level: 'high'
      };

      await request(app.getHttpServer())
        .post('/indicators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData)
        .expect(400);

      // Test con value completamente mancante
      const missingValueData = {
        type: 'ip',
        threat_level: 'high'
      };

      await request(app.getHttpServer())
        .post('/indicators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(missingValueData)
        .expect(400);
    });

    it('should return 401 when creating indicator without authentication token', async () => {
      const indicatorData = {
        value: '192.168.1.1',
        type: 'ip',
        threat_level: 'high'
      };

      const response = await request(app.getHttpServer())
        .post('/indicators')
        .send(indicatorData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Unauthorized');
      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should return 401 when creating indicator with invalid token', async () => {
      const indicatorData = {
        value: '192.168.1.1',
        type: 'ip',
        threat_level: 'high'
      };

      const response = await request(app.getHttpServer())
        .post('/indicators')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .send(indicatorData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Unauthorized');
      expect(response.body).toHaveProperty('statusCode', 401);
    });
  });

  // =====================================
  // INDICATORS READING TESTS (GET /indicators)
  // =====================================

  describe('GET /indicators', () => {
    it('should return empty list when no indicators exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/indicators')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total', 0);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return list of indicators when they exist', async () => {
      // Crea alcuni indicatori di test
      const testIndicators = [
        { value: '192.168.1.1', type: 'ip', threat_level: 'high' },
        { value: 'malicious.com', type: 'domain', threat_level: 'critical' },
        { value: 'attacker@evil.com', type: 'email', threat_level: 'medium' }
      ];

      // Crea gli indicatori
      for (const indicatorData of testIndicators) {
        await request(app.getHttpServer())
          .post('/indicators')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(indicatorData)
          .expect(201);
      }

      // Richiedi la lista
      const response = await request(app.getHttpServer())
        .get('/indicators')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total', 3);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(3);

      // Verifica che ogni indicatore abbia i campi necessari
      response.body.data.forEach((indicator: any) => {
        expect(indicator).toHaveProperty('id');
        expect(indicator).toHaveProperty('value');
        expect(indicator).toHaveProperty('type');
        expect(indicator).toHaveProperty('threat_level');
        expect(indicator).toHaveProperty('is_active', true);
        expect(indicator).toHaveProperty('created_by');
        expect(indicator.created_by).toHaveProperty('email');
      });
    });

    it('should support pagination with page and limit parameters', async () => {
      // Crea 5 indicatori di test
      for (let i = 1; i <= 5; i++) {
        await request(app.getHttpServer())
          .post('/indicators')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            value: `192.168.1.${i}`,
            type: 'ip',
            threat_level: 'medium'
          })
          .expect(201);
      }

      // Testa la paginazione - pagina 1 con limite 3
      const page1Response = await request(app.getHttpServer())
        .get('/indicators?page=1&limit=3')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(page1Response.body.data).toHaveLength(3);
      expect(page1Response.body.total).toBe(5);

      // Testa la paginazione - pagina 2 con limite 3
      const page2Response = await request(app.getHttpServer())
        .get('/indicators?page=2&limit=3')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(page2Response.body.data).toHaveLength(2);
      expect(page2Response.body.total).toBe(5);
    });

    it('should support filtering by type', async () => {
      // Crea indicatori di diversi tipi
      const testIndicators = [
        { value: '192.168.1.1', type: 'ip', threat_level: 'high' },
        { value: '192.168.1.2', type: 'ip', threat_level: 'medium' },
        { value: 'malicious.com', type: 'domain', threat_level: 'critical' },
        { value: 'evil.com', type: 'domain', threat_level: 'high' }
      ];

      for (const indicatorData of testIndicators) {
        await request(app.getHttpServer())
          .post('/indicators')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(indicatorData)
          .expect(201);
      }

      // Filtra solo gli IP
      const ipResponse = await request(app.getHttpServer())
        .get('/indicators?type=ip')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(ipResponse.body.data).toHaveLength(2);
      expect(ipResponse.body.total).toBe(2);
      ipResponse.body.data.forEach((indicator: any) => {
        expect(indicator.type).toBe('ip');
      });

      // Filtra solo i domini
      const domainResponse = await request(app.getHttpServer())
        .get('/indicators?type=domain')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(domainResponse.body.data).toHaveLength(2);
      expect(domainResponse.body.total).toBe(2);
      domainResponse.body.data.forEach((indicator: any) => {
        expect(indicator.type).toBe('domain');
      });
    });

    it('should support filtering by threat_level', async () => {
      // Crea indicatori con diversi livelli di minaccia
      const testIndicators = [
        { value: '192.168.1.1', type: 'ip', threat_level: 'critical' },
        { value: '192.168.1.2', type: 'ip', threat_level: 'critical' },
        { value: 'malicious.com', type: 'domain', threat_level: 'high' },
        { value: 'suspicious.com', type: 'domain', threat_level: 'medium' }
      ];

      for (const indicatorData of testIndicators) {
        await request(app.getHttpServer())
          .post('/indicators')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(indicatorData)
          .expect(201);
      }

      // Filtra solo quelli critici
      const criticalResponse = await request(app.getHttpServer())
        .get('/indicators?threat_level=critical')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(criticalResponse.body.data).toHaveLength(2);
      expect(criticalResponse.body.total).toBe(2);
      criticalResponse.body.data.forEach((indicator: any) => {
        expect(indicator.threat_level).toBe('critical');
      });
    });

    it('should return 401 when accessing indicators without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/indicators')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Unauthorized');
      expect(response.body).toHaveProperty('statusCode', 401);
    });
  });

  // =====================================
  // SINGLE INDICATOR READING TESTS (GET /indicators/:id)
  // =====================================

  describe('GET /indicators/:id', () => {
    it('should return specific indicator by id', async () => {
      // Crea un indicatore
      const indicatorData = {
        value: 'malicious.com',
        type: 'domain',
        threat_level: 'critical'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/indicators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(indicatorData)
        .expect(201);

      const indicatorId = createResponse.body.id;

      // Richiedi l'indicatore specifico
      const response = await request(app.getHttpServer())
        .get(`/indicators/${indicatorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', indicatorId);
      expect(response.body).toHaveProperty('value', indicatorData.value);
      expect(response.body).toHaveProperty('type', indicatorData.type);
      expect(response.body).toHaveProperty('threat_level', indicatorData.threat_level);
      expect(response.body).toHaveProperty('is_active', true);
      expect(response.body).toHaveProperty('created_by');
    });

    it('should return 404 when indicator does not exist', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .get(`/indicators/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('statusCode', 404);
    });

    it('should return 401 when accessing specific indicator without authentication', async () => {
      const indicatorId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .get(`/indicators/${indicatorId}`)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Unauthorized');
      expect(response.body).toHaveProperty('statusCode', 401);
    });
  });

  // =====================================
  // INDICATORS UPDATE TESTS (PATCH /indicators/:id)
  // =====================================

  describe('PATCH /indicators/:id', () => {
    it('should update indicator successfully with valid data', async () => {
      // Crea un indicatore
      const originalData = {
        value: '192.168.1.1',
        type: 'ip',
        threat_level: 'medium'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/indicators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(originalData)
        .expect(201);

      const indicatorId = createResponse.body.id;

      // Aggiorna l'indicatore
      const updateData = {
        threat_level: 'critical',
        value: '192.168.1.100'
      };

      const response = await request(app.getHttpServer())
        .patch(`/indicators/${indicatorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id', indicatorId);
      expect(response.body).toHaveProperty('value', updateData.value);
      expect(response.body).toHaveProperty('type', originalData.type); // Non modificato
      expect(response.body).toHaveProperty('threat_level', updateData.threat_level);
      expect(response.body).toHaveProperty('is_active', true);
    });

    it('should update individual fields independently', async () => {
      // Crea un indicatore
      const originalData = {
        value: 'suspicious.com',
        type: 'domain',
        threat_level: 'low'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/indicators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(originalData)
        .expect(201);

      const indicatorId = createResponse.body.id;

      // Aggiorna solo il threat_level
      const updateData = { threat_level: 'high' };

      const response = await request(app.getHttpServer())
        .patch(`/indicators/${indicatorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.threat_level).toBe('high');
      expect(response.body.value).toBe(originalData.value); // Invariato
      expect(response.body.type).toBe(originalData.type); // Invariato
    });

    it('should return 404 when updating non-existent indicator', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = { threat_level: 'high' };

      const response = await request(app.getHttpServer())
        .patch(`/indicators/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('statusCode', 404);
    });

    it('should return 400 when updating with invalid data', async () => {
      // Crea un indicatore
      const createResponse = await request(app.getHttpServer())
        .post('/indicators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          value: '192.168.1.1',
          type: 'ip',
          threat_level: 'medium'
        })
        .expect(201);

      const indicatorId = createResponse.body.id;

      // Tenta aggiornamento con dati invalidi
      const invalidUpdateData = {
        threat_level: 'invalid_level',
        type: 'invalid_type'
      };

      const response = await request(app.getHttpServer())
        .patch(`/indicators/${indicatorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 401 when updating indicator without authentication', async () => {
      const indicatorId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = { threat_level: 'high' };

      const response = await request(app.getHttpServer())
        .patch(`/indicators/${indicatorId}`)
        .send(updateData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Unauthorized');
      expect(response.body).toHaveProperty('statusCode', 401);
    });
  });

  // =====================================
  // INDICATORS DELETION TESTS (DELETE /indicators/:id)
  // =====================================

  describe('DELETE /indicators/:id', () => {
    it('should soft delete indicator successfully', async () => {
      // Crea un indicatore
      const indicatorData = {
        value: 'tobedeteted.com',
        type: 'domain',
        threat_level: 'high'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/indicators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(indicatorData)
        .expect(201);

      const indicatorId = createResponse.body.id;

      // Elimina l'indicatore (soft delete)
      await request(app.getHttpServer())
        .delete(`/indicators/${indicatorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verifica che l'indicatore non sia più recuperabile tramite GET
      const response = await request(app.getHttpServer())
        .get(`/indicators/${indicatorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('statusCode', 404);
    });

    it('should not include soft deleted indicators in list', async () => {
      // Crea due indicatori
      const indicator1Data = {
        value: '192.168.1.1',
        type: 'ip',
        threat_level: 'high'
      };

      const indicator2Data = {
        value: '192.168.1.2',
        type: 'ip',
        threat_level: 'medium'
      };

      const create1Response = await request(app.getHttpServer())
        .post('/indicators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(indicator1Data)
        .expect(201);

      await request(app.getHttpServer())
        .post('/indicators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(indicator2Data)
        .expect(201);

      // Verifica che ci siano 2 indicatori
      const beforeDeleteResponse = await request(app.getHttpServer())
        .get('/indicators')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(beforeDeleteResponse.body.total).toBe(2);

      // Elimina un indicatore
      await request(app.getHttpServer())
        .delete(`/indicators/${create1Response.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verifica che ora ce ne sia solo 1
      const afterDeleteResponse = await request(app.getHttpServer())
        .get('/indicators')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(afterDeleteResponse.body.total).toBe(1);
      expect(afterDeleteResponse.body.data).toHaveLength(1);
      expect(afterDeleteResponse.body.data[0].value).toBe(indicator2Data.value);
    });

    it('should return 404 when deleting non-existent indicator', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .delete(`/indicators/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('statusCode', 404);
    });

    it('should return 401 when deleting indicator without authentication', async () => {
      const indicatorId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .delete(`/indicators/${indicatorId}`)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Unauthorized');
      expect(response.body).toHaveProperty('statusCode', 401);
    });
  });

  // =====================================
  // INDICATORS STATS ENDPOINT TESTS (GET /indicators/stats)
  // =====================================

  describe('GET /indicators/stats', () => {
    it('should return dashboard statistics', async () => {
      // Crea alcuni indicatori per testare le statistiche
      const testIndicators = [
        { value: '192.168.1.1', type: 'ip', threat_level: 'critical' },
        { value: '192.168.1.2', type: 'ip', threat_level: 'critical' },
        { value: 'malicious.com', type: 'domain', threat_level: 'high' },
        { value: 'suspicious.com', type: 'domain', threat_level: 'medium' }
      ];

      for (const indicatorData of testIndicators) {
        await request(app.getHttpServer())
          .post('/indicators')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(indicatorData)
          .expect(201);
      }

      const response = await request(app.getHttpServer())
        .get('/indicators/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verifica che la response contenga tutte le statistiche attese
      expect(response.body).toHaveProperty('newIocs24h');
      expect(response.body).toHaveProperty('criticalAlerts');
      expect(response.body).toHaveProperty('totalActiveIndicators');
      expect(response.body).toHaveProperty('activeInvestigations');
      expect(response.body).toHaveProperty('dataFeeds');

      // Verifica che i numeri siano corretti
      expect(response.body.newIocs24h).toBe(4); // Tutti creati nelle ultime 24h
      expect(response.body.criticalAlerts).toBe(2); // Due indicatori critical
      expect(response.body.totalActiveIndicators).toBe(4); // Tutti attivi
      expect(typeof response.body.activeInvestigations).toBe('number');
      expect(typeof response.body.dataFeeds).toBe('number');
    });

    it('should return correct stats when no indicators exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/indicators/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.newIocs24h).toBe(0);
      expect(response.body.criticalAlerts).toBe(0);
      expect(response.body.totalActiveIndicators).toBe(0);
    });

    it('should return 401 when accessing stats without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/indicators/stats')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Unauthorized');
      expect(response.body).toHaveProperty('statusCode', 401);
    });
  });
});