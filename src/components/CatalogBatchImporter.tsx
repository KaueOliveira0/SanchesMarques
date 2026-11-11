import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';
import {
  parseRawCatalogFile,
  detectColumnMapping,
  mapRowsToProfiles,
  parseCsvRows,
  integrateImportedProfiles,
  generateSampleCsv,
  generateSampleJson,
  CatalogParseResult,
  DetectedColumnMapping,
  ProfileImportRow,
} from '../utils/catalogImporter';
import { normalizeGoogleDriveUrl } from '../utils/googleCatalogParser';
import { ProfileDefinition, AccessoryDefinition, StockProfile, StockAccessory } from '../types';
import { saveAccessoriesCustomPrices } from '../utils/pricingCatalog';
import {
  UploadCloud,
  FileSpreadsheet,
  FileCode,
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Database,
  Trash2,
  Package,
  Wrench,
  SlidersHorizontal,
  FileCheck,
  RefreshCw,
  Link as LinkIcon,
  Globe,
  FileText,
  Image as ImageIcon,
  Check,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';

interface ExtractedAccessoryRow {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: 'un' | 'm' | 'par' | 'kit';
  price: number;
  description: string;
  isSelected: boolean;
}

interface SelectableProfileRow extends ProfileImportRow {
  isSelected: boolean;
}

interface CatalogBatchImporterProps {
  onImportComplete?: (message: string) => void;
  onNavigateToProfiles?: () => void;
}

export const CatalogBatchImporter: React.FC<CatalogBatchImporterProps> = ({
  onImportComplete,
  onNavigateToProfiles,
}) => {
  const {
    customProfiles,
    setCustomProfiles,
    customAccessories,
    setCustomAccessories,
    addStockProfile,
    addStockAccessory,
    stockProfiles,
    stockAccessories,
  } = useApp();

  // Abas de entrada
  const [activeInputMode, setActiveInputMode] = useState<'google_link' | 'upload' | 'paste'>('google_link');

  // Estados dos inputs
  const [googleUrl, setGoogleUrl] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);

  // Dados extraídos analisados
  const [supplierName, setSupplierName] = useState<string>('Extrusora / Fabricante');
  const [catalogTitle, setCatalogTitle] = useState<string>('Catálogo Técnico');
  const [targetSeriesOverride, setTargetSeriesOverride] = useState<string>('Universal');
  const [extractedProfiles, setExtractedProfiles] = useState<SelectableProfileRow[]>([]);
  const [extractedAccessories, setExtractedAccessories] = useState<ExtractedAccessoryRow[]>([]);

  // Subaba de resultados
  const [activeResultsSubtab, setActiveResultsSubtab] = useState<'profiles' | 'accessories'>('profiles');

  // Opções de gravação no sistema
  const [addStockBars, setAddStockBars] = useState<boolean>(true);
  const [initialBarsPerProfile, setInitialBarsPerProfile] = useState<number>(5);
  const [addStockParts, setAddStockParts] = useState<boolean>(true);
  const [initialPartsQty, setInitialPartsQty] = useState<number>(20);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Executa a chamada à API do servidor com Gemini 3.8 Flash
  const runAiCatalogAnalysis = async (payload: {
    sourceType: 'text' | 'file' | 'url';
    text?: string;
    fileBase64?: string;
    mimeType?: string;
    fileName?: string;
    targetSeriesHint?: string;
    supplierHint?: string;
  }) => {
    setIsAnalyzingAi(true);
    setParseError(null);
    setAiStatusMessage('Enviando catálogo para análise de engenharia com IA Gemini 3.8 Flash...');

    try {
      const response = await fetch('/api/catalog/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Erro HTTP ${response.status} na análise`);
      }

      const data = result.data;
      setSupplierName(data.supplierName || 'Extrusora / Fabricante');
      setCatalogTitle(data.catalogTitle || payload.fileName || 'Catálogo de Esquadrias');
      if (data.detectedSeries) {
        setTargetSeriesOverride(data.detectedSeries);
      }

      // Mapeia perfis
      const mappedProfiles: SelectableProfileRow[] = (data.profiles || []).map((p: any, idx: number) => ({
        id: p.id || `prof_imp_${Date.now()}_${idx}`,
        code: (p.code || '').toUpperCase().trim(),
        name: p.name || `Perfil ${p.code}`,
        series: p.series || targetSeriesOverride || 'Universal',
        category: p.category || 'Outros',
        kgm: typeof p.kgm === 'number' && p.kgm > 0 ? p.kgm : 0.65,
        defaultLength: 6000,
        pricePerKg: typeof p.pricePerKg === 'number' && p.pricePerKg > 0 ? p.pricePerKg : 35.0,
        dimensions: p.dimensions || '',
        machiningNote: p.machiningNote || '',
        isValid: Boolean(p.code && p.name),
        validationErrors: [],
        isSelected: true,
      }));

      // Mapeia acessórios
      const mappedAccessories: ExtractedAccessoryRow[] = (data.accessories || []).map((a: any, idx: number) => ({
        id: a.id || `acc_imp_${Date.now()}_${idx}`,
        code: (a.code || '').toUpperCase().trim(),
        name: a.name || `Peça ${a.code}`,
        category: a.category || 'Outros',
        unit: ['un', 'm', 'par', 'kit'].includes(a.unit) ? a.unit : 'un',
        price: typeof a.price === 'number' && a.price > 0 ? a.price : 18.0,
        description: a.description || '',
        isSelected: true,
      }));

      setExtractedProfiles(mappedProfiles);
      setExtractedAccessories(mappedAccessories);

      if (mappedProfiles.length === 0 && mappedAccessories.length === 0) {
        setParseError('A IA analisou o arquivo, mas não identificou códigos de perfis ou peças com clareza. Você pode tentar colar o texto ou ajustar o documento.');
      } else {
        setImportNotification(
          `Análise concluída com sucesso! Encontrados ${mappedProfiles.length} perfis de alumínio e ${mappedAccessories.length} acessórios/peças prontos para adicionar ao sistema.`
        );
      }
    } catch (err) {
      console.error('Falha na análise com IA:', err);
      setParseError(`Erro ao analisar catálogo: ${(err as Error).message}`);
    } finally {
      setIsAnalyzingAi(false);
      setAiStatusMessage('');
    }
  };

  // 1. Processar Link do Google Drive ou Google Sheets
  const handleProcessGoogleUrl = async () => {
    if (!googleUrl.trim()) {
      setParseError('Por favor, informe um link válido do Google Drive, Google Sheets ou Documento.');
      return;
    }

    setParseError(null);
    setIsAnalyzingAi(true);
    setAiStatusMessage('Acessando link do Google Drive / Google Sheets...');

    try {
      const norm = normalizeGoogleDriveUrl(googleUrl);

      // Baixa via proxy do servidor
      const fetchRes = await fetch('/api/catalog/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: googleUrl }),
      });

      const fetchResult = await fetchRes.json();
      if (!fetchRes.ok || !fetchResult.success) {
        throw new Error(fetchResult.error || 'Falha ao baixar o arquivo do Google.');
      }

      setAiStatusMessage('Arquivo do Google baixado. Enviando para IA extrair perfis e peças...');

      if (fetchResult.text) {
        // Se for texto/CSV/Sheets
        await runAiCatalogAnalysis({
          sourceType: 'text',
          text: fetchResult.text,
          fileName: `Google Drive (${norm.serviceType})`,
          targetSeriesHint: targetSeriesOverride,
        });
      } else if (fetchResult.fileBase64) {
        // Se for PDF ou binário
        await runAiCatalogAnalysis({
          sourceType: 'file',
          fileBase64: fetchResult.fileBase64,
          mimeType: fetchResult.contentType || 'application/pdf',
          fileName: `Google Drive Doc`,
          targetSeriesHint: targetSeriesOverride,
        });
      }
    } catch (err) {
      console.error(err);
      setParseError((err as Error).message);
      setIsAnalyzingAi(false);
      setAiStatusMessage('');
    }
  };

  // 2. Processar Arquivo (PDF, Excel, Imagem, CSV)
  const processUploadedFile = (file: File) => {
    setFileName(file.name);
    setParseError(null);

    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/') || file.name.match(/\.(png|jpg|jpeg|webp)$/i);
    const isExcel = file.name.match(/\.(xlsx|xls)$/i);

    if (isPdf || isImage) {
      // Leitura como Base64 DataURL para envio multimodal
      const reader = new FileReader();
      reader.onload = async () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1] || result;
        const mimeType = isPdf ? 'application/pdf' : file.type || 'image/png';

        await runAiCatalogAnalysis({
          sourceType: 'file',
          fileBase64: base64Data,
          mimeType,
          fileName: file.name,
          targetSeriesHint: targetSeriesOverride,
        });
      };
      reader.readAsDataURL(file);
    } else if (isExcel) {
      // Leitura de planilha Excel (.xlsx / .xls)
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const csvText = XLSX.utils.sheet_to_csv(worksheet);

          setRawText(csvText);
          await runAiCatalogAnalysis({
            sourceType: 'text',
            text: csvText,
            fileName: file.name,
            targetSeriesHint: targetSeriesOverride,
          });
        } catch (excelErr) {
          setParseError(`Erro ao abrir planilha Excel: ${(excelErr as Error).message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Leitura de texto padrão (.csv, .tsv, .json, .txt)
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        setRawText(content);
        await runAiCatalogAnalysis({
          sourceType: 'text',
          text: content,
          fileName: file.name,
          targetSeriesHint: targetSeriesOverride,
        });
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadedFile(file);
  };

  // 3. Processar Texto Colado
  const handleProcessPastedText = async () => {
    if (!rawText.trim()) {
      setParseError('Cole o texto ou tabela do catálogo no campo abaixo.');
      return;
    }

    await runAiCatalogAnalysis({
      sourceType: 'text',
      text: rawText,
      fileName: 'Texto Colado do Catálogo',
      targetSeriesHint: targetSeriesOverride,
    });
  };

  // Seleção e Desmarcação
  const toggleSelectProfile = (id: string) => {
    setExtractedProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isSelected: !p.isSelected } : p))
    );
  };

  const toggleSelectAccessory = (id: string) => {
    setExtractedAccessories((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isSelected: !a.isSelected } : a))
    );
  };

  const handleToggleSelectAll = (select: boolean) => {
    if (activeResultsSubtab === 'profiles') {
      setExtractedProfiles((prev) => prev.map((p) => ({ ...p, isSelected: select })));
    } else {
      setExtractedAccessories((prev) => prev.map((a) => ({ ...a, isSelected: select })));
    }
  };

  // Limpeza
  const handleClearAll = () => {
    setGoogleUrl('');
    setRawText('');
    setFileName('');
    setExtractedProfiles([]);
    setExtractedAccessories([]);
    setParseError(null);
    setImportNotification(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 4. Injetar Perfis e Peças Selecionados no Sistema (AppContext)
  const handleCommitImportToSystem = () => {
    const selectedProfs = extractedProfiles.filter((p) => p.isSelected && p.isValid);
    const selectedAccs = extractedAccessories.filter((a) => a.isSelected);

    if (selectedProfs.length === 0 && selectedAccs.length === 0) {
      setParseError('Nenhum item marcado para importação. Marque ao menos um perfil ou acessório.');
      return;
    }

    // 1. Injeta Perfis de Alumínio
    let profilesAddedCount = 0;
    if (selectedProfs.length > 0) {
      const existingProfilesMap = new Map(customProfiles.map((p) => [p.code.toUpperCase(), p]));
      const newProfilesList = [...customProfiles];

      selectedProfs.forEach((sp) => {
        const profileDef: ProfileDefinition = {
          id: sp.id || `prof_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          code: sp.code,
          name: sp.name,
          series: targetSeriesOverride !== 'Universal' ? targetSeriesOverride : sp.series,
          category: sp.category,
          kgm: sp.kgm,
          defaultLength: sp.defaultLength || 6000,
          pricePerKg: sp.pricePerKg || 35.0,
          machiningNote: sp.machiningNote || '',
          sourceCatalog: supplierName,
        };

        if (existingProfilesMap.has(sp.code.toUpperCase())) {
          const idx = newProfilesList.findIndex((p) => p.code.toUpperCase() === sp.code.toUpperCase());
          if (idx >= 0) newProfilesList[idx] = profileDef;
        } else {
          newProfilesList.push(profileDef);
          profilesAddedCount++;
        }

        // Saldo de estoque inicial
        if (addStockBars && initialBarsPerProfile > 0) {
          addStockProfile({
            code: sp.code,
            name: sp.name,
            series: profileDef.series,
            color: 'Branco',
            wholeBarsQty: initialBarsPerProfile,
            minBarsThreshold: 2,
            kgm: sp.kgm,
            costPerKg: sp.pricePerKg,
            supplier: supplierName,
            remnants: [],
          });
        }
      });

      setCustomProfiles(newProfilesList);
      localStorage.setItem('sm_custom_pricing_profiles', JSON.stringify(newProfilesList));
    }

    // 2. Injeta Acessórios e Peças
    let accsAddedCount = 0;
    if (selectedAccs.length > 0) {
      const existingAccsMap = new Map(customAccessories.map((a) => [a.code.toUpperCase(), a]));
      const newAccsList = [...customAccessories];

      selectedAccs.forEach((sa) => {
        const accDef: AccessoryDefinition = {
          id: sa.id || `acc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          code: sa.code,
          name: sa.name,
          category: sa.category,
          unit: sa.unit,
          price: sa.price || 18.0,
          minStock: 10,
          sourceCatalog: supplierName,
        };

        if (existingAccsMap.has(sa.code.toUpperCase())) {
          const idx = newAccsList.findIndex((a) => a.code.toUpperCase() === sa.code.toUpperCase());
          if (idx >= 0) newAccsList[idx] = accDef;
        } else {
          newAccsList.push(accDef);
          accsAddedCount++;
        }

        // Adiciona ao estoque de acessórios
        if (addStockParts && initialPartsQty > 0) {
          addStockAccessory({
            code: sa.code,
            name: sa.name,
            category: sa.category,
            unit: sa.unit,
            currentQty: initialPartsQty,
            minQty: 10,
            price: sa.price || 18.0,
            supplier: supplierName,
          });
        }
      });

      setCustomAccessories(newAccsList);
      saveAccessoriesCustomPrices(newAccsList);
    }

    const successMessage = `Sucesso! Foram adicionados/atualizados ${selectedProfs.length} perfis de alumínio e ${selectedAccs.length} peças/acessórios ao banco de dados industrial do Sanches & Marques!`;
    setImportNotification(successMessage);
    if (onImportComplete) {
      onImportComplete(successMessage);
    }
  };

  const totalProfilesCount = extractedProfiles.length;
  const selectedProfilesCount = extractedProfiles.filter((p) => p.isSelected).length;
  const totalAccessoriesCount = extractedAccessories.length;
  const selectedAccessoriesCount = extractedAccessories.filter((a) => a.isSelected).length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Banner de Cabeçalho */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wide">
                Importador com IA de Catálogos do Google &amp; Fabricantes
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                Gemini 3.8 Flash Ativo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Envie catálogos em PDF, fotos/scans, planilhas Excel ou links compartilhados do Google Drive/Sheets. A IA analisa e extrai automaticamente os perfis, barras, kg/m, ferragens e acessórios.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateToProfiles && (
            <button
              type="button"
              onClick={onNavigateToProfiles}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ver Catálogo de Perfis ({customProfiles.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Notificações e Alertas */}
      {importNotification && (
        <div className="bg-emerald-950/90 border border-emerald-700/80 rounded-xl p-4 text-xs text-emerald-200 flex items-start justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-300 block mb-0.5">Operação Concluída com Sucesso!</span>
              <span>{importNotification}</span>
            </div>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="text-emerald-400 hover:text-white font-bold text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {parseError && (
        <div className="bg-rose-950/90 border border-rose-800/80 rounded-xl p-4 text-xs text-rose-200 flex items-start justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-300 block mb-0.5">Aviso de Interpretação</span>
              <span>{parseError}</span>
            </div>
          </div>
          <button onClick={() => setParseError(null)} className="text-rose-400 hover:text-white font-bold text-sm">
            ✕
          </button>
        </div>
      )}

      {/* Painel de Entrada de Dados com 3 Modos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Abas Superiores */}
        <div className="bg-slate-950/80 border-b border-slate-800 p-2 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveInputMode('google_link')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeInputMode === 'google_link'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>1. Link do Google Drive / Google Sheets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveInputMode('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeInputMode === 'upload'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>2. Enviar Arquivo (PDF, Excel, Foto do Catálogo)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveInputMode('paste')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeInputMode === 'paste'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>3. Colar Texto ou Tabela Copiada</span>
          </button>
        </div>

        {/* Conteúdo da Aba 1: Google Drive Link */}
        {activeInputMode === 'google_link' && (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block mb-1.5 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
                Cole o Link Compartilhado do Google Drive, Google Sheets ou Documento:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={googleUrl}
                  onChange={(e) => setGoogleUrl(e.target.value)}
                  placeholder="Ex: https://drive.google.com/file/d/1A2B3C.../view ou https://docs.google.com/spreadsheets/d/..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
                <button
                  type="button"
                  onClick={handleProcessGoogleUrl}
                  disabled={isAnalyzingAi || !googleUrl.trim()}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-950/40 disabled:opacity-50 cursor-pointer"
                >
                  {isAnalyzingAi ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analisando com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analisar Catálogo do Google</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-300 block mb-0.5">Como usar links do Google:</strong>
                No Google Drive ou Planilhas Google, clique em <em>Compartilhar</em> e certifique-se de que a opção de visualização esteja definida como <strong>"Qualquer pessoa com o link pode ler"</strong>. O sistema converterá automaticamente o link para extrair todos os perfis e ferragens!
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba 2: File Upload (PDF, Excel, Imagem, CSV) */}
        {activeInputMode === 'upload' && (
          <div className="p-5 space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/10'
                  : 'border-slate-700 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-950'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.tsv,.json,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                {fileName ? `Arquivo Selecionado: ${fileName}` : 'Clique para selecionar ou arraste o catálogo para cá'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Formatos aceitos: <strong>PDFs de catálogos de extrusoras</strong>, planilhas Excel (<strong>.xlsx</strong> / <strong>.xls</strong>), fotos ou scans de páginas (<strong>PNG</strong>, <strong>JPG</strong>) e arquivos <strong>CSV/JSON</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba 3: Paste Text */}
        {activeInputMode === 'paste' && (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block mb-1.5">
                Cole o Conteúdo do Catálogo (Tabela copiada do PDF, Site ou Planilha):
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Exemplo de linhas:&#10;SU-001 Marco Superior 2 Planos 0,684 kg/m&#10;SU-002 Trilho Inferior com Aba 0,725 kg/m&#10;ROL-01 Roldana Dupla com Rolamento de Agulha par R$ 28,50"
                rows={6}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleProcessPastedText}
                disabled={isAnalyzingAi || !rawText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-950/40 disabled:opacity-50 cursor-pointer"
              >
                {isAnalyzingAi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analisando Texto com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analisar Texto com IA Gemini</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-slate-400 hover:text-white"
              >
                Limpar Campo
              </button>
            </div>
          </div>
        )}

        {/* Status de Loading da IA */}
        {isAnalyzingAi && (
          <div className="p-6 bg-slate-950 border-t border-slate-800 text-center animate-pulse space-y-2">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <div className="text-sm font-bold text-white">IA Gemini 3.8 Flash em Ação</div>
            <p className="text-xs text-amber-300 font-mono">{aiStatusMessage}</p>
          </div>
        )}
      </div>

      {/* Resultados da Análise: Perfis e Peças Extraídas */}
      {(extractedProfiles.length > 0 || extractedAccessories.length > 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4">
          {/* Header dos Resultados */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Itens Identificados no Catálogo
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                  {catalogTitle}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fornecedor detectado: <strong className="text-white">{supplierName}</strong> • Linha: <strong className="text-amber-400">{targetSeriesOverride}</strong>
              </p>
            </div>

            {/* Configuração da Linha e Ações Rápidas */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-semibold">Linha Destino:</span>
                <select
                  value={targetSeriesOverride}
                  onChange={(e) => setTargetSeriesOverride(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-400 font-bold"
                >
                  <option value="Suprema">Linha Suprema (25mm)</option>
                  <option value="Gold">Linha Gold (32mm)</option>
                  <option value="Linha 25">Linha 25</option>
                  <option value="Linha 30">Linha 30</option>
                  <option value="Chroma">Chroma Minimalista</option>
                  <option value="Integrada">Integrada / Persiana</option>
                  <option value="Universal">Universal</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleToggleSelectAll(true)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer"
              >
                Marcar Todos
              </button>

              <button
                type="button"
                onClick={() => handleToggleSelectAll(false)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer"
              >
                Desmarcar Todos
              </button>
            </div>
          </div>

          {/* Abas de Perfis vs Acessórios */}
          <div className="px-4 border-b border-slate-800 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveResultsSubtab('profiles')}
              className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeResultsSubtab === 'profiles'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Perfis de Alumínio ({selectedProfilesCount}/{totalProfilesCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveResultsSubtab('accessories')}
              className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeResultsSubtab === 'accessories'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Peças &amp; Acessórios ({selectedAccessoriesCount}/{totalAccessoriesCount})</span>
            </button>
          </div>

          {/* Tabela de Perfis de Alumínio */}
          {activeResultsSubtab === 'profiles' && (
            <div className="px-4 pb-4">
              <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-96 scrollbar-thin">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-10 text-center">Sel.</th>
                      <th className="p-3">Código</th>
                      <th className="p-3">Descrição Técnica</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3">Linha</th>
                      <th className="p-3">Peso (kg/m)</th>
                      <th className="p-3">Preço Base (R$/kg)</th>
                      <th className="p-3">Usinagens / Dimensões</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 bg-slate-900/60 font-sans">
                    {extractedProfiles.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => toggleSelectProfile(p.id)}
                        className={`hover:bg-slate-800/50 cursor-pointer ${
                          p.isSelected ? 'bg-amber-500/5' : 'opacity-40'
                        }`}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={p.isSelected}
                            onChange={() => toggleSelectProfile(p.id)}
                            className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-400">{p.code}</td>
                        <td className="p-3 font-semibold text-white">{p.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 font-medium">{p.series}</td>
                        <td className="p-3 font-mono font-bold text-cyan-400">
                          {p.kgm.toFixed(3)} kg/m
                        </td>
                        <td className="p-3 font-mono text-emerald-400">
                          R$ {p.pricePerKg.toFixed(2)}
                        </td>
                        <td className="p-3 text-[11px] text-slate-400">
                          {p.dimensions ? `${p.dimensions} • ` : ''}{p.machiningNote || 'Padrão'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabela de Acessórios e Peças */}
          {activeResultsSubtab === 'accessories' && (
            <div className="px-4 pb-4">
              <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-96 scrollbar-thin">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-10 text-center">Sel.</th>
                      <th className="p-3">Código</th>
                      <th className="p-3">Nome da Peça / Acessório</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3">Unidade</th>
                      <th className="p-3">Preço Unitário</th>
                      <th className="p-3">Aplicação / Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 bg-slate-900/60 font-sans">
                    {extractedAccessories.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => toggleSelectAccessory(a.id)}
                        className={`hover:bg-slate-800/50 cursor-pointer ${
                          a.isSelected ? 'bg-amber-500/5' : 'opacity-40'
                        }`}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={a.isSelected}
                            onChange={() => toggleSelectAccessory(a.id)}
                            className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-400">{a.code}</td>
                        <td className="p-3 font-semibold text-white">{a.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700">
                            {a.category}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-cyan-400 uppercase font-bold">{a.unit}</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">
                          R$ {a.price.toFixed(2)}
                        </td>
                        <td className="p-3 text-[11px] text-slate-400">{a.description || 'Padrão'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rodapé com Opções e Botão de Ação Principal */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap text-xs text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addStockBars}
                  onChange={(e) => setAddStockBars(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500"
                />
                <span>Criar saldo de estoque inicial para perfis ({initialBarsPerProfile} barras de 6m)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addStockParts}
                  onChange={(e) => setAddStockParts(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500"
                />
                <span>Cadastrar peças no almoxarifado ({initialPartsQty} un iniciais)</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCommitImportToSystem}
                disabled={selectedProfilesCount === 0 && selectedAccessoriesCount === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 text-xs font-black transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Adicionar {selectedProfilesCount} Perfis e {selectedAccessoriesCount} Peças ao Sistema</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
