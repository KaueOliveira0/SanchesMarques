/**
 * ============================================================================
 * Sanches & Marques Esquadrias Pro - Executor de Backup Local e Notificações
 * Arquivo: src/utils/backupExecutor.ts
 * ============================================================================
 */

import {
  BackupConfig,
  getBackupConfig,
  saveBackupConfig,
  addBackupHistoryItem,
  generateBackupFileName,
  formatBackupJson,
  BACKUP_EXECUTED_EVENT,
} from './backupScheduler';

declare global {
  interface Window {
    desktopApp?: {
      isDesktop: boolean;
      platform: string;
      version: string;
      openExternal: (url: string) => void;
      showNotification: (title: string, body: string) => void;
      selectBackupDirectory: () => Promise<string | null>;
      saveBackupFile: (data: {
        directory: string;
        fileName: string;
        fileContent: string;
        notifyUser?: boolean;
      }) => Promise<{
        success: boolean;
        fullPath?: string;
        sizeBytes?: number;
        fileName?: string;
        error?: string;
      }>;
      openBackupDirectory: (dirPath: string) => Promise<boolean>;
      getDefaultBackupDirectory: () => Promise<string>;
    };
  }
}

export interface DatabaseSnapshot {
  orders: any[];
  stockProfiles: any[];
  stockAccessories: any[];
  stockGlass: any[];
  stockConsumables?: any[];
  romaneios: any[];
  companyProfile?: any;
}

export interface BackupExecutionResult {
  success: boolean;
  fileName: string;
  fullPath: string;
  sizeBytes: number;
  isAutomatic: boolean;
  timestamp: number;
  error?: string;
}

/**
 * Executa o procedimento de backup salvando no diretório especificado pelo usuário.
 */
export async function executeBackup(
  database: DatabaseSnapshot,
  isAutomatic: boolean = false,
  overrideDirectory?: string
): Promise<BackupExecutionResult> {
  const config = getBackupConfig();
  const targetDir = (overrideDirectory || config.targetDirectory || '').trim();
  const fileName = generateBackupFileName();
  const fileContent = formatBackupJson(database);
  const timestamp = Date.now();
  const formattedDate = new Date(timestamp).toLocaleString('pt-BR');

  const recordsCount = {
    orders: database.orders?.length || 0,
    stockProfiles: database.stockProfiles?.length || 0,
    stockAccessories: database.stockAccessories?.length || 0,
    stockGlass: database.stockGlass?.length || 0,
    stockConsumables: database.stockConsumables?.length || 0,
    romaneios: database.romaneios?.length || 0,
  };

  try {
    let fullPath = targetDir ? `${targetDir}\\${fileName}` : fileName;
    let sizeBytes = new Blob([fileContent]).size;

    // 1. Cenário Nativo Desktop (Electron)
    if (typeof window !== 'undefined' && window.desktopApp?.saveBackupFile) {
      const electronResult = await window.desktopApp.saveBackupFile({
        directory: targetDir,
        fileName,
        fileContent,
        notifyUser: config.autoNotification,
      });

      if (!electronResult.success) {
        throw new Error(electronResult.error || 'Falha ao gravar arquivo de backup no disco');
      }

      fullPath = electronResult.fullPath || fullPath;
      sizeBytes = electronResult.sizeBytes || sizeBytes;
    } else if (typeof window !== 'undefined') {
      // 2. Fallback Web / Navegador: aciona download apenas se for solicitação manual do usuário
      if (!isAutomatic) {
        const blob = new Blob([fileContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Backup automático: armazena snapshot no localStorage de forma silenciosa e segura
        try {
          localStorage.setItem('sanches_marques_last_auto_backup_data', fileContent);
        } catch {
          // ignora eventual estouro de cota
        }
      }

      // Notificação nativa via Web Notifications se suportado
      if (config.autoNotification && typeof Notification !== 'undefined') {
        if (Notification.permission === 'granted') {
          new Notification('Sanches & Marques Esquadrias', {
            body: `Backup do banco de dados concluído com sucesso!\nArquivo: ${fileName}`,
          });
        }
      }
    }

    // 3. Atualizar configuração com status de sucesso
    saveBackupConfig({
      lastBackupTimestamp: timestamp,
      lastBackupPath: fullPath,
      lastBackupSizeBytes: sizeBytes,
      lastBackupStatus: 'success',
      targetDirectory: targetDir,
    });

    // 4. Adicionar ao histórico
    addBackupHistoryItem(
      {
        timestamp,
        formattedDate,
        fileName,
        fullPath,
        sizeBytes,
        status: 'success',
        isAutomatic,
        recordsCount,
      },
      config.retentionCount
    );

    const result: BackupExecutionResult = {
      success: true,
      fileName,
      fullPath,
      sizeBytes,
      isAutomatic,
      timestamp,
    };

    // 5. Notificar aplicação via evento customizado
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(BACKUP_EXECUTED_EVENT, {
          detail: result,
        })
      );
    }

    return result;
  } catch (err: any) {
    console.error('Falha na execução do backup:', err);

    saveBackupConfig({
      lastBackupTimestamp: timestamp,
      lastBackupStatus: 'failed',
    });

    addBackupHistoryItem(
      {
        timestamp,
        formattedDate,
        fileName,
        fullPath: targetDir,
        sizeBytes: 0,
        status: 'failed',
        isAutomatic,
        recordsCount,
        errorMessage: err?.message || 'Erro desconhecido',
      },
      config.retentionCount
    );

    const result: BackupExecutionResult = {
      success: false,
      fileName,
      fullPath: targetDir,
      sizeBytes: 0,
      isAutomatic,
      timestamp,
      error: err?.message || 'Erro ao salvar arquivo',
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(BACKUP_EXECUTED_EVENT, {
          detail: result,
        })
      );
    }

    return result;
  }
}
