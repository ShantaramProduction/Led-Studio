'use client';

import { PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Cabinet, cabinetPresets, calculateScreen } from '../lib/screen-engine';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const STORAGE_KEY = 'shantaram-studio-project-v1';
const CLOUD_PROJECT_ID = 'default-project';

const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type NumberingMode = 'rows' | 'snake';
type InspectorTab = 'screen' | 'cabinet' | 'calc';
type SaveStatus = 'saved' | 'saving' | 'local' | 'error';

type ScreenDraft = {
  id: string;
  name: string;
  cabinetId: string;
  columns: string;
  rows: string;
  x: number;
  y: number;
};

type ProjectState = {
  id: string;
  projectName: string;
  screens: ScreenDraft[];
  activeScreenId: string;
  numberingMode: NumberingMode;
};

const initialScreens: ScreenDraft[] = [
  { id: 'main', name: 'Main Stage Screen', cabinetId: cabinetPresets[0].id, columns: '12', rows: '4', x: 120, y: 120 },
  { id: 'left-imag', name: 'Left IMAG', cabinetId: cabinetPresets[1].id, columns: '4', rows: '6', x: 80, y: 360 },
  { id: 'right-imag', name: 'Right IMAG', cabinetId: cabinetPresets[1].id, columns: '4', rows: '6', x: 720, y: 360 },
];

const defaultProject: ProjectState = {
  id: CLOUD_PROJECT_ID,
  projectName: 'Summer Fest 2026',
  screens: initialScreens,
  activeScreenId: initialScreens[0].id,
  numberingMode: 'rows',
};

const getCabinet = (cabinetId: string): Cabinet => cabinetPresets.find((preset) => preset.id === cabinetId) ?? cabinetPresets[0];

const saveStatusLabel: Record<SaveStatus, string> = {
  saved: 'Saved',
  saving: 'Saving...',
  local: 'Saved locally',
  error: 'Save error',
};

