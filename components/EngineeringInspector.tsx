import { CabinetEngineering, ScreenEngineering } from '../lib/engineering-model';

type EditableEngineeringKeys = 'receiverCardModel' | 'processorModel' | 'defaultDataPort' | 'defaultPowerLine' | 'defaultConfigFile';

type EngineeringInspectorProps = {
  engineering: ScreenEngineering;
  selectedCabinet?: CabinetEngineering;
  onScreenChange?: (patch: Partial<Pick<ScreenEngineering, EditableEngineeringKeys>>) => void;
  labels: {
    screenObject: string;
    selectedCabinet: string;
    receiverCard: string;
    processor: string;
    dataPort: string;
    powerLine: string;
    configFile: string;
    serialNumber: string;
    routing: string;
  };
};

export function EngineeringInspector({ engineering, selectedCabinet, onScreenChange, labels }: EngineeringInspectorProps) {
  const cabinet = selectedCabinet ?? engineering.cabinets[0];
  const editable = Boolean(onScreenChange);

  return (
    <div className="engineering-panel">
      <div className="section-title">{labels.screenObject}</div>

      {editable ? (
        <>
          <label className="field">
            <span>{labels.receiverCard}</span>
            <input value={engineering.receiverCardModel} onChange={(event) => onScreenChange?.({ receiverCardModel: event.target.value })} />
          </label>
          <label className="field">
            <span>{labels.processor}</span>
            <input value={engineering.processorModel} onChange={(event) => onScreenChange?.({ processorModel: event.target.value })} />
          </label>
          <label className="field">
            <span>{labels.dataPort}</span>
            <input value={engineering.defaultDataPort} onChange={(event) => onScreenChange?.({ defaultDataPort: event.target.value })} />
          </label>
          <label className="field">
            <span>{labels.powerLine}</span>
            <input value={engineering.defaultPowerLine} onChange={(event) => onScreenChange?.({ defaultPowerLine: event.target.value })} />
          </label>
          <label className="field">
            <span>{labels.configFile}</span>
            <input value={engineering.defaultConfigFile} onChange={(event) => onScreenChange?.({ defaultConfigFile: event.target.value })} />
          </label>
        </>
      ) : (
        <>
          <div className="prop"><span>{labels.receiverCard}</span><strong>{engineering.receiverCardModel}</strong></div>
          <div className="prop"><span>{labels.processor}</span><strong>{engineering.processorModel}</strong></div>
          <div className="prop"><span>{labels.dataPort}</span><strong>{engineering.defaultDataPort}</strong></div>
          <div className="prop"><span>{labels.powerLine}</span><strong>{engineering.defaultPowerLine}</strong></div>
          <div className="prop"><span>{labels.configFile}</span><strong>{engineering.defaultConfigFile}</strong></div>
        </>
      )}

      <div className="section-title">{labels.selectedCabinet}</div>
      <div className="prop"><span>ID</span><strong>#{cabinet?.label ?? 1}</strong></div>
      <div className="prop"><span>{labels.receiverCard}</span><strong>{cabinet?.receiverCard ?? 'not assigned'}</strong></div>
      <div className="prop"><span>{labels.dataPort}</span><strong>{cabinet?.dataPort ?? 'not assigned'}</strong></div>
      <div className="prop"><span>{labels.powerLine}</span><strong>{cabinet?.powerLine ?? 'not assigned'}</strong></div>
      <div className="prop"><span>{labels.configFile}</span><strong>{cabinet?.configFile ?? 'not assigned'}</strong></div>
      <div className="prop"><span>{labels.serialNumber}</span><strong>{cabinet?.serialNumber || '—'}</strong></div>

      <div className="section-title">{labels.routing}</div>
      <div className="prop"><span>Route</span><strong>{engineering.routing[0]?.name ?? 'not assigned'}</strong></div>
      <div className="prop"><span>Cabinets</span><strong>{engineering.cabinets.length}</strong></div>
    </div>
  );
}
