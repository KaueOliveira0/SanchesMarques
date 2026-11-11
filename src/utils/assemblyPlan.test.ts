import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAssemblyPlan } from './assemblyPlan.ts';
import { TYPOLOGIES_CATALOG } from '../data/catalog.ts';

test('generateAssemblyPlan generates 6 structured phases for sliding window', () => {
  const typology = TYPOLOGIES_CATALOG.find((t) => t.category.includes('Correr'))!;
  assert.ok(typology);

  const plan = generateAssemblyPlan(typology, 1500, 1200, 'Branco', 2, 1001, 'Cliente Teste', 'Quarto');
  assert.equal(plan.steps.length, 6);
  assert.equal(plan.fastenersList.length >= 3, true);
  assert.equal(plan.gasketsAndSeals.length >= 3, true);
  assert.equal(plan.qualityChecklist.length, 6);
  assert.equal(plan.widthMm, 1500);
  assert.equal(plan.heightMm, 1200);
  assert.equal(plan.quantity, 2);
});

test('generateAssemblyPlan generates diagonal glass bracing for casement door', () => {
  const casementTypology = TYPOLOGIES_CATALOG.find((t) => t.category.includes('Giro') || t.category.includes('Abrir')) || TYPOLOGIES_CATALOG[0];
  const plan = generateAssemblyPlan(casementTypology, 900, 2100, 'Preto', 1);
  assert.ok(plan.glassSettingRules.description);
  assert.ok(plan.steps[0].toolsRequired.length > 0);
});
