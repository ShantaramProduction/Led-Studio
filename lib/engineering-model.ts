export type ObjectMode = 'screen' | 'cabinets' | 'routing';

export type CabinetEngineering = {
  id: string;
  screenId: string;
  index: number;
  row: number;
  column: number;
  label: number;
  receiverCard: string;
  dataPort: string;
  powerLine: string;
  configFile: string;
  serialNumber: string;
  comment: string;
};

export type RoutingPath = {
  id: string;
  screenId: string;
  name: string;
  mode: 'snake' | 'rows' | 'custom';
  cabinetIds: string[];
};

export type ScreenEngineering = {
  screenId: string;
  objectMode: ObjectMode;
  receiverCardModel: string;
  processorModel: string;
  defaultDataPort: string;
  defaultPowerLine: string;
  defaultConfigFile: string;
  cabinets: CabinetEngineering[];
  routing: RoutingPath[];
};

export type ScreenGeometryInput = {
  screenId: string;
  columns: number;
  rows: number;
  numberingMode: 'rows' | 'snake';
  receiverCardModel?: string;
  processorModel?: string;
  defaultDataPort?: string;
  defaultPowerLine?: string;
  defaultConfigFile?: string;
};

export const buildCabinetEngineering = ({
  screenId,
  columns,
  rows,
  numberingMode,
  receiverCardModel = 'NovaStar A10s Pro',
  processorModel = 'NovaStar VX1000',
  defaultDataPort = 'Port',
  defaultPowerLine = 'Line',
  defaultConfigFile = 'not assigned',
}: ScreenGeometryInput): ScreenEngineering => {
  const cabinets: CabinetEngineering[] = Array.from({ length: columns * rows }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const snakeLabel = row % 2 === 0 ? row * columns + column + 1 : row * columns + (columns - column);
    const label = numberingMode === 'snake' ? snakeLabel : index + 1;

    return {
      id: `${screenId}-cabinet-${index + 1}`,
      screenId,
      index: index + 1,
      row: row + 1,
      column: column + 1,
      label,
      receiverCard: receiverCardModel,
      dataPort: `${defaultDataPort} ${Math.floor(index / 32) + 1}`,
      powerLine: `${defaultPowerLine} ${Math.floor(index / 16) + 1}`,
      configFile: defaultConfigFile,
      serialNumber: '',
      comment: '',
    };
  });

  return {
    screenId,
    objectMode: 'screen',
    receiverCardModel,
    processorModel,
    defaultDataPort,
    defaultPowerLine,
    defaultConfigFile,
    cabinets,
    routing: [
      {
        id: `${screenId}-route-1`,
        screenId,
        name: numberingMode === 'snake' ? 'Snake route' : 'Rows route',
        mode: numberingMode,
        cabinetIds: cabinets.map((cabinet) => cabinet.id),
      },
    ],
  };
};
