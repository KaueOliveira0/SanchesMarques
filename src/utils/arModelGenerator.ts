import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';
import { ColorFinish } from '../types';
import { ALUMINUM_COLOR_PALETTE, GLASS_TINT_STYLES } from './visualWallSimulator';
import { getEffectiveCompanyProfile } from './companyProfile';

export interface ARModelConfig {
  typologyId: string;
  typologyName: string;
  series: string;
  widthMm: number;
  heightMm: number;
  depthMm?: number;
  aluminumColor: ColorFinish;
  glassTint: 'incolor' | 'verde' | 'fume' | 'refletivo_champagne' | 'refletivo_azul';
  includeHandles?: boolean;
}

export interface ARMaterials {
  aluminum: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  hardware: THREE.MeshStandardMaterial;
  rubber: THREE.MeshStandardMaterial;
}

/**
 * Mapeia as cores de alumínio brasileiras para propriedades PBR realistas
 */
export function createAluminumMaterial(color: ColorFinish): THREE.MeshStandardMaterial {
  const palette = ALUMINUM_COLOR_PALETTE[color] || ALUMINUM_COLOR_PALETTE.Preto;

  let roughness = 0.28;
  let metalness = 0.85;

  switch (color) {
    case 'Preto':
      roughness = 0.32;
      metalness = 0.82;
      break;
    case 'Branco':
      roughness = 0.22;
      metalness = 0.15; // Pintura eletrostática brilhante
      break;
    case 'Bronze':
      roughness = 0.35;
      metalness = 0.88;
      break;
    case 'Natural':
      roughness = 0.25;
      metalness = 0.92;
      break;
    case 'Amadeirado':
      roughness = 0.45;
      metalness = 0.2;
      break;
  }

  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(palette.hex),
    roughness,
    metalness,
    name: `Aluminio_${color}`,
  });
}

/**
 * Mapeia as tonalidades de vidro para materiais PBR
 */
export function createGlassMaterial(
  glassTint: 'incolor' | 'verde' | 'fume' | 'refletivo_champagne' | 'refletivo_azul'
): THREE.MeshStandardMaterial {
  let color = 0xcae9ff;
  let opacity = 0.35;
  let metalness = 0.1;
  let roughness = 0.05;

  switch (glassTint) {
    case 'verde':
      color = 0x2ec4b6;
      opacity = 0.45;
      break;
    case 'fume':
      color = 0x343a40;
      opacity = 0.65;
      roughness = 0.08;
      break;
    case 'refletivo_champagne':
      color = 0xd4af37;
      opacity = 0.55;
      metalness = 0.65;
      roughness = 0.04;
      break;
    case 'refletivo_azul':
      color = 0x1d3557;
      opacity = 0.55;
      metalness = 0.7;
      roughness = 0.04;
      break;
    case 'incolor':
    default:
      color = 0xe0f2fe;
      opacity = 0.3;
      break;
  }

  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity,
    roughness,
    metalness,
    name: `Vidro_${glassTint}`,
  });
}

export type EsquadriaPartCategory = 'marco' | 'folha' | 'vidro' | 'acessorio' | 'guarnicao';

export function registerExplodedPart(
  obj: THREE.Object3D,
  name: string,
  category: EsquadriaPartCategory,
  explodeVec: THREE.Vector3
) {
  obj.name = name;
  obj.userData = {
    ...obj.userData,
    partName: name,
    category,
    initialPos: obj.position.clone(),
    explodeVec: explodeVec.clone(),
  };
}

/**
 * Aplica a separação da Vista Explodida aos elementos da esquadria
 * @param group Grupo raiz da esquadria
 * @param progress Fator de 0.0 (montada) a 1.0 (totalmente explodida)
 */
export function setExplodedViewProgress(group: THREE.Group, progress: number): void {
  const factor = Math.max(0, Math.min(1, progress));
  group.traverse((child) => {
    if (child.userData?.initialPos && child.userData?.explodeVec) {
      const init = child.userData.initialPos as THREE.Vector3;
      const vec = child.userData.explodeVec as THREE.Vector3;
      child.position.set(
        init.x + vec.x * factor,
        init.y + vec.y * factor,
        init.z + vec.z * factor
      );
    }
  });
}

/**
 * Constrói o modelo 3D procedural paramétrico em escala 1:1 (metros) com suporte a Vista Explodida
 */
