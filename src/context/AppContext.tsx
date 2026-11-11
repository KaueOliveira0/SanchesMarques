import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Order,
  StockProfile,
  StockAccessory,
  StockGlass,
  StockConsumable,
  DeliveryRomaneio,
  CutPiece,
  CutBarPlan,
  ProfileDefinition,
  AccessoryDefinition,
  GlassDefinition,
} from '../types';
import {
  INITIAL_SAMPLE_ORDERS,
  INITIAL_STOCK_PROFILES,
  INITIAL_STOCK_ACCESSORIES,
  INITIAL_STOCK_GLASS,
  INITIAL_STOCK_CONSUMABLES,
  TYPOLOGIES_CATALOG,
  PROFILES_CATALOG,
  ACCESSORIES_CATALOG,
  GLASS_CATALOG,
  COLOR_MULTIPLIERS,
} from '../data/catalog';
import { extractPiecesFromOrders, optimizeCutList } from '../utils/cutOptimizer';
import {
  loadProfilesWithCustomPrices,
  loadGlassWithCustomPrices,
  loadAccessoriesWithCustomPrices,
  loadColorMultipliers,
} from '../utils/pricingCatalog';
import {
  LineClearanceConfig,
  loadClearanceConfigs,
} from '../utils/clearanceConfig';

export type ActiveTab =
  | 'dashboard'
  | 'budgets'
  | 'typologies'
  | 'catalogs_library'
  | 'clearance_settings'
  | 'pricing_table'
  | 'cutting_plan'
  | 'glass_2d_optimizer'
  | 'cnc_studio'
  | 'stock'
  | 'production'
  | 'qr_labels'
  | 'finishes_simulator'
  | 'assembly'
  | 'romaneio'
  | 'site_survey'
  | 'visual_simulator'
  | 'hardware_drill_guide'
  | 'digital_showcase'
  | 'reports';

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  stockProfiles: StockProfile[];
  stockAccessories: StockAccessory[];
  stockGlass: StockGlass[];
  stockConsumables: StockConsumable[];
  romaneios: DeliveryRomaneio[];

  // Tabela Dinâmica de Preços e Folgas
  customProfiles: ProfileDefinition[];
  setCustomProfiles: (profiles: ProfileDefinition[]) => void;
  customGlass: GlassDefinition[];
  setCustomGlass: (glass: GlassDefinition[]) => void;
  customAccessories: AccessoryDefinition[];
  setCustomAccessories: (acc: AccessoryDefinition[]) => void;
  colorMultipliers: Record<string, number>;
  setColorMultipliers: (colors: Record<string, number>) => void;
  clearanceConfigs: LineClearanceConfig[];
  setClearanceConfigs: (configs: LineClearanceConfig[]) => void;

  // Ações de Pedidos
  addOrder: (order: Omit<Order, 'id' | 'number' | 'createdAt' | 'history'>) => Order;
  updateOrder: (order: Order) => void;
  deleteOrder: (id: string) => void;
  approveOrder: (id: string) => void;
  advanceProductionStep: (id: string) => void;

  // Ações de Estoque
  addStockProfile: (profile: Omit<StockProfile, 'id' | 'remnants'> & { remnants?: StockProfile['remnants'] }) => void;
  deleteStockProfile: (id: string) => void;
  updateStockProfileQty: (id: string, delta: number) => void;
  addRemnantToStock: (code: string, color: string, lengthMm: number) => void;
  removeRemnantFromStock: (profileId: string, remnantId: string) => void;
  addStockAccessory: (acc: Omit<StockAccessory, 'id'>) => void;
  deleteStockAccessory: (id: string) => void;
  updateAccessoryQty: (id: string, delta: number) => void;
  addStockGlass: (glass: Omit<StockGlass, 'id'>) => void;
  deleteStockGlass: (id: string) => void;
  updateGlassQty: (id: string, delta: number) => void;
  addStockConsumable: (item: Omit<StockConsumable, 'id'>) => void;
  deleteStockConsumable: (id: string) => void;
  updateConsumableQty: (id: string, delta: number) => void;
  deductStockForOrder: (orderId: string) => boolean;

  // Romaneios
  addRomaneio: (romaneio: Omit<DeliveryRomaneio, 'id' | 'number'>) => void;
  updateRomaneio: (romaneio: DeliveryRomaneio) => void;
  deleteRomaneio: (id: string) => void;

  // Utilitários de Cálculo
  recalculateOrderTotals: (items: Order['items'], marginPct: number, laborM2: number, taxPct: number, discount: number, color: Order['color']) => {
    totalWeightKg: number;
    totalGlassM2: number;
    materialCost: number;
    laborCost: number;
    subtotal: number;
    finalPrice: number;
  };

  // Otimização Global
  getOptimizationForOrders: (orderIds: string[]) => {
    pieces: CutPiece[];
    bars: CutBarPlan[];
    totalBars6m: number;
    totalRemnantsUsed: number;
    efficiency: number;
    totalScrapKg: number;
  };

  // Reset / Backup
  resetToSampleData: () => void;
  exportDatabaseJson: () => void;
  importDatabaseJson: (jsonStr: string) => boolean;
}

