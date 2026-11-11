import test from 'node:test';
import assert from 'node:assert/strict';
import {
  optimizeGlassCutting,
  DEFAULT_GLASS_OPTIONS,
  GlassCutPieceInput,
  extractGlassPiecesFromOrders,
} from './glass2DOptimizer';
import { Order, TypologyItem } from '../types';

test('optimizeGlassCutting packs standard window glass pieces with guillotine cuts', () => {
  const pieces: GlassCutPieceInput[] = [
    {
      id: 'p1',
      label: 'Janela Quarto',
      widthMm: 600,
      heightMm: 1000,
      quantity: 2,
      allowRotation: true,
      orderNumber: 101,
      clientName: 'Residencial Alphaville',
    },
    {
      id: 'p2',
      label: 'Maxim-Ar Banheiro',
      widthMm: 500,
      heightMm: 500,
      quantity: 2,
      allowRotation: true,
      orderNumber: 101,
    },
  ];

  const result = optimizeGlassCutting(pieces, {
    ...DEFAULT_GLASS_OPTIONS,
    sheetWidthMm: 2200,
    sheetHeightMm: 1600,
  });

  assert.equal(result.totalPiecesRequested, 4, 'Should request 4 pieces');
  assert.equal(result.totalPiecesPlaced, 4, 'All 4 pieces should fit in 1 commercial sheet');
  assert.equal(result.totalSheets, 1, 'Should use only 1 sheet');
  assert.ok(result.overallUtilizationPct > 30, 'Utilization should be calculated');
  assert.equal(result.unplacedPieces.length, 0, 'No pieces should be unplaced');

  const sheet = result.sheets[0];
  assert.equal(sheet.placedPieces.length, 4);

  // Check that no placed pieces overlap
  for (let i = 0; i < sheet.placedPieces.length; i++) {
    for (let j = i + 1; j < sheet.placedPieces.length; j++) {
      const a = sheet.placedPieces[i];
      const b = sheet.placedPieces[j];

      const overlap = !(
        a.x + a.width <= b.x ||
        b.x + b.width <= a.x ||
        a.y + a.height <= b.y ||
        b.y + b.height <= a.y
      );
      assert.equal(overlap, false, `Piece ${a.label} and ${b.label} should not overlap`);
    }
  }
});

test('optimizeGlassCutting respects rotation restrictions', () => {
  const pieceNoRotation: GlassCutPieceInput[] = [
    {
      id: 'p_text',
      label: 'Vidro Canelado Vertical',
      widthMm: 1500,
      heightMm: 400,
      quantity: 1,
      allowRotation: false,
    },
  ];

  const result = optimizeGlassCutting(pieceNoRotation, {
    ...DEFAULT_GLASS_OPTIONS,
    sheetWidthMm: 2000,
    sheetHeightMm: 1000,
    allowGlobalRotation: false,
  });

  assert.equal(result.totalPiecesPlaced, 1);
  const placed = result.sheets[0].placedPieces[0];
  assert.equal(placed.rotated, false, 'Should not rotate piece when rotation is forbidden');
  assert.equal(placed.width, 1500);
  assert.equal(placed.height, 400);
});

test('optimizeGlassCutting identifies useful remnants and scrap accurately', () => {
  const pieces: GlassCutPieceInput[] = [
    {
      id: 'p_large',
      label: 'Folha Fixa',
      widthMm: 1200,
      heightMm: 1000,
      quantity: 1,
      allowRotation: true,
    },
  ];

  const result = optimizeGlassCutting(pieces, {
    ...DEFAULT_GLASS_OPTIONS,
    sheetWidthMm: 2200,
    sheetHeightMm: 1600,
    minUsefulRemnantWidthMm: 400,
    minUsefulRemnantHeightMm: 400,
  });

  const sheet = result.sheets[0];
  assert.ok(sheet.remnants.length > 0, 'Should calculate remnants');

  const usefulRemnants = sheet.remnants.filter((r) => r.isUseful);
  assert.ok(usefulRemnants.length > 0, 'Should have at least 1 useful remnant of significant size');
  assert.ok(sheet.usefulRemnantAreaM2 > 0, 'Useful remnant area should be greater than zero');
});

test('optimizeGlassCutting handles pieces larger than the raw sheet gracefully', () => {
  const hugePiece: GlassCutPieceInput[] = [
    {
      id: 'p_huge',
      label: 'Fachada Monumental',
      widthMm: 4000,
      heightMm: 3000,
      quantity: 1,
      allowRotation: true,
    },
  ];

  const result = optimizeGlassCutting(hugePiece, {
    ...DEFAULT_GLASS_OPTIONS,
    sheetWidthMm: 2200,
    sheetHeightMm: 1600,
  });

  assert.equal(result.totalPiecesPlaced, 0, 'Cannot place piece larger than sheet');
  assert.equal(result.unplacedPieces.length, 1, 'Should register unplaced piece');
  assert.equal(result.unplacedPieces[0].id, 'p_huge');
});

test('extractGlassPiecesFromOrders extracts glass cuts from orders with formulas', () => {
  const dummyTypology: TypologyItem = {
    id: 'typ_suprema_j2',
    code: 'J2-SUP',
    name: 'Janela 2 Folhas Suprema',
    series: 'Suprema',
    category: 'Janela de Correr',
    previewSvg: '',
    description: '',
    formula: {
      cuts: [],
      glass: [
        {
          description: 'Vidro da Folha',
          quantity: 2,
          formulaW: (w) => Math.round(w / 2 - 95),
          formulaH: (_, h) => Math.round(h - 145),
        },
      ],
      accessories: [],
    },
  };

  const dummyOrders: Order[] = [
    {
      id: 'ord_1',
      number: 201,
      clientName: 'Edifício Horizon',
      clientPhone: '11999999999',
      clientAddress: 'Rua das Flores 100',
      createdAt: '2026-10-31',
      deliveryDate: '2026-11-20',
      status: 'Em Produção',
      color: 'Preto',
      totalWeightKg: 40,
      totalGlassM2: 2.8,
      materialCost: 800,
      laborCost: 400,
      items: [
        {
          id: 'item_1',
          typologyId: 'typ_suprema_j2',
          typologyName: 'Janela 2 Folhas Suprema',
          width: 1500,
          height: 1200,
          quantity: 2,
          roomTag: 'Sala de Estar',
          color: 'Preto',
          glassId: 'vid_4mm_incolor',
          glassType: 'Vidro Incolor 4mm',
        },
      ],
      subtotal: 1200,
      finalPrice: 1500,
      history: [],
    },
  ];

  const extracted = extractGlassPiecesFromOrders(dummyOrders, [dummyTypology]);
  assert.equal(extracted.length, 1);
  assert.equal(extracted[0].orderNumber, 201);
  assert.equal(extracted[0].widthMm, 655); // (1500 / 2) - 95 = 655
  assert.equal(extracted[0].heightMm, 1055); // 1200 - 145 = 1055
  assert.equal(extracted[0].quantity, 4); // 2 sheets per window * 2 windows = 4 sheets
});