export function buildWindowDoor3DGroup(config: ARModelConfig): THREE.Group {
  const root = new THREE.Group();
  root.name = `Esquadria_${config.typologyId}`;

  // Conversão de milímetros para metros (escala padrão do GLTF/USDZ para Realidade Aumentada)
  const W = Math.max(0.4, config.widthMm / 1000);
  const H = Math.max(0.4, config.heightMm / 1000);
  const D = Math.max(0.04, (config.depthMm || 80) / 1000);

  const matAlu = createAluminumMaterial(config.aluminumColor);
  const matGlass = createGlassMaterial(config.glassTint);
  const matHardware = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xd1d5db),
    metalness: 0.95,
    roughness: 0.15,
    name: 'Hardware_Inox',
  });
  const matRubber = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x111827),
    roughness: 0.85,
    metalness: 0.05,
    name: 'Gaxeta_EPDM',
  });

  const frameThickness = 0.045; // 45mm de perfil de marco
  const frameDepth = D;

  // 1. MARCO PERIMETRAL EXTERNO (Header, Sill, Jambs)
  const frameGroup = new THREE.Group();
  frameGroup.name = 'Marco_Perimetral';

  // Soleira / Trilho Inferior
  const sillGeo = new THREE.BoxGeometry(W, frameThickness, frameDepth);
  const sillMesh = new THREE.Mesh(sillGeo, matAlu);
  sillMesh.position.set(0, frameThickness / 2, 0);
  registerExplodedPart(sillMesh, 'Trilho_Inferior_Soleira', 'marco', new THREE.Vector3(0, -0.35, 0));
  frameGroup.add(sillMesh);

  // Marco Superior
  const headerGeo = new THREE.BoxGeometry(W, frameThickness, frameDepth);
  const headerMesh = new THREE.Mesh(headerGeo, matAlu);
  headerMesh.position.set(0, H - frameThickness / 2, 0);
  registerExplodedPart(headerMesh, 'Marco_Superior_Cabecalho', 'marco', new THREE.Vector3(0, 0.35, 0));
  frameGroup.add(headerMesh);

  // Montante Lateral Esquerdo
  const jambLeftGeo = new THREE.BoxGeometry(frameThickness, H - frameThickness * 2, frameDepth);
  const jambLeftMesh = new THREE.Mesh(jambLeftGeo, matAlu);
  jambLeftMesh.position.set(-W / 2 + frameThickness / 2, H / 2, 0);
  registerExplodedPart(jambLeftMesh, 'Montante_Marco_Esquerdo', 'marco', new THREE.Vector3(-0.4, 0, 0));
  frameGroup.add(jambLeftMesh);

  // Montante Lateral Direito
  const jambRightGeo = new THREE.BoxGeometry(frameThickness, H - frameThickness * 2, frameDepth);
  const jambRightMesh = new THREE.Mesh(jambRightGeo, matAlu);
  jambRightMesh.position.set(W / 2 - frameThickness / 2, H / 2, 0);
  registerExplodedPart(jambRightMesh, 'Montante_Marco_Direito', 'marco', new THREE.Vector3(0.4, 0, 0));
  frameGroup.add(jambRightMesh);

  root.add(frameGroup);

  const innerW = W - frameThickness * 2;
  const innerH = H - frameThickness * 2;
  const centerY = H / 2;

  const isPivotDoor = config.typologyId.includes('piv') || config.typologyName.toLowerCase().includes('pivotante');
  const isMinimalist = config.typologyId.includes('chroma') || config.typologyName.toLowerCase().includes('minimalista');
  const is4Leaves = config.typologyId.includes('cor4') || config.typologyName.toLowerCase().includes('4 folhas');
  const isMaximAr = config.typologyId.includes('max') || config.typologyName.toLowerCase().includes('maxim');

  if (isPivotDoor) {
    // --- PORTA PIVOTANTE COM LAMBRI E PUXADOR ---
    const doorLeafW = innerW - 0.015;
    const doorLeafH = innerH - 0.015;
    const doorThickness = 0.055;

    const doorGroup = new THREE.Group();
    doorGroup.name = 'Folha_Pivotante';
    registerExplodedPart(doorGroup, 'Folha_Pivotante', 'folha', new THREE.Vector3(0, 0, 0.18));

    // Painel principal da porta
    const doorGeo = new THREE.BoxGeometry(doorLeafW, doorLeafH, doorThickness);
    const doorMesh = new THREE.Mesh(doorGeo, matAlu);
    doorMesh.position.set(0, centerY, 0);
    registerExplodedPart(doorMesh, 'Painel_Principal_Porta', 'folha', new THREE.Vector3(0, 0, 0));
    doorGroup.add(doorMesh);

    // Frisos horizontais em relevo (Lambri ripado)
    const slatCount = Math.floor(doorLeafH / 0.15);
    const slatH = 0.012;
    const slatDepth = 0.006;
    for (let i = 1; i < slatCount; i++) {
      const slatGeo = new THREE.BoxGeometry(doorLeafW - 0.02, slatH, slatDepth);
      const slatMesh = new THREE.Mesh(slatGeo, matAlu);
      slatMesh.position.set(0, frameThickness + i * 0.15, doorThickness / 2 + slatDepth / 2);
      registerExplodedPart(
        slatMesh,
        `Friso_Lambri_${i}`,
        'folha',
        new THREE.Vector3(0, 0, 0.15 + (i % 3) * 0.03)
      );
      doorGroup.add(slatMesh);
    }

    // Puxador Inox Retangular (1000mm ou 1200mm de altura)
    const handleH = Math.min(1.2, doorLeafH * 0.5);
    const handleGeo = new THREE.BoxGeometry(0.03, handleH, 0.04);
    const handleMesh = new THREE.Mesh(handleGeo, matHardware);
    handleMesh.position.set(doorLeafW / 2 - 0.12, centerY, doorThickness / 2 + 0.035);
    registerExplodedPart(handleMesh, 'Puxador_Inox_Barra_Chata', 'acessorio', new THREE.Vector3(0.12, 0, 0.35));
    doorGroup.add(handleMesh);

    root.add(doorGroup);
  } else if (isMaximAr) {
    // --- JANELA MAXIM-AR COM BRAÇO INOX ---
    const sashW = innerW - 0.02;
    const sashH = innerH - 0.02;
    const sashProfileW = 0.04;
    const sashDepth = 0.035;

    const sashGroup = new THREE.Group();
    sashGroup.name = 'Folha_MaximAr';
    sashGroup.position.set(0, centerY, 0.01);
    registerExplodedPart(sashGroup, 'Folha_MaximAr', 'folha', new THREE.Vector3(0, 0, 0.18));

    // Vidro
    const glassGeo = new THREE.BoxGeometry(sashW - sashProfileW * 2, sashH - sashProfileW * 2, 0.008);
    const glassMesh = new THREE.Mesh(glassGeo, matGlass);
    registerExplodedPart(glassMesh, 'Vidro_Temperado_MaximAr', 'vidro', new THREE.Vector3(0, 0, -0.25));
    sashGroup.add(glassMesh);

    // Quadro da Folha
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(sashW, sashProfileW, sashDepth), matAlu);
    topBar.position.set(0, sashH / 2 - sashProfileW / 2, 0);
    registerExplodedPart(topBar, 'Travessa_Superior_MaximAr', 'folha', new THREE.Vector3(0, 0.2, 0));
    sashGroup.add(topBar);

    const btmBar = new THREE.Mesh(new THREE.BoxGeometry(sashW, sashProfileW, sashDepth), matAlu);
    btmBar.position.set(0, -sashH / 2 + sashProfileW / 2, 0);
    registerExplodedPart(btmBar, 'Travessa_Inferior_MaximAr', 'folha', new THREE.Vector3(0, -0.2, 0));
    sashGroup.add(btmBar);

    const leftBar = new THREE.Mesh(new THREE.BoxGeometry(sashProfileW, sashH - sashProfileW * 2, sashDepth), matAlu);
    leftBar.position.set(-sashW / 2 + sashProfileW / 2, 0, 0);
    registerExplodedPart(leftBar, 'Montante_Esquerdo_MaximAr', 'folha', new THREE.Vector3(-0.2, 0, 0));
    sashGroup.add(leftBar);

    const rightBar = new THREE.Mesh(new THREE.BoxGeometry(sashProfileW, sashH - sashProfileW * 2, sashDepth), matAlu);
    rightBar.position.set(sashW / 2 - sashProfileW / 2, 0, 0);
    registerExplodedPart(rightBar, 'Montante_Direito_MaximAr', 'folha', new THREE.Vector3(0.2, 0, 0));
    sashGroup.add(rightBar);

    // Fecho Maxim-ar central
    const latchMesh = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.08, 0.03), matHardware);
    latchMesh.position.set(0, -sashH / 2 + sashProfileW, sashDepth / 2 + 0.01);
    registerExplodedPart(latchMesh, 'Fecho_Articulado_MaximAr', 'acessorio', new THREE.Vector3(0, -0.15, 0.32));
    sashGroup.add(latchMesh);

    root.add(sashGroup);
  } else if (is4Leaves) {
    // --- JANELA/PORTA DE CORRER 4 FOLHAS (2 FIXAS LATERAIS + 2 MÓVEIS CENTRAIS) ---
    const leafW = innerW / 4 + 0.015; // com transpasse de 15mm
    const leafH = innerH - 0.01;
    const sashProfileW = isMinimalist ? 0.02 : 0.038;
    const sashDepth = 0.03;

    for (let i = 0; i < 4; i++) {
      const leafGroup = new THREE.Group();
      leafGroup.name = `Folha_${i + 1}`;

      const zOffset = i === 1 || i === 2 ? 0.015 : -0.015;
      const xPos = -innerW / 2 + leafW / 2 + i * (innerW / 4);
      leafGroup.position.set(xPos, centerY, zOffset);

      // Vetor de separação da folha no espaço
      const explodeX = (i - 1.5) * 0.18;
      const explodeZ = i === 1 || i === 2 ? 0.22 : -0.22;
      registerExplodedPart(leafGroup, `Folha_${i + 1}`, 'folha', new THREE.Vector3(explodeX, 0, explodeZ));

      // Vidro
      const glassGeo = new THREE.BoxGeometry(leafW - sashProfileW * 2, leafH - sashProfileW * 2, 0.008);
      const glassMesh = new THREE.Mesh(glassGeo, matGlass);
      registerExplodedPart(glassMesh, `Vidro_Folha_${i + 1}`, 'vidro', new THREE.Vector3(0, 0, 0.16));
      leafGroup.add(glassMesh);

      // Quadro da folha
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(leafW, sashProfileW, sashDepth), matAlu);
      topBar.position.set(0, leafH / 2 - sashProfileW / 2, 0);
      registerExplodedPart(topBar, `Travessa_Sup_${i + 1}`, 'folha', new THREE.Vector3(0, 0.15, 0));
      leafGroup.add(topBar);

      const btmBar = new THREE.Mesh(new THREE.BoxGeometry(leafW, sashProfileW, sashDepth), matAlu);
      btmBar.position.set(0, -leafH / 2 + sashProfileW / 2, 0);
      registerExplodedPart(btmBar, `Travessa_Inf_${i + 1}`, 'folha', new THREE.Vector3(0, -0.15, 0));
      leafGroup.add(btmBar);

      const leftBar = new THREE.Mesh(new THREE.BoxGeometry(sashProfileW, leafH - sashProfileW * 2, sashDepth), matAlu);
      leftBar.position.set(-leafW / 2 + sashProfileW / 2, 0, 0);
      registerExplodedPart(leftBar, `Montante_Esq_${i + 1}`, 'folha', new THREE.Vector3(-0.15, 0, 0));
      leafGroup.add(leftBar);

      const rightBar = new THREE.Mesh(new THREE.BoxGeometry(sashProfileW, leafH - sashProfileW * 2, sashDepth), matAlu);
      rightBar.position.set(leafW / 2 - sashProfileW / 2, 0, 0);
      registerExplodedPart(rightBar, `Montante_Dir_${i + 1}`, 'folha', new THREE.Vector3(0.15, 0, 0));
      leafGroup.add(rightBar);

      root.add(leafGroup);
    }
  } else {
    // --- PADRÃO: 2 FOLHAS DE CORRER (SUPREMA / GOLD / CHROMA) ---
    const leafW = innerW / 2 + 0.02; // 20mm de transpasse central
    const leafH = innerH - 0.01;
    const sashProfileW = isMinimalist ? 0.022 : 0.045;
    const sashDepth = 0.032;

    // Folha Esquerda (Trilho Traseiro)
    const leaf1 = new THREE.Group();
    leaf1.name = 'Folha_Esquerda';
    leaf1.position.set(-innerW / 4, centerY, -0.016);
    registerExplodedPart(leaf1, 'Folha_Esquerda', 'folha', new THREE.Vector3(-0.25, 0, -0.22));

    const glass1 = new THREE.Mesh(new THREE.BoxGeometry(leafW - sashProfileW * 2, leafH - sashProfileW * 2, 0.008), matGlass);
    registerExplodedPart(glass1, 'Vidro_Folha_Esquerda', 'vidro', new THREE.Vector3(0, 0, -0.18));
    leaf1.add(glass1);

    const top1 = new THREE.Mesh(new THREE.BoxGeometry(leafW, sashProfileW, sashDepth), matAlu);
    top1.position.set(0, leafH / 2 - sashProfileW / 2, 0);
    registerExplodedPart(top1, 'Travessa_Superior_Esq', 'folha', new THREE.Vector3(0, 0.16, 0));
    leaf1.add(top1);

    const btm1 = new THREE.Mesh(new THREE.BoxGeometry(leafW, sashProfileW, sashDepth), matAlu);
    btm1.position.set(0, -leafH / 2 + sashProfileW / 2, 0);
    registerExplodedPart(btm1, 'Travessa_Inferior_Esq', 'folha', new THREE.Vector3(0, -0.16, 0));
    leaf1.add(btm1);

    const left1 = new THREE.Mesh(new THREE.BoxGeometry(sashProfileW, leafH - sashProfileW * 2, sashDepth), matAlu);
    left1.position.set(-leafW / 2 + sashProfileW / 2, 0, 0);
    registerExplodedPart(left1, 'Montante_Lateral_Esq', 'folha', new THREE.Vector3(-0.16, 0, 0));
    leaf1.add(left1);

    const right1 = new THREE.Mesh(new THREE.BoxGeometry(sashProfileW, leafH - sashProfileW * 2, sashDepth), matAlu);
    right1.position.set(leafW / 2 - sashProfileW / 2, 0, 0);
    registerExplodedPart(right1, 'Montante_Central_Esq', 'folha', new THREE.Vector3(0.16, 0, 0));
    leaf1.add(right1);

    // Fecho concha embutido no montante
    const handle1 = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.16, 0.01), matHardware);
    handle1.position.set(-leafW / 2 + sashProfileW / 2, 0, sashDepth / 2 + 0.002);
    registerExplodedPart(handle1, 'Fecho_Concha_Esq', 'acessorio', new THREE.Vector3(-0.1, 0, 0.28));
    leaf1.add(handle1);

    root.add(leaf1);

    // Folha Direita (Trilho Frontal)
    const leaf2 = new THREE.Group();
    leaf2.name = 'Folha_Direita';
    leaf2.position.set(innerW / 4, centerY, 0.016);
    registerExplodedPart(leaf2, 'Folha_Direita', 'folha', new THREE.Vector3(0.25, 0, 0.22));

    const glass2 = new THREE.Mesh(new THREE.BoxGeometry(leafW - sashProfileW * 2, leafH - sashProfileW * 2, 0.008), matGlass);
    registerExplodedPart(glass2, 'Vidro_Folha_Direita', 'vidro', new THREE.Vector3(0, 0, 0.18));
    leaf2.add(glass2);

    const top2 = new THREE.Mesh(new THREE.BoxGeometry(leafW, sashProfileW, sashDepth), matAlu);
    top2.position.set(0, leafH / 2 - sashProfileW / 2, 0);
    registerExplodedPart(top2, 'Travessa_Superior_Dir', 'folha', new THREE.Vector3(0, 0.16, 0));
    leaf2.add(top2);

    const btm2 = new THREE.Mesh(new THREE.BoxGeometry(leafW, sashProfileW, sashDepth), matAlu);
    btm2.position.set(0, -leafH / 2 + sashProfileW / 2, 0);
    registerExplodedPart(btm2, 'Travessa_Inferior_Dir', 'folha', new THREE.Vector3(0, -0.16, 0));
    leaf2.add(btm2);

    const left2 = new THREE.Mesh(new THREE.BoxGeometry(sashProfileW, leafH - sashProfileW * 2, sashDepth), matAlu);
    left2.position.set(-leafW / 2 + sashProfileW / 2, 0, 0);
    registerExplodedPart(left2, 'Montante_Central_Dir', 'folha', new THREE.Vector3(-0.16, 0, 0));
    leaf2.add(left2);

    const right2 = new THREE.Mesh(new THREE.BoxGeometry(sashProfileW, leafH - sashProfileW * 2, sashDepth), matAlu);
    right2.position.set(leafW / 2 - sashProfileW / 2, 0, 0);
    registerExplodedPart(right2, 'Montante_Lateral_Dir', 'folha', new THREE.Vector3(0.16, 0, 0));
    leaf2.add(right2);

    const handle2 = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.16, 0.01), matHardware);
    handle2.position.set(leafW / 2 - sashProfileW / 2, 0, sashDepth / 2 + 0.002);
    registerExplodedPart(handle2, 'Fecho_Concha_Dir', 'acessorio', new THREE.Vector3(0.1, 0, 0.28));
    leaf2.add(handle2);

    root.add(leaf2);
  }

  // Garantir que a base da esquadria fique assentada no plano Y=0
  root.position.set(0, 0, 0);

  return root;
}

