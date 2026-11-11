const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const catalogsDir = path.join(__dirname, '..', 'public', 'assets', 'aistudio');

async function extractFromPdf(file) {
  const filePath = path.join(catalogsDir, file);
  console.log(`Extracting: ${file}...`);
  try {
    const buf = fs.readFileSync(filePath);
    const p = new PDFParse(new Uint8Array(buf));
    await p.load();
    const result = await p.getText();
    const text = typeof result === 'string' ? result : (result.text || '');
    console.log(`  -> Length: ${text.length} chars`);
    return text;
  } catch (e) {
    console.error(`  Error in ${file}:`, e.message);
    return '';
  }
}

async function main() {
  const catalogFiles = [
    'SUPREMA_ea969330.pdf',
    'catalogo_gold__1__8c3c4c71.pdf',
    'catalogo_ivgold-r06_c66435a5.pdf',
    'Catalogo_Tecnico_Chroma_e_Club_Chroma_Ed_10_Abril_2024_10_03bd9418.pdf',
    'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf',
    'Cata_logo_Bendini_2026_c1610461.pdf',
    'Cat_logo_2025_-_Miranda_Alum_nios_V4__1_-1_e28e5fdf.pdf',
    'CAT_LOGO_PRESIDENTE_0d0f6150.pdf',
    'CAT_LOGO_-_PERFIS_72b6f9d2.pdf',
    'CAT_LOGO_-_ACESS_RIOS_b3979971.pdf'
  ];

  const catalogSummaries = {};

  for (const file of catalogFiles) {
    const text = await extractFromPdf(file);
    fs.writeFileSync(path.join(__dirname, `extracted_${file}.txt`), text);

    // Profile code matching patterns (e.g., SU-001, LG-001, CH-..., BD-..., etc. and kg/m)
    // Matches like "SU-001", "SU001", "LG-001", "LG001", "DP-001", "MN-001", "CM-001", etc.
    const codeMatches = text.match(/\b([A-Z]{2,4}[- ]?[0-9]{3,4}[A-Z]?)\b/g) || [];
    const uniqueCodes = Array.from(new Set(codeMatches)).slice(0, 100);

    // Look for lines with kg/m (e.g., 0,582 kg/m, 1.250 kg/m)
    const weightMatches = text.match(/[0-9]{1,2}[.,][0-9]{2,3}\s*(?:kg\/m|kg\/bar)/gi) || [];

    catalogSummaries[file] = {
      file,
      charCount: text.length,
      sampleCodes: uniqueCodes.slice(0, 30),
      detectedWeightsCount: weightMatches.length,
      first1000Chars: text.slice(0, 800)
    };
  }

  fs.writeFileSync(path.join(__dirname, 'catalogs_summary.json'), JSON.stringify(catalogSummaries, null, 2));
  console.log('Finished extracting summary.');
}

main();
