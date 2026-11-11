export interface LineClearanceConfig {
  id: string;
  series: string;
  description: string;
  glassDeltaWidthMm: number; // Folga horizontal para vidro (ex: 95mm)
  glassDeltaHeightMm: number; // Folga vertical para vidro (ex: 145mm)
  sashOverlapWidthMm: number; // Transpasse de folhas móveis (ex: 26mm)
  frameClearanceWidthMm: number; // Folga do contramarco L (ex: 10mm)
  frameClearanceHeightMm: number; // Folga do contramarco H (ex: 10mm)
}

export const DEFAULT_LINE_CLEARANCES: LineClearanceConfig[] = [
  {
    id: 'clr_suprema',
    series: 'Suprema',
    description: 'Linha Suprema 25mm padrão Alcoa/Hydro',
    glassDeltaWidthMm: 95,
    glassDeltaHeightMm: 145,
    sashOverlapWidthMm: 26,
    frameClearanceWidthMm: 10,
    frameClearanceHeightMm: 10,
  },
  {
    id: 'clr_gold',
    series: 'Gold',
    description: 'Linha Gold 32mm pesada para grandes vãos',
    glassDeltaWidthMm: 115,
    glassDeltaHeightMm: 175,
    sashOverlapWidthMm: 35,
    frameClearanceWidthMm: 12,
    frameClearanceHeightMm: 12,
  },
  {
    id: 'clr_chroma',
    series: 'Chroma',
    description: 'Linha Chroma com dreno e vedação acústica',
    glassDeltaWidthMm: 98,
    glassDeltaHeightMm: 148,
    sashOverlapWidthMm: 28,
    frameClearanceWidthMm: 10,
    frameClearanceHeightMm: 10,
  },
  {
    id: 'clr_linha25',
    series: 'Linha 25',
    description: 'Linha convencional 25mm residencial',
    glassDeltaWidthMm: 90,
    glassDeltaHeightMm: 135,
    sashOverlapWidthMm: 24,
    frameClearanceWidthMm: 10,
    frameClearanceHeightMm: 10,
  },
];

const STORAGE_KEY_CLEARANCES = 'sm_clearance_configs_v1';

export const getClearanceForSeries = (
  seriesName: string,
  configs: LineClearanceConfig[] = DEFAULT_LINE_CLEARANCES
): LineClearanceConfig => {
  const norm = seriesName.trim().toLowerCase();
  const found = configs.find((c) => c.series.toLowerCase() === norm);
  if (found) return found;

  const partial = configs.find((c) => norm.includes(c.series.toLowerCase()) || c.series.toLowerCase().includes(norm));
  if (partial) return partial;

  return configs[0] || DEFAULT_LINE_CLEARANCES[0];
};

export interface DynamicGlassResult {
  glassWidthMm: number;
  glassHeightMm: number;
  sashWidthMm: number;
  areaM2: number;
  clearanceUsed: LineClearanceConfig;
}

export const calculateDynamicGlassDimensions = (
  widthMm: number,
  heightMm: number,
  series: string,
  leavesCount: number = 2,
  customConfigs?: LineClearanceConfig[]
): DynamicGlassResult => {
  const configs = customConfigs || loadClearanceConfigs();
  const clearance = getClearanceForSeries(series, configs);

  const overlapsTotal = Math.max(0, leavesCount - 1) * clearance.sashOverlapWidthMm;
  const sashWidth = (widthMm + overlapsTotal) / leavesCount;

  const glassWidth = Math.round(sashWidth - clearance.glassDeltaWidthMm);
  const glassHeight = Math.round(heightMm - clearance.glassDeltaHeightMm);
  const areaM2 = Math.round(((glassWidth * glassHeight) / 1000000) * 1000) / 1000;

  return {
    glassWidthMm: glassWidth,
    glassHeightMm: glassHeight,
    sashWidthMm: Math.round(sashWidth),
    areaM2,
    clearanceUsed: clearance,
  };
};

export const loadClearanceConfigs = (): LineClearanceConfig[] => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_CLEARANCES) : null;
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading clearance configs', e);
  }
  return DEFAULT_LINE_CLEARANCES;
};

export const saveClearanceConfigs = (configs: LineClearanceConfig[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_CLEARANCES, JSON.stringify(configs));
  } catch (e) {
    console.error('Error saving clearance configs', e);
  }
};
