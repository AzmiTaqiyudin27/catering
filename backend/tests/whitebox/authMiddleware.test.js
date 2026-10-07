const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { authenticate, authorize, authorizeAction } = require('../../src/middleware/auth.middleware');

describe('WHITEBOX TESTING - Auth Middleware Branch & Path Coverage', () => {
  const TEST_SECRET = 'test-secret-key-12345';
  process.env.JWT_SECRET = TEST_SECRET;

  const mockResponse = () => {
    const res = {};
    res.statusCode = 200;
    res.jsonOutput = null;
    res.status = function (code) {
      this.statusCode = code;
      return this;
    };
    res.json = function (data) {
      this.jsonOutput = data;
      return this;
    };
    return res;
  };

  describe('authenticate() - Branch Analysis', () => {
    it('Branch 1: No Authorization header -> 401', async () => {
      const req = { headers: {} };
      const res = mockResponse();
      let nextCalled = false;

      await authenticate(req, res, () => { nextCalled = true; });

      assert.equal(res.statusCode, 401);
      assert.equal(res.jsonOutput.success, false);
      assert.match(res.jsonOutput.message, /Token tidak ditemukan/i);
      assert.equal(nextCalled, false);
    });

    it('Branch 2: Header does not start with "Bearer " -> 401', async () => {
      const req = { headers: { authorization: 'Basic 12345' } };
      const res = mockResponse();
      let nextCalled = false;

      await authenticate(req, res, () => { nextCalled = true; });

      assert.equal(res.statusCode, 401);
      assert.equal(res.jsonOutput.success, false);
      assert.equal(nextCalled, false);
    });

    it('Branch 3: Invalid token format / bad signature -> 401 JsonWebTokenError', async () => {
      const req = { headers: { authorization: 'Bearer invalid.token.value' } };
      const res = mockResponse();
      let nextCalled = false;

      await authenticate(req, res, () => { nextCalled = true; });

      assert.equal(res.statusCode, 401);
      assert.equal(res.jsonOutput.success, false);
      assert.match(res.jsonOutput.message, /Token tidak valid/i);
      assert.equal(nextCalled, false);
    });

    it('Branch 4: Expired token -> 401 TokenExpiredError', async () => {
      // Create token that expired 10 seconds ago
      const expiredToken = jwt.sign(
        { userId: 1 },
        TEST_SECRET,
        { expiresIn: '-10s' }
      );
      const req = { headers: { authorization: `Bearer ${expiredToken}` } };
      const res = mockResponse();
      let nextCalled = false;

      await authenticate(req, res, () => { nextCalled = true; });

      assert.equal(res.statusCode, 401);
      assert.equal(res.jsonOutput.success, false);
      assert.match(res.jsonOutput.message, /Token telah kadaluarsa/i);
      assert.equal(nextCalled, false);
    });
  });

  describe('authorize() - Branch & Condition Coverage', () => {
    it('Branch 1: req.user is undefined -> 401', () => {
      const req = {};
      const res = mockResponse();
      let nextCalled = false;

      const middleware = authorize('ADMIN_CS');
      middleware(req, res, () => { nextCalled = true; });

      assert.equal(res.statusCode, 401);
      assert.equal(nextCalled, false);
    });

    it('Branch 2: User is SUPER_ADMIN -> bypass all roles -> next()', () => {
      const req = { user: { id: 1, role: 'SUPER_ADMIN' } };
      const res = mockResponse();
      let nextCalled = false;

      const middleware = authorize('ADMIN_CS', 'ADMIN_KEUANGAN');
      middleware(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, true);
      assert.equal(res.statusCode, 200);
    });

    it('Branch 3: User is PEMILIK -> view bypass -> next()', () => {
      const req = { user: { id: 2, role: 'PEMILIK' } };
      const res = mockResponse();
      let nextCalled = false;

      const middleware = authorize('ADMIN_CS');
      middleware(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, true);
      assert.equal(res.statusCode, 200);
    });

    it('Branch 4: User role is in allowed roles -> next()', () => {
      const req = { user: { id: 3, role: 'ADMIN_CS' } };
      const res = mockResponse();
      let nextCalled = false;

      const middleware = authorize('ADMIN_CS', 'ADMIN_MENU');
      middleware(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, true);
      assert.equal(res.statusCode, 200);
    });

    it('Branch 5: User role not allowed -> 403 Forbidden', () => {
      const req = { user: { id: 4, role: 'ADMIN_KEUANGAN' } };
      const res = mockResponse();
      let nextCalled = false;

      const middleware = authorize('ADMIN_CS', 'ADMIN_MENU');
      middleware(req, res, () => { nextCalled = true; });

      assert.equal(res.statusCode, 403);
      assert.equal(res.jsonOutput.success, false);
      assert.match(res.jsonOutput.message, /tidak memiliki akses/i);
      assert.equal(nextCalled, false);
    });
  });

  describe('authorizeAction() - Branch & Condition Coverage', () => {
    it('Branch 1: SUPER_ADMIN allowed -> next()', () => {
      const req = { user: { id: 1, role: 'SUPER_ADMIN' } };
      const res = mockResponse();
      let nextCalled = false;

      const middleware = authorizeAction('ADMIN_KEUANGAN');
      middleware(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, true);
    });

    it('Branch 2: PEMILIK is restricted from action -> 403', () => {
      const req = { user: { id: 2, role: 'PEMILIK' } };
      const res = mockResponse();
      let nextCalled = false;

      const middleware = authorizeAction('ADMIN_KEUANGAN');
      middleware(req, res, () => { nextCalled = true; });

      assert.equal(res.statusCode, 403);
      assert.equal(nextCalled, false);
    });

    it('Branch 3: Disallowed role -> 403', () => {
      const req = { user: { id: 3, role: 'ADMIN_CS' } };
      const res = mockResponse();
      let nextCalled = false;

      const middleware = authorizeAction('ADMIN_KEUANGAN');
      middleware(req, res, () => { nextCalled = true; });

      assert.equal(res.statusCode, 403);
      assert.equal(nextCalled, false);
    });

    it('Branch 4: Allowed specific role -> next()', () => {
      const req = { user: { id: 4, role: 'ADMIN_KEUANGAN' } };
      const res = mockResponse();
      let nextCalled = false;

      const middleware = authorizeAction('ADMIN_KEUANGAN');
      middleware(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, true);
    });
  });
});