const STORAGE_KEY = 'cem_esquadrias_pro_v2_store';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Estados com carregamento do LocalStorage
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_orders`);
      return saved ? JSON.parse(saved) : INITIAL_SAMPLE_ORDERS;
    } catch {
      return INITIAL_SAMPLE_ORDERS;
    }
  });

  const [stockProfiles, setStockProfiles] = useState<StockProfile[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_stock_profiles`);
      return saved ? JSON.parse(saved) : INITIAL_STOCK_PROFILES;
    } catch {
      return INITIAL_STOCK_PROFILES;
    }
  });

  const [stockAccessories, setStockAccessories] = useState<StockAccessory[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_stock_accessories`);
      return saved ? JSON.parse(saved) : INITIAL_STOCK_ACCESSORIES;
    } catch {
      return INITIAL_STOCK_ACCESSORIES;
    }
  });

  const [stockGlass, setStockGlass] = useState<StockGlass[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_stock_glass`);
      return saved ? JSON.parse(saved) : INITIAL_STOCK_GLASS;
    } catch {
      return INITIAL_STOCK_GLASS;
    }
  });

  const [stockConsumables, setStockConsumables] = useState<StockConsumable[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_stock_consumables`);
      return saved ? JSON.parse(saved) : INITIAL_STOCK_CONSUMABLES;
    } catch {
      return INITIAL_STOCK_CONSUMABLES;
    }
  });

  const [romaneios, setRomaneios] = useState<DeliveryRomaneio[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_romaneios`);
      if (saved) return JSON.parse(saved);
      // Romaneio de exemplo inicial
      return [
        {
          id: 'rom_1',
          number: 101,
          orderId: 'ord_101',
          orderNumber: 101,
          clientName: 'Residencial Alphaville - Casa 42',
          address: 'Alameda das Figueiras, 42 - Santana de Parnaíba - SP',
          date: '2026-10-28',
          driverName: 'Rogério Batista',
          vehiclePlate: 'BRA-2E19 (Fiorino Especial)',
          invoiceNumber: 'NF-e 004821',
          status: 'Separado',
          items: [
            {
              description: 'Janela de Correr 2 Folhas Suprema (Branco)',
              dimensions: '1500 × 1200 mm',
              quantity: 3,
              location: 'Dormitórios 1, 2 e 3',
              weightKg: 42.5,
            },
            {
              description: 'Janela Maxim-Ar c/ Braço Inox (Branco)',
              dimensions: '800 × 600 mm',
              quantity: 2,
              location: 'Banheiros',
              weightKg: 14.8,
            },
          ],
        },
      ];
    } catch {
      return [];
    }
  });

  // Tabelas customizadas de preços e custos
  const [customProfiles, setCustomProfiles] = useState<ProfileDefinition[]>(() => loadProfilesWithCustomPrices());
  const [customGlass, setCustomGlass] = useState<GlassDefinition[]>(() => loadGlassWithCustomPrices());
  const [customAccessories, setCustomAccessories] = useState<AccessoryDefinition[]>(() => loadAccessoriesWithCustomPrices());
  const [colorMultipliers, setColorMultipliers] = useState<Record<string, number>>(() => loadColorMultipliers());
  const [clearanceConfigs, setClearanceConfigs] = useState<LineClearanceConfig[]>(() => loadClearanceConfigs());

  // Salvar no localStorage sempre que houver modificações
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_orders`, JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_stock_profiles`, JSON.stringify(stockProfiles));
    } catch (e) {
      console.error(e);
    }
  }, [stockProfiles]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_stock_accessories`, JSON.stringify(stockAccessories));
    } catch (e) {
      console.error(e);
    }
  }, [stockAccessories]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_stock_glass`, JSON.stringify(stockGlass));
    } catch (e) {
      console.error(e);
    }
  }, [stockGlass]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_stock_consumables`, JSON.stringify(stockConsumables));
    } catch (e) {
      console.error(e);
    }
  }, [stockConsumables]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_romaneios`, JSON.stringify(romaneios));
    } catch (e) {
      console.error(e);
    }
  }, [romaneios]);

  // Função para recalcular custos e totais automatizados
  const recalculateOrderTotals = (
    items: Order['items'],
    marginPct: number,
    laborM2: number,
    taxPct: number,
    discount: number,
    color: Order['color']
  ) => {
    let totalWeightKg = 0;
    let totalGlassM2 = 0;
    let aluminumCost = 0;
    let glassCost = 0;
    let accessoriesCost = 0;

    const mult = colorMultipliers[color] || COLOR_MULTIPLIERS[color] || 1.0;

    for (const item of items) {
      const typo = TYPOLOGIES_CATALOG.find((t) => t.id === item.typologyId);
      if (!typo) continue;

      // Perfis (preços dinâmicos por kg)
      for (const cut of typo.formula.cuts) {
        const prof =
          customProfiles.find((p) => p.id === cut.profileId || p.code === cut.profileCode) ||
          PROFILES_CATALOG.find((p) => p.id === cut.profileId || p.code === cut.profileCode);
        if (!prof) continue;
        const lengthMm = cut.formula(item.width, item.height);
        const weight = (lengthMm / 1000) * prof.kgm * cut.quantity * item.quantity;
        const cost = weight * prof.pricePerKg * mult;
        totalWeightKg += weight;
        aluminumCost += cost;
      }

      // Vidro (preços dinâmicos por m²)
      const glassDef =
        customGlass.find((g) => g.id === item.glassId) ||
        GLASS_CATALOG.find((g) => g.id === item.glassId) ||
        customGlass[0] ||
        GLASS_CATALOG[0];
      for (const gCut of typo.formula.glass) {
        const gw = gCut.formulaW(item.width, item.height);
        const gh = gCut.formulaH(item.width, item.height);
        const m2 = (gw * gh * gCut.quantity * item.quantity) / 1000000;
        totalGlassM2 += m2;
        glassCost += m2 * glassDef.pricePerM2;
      }

      // Acessórios (preços dinâmicos unitários)
      for (const accFormula of typo.formula.accessories) {
        const accDef =
          customAccessories.find((a) => a.id === accFormula.accessoryId) ||
          ACCESSORIES_CATALOG.find((a) => a.id === accFormula.accessoryId);
        if (!accDef) continue;
        const qty = accFormula.formulaQuantity(item.width, item.height, item.quantity);
        accessoriesCost += qty * accDef.price;
      }

      // Insumos extras e materiais avulsos selecionados no item
      if (item.customMaterials?.extraMaterials) {
        for (const extra of item.customMaterials.extraMaterials) {
          accessoriesCost += (extra.quantity || 0) * (extra.unitPrice || 0);
        }
      }

      // Contramarco dedicado se ativado
      if (item.customMaterials?.counterFrameIncluded) {
        accessoriesCost += 38.00 * item.quantity;
      }
    }

    const materialCost = aluminumCost + glassCost + accessoriesCost;
    const laborCost = totalGlassM2 * laborM2;
    const directCost = materialCost + laborCost;

    // Preço com margem de lucro e impostos
    const priceWithMargin = directCost * (1 + marginPct / 100);
    const subtotal = priceWithMargin * (1 + taxPct / 100);
    const finalPrice = Math.max(0, subtotal - discount);

    return {
      totalWeightKg: Math.round(totalWeightKg * 10) / 10,
      totalGlassM2: Math.round(totalGlassM2 * 100) / 100,
      materialCost: Math.round(materialCost * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
    };
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'number' | 'createdAt' | 'history'>) => {
    const nextNumber = orders.length > 0 ? Math.max(...orders.map((o) => o.number)) + 1 : 101;
    const now = new Date().toISOString();

    const newOrder: Order = {
      ...orderData,
      id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      number: nextNumber,
      createdAt: now.slice(0, 10),
      history: [
        { date: now.replace('T', ' ').slice(0, 16), action: `Orçamento Nº ${nextNumber} cadastrado no sistema.` },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrder = (updatedOrder: Order) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
  };

  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const approveOrder = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
          return {
            ...o,
            status: 'Aprovado',
            productionStep: 'Aguardando Insumos',
            history: [
              ...o.history,
              { date: now, action: 'Orçamento aprovado pelo cliente. Convertido em Ordem de Produção (OP).' },
            ],
          };
        }
        return o;
      })
    );
  };

  const advanceProductionStep = (id: string) => {
    const steps: Order['productionStep'][] = [
      'Aguardando Insumos',
      'Corte CNC',
      'Usinagem / Furação',
      'Montagem de Esquadrias',
      'Envidraçamento & Vedação',
      'Controle de Qualidade',
      'Expedição / Concluído',
    ];

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const currentStep = o.productionStep || 'Aguardando Insumos';
          const currentIndex = steps.indexOf(currentStep);
          const nextIndex = Math.min(steps.length - 1, currentIndex + 1);
          const nextStep = steps[nextIndex];
          const isDone = nextIndex === steps.length - 1;
          const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

          return {
            ...o,
            status: isDone ? 'Concluído' : 'Em Produção',
            productionStep: nextStep,
            history: [
              ...o.history,
              { date: now, action: `Etapa de produção avançada para: "${nextStep}".` },
            ],
          };
        }
        return o;
      })
    );
  };

  const addStockProfile = (profileData: Omit<StockProfile, 'id' | 'remnants'> & { remnants?: StockProfile['remnants'] }) => {
    const newProfile: StockProfile = {
      ...profileData,
      id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      remnants: profileData.remnants || [],
    };
    setStockProfiles((prev) => [newProfile, ...prev]);
  };

  const deleteStockProfile = (id: string) => {
    setStockProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  const updateStockProfileQty = (id: string, delta: number) => {
    setStockProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, wholeBarsQty: Math.max(0, p.wholeBarsQty + delta) } : p))
    );
  };

  const addRemnantToStock = (code: string, color: string, lengthMm: number) => {
    setStockProfiles((prev) =>
      prev.map((p) => {
        if (p.code === code && p.color === color) {
          const newRem = {
            id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            lengthMm,
            registeredAt: new Date().toISOString().slice(0, 10),
          };
          return {
            ...p,
            remnants: [...p.remnants, newRem],
          };
        }
        return p;
      })
    );
  };

  const removeRemnantFromStock = (profileId: string, remnantId: string) => {
    setStockProfiles((prev) =>
      prev.map((p) => {
        if (p.id === profileId) {
          return {
            ...p,
            remnants: p.remnants.filter((r) => r.id !== remnantId),
          };
        }
        return p;
      })
    );
  };

  const addStockAccessory = (accData: Omit<StockAccessory, 'id'>) => {
    const newAcc: StockAccessory = {
      ...accData,
      id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    setStockAccessories((prev) => [newAcc, ...prev]);
  };

  const deleteStockAccessory = (id: string) => {
    setStockAccessories((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAccessoryQty = (id: string, delta: number) => {
    setStockAccessories((prev) =>
      prev.map((a) => (a.id === id ? { ...a, currentQty: Math.max(0, a.currentQty + delta) } : a))
    );
  };

  const addStockGlass = (glassData: Omit<StockGlass, 'id'>) => {
    const newGlass: StockGlass = {
      ...glassData,
      id: `gls_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    setStockGlass((prev) => [newGlass, ...prev]);
  };

  const deleteStockGlass = (id: string) => {
    setStockGlass((prev) => prev.filter((g) => g.id !== id));
  };

  const updateGlassQty = (id: string, delta: number) => {
    setStockGlass((prev) =>
      prev.map((g) => (g.id === id ? { ...g, currentAreaM2: Math.max(0, Math.round((g.currentAreaM2 + delta) * 10) / 10) } : g))
    );
  };

  const addStockConsumable = (itemData: Omit<StockConsumable, 'id'>) => {
    const newItem: StockConsumable = {
      ...itemData,
      id: `csm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    setStockConsumables((prev) => [newItem, ...prev]);
  };

  const deleteStockConsumable = (id: string) => {
    setStockConsumables((prev) => prev.filter((c) => c.id !== id));
  };

  const updateConsumableQty = (id: string, delta: number) => {
    setStockConsumables((prev) =>
      prev.map((c) => (c.id === id ? { ...c, currentQty: Math.max(0, Math.round((c.currentQty + delta) * 10) / 10) } : c))
    );
  };

  const deductStockForOrder = (orderId: string): boolean => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;

    // Calcular plano de corte do pedido
    const pieces = extractPiecesFromOrders([order]);
    const opt = optimizeCutList(pieces, stockProfiles);

    // Deduzir barras de 6m
    const barsCountByProfileColor: Record<string, number> = {};
    for (const bar of opt.bars) {
      if (!bar.isRemnant) {
        const key = `${bar.profileCode}|${bar.color}`;
        barsCountByProfileColor[key] = (barsCountByProfileColor[key] || 0) + 1;
      }
    }

    setStockProfiles((prev) =>
      prev.map((sp) => {
        const key = `${sp.code}|${sp.color}`;
        const needed = barsCountByProfileColor[key] || 0;
        return {
          ...sp,
          wholeBarsQty: Math.max(0, sp.wholeBarsQty - needed),
        };
      })
    );

    // Deduzir vidro
    if (order.totalGlassM2 > 0) {
      setStockGlass((prev) =>
        prev.map((g) => ({
          ...g,
          currentAreaM2: Math.max(0, g.currentAreaM2 - (order.totalGlassM2 / prev.length)),
        }))
      );
    }

    // Registrar no histórico
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    updateOrder({
      ...order,
      history: [
        ...order.history,
        { date: now, action: `Insumos e barras de corte deduzidos do estoque (${opt.totalBars6m} barras de 6m).` },
      ],
    });

    return true;
  };

  const addRomaneio = (data: Omit<DeliveryRomaneio, 'id' | 'number'>) => {
    const nextNum = romaneios.length > 0 ? Math.max(...romaneios.map((r) => r.number)) + 1 : 101;
    const newRom: DeliveryRomaneio = {
      ...data,
      id: `rom_${Date.now()}`,
      number: nextNum,
    };
    setRomaneios((prev) => [newRom, ...prev]);
  };

  const updateRomaneio = (updated: DeliveryRomaneio) => {
    setRomaneios((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const deleteRomaneio = (id: string) => {
    setRomaneios((prev) => prev.filter((r) => r.id !== id));
  };

  const getOptimizationForOrders = (orderIds: string[]) => {
    const selected = orders.filter((o) => orderIds.includes(o.id));
    const pieces = extractPiecesFromOrders(selected);
    const opt = optimizeCutList(pieces, stockProfiles);

    return {
      pieces,
      bars: opt.bars,
      totalBars6m: opt.totalBars6m,
      totalRemnantsUsed: opt.totalRemnantsUsed,
      efficiency: opt.overallEfficiencyPercent,
      totalScrapKg: opt.totalScrapKg,
    };
  };

  const resetToSampleData = () => {
    setOrders(INITIAL_SAMPLE_ORDERS);
    setStockProfiles(INITIAL_STOCK_PROFILES);
    setStockAccessories(INITIAL_STOCK_ACCESSORIES);
    setStockGlass(INITIAL_STOCK_GLASS);
    setStockConsumables(INITIAL_STOCK_CONSUMABLES);
    localStorage.removeItem(`${STORAGE_KEY}_orders`);
    localStorage.removeItem(`${STORAGE_KEY}_stock_profiles`);
    localStorage.removeItem(`${STORAGE_KEY}_stock_accessories`);
    localStorage.removeItem(`${STORAGE_KEY}_stock_glass`);
    localStorage.removeItem(`${STORAGE_KEY}_stock_consumables`);
    localStorage.removeItem(`${STORAGE_KEY}_romaneios`);
  };

  const exportDatabaseJson = () => {
    const data = {
      version: '2.1',
      exportedAt: new Date().toISOString(),
      orders,
      stockProfiles,
      stockAccessories,
      stockGlass,
      stockConsumables,
      romaneios,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_sanches_e_marques_esquadrias_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importDatabaseJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.orders) setOrders(data.orders);
      if (data.stockProfiles) setStockProfiles(data.stockProfiles);
      if (data.stockAccessories) setStockAccessories(data.stockAccessories);
      if (data.stockGlass) setStockGlass(data.stockGlass);
      if (data.stockConsumables) setStockConsumables(data.stockConsumables);
      if (data.romaneios) setRomaneios(data.romaneios);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        orders,
        selectedOrderId,
        setSelectedOrderId,
        stockProfiles,
        stockAccessories,
        stockGlass,
        stockConsumables,
        romaneios,
        addOrder,
        updateOrder,
        deleteOrder,
        approveOrder,
        advanceProductionStep,
        addStockProfile,
        deleteStockProfile,
        updateStockProfileQty,
        addRemnantToStock,
        removeRemnantFromStock,
        addStockAccessory,
        deleteStockAccessory,
        updateAccessoryQty,
        addStockGlass,
        deleteStockGlass,
        updateGlassQty,
        addStockConsumable,
        deleteStockConsumable,
        updateConsumableQty,
        deductStockForOrder,
        addRomaneio,
        updateRomaneio,
        deleteRomaneio,
        recalculateOrderTotals,
        getOptimizationForOrders,
        resetToSampleData,
        exportDatabaseJson,
        importDatabaseJson,
        setOrders,
        customProfiles,
        setCustomProfiles,
        customGlass,
        setCustomGlass,
        customAccessories,
        setCustomAccessories,
        colorMultipliers,
        setColorMultipliers,
        clearanceConfigs,
        setClearanceConfigs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser utilizado dentro de um AppProvider');
  }
  return context;
};
