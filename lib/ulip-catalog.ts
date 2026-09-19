// Shared (client + server safe) catalog of the ICEGATE APIs exposed by the ULIP
// test console. Kept out of lib/ulip.ts because that module is server-only.
// Required fields per API come from the ULIP ICEGATE spec / KT doc §1.4.

export type IcegateField = {
  k: string; // request body key ULIP expects
  label: string; // UI label
  v?: string; // default placeholder value (text fields)
  date?: boolean; // if true, default to today in DDMMYYYY
};

export type IcegateApi = {
  api: number;
  code: string; // e.g. "ICEGATE/02" — the actual ULIP path segment
  name: string;
  fields: IcegateField[];
};

export const ICEGATE_CATALOG: IcegateApi[] = [
  { api: 1, code: "ICEGATE/01", name: "IGM vessel info", fields: [
    { k: "igmNo", label: "IGM No", v: "2320714" },
    { k: "igmDt", label: "IGM Date (DDMMYYYY)", date: true },
  ] },
  { api: 2, code: "ICEGATE/02", name: "Bill of Entry status", fields: [
    { k: "beNo", label: "BE No", v: "2002892" },
    { k: "beDt", label: "BE Date (DDMMYYYY)", date: true },
  ] },
  { api: 3, code: "ICEGATE/03", name: "BE line items", fields: [
    { k: "beNo", label: "BE No", v: "2002892" },
    { k: "beDt", label: "BE Date (DDMMYYYY)", date: true },
  ] },
  { api: 4, code: "ICEGATE/04", name: "Vessel / port details", fields: [
    { k: "siteId", label: "Site ID", v: "INNSA1" },
    { k: "imoCode", label: "IMO Code", v: "9739131" },
    { k: "vesselCode", label: "Vessel Code", v: "MEDU" },
    { k: "arrivalDate", label: "Arrival Date (DDMMYYYY)", date: true },
  ] },
  { api: 5, code: "ICEGATE/05", name: "Shipping Bill status", fields: [
    { k: "sbNo", label: "SB No", v: "6845161" },
    { k: "sbDt", label: "SB Date (DDMMYYYY)", date: true },
  ] },
  { api: 6, code: "ICEGATE/06", name: "SB line items / EGM link", fields: [
    { k: "sbNo", label: "SB No", v: "6845161" },
    { k: "sbDt", label: "SB Date (DDMMYYYY)", date: true },
  ] },
  { api: 7, code: "ICEGATE/07", name: "Import manifest", fields: [
    { k: "igmNo", label: "IGM No", v: "2320714" },
    { k: "igmDt", label: "IGM Date (DDMMYYYY)", date: true },
  ] },
  { api: 8, code: "ICEGATE/08", name: "Export manifest (EGM)", fields: [
    { k: "egmNo", label: "EGM No", v: "1234567" },
    { k: "egmDt", label: "EGM Date (DDMMYYYY)", date: true },
  ] },
  { api: 13, code: "ICEGATE/13", name: "E-seal container", fields: [
    { k: "esealNumber", label: "E-seal Number", v: "12345678" },
    { k: "containerNumber", label: "Container No", v: "ACMP1000010" },
  ] },
];

export const ICEGATE_APIS = new Set(ICEGATE_CATALOG.map((a) => a.api));

export function todayDDMMYYYY(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}${mm}${d.getFullYear()}`;
}
