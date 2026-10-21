import assert from 'node:assert/strict';

export const tables = ['users', 'products', 'orders', 'order_items', 'reviews'];
export const primaryKeys = { users: 'user_id', products: 'product_id', orders: 'order_id', order_items: 'order_item_id', reviews: 'review_id' };
const statuses = new Set(['completed', 'cancelled', 'returned', 'shipped', 'processing']);

// Monetary values stay in integer cents until presentation. No binary-float summation.
export function cents(value) {
  assert.match(String(value), /^\d+(?:\.\d{1,2})?$/, `Invalid monetary value: ${value}`);
  const [whole, fraction = ''] = String(value).split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  assert.ok(Number.isSafeInteger(result) && result > 0, 'Money must be positive safe integer cents');
  return result;
}

export function roundedRatio(numerator, denominator) {
  if (!denominator) return null;
  // Equivalent to MySQL ROUND for these nonnegative exact numeric inputs.
  const n = BigInt(numerator), d = BigInt(denominator);
  return Number((2n * n + d) / (2n * d));
}

export function validateTables(data) {
  const indexes = {};
  const rowCounts = {};
  for (const name of tables) {
    assert.ok(Array.isArray(data[name]) && data[name].length, `Missing or empty table: ${name}`);
    rowCounts[name] = data[name].length;
    indexes[name] = new Map();
    for (const row of data[name]) {
      const id = row[primaryKeys[name]];
      assert.ok(id, `Missing primary key in ${name}`);
      assert.ok(!indexes[name].has(id), `Duplicate primary key in ${name}: ${id}`);
      indexes[name].set(id, row);
      assert.ok(Object.values(row).every(v => v !== '' && v !== null), `Missing value in ${name}: ${id}`);
    }
  }
  for (const p of data.products) cents(p.price);
  for (const u of data.users) assert.match(u.signup_date, /^\d{4}-\d{2}-\d{2}$/);
  const checkDate = value => assert.match(value, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d{1,6})?$/);
  let ordersBeforeSignup = 0, reviewsBeforeOrder = 0;
  for (const o of data.orders) {
    assert.ok(indexes.users.has(o.user_id), `Order user reference: ${o.order_id}`);
    assert.ok(statuses.has(o.order_status), `Unexpected status: ${o.order_status}`);
    cents(o.total_amount);
    checkDate(o.order_date);
    if (o.order_date < indexes.users.get(o.user_id).signup_date) ordersBeforeSignup++;
  }
  const itemSums = new Map(), orderProducts = new Set();
  for (const i of data.order_items) {
    const o = indexes.orders.get(i.order_id);
    assert.ok(o && indexes.products.has(i.product_id) && indexes.users.has(i.user_id), `Item reference: ${i.order_item_id}`);
    assert.equal(i.user_id, o.user_id, `Item user mismatch: ${i.order_item_id}`);
    const quantity = Number(i.quantity);
    assert.ok(Number.isInteger(quantity) && quantity > 0 && quantity <= 255, 'Invalid quantity');
    const total = cents(i.item_total);
    assert.equal(total, quantity * cents(i.item_price), `Item amount mismatch: ${i.order_item_id}`);
    itemSums.set(i.order_id, (itemSums.get(i.order_id) ?? 0) + total);
    orderProducts.add(`${i.order_id}|${i.product_id}`);
  }
  for (const o of data.orders) {
    assert.ok(itemSums.has(o.order_id), `Order without items: ${o.order_id}`);
    assert.equal(cents(o.total_amount), itemSums.get(o.order_id), `Order amount mismatch: ${o.order_id}`);
  }
  for (const r of data.reviews) {
    const o = indexes.orders.get(r.order_id);
    assert.ok(o && indexes.products.has(r.product_id) && indexes.users.has(r.user_id), `Review reference: ${r.review_id}`);
    assert.equal(r.user_id, o.user_id, `Review user mismatch: ${r.review_id}`);
    assert.ok(orderProducts.has(`${r.order_id}|${r.product_id}`), `Reviewed product absent from order: ${r.review_id}`);
    assert.ok(Number.isInteger(Number(r.rating)) && Number(r.rating) >= 1 && Number(r.rating) <= 5, 'Invalid rating');
    checkDate(r.review_date);
    if (r.review_date < o.order_date) reviewsBeforeOrder++;
  }
  return { rowCounts, integrity: 'passed', chronology: { ordersBeforeSignup, reviewsBeforeOrder } };
}

export function matchesPeriod(order, { year = 'all', quarter = 'all' } = {}) {
  return (year === 'all' || order.order_date.slice(0, 4) === String(year)) &&
    (quarter === 'all' || Math.ceil(Number(order.order_date.slice(5, 7)) / 3) === Number(quarter));
}

