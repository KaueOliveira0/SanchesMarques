/**
 * Presets de cidades brasileiras e mapa de isopletas de vento (NBR 6123 / NBR 10821)
 */

export interface CityPreset {
  cityName: string;
  state: string;
  windZone: 'I' | 'II' | 'III' | 'IV' | 'V';
  basicWindSpeedV0: number; // m/s
  defaultTerrain: 'I_mar_aberto' | 'II_litoral' | 'III_suburbano' | 'IV_urbano_denso';
}

export const BRAZIL_CITY_PRESETS: CityPreset[] = [
  { cityName: 'São Paulo', state: 'SP', windZone: 'III', basicWindSpeedV0: 40, defaultTerrain: 'III_suburbano' },
  { cityName: 'Rio de Janeiro', state: 'RJ', windZone: 'IV', basicWindSpeedV0: 45, defaultTerrain: 'II_litoral' },
  { cityName: 'Belo Horizonte', state: 'MG', windZone: 'II', basicWindSpeedV0: 35, defaultTerrain: 'III_suburbano' },
  { cityName: 'Curitiba', state: 'PR', windZone: 'III', basicWindSpeedV0: 40, defaultTerrain: 'III_suburbano' },
  { cityName: 'Porto Alegre', state: 'RS', windZone: 'IV', basicWindSpeedV0: 45, defaultTerrain: 'III_suburbano' },
  { cityName: 'Florianópolis', state: 'SC', windZone: 'IV', basicWindSpeedV0: 45, defaultTerrain: 'II_litoral' },
  { cityName: 'Santos', state: 'SP', windZone: 'IV', basicWindSpeedV0: 45, defaultTerrain: 'II_litoral' },
  { cityName: 'Campinas', state: 'SP', windZone: 'III', basicWindSpeedV0: 40, defaultTerrain: 'III_suburbano' },
  { cityName: 'Brasília', state: 'DF', windZone: 'II', basicWindSpeedV0: 35, defaultTerrain: 'III_suburbano' },
  { cityName: 'Salvador', state: 'BA', windZone: 'II', basicWindSpeedV0: 35, defaultTerrain: 'II_litoral' },
  { cityName: 'Recife', state: 'PE', windZone: 'II', basicWindSpeedV0: 35, defaultTerrain: 'II_litoral' },
  { cityName: 'Fortaleza', state: 'CE', windZone: 'II', basicWindSpeedV0: 35, defaultTerrain: 'II_litoral' },
];
