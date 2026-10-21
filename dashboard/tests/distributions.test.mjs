import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const data = JSON.parse(readFileSync(new URL('../src/data/dashboard.json', import.meta.url), 'utf8'));

test('new full-dataset distributions match independent processed-file counts', () => {
  assert.deepEqual(data.customerFrequency.map(r => r.count), [2708, 527, 81, 4]);
  assert.deepEqual(data.ratingDistribution.map(r => r.count), [594, 2084, 4289, 4624, 3409]);
  assert.deepEqual(Object.fromEntries(data.customerGender.map(r => [r.label, r.count])), { Female: 1141, Male: 1074, Other: 1105 });
  assert.equal(data.statusDistribution.find(r => r.label === 'cancelled').percentage, 19.6);
  assert.equal(data.statusDistribution.find(r => r.label === 'returned').percentage, 20.33);
});

test('every period partitions the purchasing population and preserves existing repeat rate', () => {
  for (const view of [data, ...Object.values(data.periods)]) {
    assert.equal(view.customerFrequency.reduce((s,r) => s+r.count,0), view.kpis.customers_with_completed_orders);
    assert.equal(view.customerFrequency.slice(1).reduce((s,r) => s+r.count,0), view.kpis.repeat_customers);
    assert.equal(view.customerFrequency[0].count, view.kpis.customers_with_completed_orders - view.kpis.repeat_customers);
    assert.equal(view.customerGender.reduce((s,r) => s+r.count,0), view.kpis.customers_with_completed_orders);
    assert.equal(view.statusDistribution.find(r => r.label === 'completed').count, view.kpis.completed_orders);
  }
});