export function aggregate(data, period = {}, validation = validateTables(data)) {
  const products = new Map(data.products.map(p => [p.product_id, p]));
  const selectedOrders = data.orders.filter(o => matchesPeriod(o, period));
  const completed = selectedOrders.filter(o => o.order_status === 'completed');
  const completedIds = new Set(completed.map(o => o.order_id));
  const revenue = completed.reduce((sum, o) => sum + cents(o.total_amount), 0);
  assert.ok(Number.isSafeInteger(revenue));
  const customerOrders = new Map(), monthGroups = new Map();
  for (const o of completed) {
    customerOrders.set(o.user_id, (customerOrders.get(o.user_id) ?? 0) + 1);
    // Source DATETIME has no timezone. Match DATE_FORMAT(order_date, '%Y-%m').
    const month = o.order_date.slice(0, 7);
    const group = monthGroups.get(month) ?? { order_month: month, completed_orders: 0, revenueCents: 0 };
    group.completed_orders++;
    group.revenueCents += cents(o.total_amount);
    monthGroups.set(month, group);
  }
  const repeat = [...customerOrders.values()].filter(count => count >= 2).length;
  // 03_business_analysis.sql sections 3, 5.
  const kpis = {
    completed_orders: completed.length,
    completed_revenue: completed.length ? revenue / 100 : null,
    completed_aov: completed.length ? roundedRatio(revenue, completed.length) / 100 : null,
    customers_with_completed_orders: customerOrders.size,
    repeat_customers: customerOrders.size ? repeat : null,
    repeat_customer_rate_pct: customerOrders.size ? roundedRatio(repeat * 10000, customerOrders.size) / 100 : null,
  };
  // Section 4.
  const monthly = [...monthGroups.values()].sort((a, b) => a.order_month.localeCompare(b.order_month)).map(g => ({
    order_month: g.order_month, completed_orders: g.completed_orders,
    completed_revenue: g.revenueCents / 100, completed_aov: roundedRatio(g.revenueCents, g.completed_orders) / 100,
  }));
  const categoryGroups = new Map(), brandGroups = new Map(), productGroups = new Map();
  for (const item of data.order_items) {
    if (!completedIds.has(item.order_id)) continue;
    const p = products.get(item.product_id);
    for (const [groups, key, labels] of [
      [categoryGroups, p.category, { category: p.category }],
      [brandGroups, p.brand, { brand: p.brand }],
      [productGroups, p.product_id, { product_id: p.product_id, product_name: p.product_name, category: p.category, brand: p.brand }],
    ]) {
      const group = groups.get(key) ?? { ...labels, orders: new Set(), items_sold: 0, revenueCents: 0 };
      group.orders.add(item.order_id);
      group.items_sold += Number(item.quantity);
      group.revenueCents += cents(item.item_total);
      groups.set(key, group);
    }
  }
  const finish = groups => [...groups.values()].map(({ orders, revenueCents, ...rest }) => ({
    ...rest, completed_orders: orders.size, completed_revenue: revenueCents / 100,
  })).sort((a, b) => b.completed_revenue - a.completed_revenue);
  // Sections 6, 7, 8. Product ranks are calculated before LIMIT 10.
  const categories = finish(categoryGroups), brands = finish(brandGroups);
  const allProducts = finish(productGroups).sort((a, b) => b.completed_revenue - a.completed_revenue || a.product_id.localeCompare(b.product_id));
  let rank = 0, previous = null;
  for (const p of allProducts) {
    if (p.completed_revenue !== previous) rank++;
    p.revenue_rank = rank;
    previous = p.completed_revenue;
  }
  for (const [name, values] of Object.entries({ monthly, categories, brands, products: allProducts })) {
    assert.equal(values.reduce((sum, r) => sum + Math.round(r.completed_revenue * 100), 0), revenue, `${name} revenue does not reconcile`);
  }
  assert.equal(monthly.reduce((sum, r) => sum + r.completed_orders, 0), completed.length);
  const dates = selectedOrders.map(o => o.order_date).sort();
  const coverage = { first_order_date: dates[0] ?? null, last_order_date: dates.at(-1) ?? null };
  const distribution = (entries, total) => entries.map(([label, count]) => ({ label, count, percentage: total ? roundedRatio(count * 10000, total) / 100 : null }));
  const statusDistribution = distribution([...statuses].map(status => [status, selectedOrders.filter(o => o.order_status === status).length]), selectedOrders.length);
  const frequencyCounts = new Map([['1', 0], ['2', 0], ['3', 0], ['4+', 0]]);
  for (const n of customerOrders.values()) { const bucket = n >= 4 ? '4+' : String(n); frequencyCounts.set(bucket, frequencyCounts.get(bucket) + 1); }
  const genderCounts = new Map();
  for (const u of data.users) if (customerOrders.has(u.user_id)) genderCounts.set(u.gender ?? 'Not provided', (genderCounts.get(u.gender ?? 'Not provided') ?? 0) + 1);
  const selectedIds = new Set(selectedOrders.map(o => o.order_id));
  // Match the all-status review population in SQL section 10. Period = related order_date.
  const selectedReviews = data.reviews.filter(r => selectedIds.has(r.order_id));
  const ratingDistribution = distribution([1, 2, 3, 4, 5].map(rating => [String(rating), selectedReviews.filter(r => Number(r.rating) === rating).length]), selectedReviews.length);
  const customerFrequency = distribution([...frequencyCounts], customerOrders.size);
  const customerGender = distribution([...genderCounts].sort(([a], [b]) => a.localeCompare(b)), customerOrders.size);
  assert.equal(customerFrequency[0].count, customerOrders.size - repeat);
  assert.equal(customerFrequency.slice(1).reduce((s, r) => s + r.count, 0), repeat);
  return { coverage, kpis, monthly, categories, brands, topProducts: allProducts.slice(0, 10), validation,
    statusDistribution, customerFrequency, customerGender, ratingDistribution };
}

export function aggregatePeriods(data) {
  const validation = validateTables(data);
  const full = aggregate(data, {}, validation);
  const periods = {};
  for (const year of ['all', '2024', '2025']) {
    for (const quarter of ['all', '1', '2', '3', '4']) {
      if (year === 'all' && quarter === 'all') continue;
      const { validation: _validation, ...view } = aggregate(data, { year, quarter }, validation);
      periods[`${year}-${quarter}`] = view;
    }
  }
  return { ...full, periods };
}
