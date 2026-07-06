export type Cabinet = {
  id: string;
  name: string;
  manufacturer: string;
  widthMm: number;
  heightMm: number;
  pixelsX: number;
  pixelsY: number;
  weightKg: number;
  avgPowerW: number;
  maxPowerW: number;
  configFile?: string;
};

export type ScreenInput = {
  name: string;
  cabinet: Cabinet;
  columns: number;
  rows: number;
};

export type ScreenCalculated = {
  cabinets: number;
  widthMm: number;
  heightMm: number;
  widthM: number;
  heightM: number;
  resolutionX: number;
  resolutionY: number;
  areaM2: number;
  weightKg: number;
  avgPowerKw: number;
  maxPowerKw: number;
};

export type ScreenModel = ScreenInput & {
  calculated: ScreenCalculated;
};

export const cabinetPresets: Cabinet[] = [
  {
    id: 'p297-outdoor-500',
    name: 'P2.97 Outdoor 500×500',
    manufacturer: 'Generic',
    widthMm: 500,
    heightMm: 500,
    pixelsX: 168,
    pixelsY: 168,
    weightKg: 8.5,
    avgPowerW: 95,
    maxPowerW: 190,
    configFile: 'p297_outdoor.rcfgx',
  },
  {
    id: 'p391-rental-500',
    name: 'P3.91 Rental 500×500',
    manufacturer: 'Generic',
    widthMm: 500,
    heightMm: 500,
    pixelsX: 128,
    pixelsY: 128,
    weightKg: 8.2,
    avgPowerW: 90,
    maxPowerW: 180,
    configFile: 'p391_rental.rcfgx',
  },
  {
    id: 'p26-indoor-500',
    name: 'P2.6 Indoor 500×500',
    manufacturer: 'Generic',
    widthMm: 500,
    heightMm: 500,
    pixelsX: 192,
    pixelsY: 192,
    weightKg: 7.8,
    avgPowerW: 85,
    maxPowerW: 170,
    configFile: 'p26_indoor.rcfgx',
  },
];

const round = (value: number, digits = 2) => Number(value.toFixed(digits));

export function clampPositiveInteger(value: number, fallback = 1) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.round(value));
}

export function calculateScreen(input: ScreenInput): ScreenModel {
  const columns = clampPositiveInteger(input.columns);
  const rows = clampPositiveInteger(input.rows);
  const cabinets = columns * rows;
  const widthMm = columns * input.cabinet.widthMm;
  const heightMm = rows * input.cabinet.heightMm;

  return {
    ...input,
    columns,
    rows,
    calculated: {
      cabinets,
      widthMm,
      heightMm,
      widthM: round(widthMm / 1000, 2),
      heightM: round(heightMm / 1000, 2),
      resolutionX: columns * input.cabinet.pixelsX,
      resolutionY: rows * input.cabinet.pixelsY,
      areaM2: round((widthMm * heightMm) / 1_000_000, 2),
      weightKg: round(cabinets * input.cabinet.weightKg, 1),
      avgPowerKw: round((cabinets * input.cabinet.avgPowerW) / 1000, 2),
      maxPowerKw: round((cabinets * input.cabinet.maxPowerW) / 1000, 2),
    },
  };
}
