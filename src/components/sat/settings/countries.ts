/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/countries.ts
 * Description: ISO 3166-1 alpha-2 country list with localised display
 *              names. The list is grouped by continent but the component
 *              flattens it. Keys (`code`) are stable; names go through
 *              Intl.DisplayNames for the active locale at render time.
 */

export interface CountryDef {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRIES: CountryDef[] = [
  { code: "ES", name: "Espanya", flag: "ES" },
  { code: "PT", name: "Portugal", flag: "PT" },
  { code: "AD", name: "Andorra", flag: "AD" },
  { code: "FR", name: "França", flag: "FR" },
  { code: "IT", name: "Itàlia", flag: "IT" },
  { code: "DE", name: "Alemanya", flag: "DE" },
  { code: "AT", name: "Àustria", flag: "AT" },
  { code: "BE", name: "Bèlgica", flag: "BE" },
  { code: "NL", name: "Països Baixos", flag: "NL" },
  { code: "LU", name: "Luxemburg", flag: "LU" },
  { code: "CH", name: "Suïssa", flag: "CH" },
  { code: "GB", name: "Regne Unit", flag: "GB" },
  { code: "IE", name: "Irlanda", flag: "IE" },
  { code: "DK", name: "Dinamarca", flag: "DK" },
  { code: "NO", name: "Noruega", flag: "NO" },
  { code: "SE", name: "Suècia", flag: "SE" },
  { code: "FI", name: "Finlàndia", flag: "FI" },
  { code: "PL", name: "Polònia", flag: "PL" },
  { code: "CZ", name: "Txèquia", flag: "CZ" },
  { code: "GR", name: "Grècia", flag: "GR" },
  { code: "RO", name: "Romania", flag: "RO" },
  { code: "MA", name: "Marroc", flag: "MA" },
  { code: "US", name: "Estats Units", flag: "US" },
  { code: "CA", name: "Canadà", flag: "CA" },
  { code: "MX", name: "Mèxic", flag: "MX" },
  { code: "AR", name: "Argentina", flag: "AR" },
  { code: "CL", name: "Xile", flag: "CL" },
  { code: "CO", name: "Colòmbia", flag: "CO" },
  { code: "CN", name: "Xina", flag: "CN" },
  { code: "JP", name: "Japó", flag: "JP" },
];
