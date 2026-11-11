import * as XLSX from 'xlsx';
import { Order, StockProfile, StockAccessory, StockGlass, StockConsumable } from '../types/index.ts';
import { TYPOLOGIES_CATALOG, PROFILES_CATALOG, GLASS_CATALOG } from '../data/catalog.ts';

/**
 * Utilitário de Exportação em Excel (.xlsx) para Sanches & Marques Esquadrias
 * Formata planilhas profissionais compatíveis com Excel, LibreOffice e ERPs/Sistemas Contábeis
 */

/**
 * Exporta um Orçamento ou Pedido detalhado para Excel (.xlsx)
 */
export function exportOrderToExcel(order: Order): void {
  const wb = XLSX.utils.book_new();

  // 1. Aba Resumo Geral do Pedido / Orçamento
  const resumoData = [
    ['SANCHES & MARQUES ESQUADRIAS - RELATÓRIO COMERCIAL & CONTÁBIL'],
    ['Sistema de Gestão Industrial de Esquadrias de Alumínio'],
    [],
    ['DADOS GERAIS DO PEDIDO'],
    ['Número do Pedido / Orçamento:', `#${order.number}`],
    ['Status:', order.status],
    ['Data de Emissão:', new Date(order.createdAt).toLocaleDateString('pt-BR')],
    ['Data Prevista de Entrega:', new Date(order.deliveryDate).toLocaleDateString('pt-BR')],
    [],
    ['DADOS DO CLIENTE'],
    ['Nome / Razão Social:', order.clientName],
    ['Telefone / WhatsApp:', order.clientPhone],
    ['E-mail:', order.clientEmail || 'Não informado'],
    ['Endereço da Obra:', order.clientAddress],
    [],
    ['CONDIÇÕES FINANCEIRAS & CONTÁBEIS'],
    ['Acabamento Geral dos Perfis:', order.color],
    ['Margem de Lucro (%):', `${order.marginPercent}%`],
    ['Taxa de Mão de Obra (R$/m²):', `R$ ${(order.laborRatePerM2 ?? order.laborCostPerM2 ?? 0).toFixed(2)}`],
    ['Alíquota de Impostos (%):', `${order.taxRatePercent ?? order.taxPct ?? 0}%`],
    ['Desconto Concedido (R$):', `R$ ${(order.discountValue ?? order.discountAmount ?? 0).toFixed(2)}`],
    ['Custo dos Materiais (R$):', `R$ ${order.materialCost.toFixed(2)}`],
    ['Custo de Mão de Obra (R$):', `R$ ${order.laborCost.toFixed(2)}`],
    ['Subtotal (R$):', `R$ ${order.subtotal.toFixed(2)}`],
    ['VALOR TOTAL DO PEDIDO:', `R$ ${order.finalPrice.toFixed(2)}`],
  ];

  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  wsResumo['!cols'] = [{ wch: 30 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo do Pedido');

  // 2. Aba Itens e Vãos
  const itensHeader = [
    'Item',
    'Ambiente / Identificação',
    'Tipologia',
    'Linha',
    'Largura (mm)',
    'Altura (mm)',
    'Área Unitária (m²)',
    'Quantidade',
    'Área Total (m²)',
    'Vidro Especificado',
  ];

  const itensRows = order.items.map((it, idx) => {
    const areaM2 = (it.width * it.height) / 1_000_000;
    const typology = TYPOLOGIES_CATALOG.find((t) => t.id === it.typologyId);
    const glass = GLASS_CATALOG.find((g) => g.id === it.glassId);
    return [
      idx + 1,
      it.roomTag || `Vão ${idx + 1}`,
      it.typologyName,
      typology?.series || 'Suprema',
      it.width,
      it.height,
      Number(areaM2.toFixed(3)),
      it.quantity,
      Number((areaM2 * it.quantity).toFixed(3)),
      glass?.name || 'Padrão',
    ];
  });

  const wsItens = XLSX.utils.aoa_to_sheet([itensHeader, ...itensRows]);
  wsItens['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 30 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 15 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, wsItens, 'Esquadrias e Vãos');

  // 3. Detalhamento de Perfis e Cortes
  const perfisHeader = ['Código Perfil', 'Descrição', 'Comprimento Corte (mm)', 'Ângulo Esquerdo', 'Ângulo Direito', 'Qtd Peças'];
  const perfisRows: any[] = [];
  order.items.forEach((item) => {
    const typology = TYPOLOGIES_CATALOG.find((t) => t.id === item.typologyId);
    if (typology && typology.formula && typology.formula.cuts) {
      typology.formula.cuts.forEach((cut) => {
        const cutLen = Math.round(cut.formula(item.width, item.height));
        const profDef = PROFILES_CATALOG.find((p) => p.code === cut.profileCode);
        perfisRows.push([
          cut.profileCode,
          profDef?.name || cut.description,
          cutLen,
          `${cut.angleLeft}°`,
          `${cut.angleRight}°`,
          cut.quantity * item.quantity,
        ]);
      });
    }
  });

  if (perfisRows.length > 0) {
    const wsPerfis = XLSX.utils.aoa_to_sheet([perfisHeader, ...perfisRows]);
    wsPerfis['!cols'] = [{ wch: 15 }, { wch: 35 }, { wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsPerfis, 'Lista de Perfis (Cortes)');
  }

  // Gravar e disparar download
  const safeName = order.clientName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Sanches&Marques_Orcamento_${order.number}_${safeName}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Exporta todo o catálogo e inventário de Estoque para Excel (.xlsx) para contabilidade
 */
export function exportStockToExcel(
  stockProfiles: StockProfile[],
  stockAccessories: StockAccessory[],
  stockGlass: StockGlass[],
  stockConsumables: StockConsumable[] = []
): void {
  const wb = XLSX.utils.book_new();

  // Calcular totais financeiros do estoque
  const totalProfilesVal = stockProfiles.reduce((acc, p) => {
    const costPerKg = PROFILES_CATALOG.find((pr) => pr.code === p.code)?.pricePerKg || 35;
    return acc + p.wholeBarsQty * 6 * p.kgm * costPerKg;
  }, 0);
  const totalAccVal = stockAccessories.reduce((acc, a) => acc + a.currentQty * a.price, 0);
  const totalGlassVal = stockGlass.reduce((acc, g) => acc + g.currentAreaM2 * g.pricePerM2, 0);
  const totalConsVal = stockConsumables.reduce((acc, c) => acc + c.currentQty * c.price, 0);
  const grandTotalStock = totalProfilesVal + totalAccVal + totalGlassVal + totalConsVal;

  // 1. Resumo Contábil de Estoque
  const resumo = [
    ['SANCHES & MARQUES ESQUADRIAS - BALANÇO PATRIMONIAL DE ESTOQUE'],
    ['Data do Relatório:', new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR')],
    [],
    ['CATEGORIA', 'QUANTIDADE DE ITENS', 'VALOR PATRIMONIAL AVALIADO (R$)'],
    ['Perfis de Alumínio (Barras de 6m):', stockProfiles.length, Number(totalProfilesVal.toFixed(2))],
    ['Acessórios & Ferragens:', stockAccessories.length, Number(totalAccVal.toFixed(2))],
    ['Chapas & Painéis de Vidro:', stockGlass.length, Number(totalGlassVal.toFixed(2))],
    ['Insumos & Consumíveis de Oficina:', stockConsumables.length, Number(totalConsVal.toFixed(2))],
    [],
    ['VALOR TOTAL DO ATIVO EM ESTOQUE:', '', Number(grandTotalStock.toFixed(2))],
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumo);
  wsResumo['!cols'] = [{ wch: 35 }, { wch: 22 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Contábil');

  // 2. Perfis de Alumínio
  const perfHeader = [
    'Código',
    'Descrição do Perfil',
    'Linha',
    'Cor / Acabamento',
    'Barras de 6m',
    'Estoque Mínimo',
    'Metros Totais',
    'Peso Unitário (kg/m)',
    'Peso Total (kg)',
    'Custo por kg (R$)',
    'Valor Total em Estoque (R$)',
    'Status Reposição',
  ];
  const perfRows = stockProfiles.map((p) => {
    const costPerKg = PROFILES_CATALOG.find((pr) => pr.code === p.code)?.pricePerKg || 35;
    const totalMeters = p.wholeBarsQty * 6;
    const totalKg = totalMeters * p.kgm;
    const totalVal = totalKg * costPerKg;
    const isLow = p.wholeBarsQty <= p.minBarsThreshold;
    return [
      p.code,
      p.name,
      p.series,
      p.color,
      p.wholeBarsQty,
      p.minBarsThreshold,
      totalMeters,
      p.kgm,
      Number(totalKg.toFixed(2)),
      Number(costPerKg.toFixed(2)),
      Number(totalVal.toFixed(2)),
      isLow ? 'REPOR URGENTE' : 'REGULAR',
    ];
  });
  const wsPerfis = XLSX.utils.aoa_to_sheet([perfHeader, ...perfRows]);
  wsPerfis['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 12 },
    { wch: 15 },
    { wch: 14 },
    { wch: 15 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPerfis, 'Perfis de Alumínio');

  // 3. Retalhos Reaproveitáveis
  const retHeader = ['Código Perfil', 'Descrição', 'Cor', 'Comprimento (mm)', 'Data de Entrada'];
  const retRows: any[] = [];
  stockProfiles.forEach((p) => {
    p.remnants.forEach((r) => {
      retRows.push([p.code, p.name, p.color, r.lengthMm, new Date(r.registeredAt).toLocaleDateString('pt-BR')]);
    });
  });
  const wsRetalhos = XLSX.utils.aoa_to_sheet([retHeader, ...retRows]);
  wsRetalhos['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsRetalhos, 'Retalhos de Alumínio');

  // 4. Acessórios & Ferragens
  const accHeader = [
    'Código',
    'Descrição',
    'Categoria',
    'Qtd em Estoque',
    'Estoque Mínimo',
    'Custo Unitário (R$)',
    'Valor Total (R$)',
    'Status Reposição',
  ];
  const accRows = stockAccessories.map((a) => {
    const totalVal = a.currentQty * a.price;
    const isLow = a.currentQty <= a.minQty;
    return [
      a.code,
      a.name,
      a.category || 'Acessório',
      a.currentQty,
      a.minQty,
      Number(a.price.toFixed(2)),
      Number(totalVal.toFixed(2)),
      isLow ? 'COMPRAR' : 'REGULAR',
    ];
  });
  const wsAcc = XLSX.utils.aoa_to_sheet([accHeader, ...accRows]);
  wsAcc['!cols'] = [
    { wch: 14 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAcc, 'Acessórios e Ferragens');

  // 5. Vidros
  const glassHeader = [
    'Tipo de Vidro',
    'Espessura (mm)',
    'Área em Estoque (m²)',
    'Estoque Mínimo (m²)',
    'Custo por m² (R$)',
    'Valor Total (R$)',
    'Status Reposição',
  ];
  const glassRows = stockGlass.map((g) => {
    const totalVal = g.currentAreaM2 * g.pricePerM2;
    const isLow = g.currentAreaM2 <= g.minAreaM2;
    return [
      g.name,
      g.thicknessMm,
      g.currentAreaM2,
      g.minAreaM2,
      Number(g.pricePerM2.toFixed(2)),
      Number(totalVal.toFixed(2)),
      isLow ? 'COMPRAR' : 'REGULAR',
    ];
  });
  const wsGlass = XLSX.utils.aoa_to_sheet([glassHeader, ...glassRows]);
  wsGlass['!cols'] = [
    { wch: 28 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsGlass, 'Estoque de Vidros');

  // 6. Consumíveis e Insumos
  const consHeader = [
    'Código',
    'Descrição do Insumo',
    'Unidade',
    'Qtd Atual',
    'Estoque Mínimo',
    'Custo Unitário (R$)',
    'Valor Total (R$)',
    'Status Reposição',
  ];
  const consRows = stockConsumables.map((c) => {
    const totalVal = c.currentQty * c.price;
    const isLow = c.currentQty <= c.minQty;
    return [
      c.code,
      c.name,
      c.unit,
      c.currentQty,
      c.minQty,
      Number(c.price.toFixed(2)),
      Number(totalVal.toFixed(2)),
      isLow ? 'COMPRAR' : 'REGULAR',
    ];
  });
  const wsCons = XLSX.utils.aoa_to_sheet([consHeader, ...consRows]);
  wsCons['!cols'] = [
    { wch: 14 },
    { wch: 30 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCons, 'Insumos e Consumíveis');

  const filename = `Sanches&Marques_Inventario_Estoque_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
