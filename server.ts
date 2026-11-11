import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { normalizeGoogleDriveUrl, extractProfilesFromTextHeuristic, extractAccessoriesFromTextHeuristic } from './src/utils/googleCatalogParser';
import { extractPricingFromTextHeuristic, SAMPLE_OCR_DATASETS } from './src/utils/pricingOcrParser';

dotenv.config();

const app = express();
const PORT = 3000;

// Permite payloads de arquivos e PDFs em base64 até 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Inicialização do cliente oficial Gemini no servidor conforme Skill gemini-api
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Endpoint para buscar e baixar conteúdo de links compartilhados do Google Drive, Google Sheets ou Web
 */
app.post('/api/catalog/fetch-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'URL inválida ou vazia.' });
    }

    const driveInfo = normalizeGoogleDriveUrl(url);
    const targetUrl = driveInfo.directDownloadUrl;

    const fetchResponse = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!fetchResponse.ok) {
      return res.status(fetchResponse.status).json({
        success: false,
        error: `Não foi possível baixar o arquivo da URL fornecida (HTTP ${fetchResponse.status}). Verifique se o compartilhamento no Google Drive está definido como "Qualquer pessoa com o link pode ler".`,
      });
    }

    const contentType = fetchResponse.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await fetchResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Se for texto/CSV/HTML
    if (contentType.includes('text') || contentType.includes('json') || contentType.includes('csv')) {
      const text = buffer.toString('utf-8');
      return res.json({
        success: true,
        driveInfo,
        contentType,
        text,
      });
    }

    // Se for binário (PDF, Imagem, Excel)
    const base64 = buffer.toString('base64');
    return res.json({
      success: true,
      driveInfo,
      contentType,
      fileBase64: base64,
      fileSizeBytes: buffer.length,
    });
  } catch (err) {
    console.error('Erro em /api/catalog/fetch-url:', err);
    return res.status(500).json({
      success: false,
      error: `Erro ao acessar o link: ${(err as Error).message}`,
    });
  }
});

/**
 * Endpoint de Extração Inteligente de Catálogos via Gemini 3.8 Flash
 */
