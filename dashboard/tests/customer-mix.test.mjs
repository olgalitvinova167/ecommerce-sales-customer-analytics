import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { customerMix } from '../src/customer-mix.mjs';

const snapshot = JSON.parse(readFileSync(new URL('../src/data/dashboard.json', import.meta.url), 'utf8'));

test('All periods customer mix matches validated counts and preserves the repeat rate', () => {
  const mix = customerMix(snapshot.kpis);
  assert.equal(mix.total, 3320);
  assert.deepEqual(mix.groups.map(g => [g.count, g.percentage]), [[612, 18.43], [2708, 81.57]]);
  assert.equal(snapshot.kpis.repeat_customer_rate_pct, 18.43);
});

test('customer groups partition purchasing customers for all period selections', () => {
  for (const view of [snapshot, ...Object.values(snapshot.periods)]) {
    const mix = customerMix(view.kpis);
    assert.equal(mix.groups[0].count + mix.groups[1].count, view.kpis.customers_with_completed_orders);
    assert.equal(mix.groups[0].percentage, view.kpis.repeat_customer_rate_pct);
    assert.ok(mix.groups.every(g => g.count >= 0));
  }
});

test('empty purchasing population displays zero counts and undefined percentages', () => {
  const mix = customerMix({ customers_with_completed_orders: 0, repeat_customers: null });
  assert.deepEqual(mix.groups.map(g => [g.count, g.percentage]), [[0, null], [0, null]]);
});
