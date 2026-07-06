const cabinets = Array.from({ length: 48 }, (_, index) => index + 1);

const cabinetPresets = [
  'P2.97 Outdoor 500×500',
  'P3.91 Rental 500×500',
  'P2.6 Indoor 500×500',
];

export default function Home() {
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
              <strong>Главный экран сцены</strong>
            </div>
            <div className="quick-grid">
              <div><span>Кабинеты</span><strong>12 × 4</strong></div>
              <div><span>Кабинет</span><strong>500 × 500 мм</strong></div>
              <div><span>Разрешение</span><strong>2016 × 672 px</strong></div>
              <div><span>Размер</span><strong>6.0 × 2.0 м</strong></div>
            </div>
          </div>

          <div className="stage-label">Рабочая область / Предпросмотр экрана</div>
          <div className="stage-inner">
            <div className="screen-card" aria-label="Предпросмотр LED-экрана">
              <div className="cabinet-grid">
                {cabinets.map((number) => (
                  <div className="cabinet" key={number}>{number}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="inspector screen-builder">
          <h2>Новый экран</h2>
          <p className="inspector-note">Заполни параметры экрана. Предпросмотр и расчеты должны обновляться сразу.</p>

          <label className="field">
            <span>Название экрана</span>
            <input defaultValue="Главный экран сцены" />
          </label>

          <label className="field">
            <span>Тип кабинета</span>
            <select defaultValue={cabinetPresets[0]}>
              {cabinetPresets.map((preset) => (
                <option key={preset}>{preset}</option>
              ))}
            </select>
          </label>

          <div className="section-title">Сетка кабинетов</div>
          <div className="field-row">
            <label className="field">
              <span>Ширина</span>
              <input defaultValue="12" />
            </label>
            <label className="field">
              <span>Высота</span>
              <input defaultValue="4" />
            </label>
          </div>

          <div className="section-title">Кабинет</div>
          <div className="field-row">
            <label className="field">
              <span>Ширина, мм</span>
              <input defaultValue="500" />
            </label>
            <label className="field">
              <span>Высота, мм</span>
              <input defaultValue="500" />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span>Пиксели X</span>
              <input defaultValue="168" />
            </label>
            <label className="field">
              <span>Пиксели Y</span>
              <input defaultValue="168" />
            </label>
          </div>

          <div className="section-title">Расчет</div>
          <div className="prop"><span>Кабинеты</span><strong>48</strong></div>
          <div className="prop"><span>Физический размер</span><strong>6.0 × 2.0 м</strong></div>
          <div className="prop"><span>Разрешение</span><strong>2016 × 672</strong></div>
          <div className="prop"><span>Площадь</span><strong>12.0 м²</strong></div>

          <button className="create-screen-button">Создать экран</button>
        </aside>
      </section>

      <footer className="statusbar">
        <div className="status-item"><span>Разрешение</span><strong>2016 × 672</strong></div>
        <div className="status-item"><span>Кабинеты</span><strong>48</strong></div>
        <div className="status-item"><span>Площадь</span><strong>12.0 м²</strong></div>
        <div className="status-item"><span>Мощность</span><strong>4.8 кВт</strong></div>
        <div className="status-item"><span>Кабинет</span><strong>P2.97 Outdoor</strong></div>
      </footer>
    </main>
  );
}
