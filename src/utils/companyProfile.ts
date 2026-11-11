export interface CompanyProfile {
  name: string;
  tagline: string;
  cnpj: string;
  ie: string;
  address: string;
  cityState: string;
  phone: string;
  email: string;
  website: string;
  technicianName: string;
  technicianCrea: string;
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  name: 'SANCHES & MARQUES ESQUADRIAS',
  tagline: 'Serralharia de Alta Precisão & Esquadrias',
  cnpj: '38.492.108/0001-45',
  ie: '148.920.311.112',
  address: 'Av. Industrial das Esquadrias, 1500 - Galpão 03',
  cityState: 'São Paulo - SP',
  phone: '(11) 98765-4321 / (11) 3456-7890',
  email: 'contato@sanchesemarques.com.br',
  website: 'www.sanchesemarques.com.br',
  technicianName: 'Eng. Carlos Eduardo Sanches',
  technicianCrea: 'CREA-SP 5069281930/D',
};

const STORAGE_KEY_COMPANY = 'sm_company_profile_v1';

export const getEffectiveCompanyProfile = (): CompanyProfile => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_COMPANY) : null;
    if (raw) {
      return { ...DEFAULT_COMPANY_PROFILE, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error loading company profile', e);
  }
  return DEFAULT_COMPANY_PROFILE;
};

export const saveCompanyProfile = (profile: Partial<CompanyProfile>) => {
  try {
    const current = getEffectiveCompanyProfile();
    const updated = { ...current, ...profile };
    localStorage.setItem(STORAGE_KEY_COMPANY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving company profile', e);
  }
};
