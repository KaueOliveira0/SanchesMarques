import test from 'node:test';
import assert from 'node:assert/strict';
import { getEffectiveCompanyProfile, saveCompanyProfile, DEFAULT_COMPANY_PROFILE } from './companyProfile';
import { getEffectiveLogoBase64, getEffectiveEmblemSrc, APP_LOGO_BASE64, APP_EMBLEM_SRC, CUSTOM_LOGO_STORAGE_KEY } from './logoData';
import { renderCorporatePdfHeader, escapeHtml } from './pdfPrint';

test('escapeHtml escapes dangerous characters correctly', () => {
  assert.equal(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.equal(escapeHtml('Sanches & Marques'), 'Sanches &amp; Marques');
  assert.equal(escapeHtml("D'Água"), 'D&#039;Água');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
});

test('renderCorporatePdfHeader generates standardized dark gradient header with gold line and contact details', () => {
  const headerHtml = renderCorporatePdfHeader({
    docBadge: 'ORÇAMENTO COMERCIAL',
    docNumber: 'PROP #1099',
    docDate: '22/10/2026',
    docSubtitle: 'Sistemas de Esquadrias de Alto Padrão',
    extraLines: ['Vendedor: João da Silva'],
  });

  assert.ok(headerHtml.includes('pdf-corporate-header'), 'Should contain pdf-corporate-header class');
  assert.ok(headerHtml.includes('pdf-golden-divider'), 'Should contain pdf-golden-divider class');
  assert.ok(headerHtml.includes('ORÇAMENTO COMERCIAL'), 'Should contain document badge');
  assert.ok(headerHtml.includes('PROP #1099'), 'Should contain document number');
  assert.ok(headerHtml.includes('SANCHES &amp; MARQUES'), 'Should contain brand name escaped');
  assert.ok(headerHtml.includes('ESQUADRIAS'), 'Should contain esquadrias spec');
  assert.ok(headerHtml.includes('Vendedor: João da Silva'), 'Should contain extra lines');
});

test('logoData defaults to official high-res transparent emblem when no custom logo set', () => {
  assert.equal(getEffectiveLogoBase64(), APP_LOGO_BASE64);
  assert.equal(getEffectiveEmblemSrc(), APP_EMBLEM_SRC);
});

test('companyProfile returns default profile with tagline', () => {
  const profile = getEffectiveCompanyProfile();
  assert.equal(profile.tagline, 'Serralharia de Alta Precisão & Esquadrias');
  assert.ok(profile.cnpj.length > 0);
  assert.ok(profile.phone.length > 0);
});
