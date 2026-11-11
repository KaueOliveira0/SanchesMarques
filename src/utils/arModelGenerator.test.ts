import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  buildWindowDoor3DGroup,
  createAluminumMaterial,
  createGlassMaterial,
  createArExportFileName,
  generateARWhatsAppMessage,
  exportToUSDZ,
  setExplodedViewProgress,
  ARModelConfig,
} from './arModelGenerator';

test('createAluminumMaterial configures correct PBR roughness and metalness for colors', () => {
  const matPreto = createAluminumMaterial('Preto');
  assert.equal(matPreto.name, 'Aluminio_Preto');
  assert.ok(matPreto.metalness > 0.7);

  const matBranco = createAluminumMaterial('Branco');
  assert.equal(matBranco.name, 'Aluminio_Branco');
  assert.ok(matBranco.metalness < 0.3); // Eletrostático menos metálico

  const matBronze = createAluminumMaterial('Bronze');
  assert.equal(matBronze.name, 'Aluminio_Bronze');
  assert.ok(matBronze.metalness > 0.8);
});

test('createGlassMaterial assigns appropriate transparency and tints', () => {
  const glassIncolor = createGlassMaterial('incolor');
  assert.equal(glassIncolor.transparent, true);
  assert.ok(glassIncolor.opacity < 0.4);

  const glassFume = createGlassMaterial('fume');
  assert.equal(glassFume.transparent, true);
  assert.ok(glassFume.opacity >= 0.5);

  const glassRefletivo = createGlassMaterial('refletivo_champagne');
  assert.ok(glassRefletivo.metalness >= 0.6); // Refletivo metálico
});

test('buildWindowDoor3DGroup creates a valid THREE.Group with outer frame and children', () => {
  const config: ARModelConfig = {
    typologyId: 'typ_cor2_gold',
    typologyName: 'Porta de Correr 2 Folhas Móveis (Linha Gold)',
    series: 'Linha Gold',
    widthMm: 2000,
    heightMm: 2200,
    aluminumColor: 'Preto',
    glassTint: 'incolor',
  };

  const group = buildWindowDoor3DGroup(config);
  assert.ok(group instanceof THREE.Group);
  assert.equal(group.name, 'Esquadria_typ_cor2_gold');

  // Verifica se o marco perimetral foi criado
  const frame = group.getObjectByName('Marco_Perimetral');
  assert.ok(frame, 'Marco_Perimetral deve existir');
  assert.equal(frame.children.length, 4, 'Deve conter soleira, marco superior e 2 montantes');

  // Verifica se as folhas foram criadas
  const leafLeft = group.getObjectByName('Folha_Esquerda');
  const leafRight = group.getObjectByName('Folha_Direita');
  assert.ok(leafLeft, 'Folha_Esquerda deve existir');
  assert.ok(leafRight, 'Folha_Direita deve existir');
});

test('buildWindowDoor3DGroup handles pivot door with lambri and vertical handle', () => {
  const config: ARModelConfig = {
    typologyId: 'typ_piv_acm',
    typologyName: 'Porta Pivotante em ACM & Lambri Ripado',
    series: 'Linha Premium ACM',
    widthMm: 1400,
    heightMm: 2800,
    aluminumColor: 'Amadeirado',
    glassTint: 'incolor',
  };

  const group = buildWindowDoor3DGroup(config);
  const pivotLeaf = group.getObjectByName('Folha_Pivotante');
  assert.ok(pivotLeaf, 'Folha_Pivotante deve existir');
  assert.ok(pivotLeaf.children.length > 5, 'Deve conter painel, frisos de lambri e puxador inox');
});

test('createArExportFileName creates clean sanitized filename for GLB and USDZ', () => {
  const fnGlb = createArExportFileName('Janela de Correr 2 Folhas (Suprema)', 1500, 1200, 'Preto', 'glb');
  assert.match(fnGlb, /^janela_de_correr_2_folhas.*_1500x1200_preto\.glb$/);

  const fnUsdz = createArExportFileName('Porta Pivotante ACM', 1200, 2400, 'Bronze', 'usdz');
  assert.match(fnUsdz, /^porta_pivotante_acm_1200x2400_bronze\.usdz$/);
});

