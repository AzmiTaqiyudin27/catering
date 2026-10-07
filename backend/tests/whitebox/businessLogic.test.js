const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('WHITEBOX TESTING - Business Logic Algorithms & Boundary Value Analysis', () => {
  describe('Employee ID Generation Algorithm', () => {
    const calculateNextEmployeeId = (existingEmployees) => {
      let maxIdNum = 0;
      existingEmployees.forEach((emp) => {
        const match = emp.employeeId.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxIdNum) maxIdNum = num;
        }
      });
      return `EMP${(maxIdNum + 1).toString().padStart(4, '0')}`;
    };

    it('Branch 1: Empty database starts with EMP0001', () => {
      const nextId = calculateNextEmployeeId([]);
      assert.equal(nextId, 'EMP0001');
    });

    it('Branch 2: Sequential IDs (EMP0001, EMP0002) yields EMP0003', () => {
      const existing = [{ employeeId: 'EMP0001' }, { employeeId: 'EMP0002' }];
      const nextId = calculateNextEmployeeId(existing);
      assert.equal(nextId, 'EMP0003');
    });

    it('Boundary/Collision Case: Deleted employee gap (EMP0001, EMP0008) yields EMP0009', () => {
      // Previously count() would yield EMP0003, colliding if EMP0003 existed or breaking sequence
      const existing = [{ employeeId: 'EMP0001' }, { employeeId: 'EMP0008' }];
      const nextId = calculateNextEmployeeId(existing);
      assert.equal(nextId, 'EMP0009');
    });

    it('Branch 3: Unpadded or variable length IDs (EMP01, EMP120) correctly finds max', () => {
      const existing = [{ employeeId: 'EMP01' }, { employeeId: 'EMP120' }];
      const nextId = calculateNextEmployeeId(existing);
      assert.equal(nextId, 'EMP0121');
    });
  });

  describe('Ingredient Low Stock Logic & Boundary Value Analysis (BVA)', () => {
    const isLowStock = (stock, minStock) => {
      return parseFloat(stock) <= parseFloat(minStock);
    };

    it('Boundary 1: stock strictly below minStock (9.99 <= 10.00) -> true', () => {
      assert.equal(isLowStock(9.99, 10.00), true);
    });

    it('Boundary 2: Exact boundary where stock == minStock (10.00 <= 10.00) -> true', () => {
      assert.equal(isLowStock(10.00, 10.00), true);
    });

    it('Boundary 3: stock strictly above minStock (10.01 <= 10.00) -> false', () => {
      assert.equal(isLowStock(10.01, 10.00), false);
    });

    it('Boundary 4: Zero stock (0 <= 5) -> true', () => {
      assert.equal(isLowStock(0, 5), true);
    });

    it('Branch: String vs Decimal type conversions', () => {
      assert.equal(isLowStock('25.50', '30.00'), true);
      assert.equal(isLowStock('50.00', '20.00'), false);
    });
  });

  describe('Order Total & Item Subtotal Calculations', () => {
    const calculateOrderTotals = (items) => {
      let totalAmount = 0;
      const calculatedItems = items.map((item) => {
        const subtotal = (parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
        totalAmount += subtotal;
        return {
          ...item,
          subtotal,
        };
      });
      return { totalAmount, items: calculatedItems };
    };

    it('Branch 1: Multiple items subtotal and grand total sum', () => {
      const items = [
        { menuName: 'Nasi Kotak Ayam', quantity: 10, unitPrice: 25000 },
        { menuName: 'Es Teh Manis', quantity: 10, unitPrice: 5000 },
      ];
      const result = calculateOrderTotals(items);

      assert.equal(result.items[0].subtotal, 250000);
      assert.equal(result.items[1].subtotal, 50000);
      assert.equal(result.totalAmount, 300000);
    });

    it('Boundary: Empty items array produces 0 total', () => {
      const result = calculateOrderTotals([]);
      assert.equal(result.totalAmount, 0);
      assert.equal(result.items.length, 0);
    });

    it('Boundary: Fractional or large amounts', () => {
      const items = [{ menuName: 'Buffet VIP', quantity: 250, unitPrice: 75000 }];
      const result = calculateOrderTotals(items);
      assert.equal(result.totalAmount, 18750000);
    });
  });

  describe('Financial Cashflow Calculation (Profit = Income - Expense)', () => {
    const calculateCashflow = (income, expense) => {
      const inc = parseFloat(income || 0);
      const exp = parseFloat(expense || 0);
      return {
        income: inc,
        expense: exp,
        profit: inc - exp,
        status: inc >= exp ? 'PROFIT' : 'DEFICIT',
      };
    };

    it('Branch 1: Positive profit (Income > Expense)', () => {
      const result = calculateCashflow(10000000, 4000000);
      assert.equal(result.profit, 6000000);
      assert.equal(result.status, 'PROFIT');
    });

    it('Branch 2: Break-even (Income == Expense)', () => {
      const result = calculateCashflow(5000000, 5000000);
      assert.equal(result.profit, 0);
      assert.equal(result.status, 'PROFIT');
    });

    it('Branch 3: Deficit (Income < Expense)', () => {
      const result = calculateCashflow(3000000, 5000000);
      assert.equal(result.profit, -2000000);
      assert.equal(result.status, 'DEFICIT');
    });
  });
});
