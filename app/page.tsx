'use client';

import { PointerEvent, WheelEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Cabinet, cabinetPresets, calculateScreen } from '../lib/screen-engine';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const STORAGE_KEY = 'shantaram-studio-project-v1';
const CLOUD_PROJECT_ID = 'default-project';

const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type Language = 'ru' | 'en';
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
  language?: Language;
};

type ContextMenu = {
  x: number;
  y: number;
  target: 'stage' | 'screen';
  screenId?: string;
} | null;

const initialScreens: ScreenDraft[] = [
  { id: 'main', name: 'Главный экран сцены', cabinetId: cabinetPresets[0].id, columns: '12', rows: '4', x: 120, y: 120 },
  { id: 'left-imag', name: 'Левый IMAG', cabinetId: cabinetPresets[1].id, columns: '4', rows: '6', x: 80, y: 360 },
  { id: 'right-imag', name: 'Правый IMAG', cabinetId: cabinetPresets[1].id, columns: '4', rows: '6', x: 720, y: 360 },
];

const defaultProject: ProjectState = {
  id: CLOUD_PROJECT_ID,
  projectName: 'Summer Fest 2026',
  screens: initialScreens,
  activeScreenId: initialScreens[0].id,
  numberingMode: 'rows',
  language: 'ru',
};

const translations = {
  ru: {
    tagline: 'Инженерная платформа для LED-экранов',
    saved: 'Сохранено',
    saving: 'Сохранение...',
    local: 'Сохранено локально',
    error: 'Ошибка сохранения',
    localMode: 'локальный режим',
    newProject: 'Новый проект',
    saveProject: 'Сохранить проект',
    newScreen: '+ Новый экран',
    numbering: 'Нумерация',
    map: 'Карта',
    library: 'Библиотека',
    settings: 'Настройки',
    fit: 'Вписать',
    project: 'Проект',
    screens: 'Экраны',
    screen: 'Экран',
    cabinet: 'Кабинет',
    calc: 'Расчет',
    addScreen: '+ Добавить экран',
    workspace: 'Рабочая область / Несколько экранов проекта',
    cabinets: 'Кабинеты',
    resolution: 'Разрешение',
    size: 'Размер',
    selectedCabinet: 'Выбран кабинет',
    row: 'ряд',
    column: 'колонка',
    activeScreenNote: 'Активный экран проекта. Изменения применяются и сохраняются автоматически.',
    screenName: 'Название экрана',
    cabinetType: 'Тип кабинета',
    cabinetGrid: 'Сетка кабинетов',
    width: 'Ширина',
    height: 'Высота',
    rows: 'По рядам',
    snake: 'Змейка',
    deleteScreen: 'Удалить экран',
    selectedCabinetTitle: 'Выбранный кабинет',
    position: 'Позиция',
    model: 'Модель',
    name: 'Название',
    manufacturer: 'Производитель',
    weight: 'Вес',
    averagePower: 'Средняя мощность',
    maxPower: 'Макс. мощность',
    config: 'Конфиг',
    activeScreen: 'Активный экран',
    physicalSize: 'Физический размер',
    area: 'Площадь',
    wholeProject: 'Весь проект',
    power: 'Мощность',
    duplicateScreen: 'Дублировать экран',
    fitView: 'Вписать вид',
    contextAddScreen: 'Добавить экран здесь',
  },
  en: {
    tagline: 'Professional LED screen engineering platform',
    saved: 'Saved',
    saving: 'Saving...',
    local: 'Saved locally',
    error: 'Save error',
    localMode: 'local mode',
    newProject: 'New Project',
    saveProject: 'Save Project',
    newScreen: '+ New Screen',
    numbering: 'Numbering',
    map: 'Map',
    library: 'Library',
    settings: 'Settings',
    fit: 'Fit',
    project: 'Project',
    screens: 'Screens',
    screen: 'Screen',
    cabinet: 'Cabinet',
    calc: 'Calc',
    addScreen: '+ Add screen',
    workspace: 'Workspace / Multi-screen project',
    cabinets: 'Cabinets',
    resolution: 'Resolution',
    size: 'Size',
    selectedCabinet: 'Selected cabinet',
    row: 'row',
    column: 'column',
    activeScreenNote: 'Active project screen. Changes are applied and saved automatically.',
    screenName: 'Screen name',
    cabinetType: 'Cabinet type',
    cabinetGrid: 'Cabinet grid',
    width: 'Width',
    height: 'Height',
    rows: 'Rows',
    snake: 'Snake',
    deleteScreen: 'Delete screen',
    selectedCabinetTitle: 'Selected cabinet',
    position: 'Position',
    model: 'Model',
    name: 'Name',
    manufacturer: 'Manufacturer',
    weight: 'Weight',
    averagePower: 'Average power',
    maxPower: 'Max power',
    config: 'Config',
    activeScreen: 'Active screen',
    physicalSize: 'Physical size',
    area: 'Area',
    wholeProject: 'Whole project',
    power: 'Power',
    duplicateScreen: 'Duplicate screen',
    fitView: 'Fit view',
    contextAddScreen: 'Add screen here',
  },
};

