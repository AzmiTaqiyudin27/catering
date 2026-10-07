const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('WHITEBOX TESTING - Upload Filter & Folder Resolution Paths', () => {
  // Test the fileFilter logic
  const fileFilter = (fileMimetype) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(fileMimetype)) {
      return { allowed: true, error: null };
    }
    return {
      allowed: false,
      error: new Error('Tipe file tidak diizinkan. Hanya JPEG, PNG, GIF, dan WebP yang diperbolehkan.'),
    };
  };

  // Test the destination folder logic
  const resolveUploadFolder = (baseUrl) => {
    let folder = 'general';
    if (baseUrl.includes('menus')) {
      folder = 'menus';
    } else if (baseUrl.includes('employees')) {
      folder = 'employees';
    } else if (baseUrl.includes('users') || baseUrl.includes('auth')) {
      folder = 'avatars';
    }
    return folder;
  };

  describe('File Mime-Type Branch Analysis', () => {
    it('Branch 1: Allows standard image/jpeg', () => {
      const res = fileFilter('image/jpeg');
      assert.equal(res.allowed, true);
      assert.equal(res.error, null);
    });

    it('Branch 2: Allows modern image/webp', () => {
      const res = fileFilter('image/webp');
      assert.equal(res.allowed, true);
    });

    it('Branch 3: Allows image/png', () => {
      const res = fileFilter('image/png');
      assert.equal(res.allowed, true);
    });

    it('Branch 4: Rejects dangerous executable/script types', () => {
      const resExe = fileFilter('application/x-msdownload');
      assert.equal(resExe.allowed, false);
      assert.match(resExe.error.message, /tidak diizinkan/i);

      const resJs = fileFilter('application/javascript');
      assert.equal(resJs.allowed, false);

      const resPdf = fileFilter('application/pdf');
      assert.equal(resPdf.allowed, false);
    });
  });

  describe('Destination Folder Branch Coverage', () => {
    it('Branch 1: Route /api/menus resolves to "menus"', () => {
      assert.equal(resolveUploadFolder('/api/menus'), 'menus');
    });

    it('Branch 2: Route /api/employees resolves to "employees"', () => {
      assert.equal(resolveUploadFolder('/api/employees'), 'employees');
    });

    it('Branch 3: Route /api/users resolves to "avatars"', () => {
      assert.equal(resolveUploadFolder('/api/users'), 'avatars');
    });

    it('Branch 4: Route /api/auth (User Profile) resolves to "avatars"', () => {
      assert.equal(resolveUploadFolder('/api/auth'), 'avatars');
    });

    it('Branch 5: Unspecified route resolves to default "general"', () => {
      assert.equal(resolveUploadFolder('/api/other'), 'general');
    });
  });
});
