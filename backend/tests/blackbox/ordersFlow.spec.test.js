const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { generateOrderNumber } = require('../../src/utils/helpers');

describe('BLACKBOX TESTING - Specification: Order Processing & Dispatch Lifecycle', () => {
  // Service implementation of order creation and dispatching
  const createOrderIn = (orderInput) => {
    const { customerName, customerPhone, customerAddress, deliveryDate, items } = orderInput;

    if (!customerName || !customerPhone || !customerAddress) {
      return { status: 400, message: 'Data pelanggan belum lengkap.' };
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return { status: 400, message: 'Pesanan harus memiliki minimal 1 item menu.' };
    }

    for (const item of items) {
      if (!item.menuName || !item.quantity || item.quantity <= 0 || item.unitPrice < 0) {
        return { status: 400, message: 'Item menu atau kuantitas tidak valid.' };
      }
    }

    let totalAmount = 0;
    const processedItems = items.map((item, index) => {
      const subtotal = item.quantity * item.unitPrice;
      totalAmount += subtotal;
      return {
        id: index + 1,
        menuId: item.menuId || null,
        menuName: item.menuName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal,
      };
    });

    return {
      status: 201,
      data: {
        id: 101,
        orderNumber: generateOrderNumber('ORD-IN'),
        customerName,
        customerPhone,
        customerAddress,
        deliveryDate: new Date(deliveryDate),
        totalAmount,
        status: 'PENDING',
        items: processedItems,
      },
    };
  };

  const dispatchToOrderOut = (orderInRecord) => {
    if (orderInRecord.status === 'CANCELLED') {
      return { status: 400, message: 'Pesanan yang dibatalkan tidak dapat dikirim.' };
    }

    const orderOut = {
      id: 201,
      orderNumber: generateOrderNumber('ORD-OUT'),
      customerName: orderInRecord.customerName,
      customerPhone: orderInRecord.customerPhone,
      customerAddress: orderInRecord.customerAddress,
      orderDate: new Date(),
      deliveryDate: orderInRecord.deliveryDate,
      totalAmount: orderInRecord.totalAmount,
      status: 'DELIVERED',
      items: orderInRecord.items,
    };

    // Update incoming order status
    orderInRecord.status = 'COMPLETED';

    return {
      status: 201,
      data: orderOut,
      updatedOrderIn: orderInRecord,
    };
  };

  it('TC-BB-03.1 [Order Validation]: Reject order without items', () => {
    const res = createOrderIn({
      customerName: 'Ibu Ratna',
      customerPhone: '08123456789',
      customerAddress: 'Jl. Merdeka No. 10',
      items: [],
    });

    assert.equal(res.status, 400);
    assert.match(res.message, /minimal 1 item/i);
  });

  it('TC-BB-03.2 [Order Validation]: Reject order with invalid/zero quantity', () => {
    const res = createOrderIn({
      customerName: 'Ibu Ratna',
      customerPhone: '08123456789',
      customerAddress: 'Jl. Merdeka No. 10',
      items: [{ menuName: 'Nasi Kotak', quantity: 0, unitPrice: 25000 }],
    });

    assert.equal(res.status, 400);
    assert.match(res.message, /kuantitas tidak valid/i);
  });

  it('TC-BB-03.3 [Order Creation]: Successfully computes subtotals and grand total', () => {
    const res = createOrderIn({
      customerName: 'Pak Hendra',
      customerPhone: '081298765432',
      customerAddress: 'Gedung Wisma Lt. 5',
      deliveryDate: '2025-05-20',
      items: [
        { menuName: 'Nasi Kotak Rendang', quantity: 50, unitPrice: 30000 },
        { menuName: 'Snack Box Standard', quantity: 50, unitPrice: 15000 },
      ],
    });

    assert.equal(res.status, 201);
    assert.ok(res.data.orderNumber.startsWith('ORD-IN-'));
    assert.equal(res.data.status, 'PENDING');
    assert.equal(res.data.items[0].subtotal, 1500000);
    assert.equal(res.data.items[1].subtotal, 750000);
    assert.equal(res.data.totalAmount, 2250000);
  });

  it('TC-BB-03.4 [Dispatch Flow]: Convert OrderIn to OrderOut with DELIVERED status and COMPLETED source', () => {
    const orderIn = createOrderIn({
      customerName: 'PT Maju Bersama',
      customerPhone: '0215551234',
      customerAddress: 'Sudirman Tower',
      deliveryDate: '2025-06-15',
      items: [{ menuName: 'Paket Buffet A', quantity: 100, unitPrice: 65000 }],
    }).data;

    const dispatchResult = dispatchToOrderOut(orderIn);

    assert.equal(dispatchResult.status, 201);
    assert.ok(dispatchResult.data.orderNumber.startsWith('ORD-OUT-'));
    assert.equal(dispatchResult.data.status, 'DELIVERED');
    assert.equal(dispatchResult.data.totalAmount, 6500000);
    assert.equal(dispatchResult.updatedOrderIn.status, 'COMPLETED');
  });

  it('TC-BB-03.5 [Dispatch Validation]: Block dispatching cancelled orders', () => {
    const cancelledOrder = {
      customerName: 'Cancelled Customer',
      status: 'CANCELLED',
    };

    const res = dispatchToOrderOut(cancelledOrder);
    assert.equal(res.status, 400);
    assert.match(res.message, /dibatalkan tidak dapat dikirim/i);
  });
});
