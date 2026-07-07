'use client';

import { useEffect, useState } from 'react';
import {
  CabinetLibraryItem,
  createCloudCabinet,
  deleteCloudCabinet,
  listCloudCabinets,
  updateCloudCabinet,
} from '../lib/cloud-library';

const emptyCabinet: Omit<CabinetLibraryItem, 'id'> = {
  name: 'New cabinet 500x500',
  manufacturer: '',
  widthMm: 500,
  heightMm: 500,
  pixelsX: 128,
  pixelsY: 128,
  weightKg: 8,
  avgPowerW: 120,
  maxPowerW: 300,
  receiverCard: 'NovaStar A10s Pro',
  configFileName: '',
  notes: '',
  isPublic: false,
};

type CabinetLibraryPanelProps = {
  labels: {
    title: string;
    subtitle: string;
    newCabinet: string;
    save: string;
    delete: string;
    name: string;
    manufacturer: string;
    size: string;
    resolution: string;
    weight: string;
    averagePower: string;
    maxPower: string;
    receiverCard: string;
    configFile: string;
    notes: string;
    cloudOnly: string;
  };
};

export function CabinetLibraryPanel({ labels }: CabinetLibraryPanelProps) {
  const [items, setItems] = useState<CabinetLibraryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<CabinetLibraryItem, 'id'>>(emptyCabinet);
  const [status, setStatus] = useState('');

  const selected = items.find((item) => item.id === selectedId);

  const load = async () => {
    const cabinets = await listCloudCabinets();
    setItems(cabinets);
    if (cabinets[0] && !selectedId) {
      setSelectedId(cabinets[0].id);
      const { id, ...nextDraft } = cabinets[0];
      setDraft(nextDraft);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectCabinet = (cabinet: CabinetLibraryItem) => {
    const { id, ...nextDraft } = cabinet;
    setSelectedId(id);
    setDraft(nextDraft);
  };

  const createNew = () => {
    setSelectedId(null);
    setDraft(emptyCabinet);
  };

  const save = async () => {
    setStatus('Saving...');
    const result = selectedId ? await updateCloudCabinet(selectedId, draft) : await createCloudCabinet(draft);
    if (!result) {
      setStatus('Cloud save failed');
      return;
    }
    setStatus('Saved');
    setSelectedId(result.id);
    await load();
  };

  const remove = async () => {
    if (!selectedId) return;
    setStatus('Deleting...');
    const ok = await deleteCloudCabinet(selectedId);
    setStatus(ok ? 'Deleted' : 'Delete failed');
    setSelectedId(null);
    setDraft(emptyCabinet);
    await load();
  };

  const setNumber = (key: keyof Omit<CabinetLibraryItem, 'id'>, value: string) => {
    const number = Number(value);
    setDraft((current) => ({ ...current, [key]: Number.isFinite(number) ? number : 0 }));
  };

  return (
    <div className="library-panel">
      <div className="section-title">{labels.title}</div>
      <p className="inspector-note">{labels.subtitle}</p>

      <div className="library-layout">
        <div className="library-list">
          <button className="add-screen-small" onClick={createNew}>{labels.newCabinet}</button>
          {items.map((item) => (
            <button
              key={item.id}
              className={`screen-list-item ${item.id === selectedId ? 'active' : ''}`}
              onClick={() => selectCabinet(item)}
            >
              <strong>{item.name}</strong>
              <span>{item.widthMm}×{item.heightMm} mm · {item.pixelsX}×{item.pixelsY}px</span>
            </button>
          ))}
        </div>

        <div className="library-editor">
          <label className="field"><span>{labels.name}</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
          <label className="field"><span>{labels.manufacturer}</span><input value={draft.manufacturer} onChange={(event) => setDraft({ ...draft, manufacturer: event.target.value })} /></label>
          <div className="field-row">
            <label className="field"><span>{labels.size} W</span><input value={draft.widthMm} inputMode="numeric" onChange={(event) => setNumber('widthMm', event.target.value)} /></label>
            <label className="field"><span>{labels.size} H</span><input value={draft.heightMm} inputMode="numeric" onChange={(event) => setNumber('heightMm', event.target.value)} /></label>
          </div>
          <div className="field-row">
            <label className="field"><span>{labels.resolution} X</span><input value={draft.pixelsX} inputMode="numeric" onChange={(event) => setNumber('pixelsX', event.target.value)} /></label>
            <label className="field"><span>{labels.resolution} Y</span><input value={draft.pixelsY} inputMode="numeric" onChange={(event) => setNumber('pixelsY', event.target.value)} /></label>
          </div>
          <div className="field-row">
            <label className="field"><span>{labels.weight}</span><input value={draft.weightKg} inputMode="decimal" onChange={(event) => setNumber('weightKg', event.target.value)} /></label>
            <label className="field"><span>{labels.averagePower}</span><input value={draft.avgPowerW} inputMode="decimal" onChange={(event) => setNumber('avgPowerW', event.target.value)} /></label>
          </div>
          <label className="field"><span>{labels.maxPower}</span><input value={draft.maxPowerW} inputMode="decimal" onChange={(event) => setNumber('maxPowerW', event.target.value)} /></label>
          <label className="field"><span>{labels.receiverCard}</span><input value={draft.receiverCard} onChange={(event) => setDraft({ ...draft, receiverCard: event.target.value })} /></label>
          <label className="field"><span>{labels.configFile}</span><input value={draft.configFileName} onChange={(event) => setDraft({ ...draft, configFileName: event.target.value })} /></label>
          <label className="field"><span>{labels.notes}</span><input value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>

          <div className="library-actions">
            <button className="create-screen-button" onClick={save}>{labels.save}</button>
            <button className="danger-button" onClick={remove} disabled={!selected}>{labels.delete}</button>
          </div>
          <p className="inspector-note">{status || labels.cloudOnly}</p>
        </div>
      </div>
    </div>
  );
}
