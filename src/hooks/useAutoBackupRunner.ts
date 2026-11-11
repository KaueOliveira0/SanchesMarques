import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  getBackupConfig,
  shouldExecuteAutoBackup,
  formatBytes,
  BACKUP_EXECUTED_EVENT,
  BACKUP_CONFIG_CHANGED_EVENT,
} from '../utils/backupScheduler';
import { executeBackup, BackupExecutionResult } from '../utils/backupExecutor';

export interface BackupToastNotification {
  id: string;
  type: 'success' | 'error';
  title: string;
  message: string;
  fileName: string;
  fullPath: string;
  sizeFormatted: string;
  timestamp: number;
}

export function useAutoBackupRunner() {
  const {
    orders,
    stockProfiles,
    stockAccessories,
    stockGlass,
    stockConsumables,
    romaneios,
  } = useApp();

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<BackupToastNotification | null>(null);
  const isRunningRef = useRef(false);

  // Snapshot atual do banco
  const databaseRef = useRef({
    orders,
    stockProfiles,
    stockAccessories,
    stockGlass,
    stockConsumables,
    romaneios,
  });

  useEffect(() => {
    databaseRef.current = {
      orders,
      stockProfiles,
      stockAccessories,
      stockGlass,
      stockConsumables,
      romaneios,
    };
  }, [orders, stockProfiles, stockAccessories, stockGlass, stockConsumables, romaneios]);

  const triggerAutoBackupCheck = useCallback(async () => {
    if (isRunningRef.current) return;

    const config = getBackupConfig();
    if (!shouldExecuteAutoBackup(config, Date.now())) {
      return;
    }

    try {
      isRunningRef.current = true;
      console.log('[AutoBackup] 24 horas transcorridas ou 1ª execução. Iniciando backup automático...');
      await executeBackup(databaseRef.current, true);
    } catch (err) {
      console.error('[AutoBackup] Erro durante rotina automática de backup:', err);
    } finally {
      isRunningRef.current = false;
    }
  }, []);

  // Monitorar evento customizado de backup executado (seja manual ou automático)
  useEffect(() => {
    const handleBackupExecuted = (e: any) => {
      const result: BackupExecutionResult = e.detail;
      if (!result) return;

      const config = getBackupConfig();
      if (!config.autoNotification && result.isAutomatic) return;

      if (result.success) {
        const toast: BackupToastNotification = {
          id: `toast_${Date.now()}`,
          type: 'success',
          title: result.isAutomatic
            ? 'Backup Automático Concluído (Rotina de 24h)'
            : 'Backup do Sistema Concluído com Sucesso',
          message: `O banco de dados foi salvo no diretório local especificado.`,
          fileName: result.fileName,
          fullPath: result.fullPath,
          sizeFormatted: formatBytes(result.sizeBytes),
          timestamp: result.timestamp,
        };
        setActiveToast(toast);

        // Auto-dismiss após 8 segundos
        setTimeout(() => {
          setActiveToast((curr) => (curr?.id === toast.id ? null : curr));
        }, 8000);
      } else {
        const toast: BackupToastNotification = {
          id: `toast_${Date.now()}`,
          type: 'error',
          title: 'Aviso: Falha no Backup',
          message: result.error || 'Não foi possível gravar o arquivo no diretório.',
          fileName: result.fileName,
          fullPath: result.fullPath,
          sizeFormatted: '0 B',
          timestamp: result.timestamp,
        };
        setActiveToast(toast);
      }
    };

    window.addEventListener(BACKUP_EXECUTED_EVENT, handleBackupExecuted);
    return () => window.removeEventListener(BACKUP_EXECUTED_EVENT, handleBackupExecuted);
  }, []);

  // Escuta evento do menu nativo do Electron para abrir o modal de agendamento
  useEffect(() => {
    const handleOpenModal = () => setIsBackupModalOpen(true);
    window.addEventListener('desktop-open-backup-modal', handleOpenModal);
    return () => window.removeEventListener('desktop-open-backup-modal', handleOpenModal);
  }, []);

  // Ciclo periódico: checar ao iniciar e a cada 60 segundos
  useEffect(() => {
    // Checagem inicial com atraso suave de 3 segundos para carregamento da UI
    const initialTimer = setTimeout(() => {
      triggerAutoBackupCheck();
    }, 3000);

    // Intervalo de verificação a cada 60 segundos
    const intervalTimer = setInterval(() => {
      triggerAutoBackupCheck();
    }, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [triggerAutoBackupCheck]);

  return {
    isBackupModalOpen,
    setIsBackupModalOpen,
    activeToast,
    dismissToast: () => setActiveToast(null),
    runBackupNow: () => executeBackup(databaseRef.current, false),
  };
}
