const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('BLACKBOX TESTING - Specification: Inventory & Low Stock Filtering', () => {
  const sampleInventory = [
    { id: 1, name: 'Beras Pandan Wangi', category: 'Bahan Pokok', stock: 15.0, minStock: 20.0, supplier: 'Toko Beras Jaya' },
    { id: 2, name: 'Daging Sapi Segar', category: 'Protein', stock: 5.0, minStock: 5.0, supplier: 'Pasar Induk' },
    { id: 3, name: 'Ayam Potong', category: 'Protein', stock: 25.0, minStock: 10.0, supplier: 'Peternakan Sejahtera' },
    { id: 4, name: 'Minyak Goreng', category: 'Bahan Pokok', stock: 40.0, minStock: 15.0, supplier: 'Toko Sembako ABC' },
    { id: 5, name: 'Bawang Merah', category: 'Bumbu', stock: 2.0, minStock: 3.0, supplier: 'Pasar Tradisional' },
    { id: 6, name: 'Gula Pasir', category: 'Bahan Pokok', stock: 10.01, minStock: 10.0, supplier: 'Toko Sembako ABC' },
  ];

  const queryIngredients = (params, database = sampleInventory) => {
    let result = [...database];

    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (i) => i.name.toLowerCase().includes(q) || i.supplier.toLowerCase().includes(q)
      );
    }

    if (params.category) {
      result = result.filter((i) => i.category === params.category);
    }

    if (params.lowStock === 'true' || params.lowStock === true) {
      result = result.filter((i) => parseFloat(i.stock) <= parseFloat(i.minStock));
    }

    return result;
  };

  it('TC-BB-04.1 [Low Stock Filter]: Returns all and only items where stock <= minStock', () => {
    const results = queryIngredients({ lowStock: 'true' });

    // Item 1: stock 15 <= 20 (Yes)
    // Item 2: stock 5 <= 5 (Yes - Boundary)
    // Item 3: stock 25 <= 10 (No)
    // Item 4: stock 40 <= 15 (No)
    // Item 5: stock 2 <= 3 (Yes)
    // Item 6: stock 10.01 <= 10 (No - strictly above)
    assert.equal(results.length, 3);
    const names = results.map((r) => r.name);
    assert.ok(names.includes('Beras Pandan Wangi'));
    assert.ok(names.includes('Daging Sapi Segar'));
    assert.ok(names.includes('Bawang Merah'));
    assert.equal(names.includes('Gula Pasir'), false);
  });

  it('TC-BB-04.2 [Search Parameter]: Case-insensitive search on name or supplier', () => {
    const byName = queryIngredients({ search: 'daging' });
    assert.equal(byName.length, 1);
    assert.equal(byName[0].name, 'Daging Sapi Segar');

    const bySupplier = queryIngredients({ search: 'sembako abc' });
    assert.equal(bySupplier.length, 2);
  });

  it('TC-BB-04.3 [Category Parameter]: Filters exclusively by category', () => {
    const proteins = queryIngredients({ category: 'Protein' });
    assert.equal(proteins.length, 2);
    proteins.forEach((p) => assert.equal(p.category, 'Protein'));
  });

  it('TC-BB-04.4 [Combined Filters]: Combined search + category + lowStock', () => {
    const combined = queryIngredients({
      category: 'Bahan Pokok',
      lowStock: 'true',
    });
    // Should only match 'Beras Pandan Wangi' (stock 15 <= 20)
    assert.equal(combined.length, 1);
    assert.equal(combined[0].name, 'Beras Pandan Wangi');
  });
});