const getCabinet = (cabinetId: string): Cabinet => cabinetPresets.find((preset) => preset.id === cabinetId) ?? cabinetPresets[0];

export default function Home() {
  const [projectName, setProjectName] = useState(defaultProject.projectName);
  const [screens, setScreens] = useState<ScreenDraft[]>(defaultProject.screens);
  const [activeScreenId, setActiveScreenId] = useState(defaultProject.activeScreenId);
  const [zoom, setZoom] = useState(90);
  const [selectedCabinet, setSelectedCabinet] = useState(1);
  const [numberingMode, setNumberingMode] = useState<NumberingMode>(defaultProject.numberingMode);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('screen');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [language, setLanguage] = useState<Language>('ru');
  const [draggingScreenId, setDraggingScreenId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; originalX: number; originalY: number } | null>(null);
  const didLoadRef = useRef(false);
  const t = translations[language];

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
    language,
  }), [projectName, screens, activeScreenId, numberingMode, language]);

  const saveProjectNow = async (payload = projectPayload) => {
    setSaveStatus('saving');
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

    if (!supabase) {
      setSaveStatus('local');
      return;
    }

    const { error } = await supabase.from('projects').upsert({
      id: payload.id,
      name: payload.projectName,
      data: payload,
      updated_at: new Date().toISOString(),
    });

    setSaveStatus(error ? 'local' : 'saved');
  };

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
          setLanguage(parsed.language ?? 'ru');
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
            setLanguage(cloudProject.language ?? 'ru');
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

    const timeout = window.setTimeout(() => saveProjectNow(projectPayload), 700);
    return () => window.clearTimeout(timeout);
  }, [projectPayload]);

  const updateActiveScreen = (patch: Partial<ScreenDraft>) => {
    setScreens((items) => items.map((item) => item.id === activeDraft.id ? { ...item, ...patch } : item));
  };

  const addScreen = (x?: number, y?: number) => {
    const nextNumber = screens.length + 1;
    const id = `screen-${Date.now()}`;
    const newScreen: ScreenDraft = {
      id,
      name: language === 'ru' ? `Экран ${nextNumber}` : `Screen ${nextNumber}`,
      cabinetId: cabinetPresets[0].id,
      columns: '6',
      rows: '3',
      x: x ?? 260 + nextNumber * 34,
      y: y ?? 180 + nextNumber * 28,
    };
    setScreens((items) => [...items, newScreen]);
    setActiveScreenId(id);
    setSelectedCabinet(1);
    setContextMenu(null);
  };

  const duplicateScreen = (screenId = activeScreenId) => {
    const source = screens.find((item) => item.id === screenId) ?? activeDraft;
    const id = `screen-${Date.now()}`;
    const copy: ScreenDraft = {
      ...source,
      id,
      name: language === 'ru' ? `${source.name} копия` : `${source.name} copy`,
      x: source.x + 40,
      y: source.y + 40,
    };
    setScreens((items) => [...items, copy]);
    setActiveScreenId(id);
    setSelectedCabinet(1);
    setContextMenu(null);
  };

  const deleteScreen = (screenId = activeScreenId) => {
    if (screens.length <= 1) return;
    const remaining = screens.filter((item) => item.id !== screenId);
    setScreens(remaining);
    setActiveScreenId(remaining[0].id);
    setSelectedCabinet(1);
    setContextMenu(null);
  };

  const newProject = () => {
    const freshScreen: ScreenDraft = {
      id: `screen-${Date.now()}`,
      name: language === 'ru' ? 'Главный экран' : 'Main Screen',
      cabinetId: cabinetPresets[0].id,
      columns: '12',
      rows: '4',
      x: 260,
      y: 180,
    };
    setProjectName(language === 'ru' ? 'Новый проект' : 'New Project');
    setScreens([freshScreen]);
    setActiveScreenId(freshScreen.id);
    setSelectedCabinet(1);
    setContextMenu(null);
  };

  const fitWorkspace = () => {
    setZoom(90);
    setContextMenu(null);
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -5 : 5;
    setZoom((value) => Math.min(180, Math.max(45, value + direction)));
  };

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

  const showStageContext = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, target: 'stage' });
  };

  const showScreenContext = (event: React.MouseEvent<HTMLDivElement>, screenId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveScreenId(screenId);
    setContextMenu({ x: event.clientX, y: event.clientY, target: 'screen', screenId });
  };

  return (
    <main className="app-shell" onClick={() => setContextMenu(null)}>
      <header className="topbar">
        <div className="brand">
          <strong>SHANTARAM Studio</strong>
          <span>{t.tagline}</span>
        </div>
        <div className="top-actions">
          <span className={`saved-dot ${saveStatus}`} />
          <span>{t[saveStatus]}{isSupabaseConfigured ? '' : ` · ${t.localMode}`}</span>
          <div className="lang">
            <button className={language === 'ru' ? 'active' : ''} onClick={() => setLanguage('ru')}>RU</button>
            <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
          </div>
        </div>
      </header>

      <nav className="toolbar">
        <button className="tool-button primary" onClick={() => addScreen()}>{t.newScreen}</button>
        <button className="tool-button" onClick={newProject}>{t.newProject}</button>
        <button className="tool-button" onClick={() => saveProjectNow()}>{t.saveProject}</button>
        <button className="tool-button ghost">{t.numbering}</button>
        <button className="tool-button ghost">{t.map}</button>
        <button className="tool-button ghost">{t.library}</button>
        <button className="tool-button ghost">{t.settings}</button>
        <div className="toolbar-spacer" />
        <button className="tool-button ghost" onClick={fitWorkspace}>{t.fit}</button>
        <div className="zoom-controls">
          <button onClick={() => setZoom((value) => Math.max(45, value - 10))}>−</button>
          <span>{zoom}%</span>
          <button onClick={() => setZoom((value) => Math.min(180, value + 10))}>+</button>
        </div>
      </nav>

      <section className="workspace">
        <aside className="project-tree">
          <label className="project-title-field">
            <span>{t.project}</span>
            <input value={projectName} onChange={(event) => setProjectName(event.target.value)} />
          </label>

          <div className="tree-section-title">{t.screens}</div>
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

          <button className="add-screen-small" onClick={() => addScreen()}>{t.addScreen}</button>
        </aside>

        <div className="stage" onWheel={handleWheel} onContextMenu={showStageContext}>
          <div className="screen-create-panel">
            <div className="panel-heading">
              <span>{projectName}</span>
              <strong>{screen.name}</strong>
            </div>
            <div className="quick-grid">
              <div><span>{t.screens}</span><strong>{screens.length}</strong></div>
              <div><span>{t.cabinets}</span><strong>{screen.columns} × {screen.rows}</strong></div>
              <div><span>{t.resolution}</span><strong>{screen.calculated.resolutionX} × {screen.calculated.resolutionY} px</strong></div>
              <div><span>{t.size}</span><strong>{screen.calculated.widthM} × {screen.calculated.heightM} m</strong></div>
            </div>
          </div>

          <div className="stage-label">{t.workspace}</div>
          <div className="floating-card">
            <span>{t.selectedCabinet}</span>
            <strong>#{selected?.label ?? 1}</strong>
            <small>{screen.name} · {t.row} {selected?.row ?? 1}, {t.column} {selected?.col ?? 1}</small>
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
                    onContextMenu={(event) => showScreenContext(event, draft.id)}
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
                            title={`${draft.name}. ${t.cabinet} #${label}`}
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

          {contextMenu && (
            <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(event) => event.stopPropagation()}>
              {contextMenu.target === 'screen' && (
                <>
                  <button onClick={() => duplicateScreen(contextMenu.screenId)}>{t.duplicateScreen}</button>
                  <button onClick={() => deleteScreen(contextMenu.screenId)} disabled={screens.length <= 1}>{t.deleteScreen}</button>
                </>
              )}
              <button onClick={() => addScreen()}>{t.contextAddScreen}</button>
              <button onClick={fitWorkspace}>{t.fitView}</button>
              <button onClick={() => saveProjectNow()}>{t.saveProject}</button>
            </div>
          )}
        </div>

        <aside className="inspector screen-builder">
          <h2>{screen.name}</h2>
          <p className="inspector-note">{t.activeScreenNote}</p>

          <div className="inspector-tabs">
            <button className={inspectorTab === 'screen' ? 'active' : ''} onClick={() => setInspectorTab('screen')}>{t.screen}</button>
            <button className={inspectorTab === 'cabinet' ? 'active' : ''} onClick={() => setInspectorTab('cabinet')}>{t.cabinet}</button>
            <button className={inspectorTab === 'calc' ? 'active' : ''} onClick={() => setInspectorTab('calc')}>{t.calc}</button>
          </div>

          {inspectorTab === 'screen' && (
            <div className="tab-panel">
              <label className="field">
                <span>{t.screenName}</span>
                <input value={activeDraft.name} onChange={(event) => updateActiveScreen({ name: event.target.value })} />
              </label>

              <label className="field">
                <span>{t.cabinetType}</span>
                <select value={activeDraft.cabinetId} onChange={(event) => updateActiveScreen({ cabinetId: event.target.value })}>
                  {cabinetPresets.map((preset) => (
                    <option value={preset.id} key={preset.id}>{preset.name}</option>
                  ))}
                </select>
              </label>

              <div className="section-title">{t.cabinetGrid}</div>
              <div className="field-row">
                <label className="field">
                  <span>{t.width}</span>
                  <input value={activeDraft.columns} inputMode="numeric" onChange={(event) => updateActiveScreen({ columns: event.target.value })} />
                </label>
                <label className="field">
                  <span>{t.height}</span>
                  <input value={activeDraft.rows} inputMode="numeric" onChange={(event) => updateActiveScreen({ rows: event.target.value })} />
                </label>
              </div>

              <div className="section-title">{t.numbering}</div>
              <div className="segmented">
                <button className={numberingMode === 'rows' ? 'active' : ''} onClick={() => setNumberingMode('rows')}>{t.rows}</button>
                <button className={numberingMode === 'snake' ? 'active' : ''} onClick={() => setNumberingMode('snake')}>{t.snake}</button>
              </div>

              <button className="danger-button" onClick={() => deleteScreen()} disabled={screens.length <= 1}>{t.deleteScreen}</button>
            </div>
          )}

          {inspectorTab === 'cabinet' && (
            <div className="tab-panel">
              <div className="section-title">{t.selectedCabinetTitle}</div>
              <div className="prop"><span>ID</span><strong>#{selected?.label ?? 1}</strong></div>
              <div className="prop"><span>{t.position}</span><strong>{t.row} {selected?.row ?? 1}, {t.column} {selected?.col ?? 1}</strong></div>
              <div className="prop"><span>{t.size}</span><strong>{cabinet.widthMm} × {cabinet.heightMm} mm</strong></div>
              <div className="prop"><span>{t.resolution}</span><strong>{cabinet.pixelsX} × {cabinet.pixelsY} px</strong></div>

              <div className="section-title">{t.model}</div>
              <div className="prop"><span>{t.name}</span><strong>{cabinet.name}</strong></div>
              <div className="prop"><span>{t.manufacturer}</span><strong>{cabinet.manufacturer}</strong></div>
              <div className="prop"><span>{t.weight}</span><strong>{cabinet.weightKg} kg</strong></div>
              <div className="prop"><span>{t.averagePower}</span><strong>{cabinet.avgPowerW} W</strong></div>
              <div className="prop"><span>{t.maxPower}</span><strong>{cabinet.maxPowerW} W</strong></div>
              <div className="prop"><span>{t.config}</span><strong>{cabinet.configFile}</strong></div>
            </div>
          )}

          {inspectorTab === 'calc' && (
            <div className="tab-panel">
              <div className="section-title">{t.activeScreen}</div>
              <div className="prop"><span>{t.cabinets}</span><strong>{screen.calculated.cabinets}</strong></div>
              <div className="prop"><span>{t.physicalSize}</span><strong>{screen.calculated.widthM} × {screen.calculated.heightM} m</strong></div>
              <div className="prop"><span>{t.resolution}</span><strong>{screen.calculated.resolutionX} × {screen.calculated.resolutionY}</strong></div>
              <div className="prop"><span>{t.area}</span><strong>{screen.calculated.areaM2} m²</strong></div>
              <div className="prop"><span>{t.weight}</span><strong>{screen.calculated.weightKg} kg</strong></div>
              <div className="prop"><span>{t.averagePower}</span><strong>{screen.calculated.avgPowerKw} kW</strong></div>
              <div className="prop"><span>{t.maxPower}</span><strong>{screen.calculated.maxPowerKw} kW</strong></div>

              <div className="section-title">{t.wholeProject}</div>
              <div className="prop"><span>{t.screens}</span><strong>{screens.length}</strong></div>
              <div className="prop"><span>{t.cabinets}</span><strong>{projectTotals.cabinets}</strong></div>
              <div className="prop"><span>{t.area}</span><strong>{projectTotals.areaM2.toFixed(2)} m²</strong></div>
              <div className="prop"><span>{t.weight}</span><strong>{projectTotals.weightKg.toFixed(1)} kg</strong></div>
              <div className="prop"><span>{t.power}</span><strong>{projectTotals.avgPowerKw.toFixed(2)} / {projectTotals.maxPowerKw.toFixed(2)} kW</strong></div>
            </div>
          )}
        </aside>
      </section>

      <footer className="statusbar">
        <div className="status-item"><span>{t.project}</span><strong>{projectName}</strong></div>
        <div className="status-item"><span>{t.screens}</span><strong>{screens.length}</strong></div>
        <div className="status-item"><span>{t.cabinets}</span><strong>{projectTotals.cabinets}</strong></div>
        <div className="status-item"><span>{t.area}</span><strong>{projectTotals.areaM2.toFixed(2)} m²</strong></div>
        <div className="status-item"><span>{t.power}</span><strong>{projectTotals.avgPowerKw.toFixed(2)} / {projectTotals.maxPowerKw.toFixed(2)} kW</strong></div>
      </footer>
    </main>
  );
}
