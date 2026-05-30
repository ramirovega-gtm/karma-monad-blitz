/**
 * Context graph del lado del usuario: el contexto de la persona/empresa que opera la plataforma.
 * Los agentes lo leen para ejecutar SIN pedir inputs. Cuando un agente necesita un dato específico
 * que no está en el contexto global, lo pide una vez y se guarda en la "memoria por agente".
 */

export interface ContextField {
  key: string;
  label: string;
  placeholder: string;
  secure?: boolean;
  seed?: string;
}

export interface ContextGroup {
  id: string;
  label: string;
  icon: string;
  fields: ContextField[];
}

export const CONTEXT_GROUPS: ContextGroup[] = [
  {
    id: "fiscal",
    label: "Identidad & Fiscal",
    icon: "▤",
    fields: [
      { key: "razonSocial", label: "Razón social / Nombre", placeholder: "Estudio Vega SRL", seed: "Estudio Vega SRL" },
      { key: "cuit", label: "CUIT / CUIL", placeholder: "30-71234567-8", seed: "30-71234567-8" },
      { key: "ivaCondition", label: "Condición IVA", placeholder: "Monotributo / Resp. Inscripto", seed: "Monotributo" },
      { key: "domicilio", label: "Domicilio fiscal", placeholder: "Av. Corrientes 1234, CABA" },
      { key: "email", label: "Email", placeholder: "hola@estudiovega.com", seed: "hola@estudiovega.com" },
      { key: "telefono", label: "Teléfono", placeholder: "+54 11 5555-5555" },
    ],
  },
  {
    id: "negocio",
    label: "Negocio",
    icon: "◉",
    fields: [
      { key: "rubro", label: "Rubro", placeholder: "Servicios profesionales", seed: "Servicios profesionales" },
      { key: "descripcion", label: "Qué hacés", placeholder: "Consultoría contable para PyMEs" },
      { key: "sitioWeb", label: "Sitio web", placeholder: "estudiovega.com" },
      { key: "icp", label: "Cliente ideal (ICP)", placeholder: "PyMEs B2B de software, 10-50 empleados" },
      { key: "tonoMarca", label: "Tono de marca", placeholder: "Cercano y profesional" },
    ],
  },
  {
    id: "prefs",
    label: "Preferencias",
    icon: "◈",
    fields: [
      { key: "moneda", label: "Moneda", placeholder: "USDC", seed: "USDC" },
      { key: "idioma", label: "Idioma", placeholder: "Español (AR)", seed: "Español (AR)" },
      { key: "horario", label: "Horario de operación", placeholder: "Lun-Vie 9-18 (GMT-3)" },
      { key: "politicaReembolso", label: "Política de reembolsos", placeholder: "Hasta 30 días" },
    ],
  },
  {
    id: "integraciones",
    label: "Integraciones",
    icon: "◆",
    fields: [
      { key: "erp", label: "ERP / Contabilidad", placeholder: "Xubio / Colppy" },
      { key: "crm", label: "CRM", placeholder: "HubSpot" },
      { key: "wallet", label: "Wallet (pagos)", placeholder: "0x8a4F…51ee", seed: "0x8a4F…51ee" },
    ],
  },
];

export const CONTEXT_FIELD_LABEL: Record<string, string> = Object.fromEntries(
  CONTEXT_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f.label])),
);

export const CONTEXT_SEED: Record<string, string> = Object.fromEntries(
  CONTEXT_GROUPS.flatMap((g) =>
    g.fields.filter((f) => f.seed).map((f) => [f.key, f.seed as string]),
  ),
);

export const ALL_CONTEXT_KEYS: string[] = CONTEXT_GROUPS.flatMap((g) =>
  g.fields.map((f) => f.key),
);

export interface AgentContextSpec {
  uses: string[]; // claves del contexto global que el agente lee
  asks?: { key: string; label: string; placeholder: string }; // input específico → memoria por agente
}

/** Qué contexto lee cada agente, y qué input específico necesita guardar. (por id de catálogo) */
export const AGENT_CONTEXT: Record<number, AgentContextSpec> = {
  100: { uses: ["razonSocial", "rubro", "icp"] }, // Atlas orquesta con tu contexto de negocio
  1: {
    uses: ["razonSocial", "cuit", "ivaCondition"],
    asks: { key: "puntoVenta", label: "Punto de venta AFIP", placeholder: "Ej. 0003" },
  },
  3: {
    uses: ["rubro", "sitioWeb", "icp"],
    asks: { key: "listaPrecios", label: "Link a tu lista de precios", placeholder: "URL o Drive" },
  },
  5: { uses: ["wallet", "razonSocial"] },
  6: {
    uses: ["razonSocial", "email"],
    asks: { key: "tipoContrato", label: "Tipo de contrato habitual", placeholder: "Locación de servicios" },
  },
  11: {
    uses: ["wallet", "moneda"],
    asks: { key: "estrategia", label: "Estrategia de riesgo", placeholder: "Conservadora / Agresiva" },
  },
};

export function agentContext(id: number): AgentContextSpec {
  return AGENT_CONTEXT[id] ?? { uses: ["razonSocial", "email"] };
}

/** Inputs específicos ya guardados por agente (seed: Fiscal-1 ya recordó su punto de venta). */
export const AGENT_MEMORY_SEED: Record<number, Record<string, string>> = {
  1: { puntoVenta: "0003" },
};

export function completeness(values: Record<string, string>): number {
  const filled = ALL_CONTEXT_KEYS.filter((k) => (values[k] ?? "").trim()).length;
  return Math.round((filled / ALL_CONTEXT_KEYS.length) * 100);
}
