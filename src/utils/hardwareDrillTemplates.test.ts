import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HARDWARE_DRILL_TEMPLATES,
  filterHardwareTemplates,
} from './hardwareDrillTemplates';

test('HARDWARE_DRILL_TEMPLATES defines templates with dimensions, tooling and step by step instructions', () => {
  assert.ok(HARDWARE_DRILL_TEMPLATES.length >= 5);
  const concha = HARDWARE_DRILL_TEMPLATES.find((t) => t.id === 'fec_con_100_udinese');
  assert.ok(concha);
  assert.equal(concha?.manufacturer, 'Udinese');
  assert.equal(concha?.faceSlotDimensions.lengthMm, 190);
  assert.equal(concha?.faceSlotDimensions.widthMm, 25);
  assert.ok(concha?.stepByStepInstructions.length && concha?.stepByStepInstructions.length >= 3);
});

test('filterHardwareTemplates filters by manufacturer, category, series and search term', () => {
  const udineseOnly = filterHardwareTemplates(HARDWARE_DRILL_TEMPLATES, { manufacturer: 'Udinese' });
  assert.ok(udineseOnly.length > 0);
  assert.ok(udineseOnly.every((t) => t.manufacturer === 'Udinese'));

  const goldSeriesOnly = filterHardwareTemplates(HARDWARE_DRILL_TEMPLATES, { series: 'Linha Gold' });
  assert.ok(goldSeriesOnly.length > 0);
  assert.ok(goldSeriesOnly.every((t) => t.compatibleSeries.includes('Linha Gold')));

  const searchPapaiz = filterHardwareTemplates(HARDWARE_DRILL_TEMPLATES, { searchTerm: 'Papaiz' });
  assert.equal(searchPapaiz.length, 1);
  assert.equal(searchPapaiz[0].id, 'fechadura_323_papaiz_udinese');
});