export default function Home() {
  const [projectName, setProjectName] = useState(defaultProject.projectName);
  const [screens, setScreens] = useState<ScreenDraft[]>(defaultProject.screens);
  const [activeScreenId, setActiveScreenId] = useState(defaultProject.activeScreenId);
  const [zoom, setZoom] = useState(90);
  const [selectedCabinet, setSelectedCabinet] = useState(1);
  const [numberingMode, setNumberingMode] = useState<NumberingMode>(defaultProject.numberingMode);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('screen');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [draggingScreenId, setDraggingScreenId] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; originalX: number; originalY: number } | null>(null);
  const didLoadRef = useRef(false);

  const activeDraft = screens.find((item) => item.id === activeScreenId) ?? screens[0];
  const cabinet = getCabinet(activeDraft.cabinetId);

  const screen = calculateScreen({
    name: activeDraft.name,
    cabinet,
    columns: toNumber(activeDraft.columns, 1),
    rows: toNumber(activeDraft.rows, 1),
  });

  const projectModels = screens.map((draft) => {
    const modelCabinet = getCabinet(draft.cabinetId);
    return calculateScreen({
      name: draft.name,
      cabinet: modelCabinet,
      columns: toNumber(draft.columns, 1),
      rows: toNumber(draft.rows, 1),
    });
  });

  const projectTotals = projectModels.reduce(
    (totals, model) => ({
      cabinets: totals.cabinets + model.calculated.cabinets,
      areaM2: totals.areaM2 + model.calculated.areaM2,
      weightKg: totals.weightKg + model.calculated.weightKg,
      avgPowerKw: totals.avgPowerKw + model.calculated.avgPowerKw,
      maxPowerKw: totals.maxPowerKw + model.calculated.maxPowerKw,
    }),
    { cabinets: 0, areaM2: 0, weightKg: 0, avgPowerKw: 0, maxPowerKw: 0 },
  );

  const cabinets = Array.from({ length: screen.calculated.cabinets }, (_, index) => {
    const row = Math.floor(index / screen.columns);
    const col = index % screen.columns;
    const snakeNumber = row % 2 === 0
      ? row * screen.columns + col + 1
      : row * screen.columns + (screen.columns - col);

    return {
      id: index + 1,
      label: numberingMode === 'snake' ? snakeNumber : index + 1,
      row: row + 1,
      col: col + 1,
    };
  });

  const selected = cabinets.find((item) => item.id === selectedCabinet) ?? cabinets[0];

  const projectPayload = useMemo<ProjectState>(() => ({
    id: CLOUD_PROJECT_ID,
    projectName,
    screens,
    activeScreenId,
    numberingMode,
  }), [projectName, screens, activeScreenId, numberingMode]);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const localProject = window.localStorage.getItem(STORAGE_KEY);
        if (localProject) {
          const parsed = JSON.parse(localProject) as ProjectState;
          setProjectName(parsed.projectName ?? defaultProject.projectName);
          setScreens(parsed.screens?.length ? parsed.screens : defaultProject.screens);
          setActiveScreenId(parsed.activeScreenId ?? defaultProject.activeScreenId);
          setNumberingMode(parsed.numberingMode ?? defaultProject.numberingMode);
          setSaveStatus('local');
        }

        if (supabase) {
          const { data, error } = await supabase
            .from('projects')
            .select('data')
            .eq('id', CLOUD_PROJECT_ID)
            .maybeSingle();

          if (!error && data?.data) {
            const cloudProject = data.data as ProjectState;
            setProjectName(cloudProject.projectName ?? defaultProject.projectName);
            setScreens(cloudProject.screens?.length ? cloudProject.screens : defaultProject.screens);
            setActiveScreenId(cloudProject.activeScreenId ?? defaultProject.activeScreenId);
            setNumberingMode(cloudProject.numberingMode ?? defaultProject.numberingMode);
            setSaveStatus('saved');
          }
        }
      } catch {
        setSaveStatus('local');
      } finally {
        didLoadRef.current = true;
      }
    };

    loadProject();
  }, []);

  useEffect(() => {
    if (!didLoadRef.current) return;

    setSaveStatus('saving');
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projectPayload));

    const timeout = window.setTimeout(async () => {
      if (!supabase) {
        setSaveStatus('local');
        return;
      }

      const { error } = await supabase.from('projects').upsert({
        id: CLOUD_PROJECT_ID,
        name: projectPayload.projectName,
        data: projectPayload,
        updated_at: new Date().toISOString(),
      });

      setSaveStatus(error ? 'local' : 'saved');
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [projectPayload]);

  const updateActiveScreen = (patch: Partial<ScreenDraft>) => {
    setScreens((items) => items.map((item) => item.id === activeDraft.id ? { ...item, ...patch } : item));
  };

  const addScreen = () => {
    const nextNumber = screens.length + 1;
    const id = `screen-${Date.now()}`;
    setScreens((items) => [
      ...items,
      {
        id,
        name: `Screen ${nextNumber}`,
        cabinetId: cabinetPresets[0].id,
        columns: '6',
        rows: '3',
        x: 260 + nextNumber * 34,
        y: 180 + nextNumber * 28,
      },
    ]);
    setActiveScreenId(id);
    setSelectedCabinet(1);
  };

  const deleteActiveScreen = () => {
    if (screens.length <= 1) return;
    const remaining = screens.filter((item) => item.id !== activeDraft.id);
    setScreens(remaining);
    setActiveScreenId(remaining[0].id);
    setSelectedCabinet(1);
  };

  const fitWorkspace = () => setZoom(90);

  const startScreenDrag = (event: PointerEvent<HTMLDivElement>, draft: ScreenDraft) => {
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: draft.id,
      startX: event.clientX,
      startY: event.clientY,
      originalX: draft.x,
      originalY: draft.y,
    };
    setDraggingScreenId(draft.id);
    setActiveScreenId(draft.id);
    setSelectedCabinet(1);
  };

  const moveScreenDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;

    const drag = dragRef.current;
    const nextX = drag.originalX + (event.clientX - drag.startX) / (zoom / 100);
    const nextY = drag.originalY + (event.clientY - drag.startY) / (zoom / 100);

    setScreens((items) => items.map((item) => item.id === drag.id ? { ...item, x: Math.round(nextX), y: Math.round(nextY) } : item));
  };

  const endScreenDrag = () => {
    dragRef.current = null;
    setDraggingScreenId(null);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <strong>SHANTARAM Studio</strong>
          <span>Professional LED screen engineering platform</span>
        </div>
        <div className="top-actions">
          <span className={`saved-dot ${saveStatus}`} />
          <span>{saveStatusLabel[saveStatus]}{isSupabaseConfigured ? '' : ' · local mode'}</span>
          <div className="lang"><span>EN</span><span>RU</span></div>
        </div>
      </header>

      <nav className="toolbar">
        <button className="tool-button primary" onClick={addScreen}>+ New Screen</button>
        <button className="tool-button">Numbering</button>
        <button className="tool-button">Map</button>
        <button className="tool-button ghost">Library</button>
        <button className="tool-button ghost">Settings</button>
        <div className="toolbar-spacer" />
        <button className="tool-button ghost" onClick={fitWorkspace}>Fit</button>
        <div className="zoom-controls">
          <button onClick={() => setZoom((value) => Math.max(45, value - 10))}>−</button>
          <span>{zoom}%</span>
          <button onClick={() => setZoom((value) => Math.min(180, value + 10))}>+</button>
        </div>
      </nav>

      <section className="workspace">
        <aside className="project-tree">
          <label className="project-title-field">
            <span>Project</span>
            <input value={projectName} onChange={(event) => setProjectName(event.target.value)} />
          </label>

          <div className="tree-section-title">Screens</div>
          <div className="screen-list">
            {screens.map((draft) => {
              const model = calculateScreen({
                name: draft.name,
                cabinet: getCabinet(draft.cabinetId),
                columns: toNumber(draft.columns, 1),
                rows: toNumber(draft.rows, 1),
              });
              return (
                <button
                  key={draft.id}
                  className={`screen-list-item ${draft.id === activeScreenId ? 'active' : ''}`}
                  onClick={() => {
                    setActiveScreenId(draft.id);
                    setSelectedCabinet(1);
                  }}
                >
                  <strong>{draft.name}</strong>
                  <span>{model.columns}×{model.rows} · {model.calculated.widthM}×{model.calculated.heightM} m</span>
                </button>
              );
            })}
          </div>

          <button className="add-screen-small" onClick={addScreen}>+ Add screen</button>
        </aside>

        <div className="stage">
          <div className="screen-create-panel">
            <div className="panel-heading">
              <span>{projectName}</span>
              <strong>{screen.name}</strong>
            </div>
            <div className="quick-grid">
              <div><span>Screens</span><strong>{screens.length}</strong></div>
              <div><span>Cabinets</span><strong>{screen.columns} × {screen.rows}</strong></div>
              <div><span>Resolution</span><strong>{screen.calculated.resolutionX} × {screen.calculated.resolutionY} px</strong></div>
              <div><span>Size</span><strong>{screen.calculated.widthM} × {screen.calculated.heightM} m</strong></div>
            </div>
          </div>

          <div className="stage-label">Workspace / Multi-screen project</div>
          <div className="floating-card">
            <span>Selected cabinet</span>
            <strong>#{selected?.label ?? 1}</strong>
            <small>{screen.name} · row {selected?.row ?? 1}, column {selected?.col ?? 1}</small>
          </div>

          <div className="stage-inner project-canvas">
            <div className="canvas-plane" style={{ transform: `scale(${zoom / 100})` }}>
              {screens.map((draft) => {
                const itemCabinet = getCabinet(draft.cabinetId);
                const itemScreen = calculateScreen({
                  name: draft.name,
                  cabinet: itemCabinet,
                  columns: toNumber(draft.columns, 1),
                  rows: toNumber(draft.rows, 1),
                });
                const itemCabinets = Array.from({ length: itemScreen.calculated.cabinets }, (_, index) => index + 1);
                const isActive = draft.id === activeScreenId;

                return (
                  <div
                    className={`screen-object ${isActive ? 'active' : ''} ${draggingScreenId === draft.id ? 'dragging' : ''}`}
                    key={draft.id}
                    style={{ left: draft.x, top: draft.y, aspectRatio: `${itemScreen.calculated.widthMm} / ${itemScreen.calculated.heightMm}` }}
                    onPointerDown={(event) => startScreenDrag(event, draft)}
                    onPointerMove={moveScreenDrag}
                    onPointerUp={endScreenDrag}
                    onPointerCancel={endScreenDrag}
                  >
                    <div className="screen-object-title">{draft.name}</div>
                    <div
                      className="cabinet-grid"
                      style={{
                        gridTemplateColumns: `repeat(${itemScreen.columns}, 1fr)`,
                        gridTemplateRows: `repeat(${itemScreen.rows}, 1fr)`,
                      }}
                    >
                      {itemCabinets.map((number) => {
                        const row = Math.floor((number - 1) / itemScreen.columns);
                        const col = (number - 1) % itemScreen.columns;
                        const snakeNumber = row % 2 === 0
                          ? row * itemScreen.columns + col + 1
                          : row * itemScreen.columns + (itemScreen.columns - col);
                        const label = numberingMode === 'snake' ? snakeNumber : number;
                        const isSelected = isActive && number === selectedCabinet;

                        return (
                          <button
                            className={`cabinet ${isSelected ? 'selected' : ''}`}
                            key={number}
                            onClick={(event) => {
                              event.stopPropagation();
                              setActiveScreenId(draft.id);
                              setSelectedCabinet(number);
                            }}
                            title={`${draft.name}. Cabinet #${label}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="inspector screen-builder">
          <h2>{screen.name}</h2>
          <p className="inspector-note">Active project screen. Changes are applied and saved automatically.</p>

          <div className="inspector-tabs">
            <button className={inspectorTab === 'screen' ? 'active' : ''} onClick={() => setInspectorTab('screen')}>Screen</button>
            <button className={inspectorTab === 'cabinet' ? 'active' : ''} onClick={() => setInspectorTab('cabinet')}>Cabinet</button>
            <button className={inspectorTab === 'calc' ? 'active' : ''} onClick={() => setInspectorTab('calc')}>Calc</button>
          </div>

          {inspectorTab === 'screen' && (
            <div className="tab-panel">
              <label className="field">
                <span>Screen name</span>
                <input value={activeDraft.name} onChange={(event) => updateActiveScreen({ name: event.target.value })} />
              </label>

              <label className="field">
                <span>Cabinet type</span>
                <select value={activeDraft.cabinetId} onChange={(event) => updateActiveScreen({ cabinetId: event.target.value })}>
                  {cabinetPresets.map((preset) => (
                    <option value={preset.id} key={preset.id}>{preset.name}</option>
                  ))}
                </select>
              </label>

              <div className="section-title">Cabinet grid</div>
              <div className="field-row">
                <label className="field">
                  <span>Width</span>
                  <input value={activeDraft.columns} inputMode="numeric" onChange={(event) => updateActiveScreen({ columns: event.target.value })} />
                </label>
                <label className="field">
                  <span>Height</span>
                  <input value={activeDraft.rows} inputMode="numeric" onChange={(event) => updateActiveScreen({ rows: event.target.value })} />
                </label>
              </div>

              <div className="section-title">Numbering</div>
              <div className="segmented">
                <button className={numberingMode === 'rows' ? 'active' : ''} onClick={() => setNumberingMode('rows')}>Rows</button>
                <button className={numberingMode === 'snake' ? 'active' : ''} onClick={() => setNumberingMode('snake')}>Snake</button>
              </div>

              <button className="danger-button" onClick={deleteActiveScreen} disabled={screens.length <= 1}>Delete screen</button>
            </div>
          )}

          {inspectorTab === 'cabinet' && (
            <div className="tab-panel">
              <div className="section-title">Selected cabinet</div>
              <div className="prop"><span>ID</span><strong>#{selected?.label ?? 1}</strong></div>
              <div className="prop"><span>Position</span><strong>Row {selected?.row ?? 1}, column {selected?.col ?? 1}</strong></div>
              <div className="prop"><span>Size</span><strong>{cabinet.widthMm} × {cabinet.heightMm} mm</strong></div>
              <div className="prop"><span>Resolution</span><strong>{cabinet.pixelsX} × {cabinet.pixelsY} px</strong></div>

              <div className="section-title">Model</div>
              <div className="prop"><span>Name</span><strong>{cabinet.name}</strong></div>
              <div className="prop"><span>Manufacturer</span><strong>{cabinet.manufacturer}</strong></div>
              <div className="prop"><span>Weight</span><strong>{cabinet.weightKg} kg</strong></div>
              <div className="prop"><span>Average power</span><strong>{cabinet.avgPowerW} W</strong></div>
              <div className="prop"><span>Max power</span><strong>{cabinet.maxPowerW} W</strong></div>
              <div className="prop"><span>Config</span><strong>{cabinet.configFile}</strong></div>
            </div>
          )}

          {inspectorTab === 'calc' && (
            <div className="tab-panel">
              <div className="section-title">Active screen</div>
              <div className="prop"><span>Cabinets</span><strong>{screen.calculated.cabinets}</strong></div>
              <div className="prop"><span>Physical size</span><strong>{screen.calculated.widthM} × {screen.calculated.heightM} m</strong></div>
              <div className="prop"><span>Resolution</span><strong>{screen.calculated.resolutionX} × {screen.calculated.resolutionY}</strong></div>
              <div className="prop"><span>Area</span><strong>{screen.calculated.areaM2} m²</strong></div>
              <div className="prop"><span>Weight</span><strong>{screen.calculated.weightKg} kg</strong></div>
              <div className="prop"><span>Average power</span><strong>{screen.calculated.avgPowerKw} kW</strong></div>
              <div className="prop"><span>Max power</span><strong>{screen.calculated.maxPowerKw} kW</strong></div>

              <div className="section-title">Whole project</div>
              <div className="prop"><span>Screens</span><strong>{screens.length}</strong></div>
              <div className="prop"><span>Cabinets</span><strong>{projectTotals.cabinets}</strong></div>
              <div className="prop"><span>Area</span><strong>{projectTotals.areaM2.toFixed(2)} m²</strong></div>
              <div className="prop"><span>Weight</span><strong>{projectTotals.weightKg.toFixed(1)} kg</strong></div>
              <div className="prop"><span>Power</span><strong>{projectTotals.avgPowerKw.toFixed(2)} / {projectTotals.maxPowerKw.toFixed(2)} kW</strong></div>
            </div>
          )}
        </aside>
      </section>

      <footer className="statusbar">
        <div className="status-item"><span>Project</span><strong>{projectName}</strong></div>
        <div className="status-item"><span>Screens</span><strong>{screens.length}</strong></div>
        <div className="status-item"><span>Cabinets</span><strong>{projectTotals.cabinets}</strong></div>
        <div className="status-item"><span>Area</span><strong>{projectTotals.areaM2.toFixed(2)} m²</strong></div>
        <div className="status-item"><span>Power</span><strong>{projectTotals.avgPowerKw.toFixed(2)} / {projectTotals.maxPowerKw.toFixed(2)} kW</strong></div>
      </footer>
    </main>
  );
}
