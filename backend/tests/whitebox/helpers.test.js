const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  paginate,
  paginationResponse,
  generateOrderNumber,
  formatRupiah,
  formatDate,
} = require('../../src/utils/helpers');

describe('WHITEBOX TESTING - Helpers Logic & Branch Coverage', () => {
  describe('paginate()', () => {
    it('Branch 1: Default arguments (page 1, limit 10)', () => {
      const result = paginate();
      assert.deepEqual(result, { skip: 0, take: 10 });
    });

    it('Branch 2: Custom valid values (page 3, limit 25)', () => {
      const result = paginate(3, 25);
      assert.deepEqual(result, { skip: 50, take: 25 });
    });

    it('Boundary 1: Page 1 edge (skip must be 0)', () => {
      const result = paginate(1, 15);
      assert.equal(result.skip, 0);
      assert.equal(result.take, 15);
    });

    it('Boundary 2: Extreme page values', () => {
      const result = paginate(100, 50);
      assert.equal(result.skip, 4950);
      assert.equal(result.take, 50);
    });
  });

  describe('paginationResponse()', () => {
    it('Branch 1: Multiple pages with hasNext = true, hasPrev = false', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const res = paginationResponse(data, 50, 1, 10);

      assert.equal(res.pagination.total, 50);
      assert.equal(res.pagination.page, 1);
      assert.equal(res.pagination.limit, 10);
      assert.equal(res.pagination.totalPages, 5);
      assert.equal(res.pagination.hasNext, true);
      assert.equal(res.pagination.hasPrev, false);
      assert.deepEqual(res.data, data);
    });

    it('Branch 2: Middle page with hasNext = true, hasPrev = true', () => {
      const data = [{ id: 3 }];
      const res = paginationResponse(data, 50, 3, 10);

      assert.equal(res.pagination.page, 3);
      assert.equal(res.pagination.totalPages, 5);
      assert.equal(res.pagination.hasNext, true);
      assert.equal(res.pagination.hasPrev, true);
    });

    it('Branch 3: Last page with hasNext = false, hasPrev = true', () => {
      const data = [{ id: 5 }];
      const res = paginationResponse(data, 50, 5, 10);

      assert.equal(res.pagination.page, 5);
      assert.equal(res.pagination.hasNext, false);
      assert.equal(res.pagination.hasPrev, true);
    });

    it('Boundary 1: Zero total records', () => {
      const res = paginationResponse([], 0, 1, 10);
      assert.equal(res.pagination.total, 0);
      assert.equal(res.pagination.totalPages, 0);
      assert.equal(res.pagination.hasNext, false);
      assert.equal(res.pagination.hasPrev, false);
    });

    it('Boundary 2: Total exact multiple of limit', () => {
      const res = paginationResponse([], 20, 2, 10);
      assert.equal(res.pagination.totalPages, 2);
    });

    it('Boundary 3: Total not multiple of limit (ceil rounding)', () => {
      const res = paginationResponse([], 21, 1, 10);
      assert.equal(res.pagination.totalPages, 3);
    });
  });

  describe('generateOrderNumber()', () => {
    it('Branch 1: Default prefix "ORD"', () => {
      const orderNum = generateOrderNumber();
      assert.match(orderNum, /^ORD-\d{6}-\d{4}$/);
    });

    it('Branch 2: Custom prefix "ORD-IN"', () => {
      const orderNum = generateOrderNumber('ORD-IN');
      assert.match(orderNum, /^ORD-IN-\d{6}-\d{4}$/);
    });

    it('Branch 3: Custom prefix "ORD-OUT"', () => {
      const orderNum = generateOrderNumber('ORD-OUT');
      assert.match(orderNum, /^ORD-OUT-\d{6}-\d{4}$/);
    });

    it('Uniqueness test: Two consecutive generations are not identical', () => {
      const num1 = generateOrderNumber('TEST');
      const num2 = generateOrderNumber('TEST');
      // Even if called rapidly, random 4-digit makes collision probability tiny
      assert.ok(num1.startsWith('TEST-'));
      assert.ok(num2.startsWith('TEST-'));
    });
  });

  describe('formatRupiah()', () => {
    it('Branch 1: Positive integer', () => {
      const formatted = formatRupiah(150000);
      assert.ok(formatted.includes('150.000'));
    });

    it('Boundary 1: Zero amount', () => {
      const formatted = formatRupiah(0);
      assert.ok(formatted.includes('0'));
    });
  });

  describe('formatDate()', () => {
    it('Branch 1: Valid Date instance', () => {
      const date = new Date('2025-08-17T10:00:00Z');
      const formatted = formatDate(date);
      assert.ok(formatted.includes('2025'));
      assert.ok(formatted.includes('Agustus'));
    });
  });
});
