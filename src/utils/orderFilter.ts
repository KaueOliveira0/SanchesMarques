import { Order, ColorFinish } from '../types';

export interface OrderFilterCriteria {
  searchTerm?: string;
  status?: string; // 'ALL' or specific status
  category?: string; // 'ALL' or finish/color ('Branco', 'Preto', etc.) or typology category
  sortBy?: 'newest' | 'oldest' | 'value_desc' | 'value_asc' | 'client_asc' | 'weight_desc';
}

export interface FilteredOrdersSummary {
  totalCount: number;
  matchedCount: number;
  totalMatchedValue: number;
  totalMatchedWeightKg: number;
  totalMatchedGlassM2: number;
}

/**
 * Normalizes text removing diacritics/accents for robust search matching
 */
export function normalizeSearchTerm(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Filter orders by search query and category/status dropdowns
 */
export function filterAndSortOrders(
  orders: Order[],
  criteria: OrderFilterCriteria
): { filteredOrders: Order[]; summary: FilteredOrdersSummary } {
  const normalizedSearch = normalizeSearchTerm(criteria.searchTerm || '');
  const targetStatus = criteria.status && criteria.status !== 'ALL' ? criteria.status : null;
  const targetCategory = criteria.category && criteria.category !== 'ALL' ? criteria.category : null;

  const filtered = orders.filter((order) => {
    // 1. Status Filter
    if (targetStatus && order.status !== targetStatus) {
      return false;
    }

    // 2. Category / Finish Filter
    if (targetCategory) {
      // Check if matches order finish color
      const matchColor = order.color?.toLowerCase() === targetCategory.toLowerCase();
      // Or matches any typology item category or name
      const matchTypology = order.items?.some(
        (it) =>
          it.typologyName?.toLowerCase().includes(targetCategory.toLowerCase()) ||
          it.roomTag?.toLowerCase().includes(targetCategory.toLowerCase())
      );
      if (!matchColor && !matchTypology) {
        return false;
      }
    }

    // 3. Search query matching
    if (normalizedSearch) {
      const searchFields = [
        String(order.number || ''),
        `op #${order.number || ''}`,
        `op${order.number || ''}`,
        order.clientName || '',
        order.clientPhone || '',
        order.clientEmail || '',
        order.clientAddress || order.address || order.projectAddress || '',
        order.color || '',
        order.sellerName || '',
        order.notes || '',
        ...(order.items || []).flatMap((it) => [
          it.typologyName || '',
          it.roomTag || it.location || '',
          it.glassType || '',
        ]),
      ].map(normalizeSearchTerm);

      const matchesQuery = searchFields.some((field) => field.includes(normalizedSearch));
      if (!matchesQuery) return false;
    }

    return true;
  });

  // Sort results
  const sorted = [...filtered].sort((a, b) => {
    switch (criteria.sortBy) {
      case 'oldest':
        return a.number - b.number;
      case 'value_desc':
        return (b.finalPrice || 0) - (a.finalPrice || 0);
      case 'value_asc':
        return (a.finalPrice || 0) - (b.finalPrice || 0);
      case 'client_asc':
        return (a.clientName || '').localeCompare(b.clientName || '');
      case 'weight_desc':
        return (b.totalWeightKg || 0) - (a.totalWeightKg || 0);
      case 'newest':
      default:
        return b.number - a.number;
    }
  });

  const summary: FilteredOrdersSummary = {
    totalCount: orders.length,
    matchedCount: sorted.length,
    totalMatchedValue: sorted.reduce((sum, o) => sum + (o.finalPrice || 0), 0),
    totalMatchedWeightKg: Number(sorted.reduce((sum, o) => sum + (o.totalWeightKg || 0), 0).toFixed(2)),
    totalMatchedGlassM2: Number(sorted.reduce((sum, o) => sum + (o.totalGlassM2 || 0), 0).toFixed(2)),
  };

  return { filteredOrders: sorted, summary };
}