/**
 * Exporta a cena/grupo para o formato GLB (padrão binário do glTF)
 */
export async function exportToGLB(group: THREE.Group): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Polyfill simples para ambientes de teste onde FileReader possa não estar no escopo global
    if (typeof globalThis.FileReader === 'undefined') {
      (globalThis as any).FileReader = class {
        readAsArrayBuffer(blob: any) {
          blob.arrayBuffer().then((buf: ArrayBuffer) => {
            (this as any).onload?.({ target: { result: buf } });
          });
        }
      };
    }

    const exporter = new GLTFExporter();
    exporter.parse(
      group,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(new Blob([result], { type: 'model/gltf-binary' }));
        } else {
          const output = JSON.stringify(result, null, 2);
          resolve(new Blob([output], { type: 'application/json' }));
        }
      },
      (error) => {
        reject(error);
      },
      { binary: true }
    );
  });
}

/**
 * Exporta a cena/grupo para o formato USDZ (padrão nativo da Apple para iOS AR Quick Look)
 */
export async function exportToUSDZ(group: THREE.Group): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const exporter = new USDZExporter();
      exporter.parse(
        group,
        (result: Uint8Array) => {
          resolve(new Blob([result as any], { type: 'model/vnd.usdz+zip' }));
        },
        (error: any) => {
          reject(error);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Formata o nome do arquivo para download de acordo com a esquadria configurada
 */
export function createArExportFileName(
  typologyName: string,
  widthMm: number,
  heightMm: number,
  color: ColorFinish,
  ext: 'glb' | 'usdz'
): string {
  const cleanName = typologyName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 30);

  return `${cleanName}_${widthMm}x${heightMm}_${color.toLowerCase()}.${ext}`;
}

/**
 * Gera mensagem WhatsApp explicativa para o cliente acessar a esquadria em AR
 */
export function generateARWhatsAppMessage(
  config: ARModelConfig,
  clientName = 'Cliente',
  fileType: 'GLB' | 'USDZ' = 'USDZ'
): string {
  const company = getEffectiveCompanyProfile();
  const glass = GLASS_TINT_STYLES[config.glassTint];
  const color = ALUMINUM_COLOR_PALETTE[config.aluminumColor];

  let text = `📱 *VISUALIZAÇÃO EM REALIDADE AUMENTADA (AR 3D)*\n`;
  text += `🏭 *${company.name}*\n`;
  text += `👤 *Cliente:* ${clientName}\n`;
  text += `───────────────────────\n`;
  text += `✨ *Esquadria:* ${config.typologyName}\n`;
  text += `📐 *Medidas Reais (1:1):* ${config.widthMm} × ${config.heightMm} mm\n`;
  text += `🎨 *Alumínio:* ${color.name}\n`;
  text += `🪟 *Vidro:* ${glass.name}\n`;
  text += `───────────────────────\n`;
  text += `👁️ *COMO PROJETAR NA PAREDE DA SUA CASA:*\n\n`;

  if (fileType === 'USDZ') {
    text += `🍏 *No iPhone ou iPad:*\n`;
    text += `1. Abra o arquivo .USDZ anexado diretamente no Safari.\n`;
    text += `2. O sistema abrirá a câmera automaticamente em modo AR Quick Look.\n`;
    text += `3. Aponte a câmera para o chão ou parede do vão e veja a janela em tamanho real!\n`;
  } else {
    text += `🤖 *No Celular Android:*\n`;
    text += `1. Abra o arquivo .GLB anexado.\n`;
    text += `2. Toque no ícone de "Visualizar no seu espaço" (Google Scene Viewer).\n`;
    text += `3. Aponte a câmera para a parede da obra para conferir a escala real 1:1.\n`;
  }

  text += `\nQualquer dúvida estamos à disposição!`;
  return text;
}
