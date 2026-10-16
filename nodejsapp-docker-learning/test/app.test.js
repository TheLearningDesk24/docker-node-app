const test = require("node:test");
const assert = require("node:assert/strict");

test("sample product data has unique ids and valid prices", () => {
  const products = [
    { id: 1, name: "Wireless Mouse", price: 799 },
    { id: 2, name: "Cotton T-Shirt", price: 499 },
    { id: 3, name: "Insulated Water Bottle", price: 699 }
  ];

  assert.equal(new Set(products.map((p) => p.id)).size, products.length);
  assert.ok(products.every((p) => p.price >= 0));
});
