import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeHeaderKey,
  parseLocaleNumber,
  detectColumnMapping,
  parseCsvRows,
  parseJsonCatalog,
  parseRawCatalogFile,
  integrateImportedProfiles,
  inferCategory,
  inferSeries,
  normalizeCuttingAngle,
  generateSampleCsv,
  generateSampleJson,
} from './catalogImporter.ts';
import { ProfileDefinition } from '../types/index.ts';

test('normalizeHeaderKey cleans accents, casing, and special characters', () => {
  assert.equal(normalizeHeaderKey('CÓDIGO'), 'codigo');
  assert.equal(normalizeHeaderKey('Preço R$/kg'), 'preco_r$/kg');
  assert.equal(normalizeHeaderKey('  Dimensão (mm)  '), 'dimensao_mm');
  assert.equal(normalizeHeaderKey('Ângulo de Corte'), 'angulo_de_corte');
  assert.equal(normalizeHeaderKey('Peso Linear (kg/m)'), 'peso_linear_kg/m');
});

test('parseLocaleNumber handles Brazilian and international formats', () => {
  assert.equal(parseLocaleNumber('0,745'), 0.745);
  assert.equal(parseLocaleNumber('38,50'), 38.50);
  assert.equal(parseLocaleNumber('R$ 42,90'), 42.90);
  assert.equal(parseLocaleNumber('1.250,50'), 1250.50);
  assert.equal(parseLocaleNumber('0.812'), 0.812);
  assert.equal(parseLocaleNumber(45.5), 45.5);
  assert.equal(parseLocaleNumber('invalid'), null);
  assert.equal(parseLocaleNumber(''), null);
});

test('detectColumnMapping detects standard and variations of aluminum column names', () => {
  const headers = [
    'Ref_Perfil',
    'Denominação Técnica',
    'Bitola / Dimensões',
    'kg/m',
    'Custo R$/kg',
    'Grau de Corte',
    'Usinagens e Furos',
    'Sistema',
  ];

  const mapping = detectColumnMapping(headers);
  assert.equal(mapping.codeCol, 'Ref_Perfil');
  assert.equal(mapping.nameCol, 'Denominação Técnica');
  assert.equal(mapping.dimensionsCol, 'Bitola / Dimensões');
  assert.equal(mapping.kgmCol, 'kg/m');
  assert.equal(mapping.priceKgCol, 'Custo R$/kg');
  assert.equal(mapping.cuttingAnglesCol, 'Grau de Corte');
  assert.equal(mapping.machiningCol, 'Usinagens e Furos');
  assert.equal(mapping.seriesCol, 'Sistema');
});

test('detectColumnMapping detects bar weight when linear weight is absent', () => {
  const headers = ['Codigo', 'Descricao', 'Peso_Barra_6m', 'Custo_Barra'];
  const mapping = detectColumnMapping(headers);
  assert.equal(mapping.codeCol, 'Codigo');
  assert.equal(mapping.barWeightCol, 'Peso_Barra_6m');
  assert.equal(mapping.barCostCol, 'Custo_Barra');
});

test('parseCsvRows handles semicolon and quoted fields', () => {
  const sampleCsv = generateSampleCsv();
  const { headers, rows } = parseCsvRows(sampleCsv);
  assert.ok(headers.length >= 7);
  assert.equal(rows.length, 8);
  assert.equal(rows[0]['Codigo'], 'BEL-001');
  assert.equal(rows[0]['Categoria'], 'Marco');
});

test('parseRawCatalogFile parses CSV and computes kg/m and prices properly', () => {
  const csvContent = [
    'Cod;Nome;Secao;Peso_Barra;Custo_Barra;Corte',
    'AL-100;Marco Superior;40x60mm;4,800;192,00;45° / 45°',
    'AL-200;Montante Fecho;32x50mm;3,600;144,00;90° / 90°',
  ].join('\n');

  const result = parseRawCatalogFile(csvContent, 'Tabela_Alcoa.csv');
  assert.equal(result.format, 'csv');
  assert.equal(result.profiles.length, 2);

  const p1 = result.profiles[0];
  assert.equal(p1.code, 'AL-100');
  assert.equal(p1.name, 'Marco Superior');
  assert.equal(p1.kgm, 0.8); // 4.8 / 6 = 0.8
  assert.equal(p1.pricePerKg, 40); // 192 / (0.8 * 6) = 40
  assert.equal(p1.dimensions, '40x60mm');
  assert.equal(p1.cuttingAngles, '45° / 45° (Meia-esquadria)');
  assert.equal(p1.isValid, true);
});

