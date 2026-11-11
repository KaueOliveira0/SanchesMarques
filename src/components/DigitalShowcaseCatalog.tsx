import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Heart,
  MessageCircle,
  Copy,
  Check,
  Plus,
  Trash2,
  Share2,
  ExternalLink,
  Sliders,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  Building2,
  X,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  SHOWCASE_PRODUCTS,
  ShowcaseProduct,
  WishlistItem,
  generateWishlistWhatsAppQuote,
} from '../utils/digitalShowcase';
import { sanitizeWhatsAppPhone, createWhatsAppShareUrl } from '../utils/whatsappProposal';

export const DigitalShowcaseCatalog: React.FC = () => {
  const { addOrder, setActiveTab, setSelectedOrderId } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isWishlistDrawerOpen, setIsWishlistDrawerOpen] = useState(false);
  const [activeModalProduct, setActiveModalProduct] = useState<ShowcaseProduct | null>(null);

  // Modal custom item state
  const [customWidth, setCustomWidth] = useState<number>(1500);
  const [customHeight, setCustomHeight] = useState<number>(1200);
  const [customQty, setCustomQty] = useState<number>(1);
  const [customColor, setCustomColor] = useState<string>('Preto');
  const [customGlass, setCustomGlass] = useState<string>('Vidro Temperado 6mm Incolor');
  const [customNotes, setCustomNotes] = useState<string>('');

  // Cliente info
  const [clientName, setClientName] = useState('Mariana S. Costa');
  const [clientPhone, setClientPhone] = useState('(11) 98765-4321');
  const [obraAddress, setObraAddress] = useState('Residencial Alphaville 2 - Casa 88');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'ALL') return SHOWCASE_PRODUCTS;
    return SHOWCASE_PRODUCTS.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  const totalWishlistEstimated = useMemo(() => {
    return wishlist.reduce((acc, it) => acc + it.estimatedUnitPrice * it.quantity, 0);
  }, [wishlist]);

  const handleOpenAddModal = (product: ShowcaseProduct) => {
    setActiveModalProduct(product);
    setCustomWidth(product.defaultWidthMm);
    setCustomHeight(product.defaultHeightMm);
    setCustomQty(1);
    setCustomNotes('');
  };

  const handleConfirmAddToWishlist = () => {
    if (!activeModalProduct) return;

    // Preço unitário proporcional à área
    const baseArea = (activeModalProduct.defaultWidthMm * activeModalProduct.defaultHeightMm) / 1000000;
    const currentArea = (customWidth * customHeight) / 1000000;
    const ratio = Math.max(0.6, currentArea / Math.max(0.5, baseArea));
    const avgBase = (activeModalProduct.estimatedPriceRange.min + activeModalProduct.estimatedPriceRange.max) / 2;
    const estimatedUnitPrice = Math.round(avgBase * ratio);

    const newItem: WishlistItem = {
      productId: activeModalProduct.id,
      productName: activeModalProduct.name,
      series: activeModalProduct.series,
      categoryLabel: activeModalProduct.categoryLabel,
      widthMm: customWidth,
      heightMm: customHeight,
      quantity: customQty,
      color: customColor,
      glassType: customGlass,
      customNotes,
      estimatedUnitPrice,
    };

    setWishlist((prev) => [...prev, newItem]);
    setActiveModalProduct(null);
    showToast(`"${activeModalProduct.name}" adicionado à Lista de Desejos!`);
    setIsWishlistDrawerOpen(true);
  };

  const handleRemoveFromWishlist = (idx: number) => {
    setWishlist((prev) => prev.filter((_, i) => i !== idx));
    showToast('Item removido da lista.');
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url);
      }
    } catch {}
    setCopiedLink(true);
    showToast('Link da vitrine virtual copiado para envio ao cliente!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendWishlistWhatsApp = () => {
    const text = generateWishlistWhatsAppQuote(wishlist, clientName, clientPhone, obraAddress);
    const sanitized = sanitizeWhatsAppPhone(clientPhone);
    const url = createWhatsAppShareUrl(sanitized, text);
    window.open(url, '_blank');
  };

  const handleConvertToOrder = () => {
    if (wishlist.length === 0) return;

    const orderItems = wishlist.map((it, idx) => ({
      id: `wish_item_${Date.now()}_${idx}`,
      typologyId: 'typ_showcase_custom',
      typologyName: it.productName,
      width: it.widthMm,
      height: it.heightMm,
      widthMm: it.widthMm,
      heightMm: it.heightMm,
      quantity: it.quantity,
      roomTag: it.categoryLabel,
      location: it.categoryLabel,
      glassId: 'gls_temp_6mm',
      glassType: it.glassType,
      color: it.color as any,
      aluminumColor: it.color,
      unitPrice: it.estimatedUnitPrice,
      totalPrice: it.estimatedUnitPrice * it.quantity,
      notes: it.customNotes,
    }));

    const createdOrder = addOrder({
      clientName: clientName || 'Cliente da Vitrine Online',
      clientPhone: clientPhone || '',
      clientAddress: obraAddress || 'Endereço da Obra',
      deliveryDate: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
      status: 'Orçamento',
      productionStep: 'Aguardando Insumos',
      color: (wishlist[0]?.color as any) || 'Preto',
      marginPercent: 35,
      laborRatePerM2: 85,
      taxRatePercent: 6,
      discountValue: 0,
      totalWeightKg: Math.round(wishlist.length * 28),
      totalGlassM2: Math.round(wishlist.length * 2.8 * 10) / 10,
      materialCost: Math.round(totalWishlistEstimated * 0.55),
      laborCost: Math.round(totalWishlistEstimated * 0.15),
      subtotal: totalWishlistEstimated,
      finalPrice: totalWishlistEstimated,
      items: orderItems,
    });

    setIsWishlistDrawerOpen(false);
    setSelectedOrderId(createdOrder.id);
    setActiveTab('budgets');
    showToast(`Orçamento OP #${createdOrder.number} criado com sucesso a partir da Lista de Desejos!`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-emerald-500/60 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 text-xs text-emerald-300 font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wide">
                Vitrine &amp; Catálogo Digital Interativo
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CLIENTE / ARQUITETO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Envie aos seus clientes pelo WhatsApp. O cliente seleciona modelos, personaliza medidas e gera a lista de desejos para orçamento.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-sm active:scale-95"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-amber-400" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link da Vitrine'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsWishlistDrawerOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-amber-900/30 cursor-pointer active:scale-95"
          >
            <Heart className="w-4 h-4 fill-slate-950" />
            <span>Lista de Desejos ({wishlist.length})</span>
            {wishlist.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                {wishlist.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Categorias Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        {[
          { id: 'ALL', label: 'Todos os Modelos' },
          { id: 'portas_pivotantes', label: 'Portas de Entrada & ACM' },
          { id: 'integradas_motorizadas', label: 'Persianas Integradas' },
          { id: 'minimalistas', label: 'Linha Minimalista (Chroma)' },
          { id: 'guarda_corpos', label: 'Guarda-Corpos & Sacadas' },
          { id: 'janelas_correr', label: 'Janelas de Correr (Suprema/Gold)' },
          { id: 'brises_fachadas', label: 'Brises & Fachadas Ripadas' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid de Produtos da Vitrine */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col group hover:border-slate-700 transition-all"
          >
            {/* Foto Principal com Badge de Categoria */}
            <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
              <img
                src={prod.imageUrl}
                alt={prod.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none" />

              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-950/80 backdrop-blur-md text-amber-400 border border-amber-500/30">
                {prod.series}
              </span>

              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">
                    Faixa Estimada:
                  </span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    R$ {prod.estimatedPriceRange.min.toLocaleString('pt-BR')} a R${' '}
                    {prod.estimatedPriceRange.max.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Conteúdo Técnico e Destaques */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                  {prod.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {prod.tagline}
                </p>

                {/* Highlights Chips */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                  {prod.highlights.map((hl) => (
                    <span
                      key={hl}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800"
                    >
                      {hl}
                    </span>
                  ))}
                </div>
              </div>

              {/* Botão de Adicionar à Lista */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-500">
                  Padrão: {prod.defaultWidthMm}×{prod.defaultHeightMm}mm
                </span>

                <button
                  type="button"
                  onClick={() => handleOpenAddModal(prod)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-950/20 cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Personalizar &amp; Adicionar</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Personalização e Adição à Lista de Desejos */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">{activeModalProduct.name}</h3>
                <span className="text-[11px] text-amber-400">{activeModalProduct.series}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block text-[11px] mb-1">Largura Estimada (mm)</label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 1000)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-[11px] mb-1">Altura Estimada (mm)</label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 1000)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block text-[11px] mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-[11px] mb-1">Cor do Alumínio</label>
                  <select
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  >
                    <option value="Preto">Preto Fosco</option>
                    <option value="Branco">Branco Neve</option>
                    <option value="Amadeirado">Amadeirado Nogueira</option>
                    <option value="Bronze">Bronze 1003</option>
                    <option value="Natural">Alumínio Natural</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Tipo de Vidro</label>
                <select
                  value={customGlass}
                  onChange={(e) => setCustomGlass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="Vidro Temperado 6mm Incolor">Vidro Temperado 6mm Incolor</option>
                  <option value="Vidro Temperado 6mm Verde">Vidro Temperado 6mm Verde</option>
                  <option value="Vidro Temperado 6mm Fumê">Vidro Temperado 6mm Fumê</option>
                  <option value="Vidro Laminado Acústico 8mm">Vidro Laminado Acústico 8mm (PVB Silence)</option>
                  <option value="Vidro Refletivo Habitat Champanhe">Vidro Refletivo Habitat Champanhe</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Observações Especiais do Vão</label>
                <input
                  type="text"
                  placeholder="Ex: Ponto de energia no teto, vão com coluna de concreto..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModalProduct(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAddToWishlist}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all"
              >
                Confirmar na Lista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer da Lista de Desejos (Carrinho do Cliente) */}
      {isWishlistDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
            {/* Topo do Drawer */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <h3 className="text-sm font-bold text-white">
                  Lista de Desejos ({wishlist.length} item(ns))
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWishlistDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dados do Cliente */}
            <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Dados do Solicitante / Obra:
              </span>
              <input
                type="text"
                placeholder="Seu Nome / Arquiteto"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Telefone (WhatsApp)"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono"
                />
                <input
                  type="text"
                  placeholder="Cidade / Bairro"
                  value={obraAddress}
                  onChange={(e) => setObraAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white"
                />
              </div>
            </div>

            {/* Lista dos Itens Selecionados */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {wishlist.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                  <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                  <p className="text-xs">Sua lista de desejos está vazia.</p>
                  <p className="text-[11px] text-slate-600">
                    Clique em "+ Personalizar & Adicionar" nos produtos da vitrine para montar a proposta.
                  </p>
                </div>
              ) : (
                wishlist.map((it, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 relative group"
                  >
                    <div className="flex justify-between items-start pr-6">
                      <h4 className="text-xs font-bold text-white">{it.productName}</h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromWishlist(idx)}
                        className="text-slate-500 hover:text-rose-400 absolute top-3 right-3 cursor-pointer"
                        title="Remover da lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                      <div>
                        {it.widthMm} × {it.heightMm} mm • {it.quantity} un • {it.color}
                      </div>
                      <div className="text-cyan-400">{it.glassType}</div>
                      {it.customNotes && (
                        <div className="text-slate-500 italic">"{it.customNotes}"</div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-900 text-xs">
                      <span className="text-slate-500 font-sans">Estimativa:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        R$ {(it.estimatedUnitPrice * it.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Rodapé do Carrinho com Ações */}
            {wishlist.length > 0 && (
              <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Estimado da Lista:</span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    R$ {totalWishlistEstimated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleSendWishlistWhatsApp}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar Lista p/ WhatsApp da Serralheria</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConvertToOrder}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-950/30 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Converter em Novo Orçamento (OP)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
