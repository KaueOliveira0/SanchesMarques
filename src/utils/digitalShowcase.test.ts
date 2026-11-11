import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SHOWCASE_PRODUCTS,
  generateWishlistWhatsAppQuote,
  WishlistItem,
} from './digitalShowcase';

test('SHOWCASE_PRODUCTS contains premium products across all popular categories', () => {
  assert.ok(SHOWCASE_PRODUCTS.length >= 6);
  const acmDoor = SHOWCASE_PRODUCTS.find((p) => p.id === 'sc_porta_piv_acm');
  assert.ok(acmDoor);
  assert.equal(acmDoor?.category, 'portas_pivotantes');
  assert.ok(acmDoor?.specifications.length && acmDoor?.specifications.length >= 3);
  assert.ok(acmDoor?.estimatedPriceRange.max > acmDoor?.estimatedPriceRange.min);
});

test('generateWishlistWhatsAppQuote formats structured WhatsApp message with wishlist items and total', () => {
  const sampleWishlist: WishlistItem[] = [
    {
      productId: 'sc_porta_piv_acm',
      productName: 'Porta Pivotante em ACM',
      series: 'Linha Premium ACM',
      categoryLabel: 'Portas de Entrada',
      widthMm: 1400,
      heightMm: 2800,
      quantity: 1,
      color: 'Amadeirado',
      glassType: 'Vidro Refletivo Champanhe',
      estimatedUnitPrice: 5500,
    },
    {
      productId: 'sc_janela_integrada_mot',
      productName: 'Janela Integrada Motorizada',
      series: 'Linha Suprema Integrada',
      categoryLabel: 'Persianas Integradas',
      widthMm: 1500,
      heightMm: 1200,
      quantity: 2,
      color: 'Preto',
      glassType: 'Vidro Temperado 6mm',
      estimatedUnitPrice: 2800,
    },
  ];

  const msg = generateWishlistWhatsAppQuote(sampleWishlist, 'Mariana Costa', '(11) 98765-4321', 'Alphaville Residencial 2');
  assert.ok(msg.includes('LISTA DE DESEJOS'));
  assert.ok(msg.includes('Mariana Costa'));
  assert.ok(msg.includes('(11) 98765-4321'));
  assert.ok(msg.includes('Porta Pivotante em ACM'));
  assert.ok(msg.includes('Janela Integrada Motorizada'));
  // Total = 5500 + 2*2800 = 11100
  assert.ok(msg.includes('11.100,00'));
});
