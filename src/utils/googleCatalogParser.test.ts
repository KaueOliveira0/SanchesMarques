import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeGoogleDriveUrl,
  extractProfilesFromTextHeuristic,
  extractAccessoriesFromTextHeuristic,
} from './googleCatalogParser';

test('normalizeGoogleDriveUrl transforms Google Drive file links to direct download format', () => {
  const fileUrl = 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0/view?usp=sharing';
  const res = normalizeGoogleDriveUrl(fileUrl);

  assert.equal(res.serviceType, 'drive_file');
  assert.equal(res.fileId, '1A2B3C4D5E6F7G8H9I0');
  assert.equal(res.directDownloadUrl, 'https://drive.google.com/uc?export=download&id=1A2B3C4D5E6F7G8H9I0');
});

test('normalizeGoogleDriveUrl transforms Google Sheets links to direct CSV export format', () => {
  const sheetsUrl = 'https://docs.google.com/spreadsheets/d/1XyZ987SheetId/edit#gid=0';
  const res = normalizeGoogleDriveUrl(sheetsUrl);

  assert.equal(res.serviceType, 'google_sheets');
  assert.equal(res.fileId, '1XyZ987SheetId');
  assert.equal(res.directDownloadUrl, 'https://docs.google.com/spreadsheets/d/1XyZ987SheetId/export?format=csv');
});

test('normalizeGoogleDriveUrl transforms Google Docs links to direct text export format', () => {
  const docUrl = 'https://docs.google.com/document/d/1DocId998877/edit';
  const res = normalizeGoogleDriveUrl(docUrl);

  assert.equal(res.serviceType, 'google_docs');
  assert.equal(res.fileId, '1DocId998877');
  assert.equal(res.directDownloadUrl, 'https://docs.google.com/document/d/1DocId998877/export?format=txt');
});

test('normalizeGoogleDriveUrl handles direct web URLs seamlessly', () => {
  const directUrl = 'https://exemplo.com.br/catalogo-aluminio.pdf';
  const res = normalizeGoogleDriveUrl(directUrl);

  assert.equal(res.serviceType, 'direct_web_url');
  assert.equal(res.directDownloadUrl, directUrl);
});

test('extractProfilesFromTextHeuristic identifies profiles and weights from catalog raw text', () => {
  const sample = `
    SU-001 Marco Superior 2 Planos Suprema 0,684 kg/m R$ 34,50
    SU-002 Trilho Inferior com Aba 0,725 kg/m
    GL-001 Marco Superior Linha Gold 1,150 kg/m
  `;

  const profiles = extractProfilesFromTextHeuristic(sample);
  assert.equal(profiles.length, 3);
  assert.equal(profiles[0].code, 'SU-001');
  assert.equal(profiles[0].kgm, 0.684);
  assert.equal(profiles[0].series, 'Suprema');
  assert.equal(profiles[1].code, 'SU-002');
  assert.equal(profiles[1].category, 'Trilho');
  assert.equal(profiles[2].code, 'GL-001');
  assert.equal(profiles[2].series, 'Gold');
  assert.equal(profiles[2].kgm, 1.15);
});

test('extractAccessoriesFromTextHeuristic parses accessories and hardware items', () => {
  const sample = `
    ROL-01 Roldana Dupla com Rolamento de Agulha par R$ 28,50
    FEC-02 Fecho Concha Automático Lateral un R$ 18,00
    ESC-05 Escova de Vedação 5x7mm com barreira metro R$ 3,20
  `;

  const accs = extractAccessoriesFromTextHeuristic(sample);
  assert.equal(accs.length, 3);
  assert.equal(accs[0].category, 'Roldana');
  assert.equal(accs[0].unit, 'par');
  assert.equal(accs[0].price, 28.5);
  assert.equal(accs[1].category, 'Fecho');
  assert.equal(accs[2].category, 'Vedação');
  assert.equal(accs[2].unit, 'm');
});