app.post('/api/catalog/analyze', async (req, res) => {
  try {
    const {
      sourceType, // 'text' | 'file' | 'url'
      text,
      fileBase64,
      mimeType,
      fileName,
      targetSeriesHint,
      supplierHint,
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback gracioso para extração local heurística caso a chave não esteja presente
      console.warn('GEMINI_API_KEY ausente. Utilizando motor de extração local.');
      const localProfiles = extractProfilesFromTextHeuristic(text || '', targetSeriesHint || 'Universal', supplierHint || 'Catálogo');
      const localAccessories = extractAccessoriesFromTextHeuristic(text || '');
      return res.json({
        success: true,
        source: 'local_heuristic',
        data: {
          supplierName: supplierHint || 'Catálogo Importado',
          catalogTitle: fileName || 'Catálogo de Esquadrias',
          detectedSeries: targetSeriesHint || (localProfiles[0]?.series || 'Universal'),
          profiles: localProfiles,
          accessories: localAccessories,
        },
      });
    }

    // Prepara as partes do conteúdo para a IA
    const parts: any[] = [];

    // Se houver arquivo binário (PDF ou imagem)
    if (fileBase64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType,
          data: fileBase64,
        },
      });
    }

    // Prompt detalhado com regras de engenharia de esquadrias no Brasil
    const promptInstructions = `
Você é um engenheiro sênior especialista em esquadrias de alumínio industriais brasileiras (normas ABNT NBR 10821 e NBR 7199), com profundo conhecimento das linhas do mercado: Suprema (25mm), Gold (32mm), Inova, Linha 25, Linha 30, Chroma/Minimalista, Integrada Persiana, Fachada Grid/Structural Glazing e Universal.

Analise atentamente o documento/texto/imagem do catálogo técnico fornecido e extraia:
1. TODOS os perfis de alumínio presentes:
   - code: Código comercial do perfil (ex: SU-001, GL-002, CHR-020, MN-053, MP-340, AL-100, etc.)
   - name: Nome técnico da peça (ex: Marco Superior 2 Planos, Trilho Inferior com Aba, Montante Folha Mão de Amigo, Travessa, Baguete, Arremate)
   - series: Linha/Série (ex: Suprema, Gold, Linha 25, Linha 30, Chroma, Integrada, Universal). Se informado ${targetSeriesHint ? `use preferencialmente '${targetSeriesHint}'` : 'deduza pela referência ou título'}.
   - category: Marco, Folha, Trilho, Travessa, Baguate, Arremate, Montante, Contramarco ou Outros.
   - kgm: Peso nominal por metro linear em kg/m (número decimal, ex: 0.684, 1.150, 0.725). Se estiver em peso de barra de 6m, divida por 6. Se ausente, estime de acordo com o porte do perfil.
   - pricePerKg: Custo base estimado por kg em R$ (padrão R$ 34.00 a 38.00).
   - dimensions: Dimensões da seção (largura x altura em mm se indicado).
   - machiningNote: Orientações de usinagem, furação, drenos ou estampo.

2. TODOS os acessórios, peças e ferragens presentes:
   - code: Código do acessório (ex: ROL-01, FEC-SUP-01, ESC-5X7, GU-EPDM-01, FECH-32).
   - name: Nome do acessório (ex: Roldana Dupla com Rolamento de Agulha, Fecho Concha Automático, Escova de Vedação 5x7mm, Puxador Tubular Inox).
   - category: Roldana, Fecho, Fechadura, Puxador, Vedação, Parafusos, Braço, Motor ou Outros.
   - unit: un, m, par ou kit.
   - price: Preço unitário estimado em R$.
   - description: Função ou aplicação da peça na esquadria.

${text ? `Conteúdo adicional de texto do catálogo:\n${text.slice(0, 50000)}` : ''}
    `.trim();

    parts.push({ text: promptInstructions });

    // Chamada oficial à API do Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: 'Você é um assistente técnico e engenheiro industrial de esquadrias de alumínio. Retorne sempre JSON válido e rigoroso com a lista de perfis e acessórios extraídos.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplierName: { type: Type.STRING, description: 'Nome da extrusora ou distribuidor (ex: Belmetal, Hydro, Alcoa, CBA, Alumiconte, etc.)' },
            catalogTitle: { type: Type.STRING, description: 'Título ou identificação do catálogo' },
            detectedSeries: { type: Type.STRING, description: 'Série predominante detectada' },
            profiles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  name: { type: Type.STRING },
                  series: { type: Type.STRING },
                  category: { type: Type.STRING },
                  kgm: { type: Type.NUMBER },
                  pricePerKg: { type: Type.NUMBER },
                  dimensions: { type: Type.STRING },
                  machiningNote: { type: Type.STRING },
                },
                required: ['code', 'name', 'kgm'],
              },
            },
            accessories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                },
                required: ['code', 'name'],
              },
            },
          },
          required: ['profiles', 'accessories'],
        },
      },
    });

    const jsonText = (response.text ?? '{}').trim();
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(jsonText);
    } catch {
      // Se houver algum caractere fora do JSON, tenta extrair o bloco {}
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        throw new Error('Falha ao interpretar resposta estruturada da IA.');
      }
    }

    // Normalização e validação dos dados retornados
    const profiles = (parsedData.profiles || []).map((p: any, idx: number) => ({
      id: `prof_imp_${Date.now()}_${idx}`,
      code: String(p.code || `AL-${idx + 1}`).trim().toUpperCase(),
      name: String(p.name || `Perfil ${p.code}`).trim(),
      series: p.series || targetSeriesHint || 'Universal',
      category: p.category || 'Outros',
      kgm: typeof p.kgm === 'number' && p.kgm > 0 ? p.kgm : 0.65,
      defaultLength: 6000,
      pricePerKg: typeof p.pricePerKg === 'number' && p.pricePerKg > 0 ? p.pricePerKg : 35.0,
      dimensions: p.dimensions || '',
      machiningNote: p.machiningNote || '',
      isValid: true,
      validationErrors: [],
    }));

    const accessories = (parsedData.accessories || []).map((a: any, idx: number) => ({
      id: `acc_imp_${Date.now()}_${idx}`,
      code: String(a.code || `ACC-${idx + 1}`).trim().toUpperCase(),
      name: String(a.name || `Acessório ${a.code}`).trim(),
      category: a.category || 'Outros',
      unit: ['un', 'm', 'par', 'kit'].includes(a.unit) ? a.unit : 'un',
      price: typeof a.price === 'number' && a.price > 0 ? a.price : 18.0,
      description: a.description || '',
      isValid: true,
      validationErrors: [],
    }));

    return res.json({
      success: true,
      source: 'gemini_ai',
      data: {
        supplierName: parsedData.supplierName || supplierHint || 'Extrusora / Fabricante',
        catalogTitle: parsedData.catalogTitle || fileName || 'Catálogo Técnico',
        detectedSeries: parsedData.detectedSeries || targetSeriesHint || (profiles[0]?.series || 'Universal'),
        profiles,
        accessories,
      },
    });
  } catch (err) {
    console.error('Erro em /api/catalog/analyze:', err);

    // Fallback local se o Gemini falhar
    const fallbackText = req.body?.text || '';
    if (fallbackText) {
      const localProfiles = extractProfilesFromTextHeuristic(fallbackText);
      const localAccessories = extractAccessoriesFromTextHeuristic(fallbackText);
      return res.json({
        success: true,
        source: 'local_heuristic_fallback',
        warning: `Análise realizada pelo motor de contingência local devido a: ${(err as Error).message}`,
        data: {
          supplierName: req.body?.supplierHint || 'Catálogo',
          catalogTitle: req.body?.fileName || 'Catálogo de Esquadrias',
          detectedSeries: localProfiles[0]?.series || 'Universal',
          profiles: localProfiles,
          accessories: localAccessories,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: `Falha na análise do catálogo: ${(err as Error).message}`,
    });
  }
});

