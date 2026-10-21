import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, mkdtempSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { aggregate, matchesPeriod, cents, roundedRatio } from '../scripts/analytics.mjs';

function fixture() {
  const data = {
    users: ['u1', 'u2', 'u3'].map(user_id => ({ user_id, signup_date: '2023-01-01' })),
    products: [{ product_id: 'p1', product_name: 'First', category: 'A', brand: 'X', price: '10.00' }, { product_id: 'p2', product_name: 'Second', category: 'B', brand: 'Y', price: '20.00' }],
    orders: [], order_items: [], reviews: [],
  };
  const addOrder = (id, user, status, items, date = '2024-01-01 12:00:00') => {
    const amount = items.reduce((sum, [, total]) => sum + cents(total), 0);
    data.orders.push({ order_id: id, user_id: user, order_status: status, total_amount: (amount / 100).toFixed(2), order_date: date });
    items.forEach(([product_id, total], index) => data.order_items.push({ order_item_id: `${id}-${index}`, order_id: id, user_id: user, product_id, quantity: '1', item_price: total, item_total: total }));
  };
  addOrder('o1', 'u1', 'completed', [['p1', '10.00'], ['p1', '5.00'], ['p2', '20.00']]);
  addOrder('o2', 'u1', 'completed', [['p2', '20.00']], '2024-02-01 00:00:00');
  addOrder('o3', 'u2', 'completed', [['p1', '10.00']]);
  for (const status of ['cancelled', 'returned', 'processing', 'shipped']) addOrder(status, 'u3', status, [['p1', '100.00']]);
  data.reviews.push({ review_id: 'r1', order_id: 'o1', user_id: 'u1', product_id: 'p1', rating: '4', review_date: '2023-12-31 12:00:00' });
  return data;
}

test('completed order scope, repeat denominator, calendar months and distinct product orders', () => {
  const result = aggregate(fixture());
  assert.deepEqual(result.kpis, { completed_orders: 3, completed_revenue: 65, completed_aov: 21.67, customers_with_completed_orders: 2, repeat_customers: 1, repeat_customer_rate_pct: 50 });
  assert.equal(result.categories.find(r => r.category === 'A').completed_orders, 2);
  assert.equal(result.categories.find(r => r.category === 'A').items_sold, 3);
  assert.equal(result.categories.find(r => r.category === 'A').completed_revenue, 25);
  assert.deepEqual(result.monthly.map(r => [r.order_month, r.completed_revenue]), [['2024-01', 45], ['2024-02', 20]]);
  assert.equal(result.validation.chronology.reviewsBeforeOrder, 1);
});

test('SQL-style dense ranking preserves tied ranks and limits output to ten rows', () => {
  const data = fixture();
  data.products = Array.from({ length: 12 }, (_, i) => ({ product_id: `p${String(i).padStart(2, '0')}`, product_name: 'Same label', category: 'A', brand: 'X', price: '1.00' }));
  data.orders = [{ order_id: 'o1', user_id: 'u1', order_status: 'completed', order_date: '2024-01-01 12:00:00', total_amount: '24.00' }];
  data.order_items = data.products.map((p, i) => ({ order_item_id: `i${i}`, order_id: 'o1', user_id: 'u1', product_id: p.product_id, quantity: '1', item_price: '2.00', item_total: '2.00' }));
  data.reviews[0].product_id = 'p00';
  const result = aggregate(data);
  assert.equal(result.topProducts.length, 10);
  assert.ok(result.topProducts.every(r => r.revenue_rank === 1));
  assert.equal(result.topProducts[0].product_id, 'p00');
  assert.equal(result.topProducts[9].product_id, 'p09');
});

test('exact cents and positive half-up rounding match DECIMAL business calculations', () => {
  assert.equal(cents('0.10') + cents('0.20'), 30);
  assert.equal(roundedRatio(201, 2), 101);
  assert.equal(roundedRatio(200, 3), 67);
  assert.equal(roundedRatio(0, 0), null);
  assert.throws(() => cents('1.001'));
});

test('invalid joins, duplicate keys, missing items, and incorrect amounts fail validation', () => {
  const mutations = [
    data => { data.orders[0].user_id = 'missing'; },
    data => { data.order_items[0].user_id = 'u2'; },
    data => { data.reviews[0].product_id = 'missing'; },
    data => { data.users.push(data.users[0]); },
    data => { data.order_items = data.order_items.filter(i => i.order_id !== 'o1'); },
    data => { data.order_items[0].item_total = '11.00'; },
    data => { data.orders[0].total_amount = '1.00'; },
  ];
  for (const mutation of mutations) {
    const data = fixture(); mutation(data);
    assert.throws(() => aggregate(data));
  }
});

test('zero completed orders preserve SQL null metrics without invalid division', () => {
  const data = fixture();
  data.orders.forEach(o => { o.order_status = 'cancelled'; });
  const result = aggregate(data);
  assert.equal(result.kpis.completed_orders, 0);
  assert.equal(result.kpis.completed_revenue, null);
  assert.equal(result.kpis.completed_aov, null);
  assert.equal(result.kpis.repeat_customer_rate_pct, null);
  assert.deepEqual(result.monthly, []);
});

