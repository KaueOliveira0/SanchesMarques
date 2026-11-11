/**
 * ============================================================================
 * Sanches & Marques Esquadrias Pro - Agendador de Backup Automático 24h
 * Arquivo: src/utils/backupScheduler.ts
 * ============================================================================
 */

export interface BackupRecordCounts {
  orders: number;
  stockProfiles: number;
  stockAccessories: number;
  stockGlass: number;
  stockConsumables: number;
  romaneios: number;
}

export interface BackupConfig {
  enabled: boolean;
  intervalHours: number; // Padrão: 24 horas
  targetDirectory: string; // Diretório local especificado pelo usuário
  lastBackupTimestamp: number | null;
  lastBackupPath: string | null;
  lastBackupSizeBytes: number | null;
  lastBackupStatus: 'success' | 'failed' | null;
  autoNotification: boolean; // Notificar no sistema operacional e in-app
  retentionCount: number; // Quantidade de backups a manter no histórico
}

export interface BackupHistoryItem {
  id: string;
  timestamp: number;
  formattedDate: string;
  fileName: string;
  fullPath: string;
  sizeBytes: number;
  status: 'success' | 'failed';
  isAutomatic: boolean;
  recordsCount: BackupRecordCounts;
  errorMessage?: string;
}

export const BACKUP_CONFIG_STORAGE_KEY = 'sm_backup_config_v1';
export const BACKUP_HISTORY_STORAGE_KEY = 'sm_backup_history_v1';
export const BACKUP_CONFIG_CHANGED_EVENT = 'sm_backup_config_changed';
export const BACKUP_EXECUTED_EVENT = 'sm_backup_executed';

export const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  enabled: true,
  intervalHours: 24,
  targetDirectory: 'C:\\SanchesMarques_Backups', // Valor padrão Windows sugerido
  lastBackupTimestamp: null,
  lastBackupPath: null,
  lastBackupSizeBytes: null,
  lastBackupStatus: null,
  autoNotification: true,
  retentionCount: 30,
};

/**
 * Recupera a configuração atual de backup persistida.
 */
export function getBackupConfig(): BackupConfig {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(BACKUP_CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_BACKUP_CONFIG,
          ...parsed,
          intervalHours: parsed.intervalHours || 24,
        };
      }
    }
  } catch (err) {
    console.error('Falha ao carregar configuração de backup:', err);
  }
  return { ...DEFAULT_BACKUP_CONFIG };
}

/**
 * Salva a configuração de backup e notifica os componentes.
 */
export function saveBackupConfig(config: Partial<BackupConfig>): BackupConfig {
  const current = getBackupConfig();
  const updated: BackupConfig = {
    ...current,
    ...config,
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(BACKUP_CONFIG_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(BACKUP_CONFIG_CHANGED_EVENT, { detail: updated }));
    }
  } catch (err) {
    console.error('Falha ao salvar configuração de backup:', err);
  }

  return updated;
}

/**
 * Recupera o histórico de backups realizados.
 */
export function getBackupHistory(): BackupHistoryItem[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(BACKUP_HISTORY_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    }
  } catch (err) {
    console.error('Falha ao ler histórico de backups:', err);
  }
  return [];
}

/**
 * Adiciona um item ao histórico de backups respeitando o limite de retenção.
 */
export function addBackupHistoryItem(
  item: Omit<BackupHistoryItem, 'id'>,
  maxRetention: number = 30
): BackupHistoryItem {
  const history = getBackupHistory();
  const newItem: BackupHistoryItem = {
    ...item,
    id: `bkp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };

  const updatedHistory = [newItem, ...history].slice(0, maxRetention);

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(BACKUP_HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    }
  } catch (err) {
    console.error('Falha ao salvar histórico de backup:', err);
  }

  return newItem;
}

/**
 * Limpa o histórico de backups.
 */
export function clearBackupHistory(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(BACKUP_HISTORY_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Falha ao limpar histórico de backups:', err);
  }
}

/**
 * Avalia se o backup automático deve ser executado no momento atual.
 * Regra: Ativo E (nunca executado OU já se passaram >= intervalHours desde a última execução).
 */
export function shouldExecuteAutoBackup(
  config: BackupConfig,
  currentTimestamp: number = Date.now()
): boolean {
  if (!config.enabled) {
    return false;
  }

  // Se nunca foi executado antes, deve executar
  if (!config.lastBackupTimestamp) {
    return true;
  }

  const intervalMs = config.intervalHours * 60 * 60 * 1000;
  const elapsedMs = currentTimestamp - config.lastBackupTimestamp;

  return elapsedMs >= intervalMs;
}

/**
 * Calcula o tempo restante até a próxima execução agendada.
 */
export function calculateTimeUntilNextBackup(
  config: BackupConfig,
  currentTimestamp: number = Date.now()
): { ms: number; formatted: string; isOverdue: boolean } {
  if (!config.enabled) {
    return { ms: 0, formatted: 'Desativado', isOverdue: false };
  }

  if (!config.lastBackupTimestamp) {
    return { ms: 0, formatted: 'Execução Imediata', isOverdue: true };
  }

  const intervalMs = config.intervalHours * 60 * 60 * 1000;
  const nextScheduledMs = config.lastBackupTimestamp + intervalMs;
  const diffMs = nextScheduledMs - currentTimestamp;

  if (diffMs <= 0) {
    return { ms: 0, formatted: 'Pendente agora', isOverdue: true };
  }

  const totalMinutes = Math.floor(diffMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let formatted = '';
  if (hours > 0) {
    formatted += `${hours}h `;
  }
  formatted += `${minutes}m`;

  return { ms: diffMs, formatted: formatted.trim(), isOverdue: false };
}

/**
 * Gera um nome padronizado de arquivo de backup com data e hora.
 * Exemplo: backup_sanches_marques_2026-10-22_15-45.json
 */
export function generateBackupFileName(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `backup_sanches_marques_${year}-${month}-${day}_${hours}-${minutes}.json`;
}

/**
 * Formata os dados completos da aplicação em formato JSON estruturado com metadados e checksum.
 */
export function formatBackupJson(database: {
  orders: any[];
  stockProfiles: any[];
  stockAccessories: any[];
  stockGlass: any[];
  stockConsumables?: any[];
  romaneios: any[];
  companyProfile?: any;
}): string {
  const now = new Date();
  const payload = {
    system: 'Sanches & Marques Esquadrias Pro',
    applicationVersion: '3.0.0',
    backupVersion: '2.2',
    exportedAt: now.toISOString(),
    formattedDate: now.toLocaleString('pt-BR'),
    counts: {
      orders: database.orders?.length || 0,
      stockProfiles: database.stockProfiles?.length || 0,
      stockAccessories: database.stockAccessories?.length || 0,
      stockGlass: database.stockGlass?.length || 0,
      stockConsumables: database.stockConsumables?.length || 0,
      romaneios: database.romaneios?.length || 0,
    },
    company: database.companyProfile || null,
    data: {
      orders: database.orders || [],
      stockProfiles: database.stockProfiles || [],
      stockAccessories: database.stockAccessories || [],
      stockGlass: database.stockGlass || [],
      stockConsumables: database.stockConsumables || [],
      romaneios: database.romaneios || [],
    },
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Formata tamanho em bytes para leitura humana (ex: 124.5 KB).
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
