import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';

test('xlsx library creates valid workbooks and sheets', () => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['Código', 'Descrição', 'Valor (R$)'],
    ['SU-001', 'Marco Superior', 150.5],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, 'Perfis');

  assert.equal(wb.SheetNames.length, 1);
  assert.equal(wb.SheetNames[0], 'Perfis');
  assert.ok(wb.Sheets['Perfis']['A1']);
  assert.equal(wb.Sheets['Perfis']['A1'].v, 'Código');
  assert.equal(wb.Sheets['Perfis']['C2'].v, 150.5);
});
