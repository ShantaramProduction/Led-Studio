'use client';

import { useMemo, useState } from 'react';
import { Cabinet, cabinetPresets, calculateScreen } from '../lib/screen-engine';

const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function Home() {
  const [screenName, setScreenName] = useState('Главный экран сцены');
  const [cabinetId, setCabinetId] = useState(cabinetPresets[0].id);
  const [columns, setColumns] = useState('12');
  const [rows, setRows] = useState('4');

  const cabinet = useMemo<Cabinet>(() => {
    return cabinetPresets.find((preset) => preset.id === cabinetId) ?? cabinetPresets[0];
  }, [cabinetId]);

  const screen = calculateScreen({
    name: screenName,
    cabinet,
    columns: toNumber(columns, 1),
    rows: toNumber(rows, 1),
  });

  const cabinets = Array.from({ length: screen.calculated.cabinets }, (_, index) => index + 1);

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
        <button className="tool-button primary">+ Новый экран</button>
        <button className="tool-button">Нумерация</button>
        <button className="tool-button">Карта</button>
        <button className="tool-button ghost">Библиотека</button>
        <button className="tool-button ghost">Настройки</button>
      </nav>

      <section className="workspace">
        <div className="stage">
          <div className="screen-create-panel">
            <div className="panel-heading">
              <span>Создание экрана</span>
              <strong>{screen.name}</strong>
            </div>
            <div className="quick-grid">
              <div><span>Кабинеты</span><strong>{screen.columns} × {screen.rows}</strong></div>
              <div><span>Кабинет</span><strong>{cabinet.widthMm} × {cabinet.heightMm} мм</strong></div>
              <div><span>Разрешение</span><strong>{screen.calculated.resolutionX} × {screen.calculated.resolutionY} px</strong></div>
              <div><span>Размер</span><strong>{screen.calculated.widthM} × {screen.calculated.heightM} м</strong></div>
            </div>
          </div>

          <div className="stage-label">Рабочая область / Предпросмотр экрана</div>
          <div className="stage-inner">
            <div
              className="screen-card"
              aria-label="Предпросмотр LED-экрана"
              style={{ aspectRatio: `${screen.calculated.widthMm} / ${screen.calculated.heightMm}` }}
            >
              <div
                className="cabinet-grid"
                style={{
                  gridTemplateColumns: `repeat(${screen.columns}, 1fr)`,
                  gridTemplateRows: `repeat(${screen.rows}, 1fr)`,
                }}
              >
                {cabinets.map((number) => (
                  <div className="cabinet" key={number}>{number}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="inspector screen-builder">
          <h2>Новый экран</h2>
          <p className="inspector-note">Заполни параметры экрана. Предпросмотр и расчеты обновляются сразу.</p>

          <label className="field">
            <span>Название экрана</span>
            <input value={screenName} onChange={(event) => setScreenName(event.target.value)} />
          </label>

          <label className="field">
            <span>Тип кабинета</span>
            <select value={cabinetId} onChange={(event) => setCabinetId(event.target.value)}>
              {cabinetPresets.map((preset) => (
                <option value={preset.id} key={preset.id}>{preset.name}</option>
              ))}
            </select>
          </label>

          <div className="section-title">Сетка кабинетов</div>
          <div className="field-row">
            <label className="field">
              <span>Ширина</span>
              <input value={columns} inputMode="numeric" onChange={(event) => setColumns(event.target.value)} />
            </label>
            <label className="field">
              <span>Высота</span>
              <input value={rows} inputMode="numeric" onChange={(event) => setRows(event.target.value)} />
            </label>
          </div>

          <div className="section-title">Кабинет</div>
          <div className="prop"><span>Производитель</span><strong>{cabinet.manufacturer}</strong></div>
          <div className="prop"><span>Размер</span><strong>{cabinet.widthMm} × {cabinet.heightMm} мм</strong></div>
          <div className="prop"><span>Разрешение</span><strong>{cabinet.pixelsX} × {cabinet.pixelsY} px</strong></div>
          <div className="prop"><span>Вес</span><strong>{cabinet.weightKg} кг</strong></div>
          <div className="prop"><span>Средняя мощность</span><strong>{cabinet.avgPowerW} Вт</strong></div>
          <div className="prop"><span>Макс. мощность</span><strong>{cabinet.maxPowerW} Вт</strong></div>
          <div className="prop"><span>Конфиг</span><strong>{cabinet.configFile}</strong></div>

          <div className="section-title">Расчет</div>
          <div className="prop"><span>Кабинеты</span><strong>{screen.calculated.cabinets}</strong></div>
          <div className="prop"><span>Физический размер</span><strong>{screen.calculated.widthM} × {screen.calculated.heightM} м</strong></div>
          <div className="prop"><span>Разрешение</span><strong>{screen.calculated.resolutionX} × {screen.calculated.resolutionY}</strong></div>
          <div className="prop"><span>Площадь</span><strong>{screen.calculated.areaM2} м²</strong></div>
          <div className="prop"><span>Вес</span><strong>{screen.calculated.weightKg} кг</strong></div>
          <div className="prop"><span>Средняя мощность</span><strong>{screen.calculated.avgPowerKw} кВт</strong></div>
          <div className="prop"><span>Макс. мощность</span><strong>{screen.calculated.maxPowerKw} кВт</strong></div>

          <button className="create-screen-button">Создать экран</button>
        </aside>
      </section>

      <footer className="statusbar">
        <div className="status-item"><span>Разрешение</span><strong>{screen.calculated.resolutionX} × {screen.calculated.resolutionY}</strong></div>
        <div className="status-item"><span>Кабинеты</span><strong>{screen.calculated.cabinets}</strong></div>
        <div className="status-item"><span>Площадь</span><strong>{screen.calculated.areaM2} м²</strong></div>
        <div className="status-item"><span>Мощность</span><strong>{screen.calculated.avgPowerKw} / {screen.calculated.maxPowerKw} кВт</strong></div>
        <div className="status-item"><span>Кабинет</span><strong>{cabinet.name}</strong></div>
      </footer>
    </main>
  );
}
