// server/test/enrichment.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import nock from 'nock';
import { Indicator } from '../src/indicators/entities/indicator.entity';
import { User } from '../src/auth/entities/user.entity';
import { EnrichmentProcessor } from '../src/enrichment/enrichment.processor';

describe('Enrichment Processor E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let enrichmentProcessor: EnrichmentProcessor;

  // Test data
  const MOCK_IP = '1.2.3.4';
  const MOCK_ABUSEIPDB_RESPONSE = {
    data: {
      ipAddress: MOCK_IP,
      abuseConfidenceScore: 95,
      countryCode: 'US',
      isp: 'Cloudflare, Inc.',
      domain: 'example.com',
      latitude: 37.7749,
      longitude: -122.4194,
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Abilita gli hooks per una chiusura pulita
    app.enableShutdownHooks();

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    // Get the enrichment processor instance from the dependency container
    enrichmentProcessor = app.get<EnrichmentProcessor>(EnrichmentProcessor);
  });

  beforeEach(async () => {
    // Clean the database before each test to ensure isolation
    await dataSource.query(
      'TRUNCATE TABLE "indicators" RESTART IDENTITY CASCADE',
    );
    await dataSource.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');

    // Configure nock mock before each test
    nock('https://api.abuseipdb.com')
      .get('/api/v2/check')
      .query(true) // Accept any query parameters
      .reply(200, MOCK_ABUSEIPDB_RESPONSE);
  });

  afterEach(() => {
    nock.cleanAll(); // Clean all mocks after each test
  });

  afterAll(async () => {
    await app.close();
  });

  // =====================================
  // ENRICHMENT PROCESSOR TESTS
  // =====================================

  it('should process an enrichment job, call AbuseIPDB, and update the indicator', async () => {
    // 1. SETUP: Create a user and an IP indicator in the database
    const userRepo = dataSource.getRepository(User);
    const testUser = await userRepo.save({
      email: 'test@user.com',
      password_hash: 'hash',
      role: 'analyst',
    });

    const indicatorRepo = dataSource.getRepository(Indicator);
    const testIndicator = await indicatorRepo.save({
      value: MOCK_IP,
      type: 'ip',
      threat_level: 'medium',
      is_active: true,
      first_seen: new Date(),
      last_seen: new Date(),
      created_by: testUser,
    });

    // Verify initial state - no enrichment data
    expect(testIndicator.abuse_score).toBeNull();
    expect(testIndicator.country_code).toBeNull();
    expect(testIndicator.isp).toBeNull();
    expect(testIndicator.latitude).toBeNull();
    expect(testIndicator.longitude).toBeNull();

    // 2. ACTION: Set up environment for testing and create mock job
    // Ensure API key is available for the processor
    process.env.ABUSEIPDB_API_KEY = 'test-api-key-for-integration-test';
    
    const mockJob = {
      data: {
        indicatorId: testIndicator.id,
        ipAddress: testIndicator.value,
      },
    };

    // 3. EXECUTE: Call the enrichment processor directly
    // @ts-ignore - Ignore the complete Job type for simplicity in testing
    await enrichmentProcessor.handleIpEnrichment(mockJob);

    // 4. ASSERTION: Verify that the indicator has been updated in the database
    const updatedIndicator = await indicatorRepo.findOneBy({
      id: testIndicator.id,
    });

    expect(updatedIndicator).toBeDefined();
    expect(updatedIndicator.abuse_score).toEqual(
      MOCK_ABUSEIPDB_RESPONSE.data.abuseConfidenceScore,
    );
    expect(updatedIndicator.country_code).toEqual(
      MOCK_ABUSEIPDB_RESPONSE.data.countryCode,
    );
    expect(updatedIndicator.isp).toEqual(MOCK_ABUSEIPDB_RESPONSE.data.isp);
    expect(updatedIndicator.domain_usage).toEqual(
      MOCK_ABUSEIPDB_RESPONSE.data.domain,
    );
    expect(Number(updatedIndicator.latitude)).toBeCloseTo(
      MOCK_ABUSEIPDB_RESPONSE.data.latitude,
    );
    expect(Number(updatedIndicator.longitude)).toBeCloseTo(
      MOCK_ABUSEIPDB_RESPONSE.data.longitude,
    );
  });

  it('should handle enrichment job with missing geolocation data', async () => {
    // Mock response without latitude/longitude
    const MOCK_RESPONSE_NO_GEO = {
      data: {
        ipAddress: '8.8.8.8',
        abuseConfidenceScore: 0,
        countryCode: 'US',
        isp: 'Google LLC',
        domain: 'google.com',
        // No latitude/longitude provided
      },
    };

    // Override the default nock mock for this test
    nock.cleanAll();
    nock('https://api.abuseipdb.com')
      .get('/api/v2/check')
      .query(true)
      .reply(200, MOCK_RESPONSE_NO_GEO);

    // Setup test data
    const userRepo = dataSource.getRepository(User);
    const testUser = await userRepo.save({
      email: 'test@user.com',
      password_hash: 'hash',
      role: 'analyst',
    });

    const indicatorRepo = dataSource.getRepository(Indicator);
    const testIndicator = await indicatorRepo.save({
      value: '8.8.8.8',
      type: 'ip',
      threat_level: 'low',
      is_active: true,
      first_seen: new Date(),
      last_seen: new Date(),
      created_by: testUser,
    });

    // Process the enrichment directly
    // Ensure API key is available for the processor
    process.env.ABUSEIPDB_API_KEY = 'test-api-key-for-integration-test';
    
    const mockJob = {
      data: {
        indicatorId: testIndicator.id,
        ipAddress: testIndicator.value,
      },
    };

    // @ts-ignore - Ignore the complete Job type for simplicity in testing
    await enrichmentProcessor.handleIpEnrichment(mockJob);

    // Verify enrichment data was saved (without geolocation)
    const updatedIndicator = await indicatorRepo.findOneBy({
      id: testIndicator.id,
    });

    expect(updatedIndicator.abuse_score).toEqual(0);
    expect(updatedIndicator.country_code).toEqual('US');
    expect(updatedIndicator.isp).toEqual('Google LLC');
    expect(updatedIndicator.domain_usage).toEqual('google.com');
    expect(updatedIndicator.latitude).toBeNull();
    expect(updatedIndicator.longitude).toBeNull();
  });

  it('should handle API errors gracefully and mark job as failed', async () => {
    // Override nock to simulate API error
    nock.cleanAll();
    nock('https://api.abuseipdb.com')
      .get('/api/v2/check')
      .query(true)
      .reply(429, { error: 'Rate limit exceeded' }); // 429 Too Many Requests

    // Setup test data
    const userRepo = dataSource.getRepository(User);
    const testUser = await userRepo.save({
      email: 'test@user.com',
      password_hash: 'hash',
      role: 'analyst',
    });

    const indicatorRepo = dataSource.getRepository(Indicator);
    const testIndicator = await indicatorRepo.save({
      value: '192.168.1.1',
      type: 'ip',
      threat_level: 'medium',
      is_active: true,
      first_seen: new Date(),
      last_seen: new Date(),
      created_by: testUser,
    });

    // Process the enrichment directly - this should throw an error
    // Ensure API key is available for the processor
    process.env.ABUSEIPDB_API_KEY = 'test-api-key-for-integration-test';
    
    const mockJob = {
      data: {
        indicatorId: testIndicator.id,
        ipAddress: testIndicator.value,
      },
    };

    // Expect the processor to throw an error due to API failure
    try {
      // @ts-ignore - Ignore the complete Job type for simplicity in testing
      await enrichmentProcessor.handleIpEnrichment(mockJob);
      fail('Processor should have thrown an error');
    } catch (error) {
      // Error thrown as expected
      expect(error).toBeDefined();
    }

    // Verify that the indicator was NOT updated (no enrichment data)
    const unchangedIndicator = await indicatorRepo.findOneBy({
      id: testIndicator.id,
    });

    expect(unchangedIndicator.abuse_score).toBeNull();
    expect(unchangedIndicator.country_code).toBeNull();
    expect(unchangedIndicator.isp).toBeNull();
    expect(unchangedIndicator.latitude).toBeNull();
    expect(unchangedIndicator.longitude).toBeNull();
  });

  it('should handle multiple jobs processing in sequence', async () => {
    const TEST_IPS = ['1.1.1.1', '8.8.8.8', '9.9.9.9'];
    const userRepo = dataSource.getRepository(User);
    const indicatorRepo = dataSource.getRepository(Indicator);

    // Create test user
    const testUser = await userRepo.save({
      email: 'test@user.com',
      password_hash: 'hash',
      role: 'analyst',
    });

    // Create test indicators
    const testIndicators = [];
    for (let i = 0; i < TEST_IPS.length; i++) {
      const indicator = await indicatorRepo.save({
        value: TEST_IPS[i],
        type: 'ip',
        threat_level: 'medium',
        is_active: true,
        first_seen: new Date(),
        last_seen: new Date(),
        created_by: testUser,
      });
      testIndicators.push(indicator);
    }

    // Override nock to handle multiple requests
    nock.cleanAll();
    TEST_IPS.forEach((ip, index) => {
      nock('https://api.abuseipdb.com')
        .get('/api/v2/check')
        .query(true)
        .reply(200, {
          data: {
            ipAddress: ip,
            abuseConfidenceScore: (index + 1) * 25, // Different scores for each
            countryCode: ['US', 'UK', 'DE'][index],
            isp: `ISP ${index + 1}`,
            domain: `domain${index + 1}.com`,
            latitude: 40.0 + index,
            longitude: -74.0 - index,
          },
        });
    });

    // Process all enrichments directly
    // Ensure API key is available for the processor
    process.env.ABUSEIPDB_API_KEY = 'test-api-key-for-integration-test';
    
    for (let i = 0; i < testIndicators.length; i++) {
      const mockJob = {
        data: {
          indicatorId: testIndicators[i].id,
          ipAddress: testIndicators[i].value,
        },
      };
      
      // @ts-ignore - Ignore the complete Job type for simplicity in testing
      await enrichmentProcessor.handleIpEnrichment(mockJob);
    }

    // Verify all indicators were enriched correctly
    for (let i = 0; i < testIndicators.length; i++) {
      const updatedIndicator = await indicatorRepo.findOneBy({
        id: testIndicators[i].id,
      });

      expect(updatedIndicator.abuse_score).toEqual((i + 1) * 25);
      expect(updatedIndicator.country_code).toEqual(['US', 'UK', 'DE'][i]);
      expect(updatedIndicator.isp).toEqual(`ISP ${i + 1}`);
      expect(updatedIndicator.domain_usage).toEqual(`domain${i + 1}.com`);
      expect(Number(updatedIndicator.latitude)).toBeCloseTo(40.0 + i);
      expect(Number(updatedIndicator.longitude)).toBeCloseTo(-74.0 - i);
    }
  });
});