test('generateARWhatsAppMessage includes model, dimensions in meters and instructions', () => {
  const config: ARModelConfig = {
    typologyId: 'typ_cor2_gold',
    typologyName: 'Porta de Correr 2 Folhas',
    series: 'Linha Gold',
    widthMm: 2000,
    heightMm: 2200,
    aluminumColor: 'Preto',
    glassTint: 'fume',
  };

  const msgIos = generateARWhatsAppMessage(config, 'Eng. Carlos', 'USDZ');
  assert.ok(msgIos.includes('VISUALIZAÇÃO EM REALIDADE AUMENTADA'));
  assert.ok(msgIos.includes('2000 × 2200 mm'));
  assert.ok(msgIos.includes('No iPhone ou iPad'));

  const msgAndroid = generateARWhatsAppMessage(config, 'Mariana', 'GLB');
  assert.ok(msgAndroid.includes('No Celular Android'));
  assert.ok(msgAndroid.includes('Google Scene Viewer'));
});

test('exportToUSDZ produces a valid Blob with model/vnd.usdz+zip type', async () => {
  const config: ARModelConfig = {
    typologyId: 'typ_cor2_gold',
    typologyName: 'Janela 2 Folhas',
    series: 'Suprema',
    widthMm: 1200,
    heightMm: 1000,
    aluminumColor: 'Preto',
    glassTint: 'incolor',
  };

  const group = buildWindowDoor3DGroup(config);
  const blob = await exportToUSDZ(group);
  assert.ok(blob instanceof Blob);
  assert.equal(blob.type, 'model/vnd.usdz+zip');
  assert.ok(blob.size > 1000, 'USDZ deve conter dados compactados da geometria e materiais');
});

test('setExplodedViewProgress dynamically separates and restores subcomponents', () => {
  const config: ARModelConfig = {
    typologyId: 'typ_cor2_gold',
    typologyName: 'Janela de Correr 2 Folhas (Suprema)',
    series: 'Linha Suprema',
    widthMm: 1500,
    heightMm: 1200,
    aluminumColor: 'Preto',
    glassTint: 'incolor',
  };

  const group = buildWindowDoor3DGroup(config);
  const header = group.getObjectByName('Marco_Superior_Cabecalho') as THREE.Mesh;
  const sill = group.getObjectByName('Trilho_Inferior_Soleira') as THREE.Mesh;
  const glassLeft = group.getObjectByName('Vidro_Folha_Esquerda') as THREE.Mesh;

  assert.ok(header, 'Marco Superior deve existir');
  assert.ok(sill, 'Trilho Inferior deve existir');
  assert.ok(glassLeft, 'Vidro da Folha Esquerda deve existir');

  const initialHeaderY = header.position.y;
  const initialSillY = sill.position.y;
  const initialGlassZ = glassLeft.position.z;

  // Aplica 100% de explosão
  setExplodedViewProgress(group, 1.0);
  assert.ok(header.position.y > initialHeaderY + 0.3, 'Marco superior deve subir na explosão');
  assert.ok(sill.position.y < initialSillY - 0.3, 'Trilho inferior deve descer na explosão');
  assert.notEqual(glassLeft.position.z, initialGlassZ, 'Vidro deve se separar no eixo Z');

  // Aplica 50% de explosão intermediária
  setExplodedViewProgress(group, 0.5);
  const midHeaderY = header.position.y;
  assert.ok(midHeaderY > initialHeaderY && midHeaderY < initialHeaderY + 0.35);

  // Retorna para montado (0%)
  setExplodedViewProgress(group, 0.0);
  assert.equal(header.position.y, initialHeaderY, 'Marco superior deve retornar à posição original');
  assert.equal(sill.position.y, initialSillY, 'Trilho inferior deve retornar à posição original');
  assert.equal(glassLeft.position.z, initialGlassZ, 'Vidro deve retornar à posição original');
});
