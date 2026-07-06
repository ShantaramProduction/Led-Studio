'use client';

import { useMemo, useState } from 'react';
import { Cabinet, cabinetPresets, calculateScreen } from '../lib/screen-engine';

const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type NumberingMode = 'rows' | 'snake';
type InspectorTab = 'screen' | 'cabinet' | 'calc';

type ScreenDraft = {
  id: string;
  name: string;
  cabinetId: string;
  columns: string;
  rows: string;
  x: number;
  y: number;
};

const initialScreens: ScreenDraft[] = [
  { id: 'main', name: 'Главный экран сцены', cabinetId: cabinetPresets[0].id, columns: '12', rows: '4', x: 120, y: 120 },
  { id: 'left-imag', name: 'Левый IMAG', cabinetId: cabinetPresets[1].id, columns: '4', rows: '6', x: 80, y: 360 },
  { id: 'right-imag', name: 'Правый IMAG', cabinetId: cabinetPresets[1].id, columns: '4', rows: '6', x: 720, y: 360 },
];

const getCabinet = (cabinetId: string): Cabinet => cabinetPresets.find((preset) => preset.id === cabinetId) ?? cabinetPresets[0];

export default function Home() {
  const [projectName, setProjectName] = useState('Summer Fest 2026');
  const [screens, setScreens] = useState<ScreenDraft[]>(initialScreens);
  const [activeScreenId, setActiveScreenId] = useState(initialScreens[0].id);
  const [zoom, setZoom] = useState(90);
  const [selectedCabinet, setSelectedCabinet] = useState(1);
  const [numberingMode, setNumberingMode] = useState<NumberingMode>('rows');
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('screen');

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
        name: `Экран ${nextNumber}`,
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

  const fitWorkspace = () => setZoom(90);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <strong>SHANTARAM Studio</strong>
          <span>Инженерная платформа для LED-экранов</span>
        </div>
        <div className="top-actions">
          <span className="saved-dot" />
          <span>Сохранено</span>
          <div className="lang"><span>RU</span><span>EN</span></div>
        </div>
      </header>

      <nav className="toolbar">
        <button className="tool-button primary" onClick={addScreen}>+ Новый экран</button>
        <button className="tool-button">Нумерация</button>
        <button className="tool-button">Карта</button>
        <button className="tool-button ghost">Библиотека</button>
        <button className="tool-button ghost">Настройки</button>
        <div className="toolbar-spacer" />
        <button className="tool-button ghost" onClick={fitWorkspace}>Вписать</button>
        <div className="zoom-controls">
          <button onClick={() => setZoom((value) => Math.max(45, value - 10))}>−</button>
          <span>{zoom}%</span>
          <button onClick={() => setZoom((value) => Math.min(180, value + 10))}>+</button>
        </div>
      </nav>

      <section className="workspace">
        <aside className="project-tree">
          <label className="project-title-field">
            <span>Проект</span>
            <input value={projectName} onChange={(event) => setProjectName(event.target.value)} />
          </label>

          <div className="tree-section-title">Экраны</div>
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
                  <span>{model.columns}×{model.rows} · {model.calculated.widthM}×{model.calculated.heightM} м</span>
                </button>
              );
            })}
          </div>

          <button className="add-screen-small" onClick={addScreen}>+ Добавить экран</button>
        </aside>

        <div className="stage">
          <div className="screen-create-panel">
            <div className="panel-heading">
              <span>{projectName}</span>
              <strong>{screen.name}</strong>
            </div>
            <div className="quick-grid">
              <div><span>Экранов</span><strong>{screens.length}</strong></div>
              <div><span>Кабинеты</span><strong>{screen.columns} × {screen.rows}</strong></div>
              <div><span>Разрешение</span><strong>{screen.calculated.resolutionX} × {screen.calculated.resolutionY} px</strong></div>
              <div><span>Размер</span><strong>{screen.calculated.widthM} × {screen.calculated.heightM} м</strong></div>
            </div>
          </div>

          <div className="stage-label">Рабочая область / Несколько экранов проекта</div>
          <div className="floating-card">
            <span>Выбран кабинет</span>
            <strong>№{selected?.label ?? 1}</strong>
            <small>{screen.name} · ряд {selected?.row ?? 1}, колонка {selected?.col ?? 1}</small>
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
                    className={`screen-object ${isActive ? 'active' : ''}`}
                    key={draft.id}
                    style={{ left: draft.x, top: draft.y, aspectRatio: `${itemScreen.calculated.widthMm} / ${itemScreen.calculated.heightMm}` }}
                    onClick={() => setActiveScreenId(draft.id)}
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
                            title={`${draft.name}. Кабинет №${label}`}
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
          <p className="inspector-note">Активный экран проекта. Изменения применяются сразу.</p>

          <div className="inspector-tabs">
            <button className={inspectorTab === 'screen' ? 'active' : ''} onClick={() => setInspectorTab('screen')}>Экран</button>
            <button className={inspectorTab === 'cabinet' ? 'active' : ''} onClick={() => setInspectorTab('cabinet')}>Кабинет</button>
            <button className={inspectorTab === 'calc' ? 'active' : ''} onClick={() => setInspectorTab('calc')}>Расчет</button>
          </div>

          {inspectorTab === 'screen' && (
            <div className="tab-panel">
              <label className="field">
                <span>Название экрана</span>
                <input value={activeDraft.name} onChange={(event) => updateActiveScreen({ name: event.target.value })} />
              </label>

              <label className="field">
                <span>Тип кабинета</span>
                <select value={activeDraft.cabinetId} onChange={(event) => updateActiveScreen({ cabinetId: event.target.value })}>
                  {cabinetPresets.map((preset) => (
                    <option value={preset.id} key={preset.id}>{preset.name}</option>
                  ))}
                </select>
              </label>

              <div className="section-title">Сетка кабинетов</div>
              <div className="field-row">
                <label className="field">
                  <span>Ширина</span>
                  <input value={activeDraft.columns} inputMode="numeric" onChange={(event) => updateActiveScreen({ columns: event.target.value })} />
                </label>
                <label className="field">
                  <span>Высота</span>
                  <input value={activeDraft.rows} inputMode="numeric" onChange={(event) => updateActiveScreen({ rows: event.target.value })} />
                </label>
              </div>

              <div className="section-title">Нумерация</div>
              <div className="segmented">
                <button className={numberingMode === 'rows' ? 'active' : ''} onClick={() => setNumberingMode('rows')}>По рядам</button>
                <button className={numberingMode === 'snake' ? 'active' : ''} onClick={() => setNumberingMode('snake')}>Змейка</button>
              </div>
            </div>
          )}

          {inspectorTab === 'cabinet' && (
            <div className="tab-panel">
              <div className="section-title">Выбранный кабинет</div>
              <div className="prop"><span>ID</span><strong>№{selected?.label ?? 1}</strong></div>
              <div className="prop"><span>Позиция</span><strong>Ряд {selected?.row ?? 1}, колонка {selected?.col ?? 1}</strong></div>
              <div className="prop"><span>Размер</span><strong>{cabinet.widthMm} × {cabinet.heightMm} мм</strong></div>
              <div className="prop"><span>Разрешение</span><strong>{cabinet.pixelsX} × {cabinet.pixelsY} px</strong></div>

              <div className="section-title">Модель</div>
              <div className="prop"><span>Название</span><strong>{cabinet.name}</strong></div>
              <div className="prop"><span>Производитель</span><strong>{cabinet.manufacturer}</strong></div>
              <div className="prop"><span>Вес</span><strong>{cabinet.weightKg} кг</strong></div>
              <div className="prop"><span>Средняя мощность</span><strong>{cabinet.avgPowerW} Вт</strong></div>
              <div className="prop"><span>Макс. мощность</span><strong>{cabinet.maxPowerW} Вт</strong></div>
              <div className="prop"><span>Конфиг</span><strong>{cabinet.configFile}</strong></div>
            </div>
          )}

          {inspectorTab === 'calc' && (
            <div className="tab-panel">
              <div className="section-title">Активный экран</div>
              <div className="prop"><span>Кабинеты</span><strong>{screen.calculated.cabinets}</strong></div>
              <div className="prop"><span>Физический размер</span><strong>{screen.calculated.widthM} × {screen.calculated.heightM} м</strong></div>
              <div className="prop"><span>Разрешение</span><strong>{screen.calculated.resolutionX} × {screen.calculated.resolutionY}</strong></div>
              <div className="prop"><span>Площадь</span><strong>{screen.calculated.areaM2} м²</strong></div>
              <div className="prop"><span>Вес</span><strong>{screen.calculated.weightKg} кг</strong></div>
              <div className="prop"><span>Средняя мощность</span><strong>{screen.calculated.avgPowerKw} кВт</strong></div>
              <div className="prop"><span>Макс. мощность</span><strong>{screen.calculated.maxPowerKw} кВт</strong></div>

              <div className="section-title">Весь проект</div>
              <div className="prop"><span>Экранов</span><strong>{screens.length}</strong></div>
              <div className="prop"><span>Кабинеты</span><strong>{projectTotals.cabinets}</strong></div>
              <div className="prop"><span>Площадь</span><strong>{projectTotals.areaM2.toFixed(2)} м²</strong></div>
              <div className="prop"><span>Вес</span><strong>{projectTotals.weightKg.toFixed(1)} кг</strong></div>
              <div className="prop"><span>Мощность</span><strong>{projectTotals.avgPowerKw.toFixed(2)} / {projectTotals.maxPowerKw.toFixed(2)} кВт</strong></div>
            </div>
          )}
        </aside>
      </section>

      <footer className="statusbar">
        <div className="status-item"><span>Проект</span><strong>{projectName}</strong></div>
        <div className="status-item"><span>Экраны</span><strong>{screens.length}</strong></div>
        <div className="status-item"><span>Кабинеты</span><strong>{projectTotals.cabinets}</strong></div>
        <div className="status-item"><span>Площадь</span><strong>{projectTotals.areaM2.toFixed(2)} м²</strong></div>
        <div className="status-item"><span>Мощность</span><strong>{projectTotals.avgPowerKw.toFixed(2)} / {projectTotals.maxPowerKw.toFixed(2)} кВт</strong></div>
      </footer>
    </main>
  );
}
