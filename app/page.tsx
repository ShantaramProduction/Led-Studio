const cabinets = Array.from({ length: 48 }, (_, index) => index + 1);

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
        <button className="tool-button">Экспорт</button>
        <button className="tool-button ghost">Библиотека</button>
        <button className="tool-button ghost">Настройки</button>
      </nav>

      <section className="workspace">
        <div className="stage">
          <div className="stage-label">Рабочая область / Фестивальный LED-экран</div>
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

        <aside className="inspector">
          <h2>Инспектор</h2>
          <div className="prop"><span>Объект</span><strong>Экран</strong></div>
          <div className="prop"><span>Кабинеты</span><strong>12 × 4</strong></div>
          <div className="prop"><span>Кабинет px</span><strong>168 × 168</strong></div>
          <div className="prop"><span>Разрешение</span><strong>2016 × 672</strong></div>
          <div className="prop"><span>Размер</span><strong>6.0 × 2.0 м</strong></div>
          <div className="prop"><span>Карта</span><strong>ID кабинетов</strong></div>
        </aside>
      </section>

      <footer className="statusbar">
        <div className="status-item"><span>Разрешение</span><strong>2016 × 672</strong></div>
        <div className="status-item"><span>Кабинеты</span><strong>48</strong></div>
        <div className="status-item"><span>Площадь</span><strong>12.0 м²</strong></div>
        <div className="status-item"><span>Мощность</span><strong>4.8 кВт</strong></div>
        <div className="status-item"><span>Экспорт</span><strong>PDF / PNG / SVG</strong></div>
      </footer>
    </main>
  );
}