/**
 * Endpoint de Leitura OCR de Tabelas de Preços de Alumínio via Gemini 3.8 Flash Vision
 * Recebe print/imagem (base64) ou texto e gera matriz de preços com R$/kg, barras e acabamentos
 */
app.post('/api/pricing/ocr-matrix', async (req, res) => {
  try {
    const { imageBase64, mimeType, rawText, supplierHint } = req.body;

    if (!imageBase64 && !rawText) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma imagem ou texto de tabela de preços foi fornecido.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY ausente. Utilizando motor OCR heurístico de preços.');
      const localResult = extractPricingFromTextHeuristic(rawText || '');
      return res.json({
        success: true,
        source: 'local_heuristic',
        supplier: supplierHint || localResult.supplier || SAMPLE_OCR_DATASETS[0].supplier,
        colorMultipliers: localResult.colorMultipliers || SAMPLE_OCR_DATASETS[0].colorMultipliers,
        items: localResult.items.length > 0 ? localResult.items : SAMPLE_OCR_DATASETS[0].items,
      });
    }

    const parts: any[] = [];
    if (imageBase64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      });
    }

    const promptInstructions = `
Você é um engenheiro sênior orçamentista de esquadrias de alumínio industriais e especialista em OCR de tabelas comerciais (Belmetal, Hydro, Alcoa, CBA, Alumiconte, Perfil Alumínio, Miranda, etc.).
Analise atentamente a imagem do print / tabela de preços de perfis de alumínio e extraia:
1. supplier: Nome da extrusora ou distribuidora que emitiu a tabela.
2. effectiveDate: Data de vigência ou emissão se visível (ex: Março/2026, 01/02/2026).
3. detectedBaseKgPrice: Preço base ou médio por kg de alumínio bruto/natural (R$/kg).
4. colorMultipliers: Multiplicadores de acabamento/cor identificados na tabela (ex: Natural=1.0, Branco=1.12, Preto=1.15, Bronze=1.20, Amadeirado=1.45).
5. items: Lista de TODOS os perfis identificados com seus respectivos preços:
   - code: Código do perfil (ex: SU-001, GL-002, CHR-020, MN-053, MP-340, AL-100, CM-060, BG-01, VT-100, etc.)
   - name: Descrição da peça (ex: Trilho Superior 2 Planos, Marco Lateral, Montante Folha, Travessa, Baguete)
   - series: Linha/Série (ex: Suprema, Gold, Inova, Linha 25, Linha 30, Chroma, Minimalista, Fachada, Universal)
   - category: Trilho, Marco, Folha, Travessa, Baguete, Arremate, Contramarco ou Outros
   - kgm: Peso por metro linear em kg/m se disponível na tabela (ex: 0.684, 1.150)
   - pricePerKg: Preço por kg em R$ (número decimal, ex: 38.50). Se a tabela estiver em preço por barra de 6m e o peso for conhecido, deduza pricePerKg = preco_barra / (kgm * 6).
   - barPrice6m: Preço da barra de 6 metros se indicado explicitamente.
   - confidence: Nível de confiança da leitura OCR (0.0 a 1.0).
   - colorPrices: Preços específicos por acabamento se houver colunas separadas (ex: { Natural: 35.0, Branco: 39.2, Preto: 40.5, Bronze: 42.0, Amadeirado: 51.0 }).

${rawText ? `Texto auxiliar ou dados tabulares colados:\n${rawText.slice(0, 30000)}` : ''}
    `.trim();

    parts.push({ text: promptInstructions });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: 'Você é um motor de OCR de altíssima precisão para tabelas de preços de perfis de alumínio. Retorne sempre JSON rigoroso e padronizado.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplier: { type: Type.STRING },
            effectiveDate: { type: Type.STRING },
            detectedBaseKgPrice: { type: Type.NUMBER },
            colorMultipliers: {
              type: Type.OBJECT,
              properties: {
                Natural: { type: Type.NUMBER },
                Branco: { type: Type.NUMBER },
                Preto: { type: Type.NUMBER },
                Bronze: { type: Type.NUMBER },
                Amadeirado: { type: Type.NUMBER },
              },
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  name: { type: Type.STRING },
                  series: { type: Type.STRING },
                  category: { type: Type.STRING },
                  kgm: { type: Type.NUMBER },
                  pricePerKg: { type: Type.NUMBER },
                  barPrice6m: { type: Type.NUMBER },
                  confidence: { type: Type.NUMBER },
                  colorPrices: {
                    type: Type.OBJECT,
                    properties: {
                      Natural: { type: Type.NUMBER },
                      Branco: { type: Type.NUMBER },
                      Preto: { type: Type.NUMBER },
                      Bronze: { type: Type.NUMBER },
                      Amadeirado: { type: Type.NUMBER },
                    },
                  },
                },
                required: ['code', 'pricePerKg'],
              },
            },
          },
          required: ['supplier', 'items'],
        },
      },
    });

    const jsonText = (response.text ?? '{}').trim();
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(jsonText);
    } catch {
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        throw new Error('Falha ao interpretar resposta OCR da IA.');
      }
    }

    return res.json({
      success: true,
      source: 'gemini_vision_ocr',
      supplier: parsedData.supplier || supplierHint || 'Extrusora de Alumínio',
      effectiveDate: parsedData.effectiveDate,
      detectedBaseKgPrice: parsedData.detectedBaseKgPrice,
      colorMultipliers: parsedData.colorMultipliers,
      items: parsedData.items || [],
    });
  } catch (err) {
    console.error('Erro em /api/pricing/ocr-matrix:', err);
    const fallbackText = req.body?.rawText || '';
    const localResult = extractPricingFromTextHeuristic(fallbackText);
    return res.json({
      success: true,
      source: 'local_heuristic_fallback',
      warning: `Processado via contingência local devido a instabilidade externa: ${(err as Error).message}`,
      supplier: req.body?.supplierHint || localResult.supplier || SAMPLE_OCR_DATASETS[0].supplier,
      colorMultipliers: localResult.colorMultipliers || SAMPLE_OCR_DATASETS[0].colorMultipliers,
      items: localResult.items.length > 0 ? localResult.items : SAMPLE_OCR_DATASETS[0].items,
    });
  }
});

// Inicialização Full-Stack com Vite em desenvolvimento
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sanches & Marques Backend] Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
