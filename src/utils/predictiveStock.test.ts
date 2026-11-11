import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePredictiveStockInsights, calculateProfileDailyConsumption } from './predictiveStock.ts';
import { INITIAL_STOCK_PROFILES, INITIAL_SAMPLE_ORDERS } from '../data/catalog.ts';

test('calculateProfileDailyConsumption returns baseline rate for standard profiles', () => {
  const rate = calculateProfileDailyConsumption('SU-001', INITIAL_SAMPLE_ORDERS);
  assert.ok(rate > 0);
  assert.equal(typeof rate, 'number');
});

test('generatePredictiveStockInsights computes runout days and priorities', () => {
  const insights = generatePredictiveStockInsights(INITIAL_STOCK_PROFILES, INITIAL_SAMPLE_ORDERS, 10);
  assert.equal(insights.totalProfilesMonitored, INITIAL_STOCK_PROFILES.length);
  assert.ok(insights.topPriorityProfiles.length > 0);

  const top = insights.topPriorityProfiles[0];
  assert.ok(top.profileCode);
  assert.ok(top.daysUntilStockout >= 0);
  assert.ok(top.reorderPointBars >= 0);
  assert.ok(top.reasoning.length > 0);
});
