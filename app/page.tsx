const cabinets = Array.from({ length: 48 }, (_, index) => index + 1);

export default function Home() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <strong>SHANTARAM Studio</strong>
          <span>Professional Screen Engineering Platform</span>
        </div>
        <div className="top-actions">
          <span className="saved-dot" />
          <span>Saved</span>
          <div className="lang"><span>RU</span><span>EN</span></div>
        </div>
      </header>

      <nav className="toolbar">
        <button className="tool-button primary">+ New Screen</button>
        <button className="tool-button">Numbering</button>
        <button className="tool-button">Pattern</button>
        <button className="tool-button">Export</button>
        <button className="tool-button ghost">Library</button>
        <button className="tool-button ghost">Settings</button>
      </nav>

      <section className="workspace">
        <div className="stage">
          <div className="stage-label">Screen Workspace / Festival LED Wall</div>
          <div className="stage-inner">
            <div className="screen-card" aria-label="LED screen preview">
              <div className="cabinet-grid">
                {cabinets.map((number) => (
                  <div className="cabinet" key={number}>{number}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="inspector">
          <h2>Inspector</h2>
          <div className="prop"><span>Object</span><strong>Screen</strong></div>
          <div className="prop"><span>Cabinets</span><strong>12 × 4</strong></div>
          <div className="prop"><span>Cabinet px</span><strong>168 × 168</strong></div>
          <div className="prop"><span>Resolution</span><strong>2016 × 672</strong></div>
          <div className="prop"><span>Physical size</span><strong>6.0 × 2.0 m</strong></div>
          <div className="prop"><span>Pattern</span><strong>Cabinet IDs</strong></div>
        </aside>
      </section>

      <footer className="statusbar">
        <div className="status-item"><span>Resolution</span><strong>2016 × 672</strong></div>
        <div className="status-item"><span>Cabinets</span><strong>48</strong></div>
        <div className="status-item"><span>Area</span><strong>12.0 m²</strong></div>
        <div className="status-item"><span>Power</span><strong>4.8 kW</strong></div>
        <div className="status-item"><span>Export</span><strong>PDF / PNG / SVG</strong></div>
      </footer>
    </main>
  );
}
