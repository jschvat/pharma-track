/**
 * Authentication Integration Tests
 * 
 * Comprehensive tests for authentication endpoints including
 * login, registration, and JWT token validation.
 */

const request = require('supertest');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Import the enhanced server (we'll need to update this)
const app = require('../../server-enhanced');

describe('Authentication Integration Tests', () => {
  let db;
  let testUser;

  beforeAll(async () => {
    // Connect to test database
    db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'pharmatrak_user',
      password: process.env.DB_PASSWORD || 'pharmatrak_password',
      database: process.env.DB_NAME_TEST || 'pharmatrak_test'
    });

    // Create test user
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    testUser = {
      name: 'Test User',
      email: global.testUtils.uniqueEmail(),
      password: 'TestPassword123!',
      hashedPassword,
      role: 'user',
      store_id: 1
    };

    await db.execute(`
      INSERT INTO users (name, email, password, role, store_id) 
      VALUES (?, ?, ?, ?, ?)
    `, [testUser.name, testUser.email, testUser.hashedPassword, testUser.role, testUser.store_id]);
  });

  afterAll(async () => {
    if (db) {
      // Clean up test user
      await db.execute('DELETE FROM users WHERE email = ?', [testUser.email]);
      await db.end();
    }
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
    });

    test('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toBeInstanceOf(Array);
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: testUser.password
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    test('should respect rate limiting', async () => {
      // Make multiple requests to trigger rate limiting
      const promises = Array(10).fill().map(() => 
        request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeEach(async () => {
      // Login to get a valid token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      authToken = loginResponse.body.token;
    });

    test('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject expired token', async () => {
      // Create an expired token (this would require mocking JWT or using a test token)
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: testUser.id }, 
        process.env.JWT_SECRET || 'test-jwt-secret-key',
        { expiresIn: '-1h' } // Already expired
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken;

    beforeEach(async () => {
      // Login to get a valid token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      authToken = loginResponse.body.token;
    });

    test('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Logged out');
    });

    test('should handle logout without token gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Security Features', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      // Check for security headers (added by helmet)
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });

    test('should sanitize malicious input', async () => {
      const maliciousInput = {
        email: '<script>alert("xss")</script>test@example.com',
        password: 'password<script>alert("xss")</script>'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousInput)
        .expect(401);

      // Input should be sanitized, script tags removed
      expect(response.body.error).not.toContain('<script>');
    });

    test('should respect CORS policy', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    test('should block unauthorized origins', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'http://malicious-site.com')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      // Should either reject the request or not include CORS headers
      expect(response.headers['access-control-allow-origin']).not.toBe('http://malicious-site.com');
    });
  });

  describe('Performance', () => {
    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('should handle concurrent login requests', async () => {
      const concurrentRequests = 5;
      const promises = Array(concurrentRequests).fill().map(() => 
        request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password
          })
      );

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
      });
    });
  });
});