test('parseJsonCatalog parses JSON with profiles and typologies with dynamic cuts formulas', () => {
  const jsonContent = generateSampleJson();
  const result = parseJsonCatalog(jsonContent);

  assert.equal(result.format, 'json');
  assert.equal(result.supplierName, 'Hydro Alumínio Brasil - Catálogo 2026');
  assert.equal(result.profiles.length, 4);
  assert.equal(result.typologies.length, 1);

  const typo = result.typologies[0];
  assert.equal(typo.code, 'J-COR-2F-HYD');
  assert.equal(typo.formula.cuts.length, 4);

  // Testa a fórmula de corte compilada dinamicamente:
  // HYD-101: Marco Superior formulaExpr 'W'
  const cut1 = typo.formula.cuts.find((c) => c.profileCode === 'HYD-101')!;
  assert.equal(cut1.formula(1500, 1200), 1500);

  // HYD-120: Montante Lateral formulaExpr 'H - 42'
  const cut2 = typo.formula.cuts.find((c) => c.profileCode === 'HYD-120')!;
  assert.equal(cut2.formula(1500, 1200), 1158);

  // HYD-130: Travessa formulaExpr 'W / 2 + 10' -> 1500 / 2 = 750 (ou arredondado)
  const cut3 = typo.formula.cuts.find((c) => c.profileCode === 'HYD-130')!;
  assert.ok(cut3.formula(1500, 1200) > 0);
});

test('inferCategory and inferSeries work accurately', () => {
  assert.equal(inferCategory('Marco Lateral 2 Planos', 'SU-001'), 'Marco');
  assert.equal(inferCategory('Trilho Inferior c/ Dreno', 'GL-003'), 'Trilho');
  assert.equal(inferCategory('Montante Mão de Amigo', 'CHR-040'), 'Montante');
  assert.equal(inferCategory('Baguete Redondo Pressão', 'BG-002'), 'Baguate');
  assert.equal(inferCategory('Tubo Retangular 50x25', 'TB-025'), 'Comercial');

  assert.equal(inferSeries('CHR-001', 'Marco Chroma'), 'Chroma');
  assert.equal(inferSeries('SU-053', 'Montante Suprema'), 'Suprema');
  assert.equal(inferSeries('LG-020', 'Folha Gold'), 'Gold');
});

test('normalizeCuttingAngle maps common angles', () => {
  assert.equal(normalizeCuttingAngle('45° / 45°'), '45° / 45° (Meia-esquadria)');
  assert.equal(normalizeCuttingAngle('90° / 90°'), '90° / 90° (Corte Reto)');
  assert.equal(normalizeCuttingAngle('45 e 90'), '45° / 90° (Misto)');
});

test('integrateImportedProfiles merges and deduplicates profiles seamlessly', () => {
  const current: ProfileDefinition[] = [
    {
      id: 'su001',
      code: 'SU-001',
      name: 'Marco Antigo',
      series: 'Suprema',
      category: 'Marco',
      kgm: 0.582,
      defaultLength: 6000,
      pricePerKg: 35.0,
    },
  ];

  const imported = [
    {
      id: 'imp_su001',
      code: 'SU-001',
      name: 'Marco Atualizado com Custo Novo',
      series: 'Suprema',
      category: 'Marco',
      kgm: 0.582,
      defaultLength: 6000,
      pricePerKg: 38.5,
      isValid: true,
      validationErrors: [],
    },
    {
      id: 'imp_su002',
      code: 'SU-002',
      name: 'Marco Superior',
      series: 'Suprema',
      category: 'Marco',
      kgm: 0.54,
      defaultLength: 6000,
      pricePerKg: 38.5,
      isValid: true,
      validationErrors: [],
    },
  ];

  const result = integrateImportedProfiles(imported, current);
  assert.equal(result.updatedProfiles.length, 2);
  assert.equal(result.addedCount, 1);
  assert.equal(result.updatedCount, 1);

  const updatedSu001 = result.updatedProfiles.find((p) => p.code === 'SU-001')!;
  assert.equal(updatedSu001.pricePerKg, 38.5);
  assert.equal(updatedSu001.name, 'Marco Atualizado com Custo Novo');
});
