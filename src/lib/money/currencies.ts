import type { Currency, Country } from "@/types";

export const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", minorUnits: 2, enabled: true },
  { code: "EUR", name: "Euro", symbol: "€", minorUnits: 2, enabled: true },
  { code: "GBP", name: "British Pound", symbol: "£", minorUnits: 2, enabled: true },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", minorUnits: 2, enabled: true },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", minorUnits: 2, enabled: true },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", minorUnits: 0, enabled: true },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$", minorUnits: 2, enabled: true },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", minorUnits: 2, enabled: true },
  { code: "INR", name: "Indian Rupee", symbol: "₹", minorUnits: 2, enabled: true },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", minorUnits: 2, enabled: false },
  { code: "ZAR", name: "South African Rand", symbol: "R", minorUnits: 2, enabled: true },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD", minorUnits: 3, enabled: false },
];

export const COUNTRIES: Country[] = [
  {
    code: "US",
    name: "United States",
    defaultCurrency: "USD",
    enabled: true,
    regions: [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
      "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
      "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
      "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
      "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
      "New Hampshire", "New Jersey", "New Mexico", "New York",
      "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
      "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
      "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
      "West Virginia", "Wisconsin", "Wyoming",
    ],
  },
  {
    code: "CA",
    name: "Canada",
    defaultCurrency: "CAD",
    enabled: true,
    regions: ["Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba"],
  },
  {
    code: "GB",
    name: "United Kingdom",
    defaultCurrency: "GBP",
    enabled: true,
    regions: ["England", "Scotland", "Wales", "Northern Ireland"],
  },
  {
    code: "DE",
    name: "Germany",
    defaultCurrency: "EUR",
    enabled: true,
    regions: ["Bavaria", "Berlin", "Hamburg", "North Rhine-Westphalia"],
  },
  {
    code: "FR",
    name: "France",
    defaultCurrency: "EUR",
    enabled: true,
    regions: ["Île-de-France", "Provence", "Auvergne-Rhône-Alpes"],
  },
  {
    code: "AU",
    name: "Australia",
    defaultCurrency: "AUD",
    enabled: true,
    regions: ["New South Wales", "Victoria", "Queensland"],
  },
  {
    code: "MX",
    name: "Mexico",
    defaultCurrency: "MXN",
    enabled: true,
    regions: ["Ciudad de México", "Jalisco", "Nuevo León"],
  },
  {
    code: "BR",
    name: "Brazil",
    defaultCurrency: "BRL",
    enabled: true,
    regions: ["São Paulo", "Rio de Janeiro", "Minas Gerais"],
  },
  {
    code: "IN",
    name: "India",
    defaultCurrency: "INR",
    enabled: true,
    regions: ["Maharashtra", "Karnataka", "Delhi", "Tamil Nadu"],
  },
  {
    code: "JP",
    name: "Japan",
    defaultCurrency: "JPY",
    enabled: true,
    regions: ["Tokyo", "Osaka", "Kyoto"],
  },
  {
    code: "ZA",
    name: "South Africa",
    defaultCurrency: "ZAR",
    enabled: true,
    regions: ["Gauteng", "Western Cape", "KwaZulu-Natal"],
  },
];

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function getCountry(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function enabledCountries(): Country[] {
  return COUNTRIES.filter((c) => c.enabled);
}

export function enabledCurrencies(): Currency[] {
  return CURRENCIES.filter((c) => c.enabled);
}
