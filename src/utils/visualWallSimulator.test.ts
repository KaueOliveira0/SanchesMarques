import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WALL_SAMPLE_PHOTOS,
  GLASS_TINT_STYLES,
  ALUMINUM_COLOR_PALETTE,
  DEFAULT_SIMULATION_STATE,
  generateSimulationWhatsAppMessage,
} from './visualWallSimulator';

test('WALL_SAMPLE_PHOTOS contains realistic sample environments with coordinate percentages', () => {
  assert.ok(WALL_SAMPLE_PHOTOS.length >= 4);
  const sample = WALL_SAMPLE_PHOTOS[0];
  assert.ok(sample.url.startsWith('https://'));
  assert.ok(sample.defaultOpening.xPct >= 0 && sample.defaultOpening.xPct <= 100);
  assert.ok(sample.defaultOpening.widthPct > 0);
});

test('GLASS_TINT_STYLES and ALUMINUM_COLOR_PALETTE define all standard options', () => {
  assert.ok(GLASS_TINT_STYLES.incolor);
  assert.ok(GLASS_TINT_STYLES.verde);
  assert.ok(GLASS_TINT_STYLES.fume);
  assert.ok(GLASS_TINT_STYLES.refletivo_champagne);

  assert.ok(ALUMINUM_COLOR_PALETTE.Preto);
  assert.ok(ALUMINUM_COLOR_PALETTE.Branco);
  assert.ok(ALUMINUM_COLOR_PALETTE.Amadeirado);
  assert.ok(ALUMINUM_COLOR_PALETTE.Bronze);
});

test('generateSimulationWhatsAppMessage outputs formatted proposal with company, model and finishes', () => {
  const msg = generateSimulationWhatsAppMessage(DEFAULT_SIMULATION_STATE, 'Arq. Fernanda Lima', 1042);
  assert.ok(msg.includes('SIMULAÇÃO VISUAL DE ESQUADRIA'));
  assert.ok(msg.includes('Arq. Fernanda Lima'));
  assert.ok(msg.includes('OP #1042'));
  assert.ok(msg.includes('Porta de Correr 2 Folhas Móveis'));
  assert.ok(msg.includes('Preto Fosco'));
});
