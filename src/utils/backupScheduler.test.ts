import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldExecuteAutoBackup,
  calculateTimeUntilNextBackup,
  generateBackupFileName,
  formatBackupJson,
  formatBytes,
  BackupConfig,
  DEFAULT_BACKUP_CONFIG,
} from './backupScheduler';

test('shouldExecuteAutoBackup returns false when backup is disabled', () => {
  const config: BackupConfig = {
    ...DEFAULT_BACKUP_CONFIG,
    enabled: false,
    lastBackupTimestamp: null,
  };
  assert.equal(shouldExecuteAutoBackup(config), false);
});

test('shouldExecuteAutoBackup returns true if enabled and never executed before', () => {
  const config: BackupConfig = {
    ...DEFAULT_BACKUP_CONFIG,
    enabled: true,
    lastBackupTimestamp: null,
  };
  assert.equal(shouldExecuteAutoBackup(config), true);
});

test('shouldExecuteAutoBackup returns false if less than 24 hours have passed', () => {
  const now = 1700000000000;
  const twelveHoursAgo = now - 12 * 60 * 60 * 1000;
  const config: BackupConfig = {
    ...DEFAULT_BACKUP_CONFIG,
    enabled: true,
    intervalHours: 24,
    lastBackupTimestamp: twelveHoursAgo,
  };
  assert.equal(shouldExecuteAutoBackup(config, now), false);
});

test('shouldExecuteAutoBackup returns true if 24 hours or more have passed', () => {
  const now = 1700000000000;
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
  const config: BackupConfig = {
    ...DEFAULT_BACKUP_CONFIG,
    enabled: true,
    intervalHours: 24,
    lastBackupTimestamp: twentyFourHoursAgo,
  };
  assert.equal(shouldExecuteAutoBackup(config, now), true);

  const twentySixHoursAgo = now - 26 * 60 * 60 * 1000;
  assert.equal(shouldExecuteAutoBackup({ ...config, lastBackupTimestamp: twentySixHoursAgo }, now), true);
});

test('calculateTimeUntilNextBackup computes hours and minutes accurately', () => {
  const now = 1700000000000;
  const tenHoursAgo = now - 10 * 60 * 60 * 1000;
  const config: BackupConfig = {
    ...DEFAULT_BACKUP_CONFIG,
    enabled: true,
    intervalHours: 24,
    lastBackupTimestamp: tenHoursAgo,
  };

  const result = calculateTimeUntilNextBackup(config, now);
  assert.equal(result.isOverdue, false);
  assert.equal(result.formatted, '14h 0m');
  assert.equal(result.ms, 14 * 60 * 60 * 1000);
});

test('calculateTimeUntilNextBackup flags overdue backups', () => {
  const now = 1700000000000;
  const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;
  const config: BackupConfig = {
    ...DEFAULT_BACKUP_CONFIG,
    enabled: true,
    intervalHours: 24,
    lastBackupTimestamp: twentyFiveHoursAgo,
  };

  const result = calculateTimeUntilNextBackup(config, now);
  assert.equal(result.isOverdue, true);
  assert.equal(result.formatted, 'Pendente agora');
});

test('generateBackupFileName produces a clean timestamped filename', () => {
  const sampleDate = new Date(2026, 9, 22, 14, 30); // 2026-10-22 14:30
  const fileName = generateBackupFileName(sampleDate);
  assert.equal(fileName, 'backup_sanches_marques_2026-10-22_14-30.json');
});

test('formatBackupJson builds a structured payload with counts and version', () => {
  const mockDatabase = {
    orders: [{ id: 'ord_1', clientName: 'Construtora Alfa' }],
    stockProfiles: [{ id: 'prof_1', code: 'SU-001', wholeBarsQty: 10 }],
    stockAccessories: [{ id: 'acc_1', name: 'Roldana Dupla' }],
    stockGlass: [{ id: 'gl_1', glassType: 'Temperado 8mm' }],
    stockConsumables: [{ id: 'con_1', name: 'Parafuso Inox' }],
    romaneios: [{ id: 'rom_1', driverName: 'Carlos' }],
    companyProfile: { tradingName: 'Sanches & Marques Esquadrias' },
  };

  const jsonStr = formatBackupJson(mockDatabase);
  const parsed = JSON.parse(jsonStr);

  assert.equal(parsed.system, 'Sanches & Marques Esquadrias Pro');
  assert.equal(parsed.backupVersion, '2.2');
  assert.equal(parsed.counts.orders, 1);
  assert.equal(parsed.counts.stockProfiles, 1);
  assert.equal(parsed.data.orders[0].clientName, 'Construtora Alfa');
});

test('formatBytes converts numbers to human-readable units', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1536), '1.5 KB');
  assert.equal(formatBytes(1048576), '1 MB');
});