test('periods recompute repeat customers, revenue, and ranks from selected completed orders', () => {
  const data = fixture();
  data.orders.find(o => o.order_id === 'o2').order_date = '2024-04-01 00:00:00';
  data.orders.find(o => o.order_id === 'o3').order_date = '2025-01-01 00:00:00';
  const q1 = aggregate(data, { year: '2024', quarter: '1' });
  assert.equal(q1.kpis.completed_orders, 1);
  assert.equal(q1.kpis.completed_revenue, 35);
  assert.equal(q1.kpis.completed_aov, 35);
  assert.equal(q1.kpis.repeat_customers, 0);
  assert.equal(q1.kpis.customers_with_completed_orders, 1);
  assert.equal(q1.kpis.repeat_customer_rate_pct, 0);
  assert.equal(q1.topProducts[0].product_id, 'p2');
  const q1BothYears = aggregate(data, { quarter: '1' });
  assert.equal(q1BothYears.kpis.completed_revenue, 45);
  assert.equal(q1BothYears.kpis.repeat_customers, 0);
  assert.equal(q1BothYears.kpis.customers_with_completed_orders, 2);
  assert.equal(q1BothYears.topProducts[0].product_id, 'p1');
  const year = aggregate(data, { year: '2024' });
  assert.equal(year.kpis.completed_revenue, 55);
  assert.equal(year.kpis.repeat_customer_rate_pct, 100);
  const empty = aggregate(data, { year: '2025', quarter: '4' });
  assert.equal(empty.kpis.completed_orders, 0);
  assert.equal(empty.kpis.completed_aov, null);
  assert.equal(empty.kpis.repeat_customer_rate_pct, null);
  assert.deepEqual(empty.topProducts, []);
});

test('quarter and year boundaries use source calendar timestamps without timezone conversion', () => {
  for (const [date, year, quarter] of [
    ['2024-03-31 23:59:59.999999', '2024', '1'],
    ['2024-04-01 00:00:00', '2024', '2'],
    ['2024-07-01 00:00:00', '2024', '3'],
    ['2024-10-01 00:00:00', '2024', '4'],
    ['2024-12-31 23:59:59.999999', '2024', '4'],
    ['2025-01-01 00:00:00', '2025', '1'],
  ]) {
    const order = { order_date: date };
    assert.equal(matchesPeriod(order, { year, quarter }), true);
    assert.equal(matchesPeriod(order, { year: year === '2024' ? '2025' : '2024', quarter }), false);
    assert.equal(matchesPeriod(order, { year, quarter: String(Number(quarter) % 4 + 1) }), false);
  }
});

test('all 15 generated periods reconcile and year/quarter partitions reproduce the baseline', () => {
  const data = JSON.parse(readFileSync(new URL('../src/data/dashboard.json', import.meta.url), 'utf8'));
  assert.equal(Object.keys(data.periods).length, 14);
  for (const [key, view] of Object.entries({ 'all-all': data, ...data.periods })) {
    for (const group of ['monthly', 'categories', 'brands']) {
      assert.equal(view[group].reduce((sum, r) => sum + Math.round(r.completed_revenue * 100), 0), Math.round(view.kpis.completed_revenue * 100), `${key}: ${group}`);
    }
    assert.equal(view.monthly.reduce((sum, r) => sum + r.completed_orders, 0), view.kpis.completed_orders);
    const [year, quarter] = key.split('-');
    assert.ok(view.monthly.every(r => matchesPeriod({ order_date: r.order_month }, { year, quarter })));
    const includesNovember = (year === 'all' || year === '2025') && (quarter === 'all' || quarter === '4');
    assert.equal(view.monthly.some(r => r.order_month === '2025-11'), includesNovember);
  }
  for (const keys of [['2024-all', '2025-all'], ['all-1', 'all-2', 'all-3', 'all-4']]) {
    assert.equal(keys.reduce((sum, key) => sum + Math.round(data.periods[key].kpis.completed_revenue * 100), 0), 241971258);
    assert.equal(keys.reduce((sum, key) => sum + data.periods[key].kpis.completed_orders, 0), 4021);
  }
});

test('approved dataset snapshot matches the independently reviewed baseline', () => {
  const data = JSON.parse(readFileSync(new URL('../src/data/dashboard.json', import.meta.url), 'utf8'));
  assert.deepEqual(data.kpis, { completed_orders: 4021, completed_revenue: 2419712.58, completed_aov: 601.77, customers_with_completed_orders: 3320, repeat_customers: 612, repeat_customer_rate_pct: 18.43 });
  assert.deepEqual(data.validation.rowCounts, { users: 10000, products: 2000, orders: 20000, order_items: 43525, reviews: 15000 });
});

test('standalone aggregate preparation works without source CSVs and rejects a changed snapshot', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const isolated = mkdtempSync(resolve(root, 'tests/.standalone-'));
  assert.ok(resolve(isolated).startsWith(resolve(root, 'tests') + sep));
  try {
    for (const file of ['scripts/aggregate.mjs', 'scripts/analytics.mjs', 'src/data/dashboard.json', 'src/data/provenance.json']) {
      const target = resolve(isolated, file);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(resolve(root, file), target);
    }
    const execute = () => spawnSync(process.execPath, [resolve(isolated, 'scripts/aggregate.mjs')], { cwd: isolated, encoding: 'utf8' });
    const valid = execute();
    assert.equal(valid.status, 0, valid.stderr);
    assert.match(valid.stdout, /Standalone build: verified/);
    const target = resolve(isolated, 'src/data/dashboard.json');
    const changed = JSON.parse(readFileSync(target, 'utf8'));
    changed.kpis.completed_revenue++;
    writeFileSync(target, JSON.stringify(changed));
    const invalid = execute();
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /checksum mismatch/);
  } finally {
    // Only delete the verified temporary test directory beneath this dashboard.
    assert.ok(resolve(isolated).startsWith(resolve(root, 'tests') + sep));
    rmSync(isolated, { recursive: true, force: true });
  }
});
