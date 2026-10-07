const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('BLACKBOX TESTING - Specification: Role-Based Access Control (RBAC) Matrix', () => {
  // Defined Permissions Matrix according to specification:
  // - SUPER_ADMIN: Full access to all modules and all actions
  // - PEMILIK: Read-only access to business modules (finance, orders, menu, hr, activities); NO access to user management
  // - ADMIN_KEUANGAN: Full access to Finance (Income, Expense, Recap)
  // - ADMIN_CS: Full access to Orders (Orders In, Orders Out, Recap) and read access to Menus
  // - ADMIN_MENU: Full access to Menus & Ingredients
  // - ADMIN_SDM: Full access to HR (Employees)
  const canAccessModule = (userRole, module, action = 'VIEW') => {
    if (!userRole) return false;

    // Super Admin has unrestricted access to everything
    if (userRole === 'SUPER_ADMIN') return true;

    // User management is strictly SUPER_ADMIN only
    if (module === 'users') return false;

    // Pemilik can view all business modules, but cannot perform write/delete actions
    if (userRole === 'PEMILIK') {
      if (action === 'VIEW') {
        return ['finance', 'orders', 'menu', 'hr', 'activities'].includes(module);
      }
      return false; // Action is blocked for Pemilik
    }

    // Role-specific operational access
    const rolePermissions = {
      ADMIN_KEUANGAN: ['finance'],
      ADMIN_CS: ['orders'],
      ADMIN_MENU: ['menu'],
      ADMIN_SDM: ['hr'],
    };

    // Special: ADMIN_CS can view menus for creating orders
    if (userRole === 'ADMIN_CS' && module === 'menu' && action === 'VIEW') {
      return true;
    }

    const allowedModules = rolePermissions[userRole] || [];
    return allowedModules.includes(module);
  };

  describe('User Management Access Security', () => {
    it('TC-BB-02.1: SUPER_ADMIN is granted access to User Management', () => {
      assert.equal(canAccessModule('SUPER_ADMIN', 'users', 'VIEW'), true);
      assert.equal(canAccessModule('SUPER_ADMIN', 'users', 'MUTATE'), true);
    });

    it('TC-BB-02.2: PEMILIK is strictly denied access to User Management', () => {
      assert.equal(canAccessModule('PEMILIK', 'users', 'VIEW'), false);
      assert.equal(canAccessModule('PEMILIK', 'users', 'MUTATE'), false);
    });

    it('TC-BB-02.3: Operational Admins (CS, Keuangan, Menu, SDM) are denied User Management', () => {
      assert.equal(canAccessModule('ADMIN_CS', 'users'), false);
      assert.equal(canAccessModule('ADMIN_KEUANGAN', 'users'), false);
      assert.equal(canAccessModule('ADMIN_MENU', 'users'), false);
      assert.equal(canAccessModule('ADMIN_SDM', 'users'), false);
    });
  });

  describe('Finance Module Access Rules', () => {
    it('TC-BB-02.4: ADMIN_KEUANGAN has full view & mutate access to Finance', () => {
      assert.equal(canAccessModule('ADMIN_KEUANGAN', 'finance', 'VIEW'), true);
      assert.equal(canAccessModule('ADMIN_KEUANGAN', 'finance', 'MUTATE'), true);
    });

    it('TC-BB-02.5: PEMILIK has view-only access to Finance (cannot mutate)', () => {
      assert.equal(canAccessModule('PEMILIK', 'finance', 'VIEW'), true);
      assert.equal(canAccessModule('PEMILIK', 'finance', 'MUTATE'), false);
    });

    it('TC-BB-02.6: ADMIN_CS is denied access to Finance', () => {
      assert.equal(canAccessModule('ADMIN_CS', 'finance', 'VIEW'), false);
    });
  });

  describe('Orders & Menu Cross-Module Integration', () => {
    it('TC-BB-02.7: ADMIN_CS has access to Orders', () => {
      assert.equal(canAccessModule('ADMIN_CS', 'orders', 'VIEW'), true);
      assert.equal(canAccessModule('ADMIN_CS', 'orders', 'MUTATE'), true);
    });

    it('TC-BB-02.8: ADMIN_CS can VIEW menus for order item selection', () => {
      assert.equal(canAccessModule('ADMIN_CS', 'menu', 'VIEW'), true);
    });

    it('TC-BB-02.9: ADMIN_CS CANNOT mutate (create/edit/delete) menus', () => {
      assert.equal(canAccessModule('ADMIN_CS', 'menu', 'MUTATE'), false);
    });

    it('TC-BB-02.10: ADMIN_MENU can mutate menus', () => {
      assert.equal(canAccessModule('ADMIN_MENU', 'menu', 'MUTATE'), true);
    });
  });

  describe('HR Module Access Rules', () => {
    it('TC-BB-02.11: ADMIN_SDM has access to HR', () => {
      assert.equal(canAccessModule('ADMIN_SDM', 'hr', 'VIEW'), true);
      assert.equal(canAccessModule('ADMIN_SDM', 'hr', 'MUTATE'), true);
    });

    it('TC-BB-02.12: Other operational roles cannot access HR', () => {
      assert.equal(canAccessModule('ADMIN_CS', 'hr'), false);
      assert.equal(canAccessModule('ADMIN_KEUANGAN', 'hr'), false);
      assert.equal(canAccessModule('ADMIN_MENU', 'hr'), false);
    });
  });
});
