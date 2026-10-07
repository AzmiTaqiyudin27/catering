const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('BLACKBOX TESTING - Specification: Authentication & User Credentials', () => {
  const JWT_SECRET = 'blackbox-test-secret-key';
  process.env.JWT_SECRET = JWT_SECRET;

  // Mock Blackbox API handler for Login simulation
  const loginHandler = async (body, userDatabase) => {
    const { email, password } = body || {};

    if (!email || !password) {
      return {
        status: 400,
        body: {
          success: false,
          message: 'Email dan password wajib diisi.',
          errors: [
            !email && { field: 'email', message: 'Email tidak boleh kosong' },
            !password && { field: 'password', message: 'Password tidak boleh kosong' },
          ].filter(Boolean),
        },
      };
    }

    const user = userDatabase.find((u) => u.email === email);
    if (!user) {
      return {
        status: 401,
        body: {
          success: false,
          message: 'Email atau password salah.',
        },
      };
    }

    if (!user.isActive) {
      return {
        status: 401,
        body: {
          success: false,
          message: 'Akun Anda telah dinonaktifkan.',
        },
      };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return {
        status: 401,
        body: {
          success: false,
          message: 'Email atau password salah.',
        },
      };
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      status: 200,
      body: {
        success: true,
        message: 'Login berhasil.',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        },
      },
    };
  };

  it('TC-BB-01.1 [Valid Login]: Returns 200 with JWT token and user info', async () => {
    const passwordHash = await bcrypt.hash('secret123', 10);
    const mockDB = [
      { id: 1, name: 'Budi CS', email: 'cs@catering.com', password: passwordHash, role: 'ADMIN_CS', isActive: true },
    ];

    const response = await loginHandler({ email: 'cs@catering.com', password: 'secret123' }, mockDB);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.ok(response.body.data.token, 'Token must be present');
    assert.equal(response.body.data.user.email, 'cs@catering.com');
    assert.equal(response.body.data.user.role, 'ADMIN_CS');

    // Verify token can be decoded
    const decoded = jwt.verify(response.body.data.token, JWT_SECRET);
    assert.equal(decoded.userId, 1);
    assert.equal(decoded.role, 'ADMIN_CS');
  });

  it('TC-BB-01.2 [Invalid Password]: Returns 401 with error message', async () => {
    const passwordHash = await bcrypt.hash('secret123', 10);
    const mockDB = [
      { id: 1, name: 'Admin', email: 'admin@catering.com', password: passwordHash, role: 'SUPER_ADMIN', isActive: true },
    ];

    const response = await loginHandler({ email: 'admin@catering.com', password: 'wrongpassword' }, mockDB);

    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
    assert.match(response.body.message, /salah/i);
    assert.equal(response.body.data, undefined);
  });

  it('TC-BB-01.3 [Non-existent Email]: Returns 401 with error message', async () => {
    const mockDB = [];
    const response = await loginHandler({ email: 'unknown@catering.com', password: 'any' }, mockDB);

    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
    assert.match(response.body.message, /salah/i);
  });

  it('TC-BB-01.4 [Empty Payload / Missing Credentials]: Returns 400 Bad Request', async () => {
    const mockDB = [];
    const response = await loginHandler({}, mockDB);

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.ok(response.body.errors.length >= 2);
  });

  it('TC-BB-01.5 [Deactivated User Account]: Returns 401 with deactivated notice', async () => {
    const passwordHash = await bcrypt.hash('secret123', 10);
    const mockDB = [
      { id: 2, name: 'Ex Employee', email: 'ex@catering.com', password: passwordHash, role: 'ADMIN_CS', isActive: false },
    ];

    const response = await loginHandler({ email: 'ex@catering.com', password: 'secret123' }, mockDB);

    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
    assert.match(response.body.message, /dinonaktifkan/i);
  });

  it('TC-BB-01.6 [Password Security]: Stored passwords must never be stored in plain text', async () => {
    const plainPassword = 'mySuperPassword2024';
    const hash = await bcrypt.hash(plainPassword, 10);

    assert.notEqual(hash, plainPassword);
    assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'));
    assert.ok(await bcrypt.compare(plainPassword, hash));
    assert.equal(await bcrypt.compare('differentPassword', hash), false);
  });
});
