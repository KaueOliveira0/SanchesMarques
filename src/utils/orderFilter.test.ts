import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAndSortOrders, normalizeSearchTerm } from './orderFilter';
import { Order } from '../types';

const mockOrders: Order[] = [
  {
    id: 'ord_1',
    number: 101,
    clientName: 'Residencial Alphaville (Sr. Carlos Eduardo)',
    clientPhone: '(11) 98765-4321',
    clientEmail: 'carlos@alphaville.com.br',
    clientAddress: 'Alameda dos Ipês, 450 - Barueri/SP',
    createdAt: '2026-10-01',
    deliveryDate: '2026-10-25',
    status: 'Orçamento',
    color: 'Preto',
    items: [
      {
        id: 'it_1',
        typologyId: 'typ_cor2_sup',
        typologyName: 'Janela de Correr 2 Folhas (Suprema)',
        width: 1500,
        height: 1200,
        quantity: 3,
        roomTag: 'Sala de Estar',
        color: 'Preto',
        glassId: 'gls_temp_6mm',
      },
    ],
    totalWeightKg: 45.0,
    totalGlassM2: 3.5,
    materialCost: 2000,
    laborCost: 400,
    subtotal: 3200,
    finalPrice: 3200,
    history: [],
  },
  {
    id: 'ord_2',
    number: 102,
    clientName: 'Edifício Horizon (Arq. Mariana Santos)',
    clientPhone: '(11) 97123-8899',
    clientEmail: 'mariana@horizon.arq.br',
    clientAddress: 'Av. Paulista, 1800 - Bela Vista/SP',
    createdAt: '2026-10-05',
    deliveryDate: '2026-10-30',
    status: 'Aprovado',
    color: 'Branco',
    items: [
      {
        id: 'it_2',
        typologyId: 'typ_port_gold',
        typologyName: 'Porta de Correr 4 Folhas (Gold)',
        width: 3200,
        height: 2400,
        quantity: 2,
        roomTag: 'Varanda Gourmet',
        color: 'Branco',
        glassId: 'gls_lam_8mm',
      },
    ],
    totalWeightKg: 120.0,
    totalGlassM2: 12.0,
    materialCost: 7500,
    laborCost: 1500,
    subtotal: 13500,
    finalPrice: 13500,
    history: [],
  },
  {
    id: 'ord_3',
    number: 103,
    clientName: 'Clínica Bella Fisio',
    clientPhone: '(11) 99444-1122',
    clientAddress: 'Rua das Flores, 88 - Campinas/SP',
    createdAt: '2026-10-10',
    deliveryDate: '2026-11-05',
    status: 'Em Produção',
    color: 'Amadeirado',
    items: [
      {
        id: 'it_3',
        typologyId: 'typ_max_sup',
        typologyName: 'Maxim-Ar com Grade (Suprema)',
        width: 800,
        height: 800,
        quantity: 4,
        roomTag: 'Consultórios',
        color: 'Amadeirado',
        glassId: 'gls_temp_6mm',
      },
    ],
    totalWeightKg: 35.0,
    totalGlassM2: 2.2,
    materialCost: 1800,
    laborCost: 350,
    subtotal: 2900,
    finalPrice: 2900,
    history: [],
  },
];

test('normalizeSearchTerm removes accents and trims', () => {
  assert.equal(normalizeSearchTerm('  São Paulo / Orçamento  '), 'sao paulo / orcamento');
  assert.equal(normalizeSearchTerm('Edifício Horizon'), 'edificio horizon');
});

test('filterAndSortOrders filters by client name case and accent insensitively', () => {
  const result = filterAndSortOrders(mockOrders, { searchTerm: 'carlos' });
  assert.equal(result.filteredOrders.length, 1);
  assert.equal(result.filteredOrders[0].number, 101);
});

test('filterAndSortOrders searches by OP number formatted or bare', () => {
  const result1 = filterAndSortOrders(mockOrders, { searchTerm: '102' });
  assert.equal(result1.filteredOrders.length, 1);
  assert.equal(result1.filteredOrders[0].clientName, 'Edifício Horizon (Arq. Mariana Santos)');

  const result2 = filterAndSortOrders(mockOrders, { searchTerm: 'OP #103' });
  assert.equal(result2.filteredOrders.length, 1);
  assert.equal(result2.filteredOrders[0].number, 103);
});

test('filterAndSortOrders searches by typology or room inside items', () => {
  const result1 = filterAndSortOrders(mockOrders, { searchTerm: 'Varanda Gourmet' });
  assert.equal(result1.filteredOrders.length, 1);
  assert.equal(result1.filteredOrders[0].number, 102);

  const result2 = filterAndSortOrders(mockOrders, { searchTerm: 'Maxim-Ar' });
  assert.equal(result2.filteredOrders.length, 1);
  assert.equal(result2.filteredOrders[0].number, 103);
});

test('filterAndSortOrders filters by status', () => {
  const orcamentos = filterAndSortOrders(mockOrders, { status: 'Orçamento' });
  assert.equal(orcamentos.filteredOrders.length, 1);
  assert.equal(orcamentos.filteredOrders[0].status, 'Orçamento');

  const aprovados = filterAndSortOrders(mockOrders, { status: 'Aprovado' });
  assert.equal(aprovados.filteredOrders.length, 1);
  assert.equal(aprovados.filteredOrders[0].status, 'Aprovado');

  const todos = filterAndSortOrders(mockOrders, { status: 'ALL' });
  assert.equal(todos.filteredOrders.length, 3);
});

test('filterAndSortOrders filters by category / color finish', () => {
  const pretos = filterAndSortOrders(mockOrders, { category: 'Preto' });
  assert.equal(pretos.filteredOrders.length, 1);
  assert.equal(pretos.filteredOrders[0].color, 'Preto');

  const amadeirados = filterAndSortOrders(mockOrders, { category: 'Amadeirado' });
  assert.equal(amadeirados.filteredOrders.length, 1);
  assert.equal(amadeirados.filteredOrders[0].number, 103);
});

test('filterAndSortOrders calculates correct summary statistics', () => {
  const result = filterAndSortOrders(mockOrders, { status: 'ALL' });
  assert.equal(result.summary.totalCount, 3);
  assert.equal(result.summary.matchedCount, 3);
  assert.equal(result.summary.totalMatchedValue, 19600);
  assert.equal(result.summary.totalMatchedWeightKg, 200.0);
  assert.equal(result.summary.totalMatchedGlassM2, 17.7);
});

test('filterAndSortOrders sorts correctly by value and client name', () => {
  const sortedValueDesc = filterAndSortOrders(mockOrders, { sortBy: 'value_desc' });
  assert.equal(sortedValueDesc.filteredOrders[0].number, 102); // 13500
  assert.equal(sortedValueDesc.filteredOrders[2].number, 103); // 2900

  const sortedClientAsc = filterAndSortOrders(mockOrders, { sortBy: 'client_asc' });
  assert.equal(sortedClientAsc.filteredOrders[0].number, 103); // Clínica Bella Fisio
});
