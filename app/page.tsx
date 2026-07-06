'use client';

import { MouseEvent as ReactMouseEvent, PointerEvent, WheelEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Cabinet, cabinetPresets, calculateScreen } from '../lib/screen-engine';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const PROJECT_INDEX_KEY = 'shantaram-studio-project-index-v2';
const PROJECT_KEY_PREFIX = 'shantaram-studio-project-v2:';
const SESSION_KEY = 'shantaram-studio-admin-session';
const SNAP_SIZE = 20;

const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const snap = (value: number, enabled: boolean) => enabled ? Math.round(value / SNAP_SIZE) * SNAP_SIZE : Math.round(value);

type Language = 'ru' | 'en';
type NumberingMode = 'rows' | 'snake';
type InspectorTab = 'screen' | 'cabinet' | 'calc' | 'canvas';
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
  updatedAt: string;
};

type ProjectCard = {
  id: string;
  name: string;
  screens: number;
  cabinets: number;
  areaM2: number;
  updatedAt: string;
};

type ContextMenu = {
  x: number;
  y: number;
  target: 'stage' | 'screen';
  screenId?: string;
  canvasX?: number;
  canvasY?: number;
} | null;

const makeInitialScreens = (language: Language): ScreenDraft[] => [
  { id: 'main', name: language === 'ru' ? 'Главный экран сцены' : 'Main Stage Screen', cabinetId: cabinetPresets[0].id, columns: '12', rows: '4', x: 120, y: 120 },
  { id: 'left-imag', name: language === 'ru' ? 'Левый IMAG' : 'Left IMAG', cabinetId: cabinetPresets[1].id, columns: '4', rows: '6', x: 80, y: 360 },
  { id: 'right-imag', name: language === 'ru' ? 'Правый IMAG' : 'Right IMAG', cabinetId: cabinetPresets[1].id, columns: '4', rows: '6', x: 720, y: 360 },
];

const createProject = (language: Language, name?: string): ProjectState => {
  const screens = makeInitialScreens(language);
  return {
    id: `project-${Date.now()}`,
    projectName: name ?? (language === 'ru' ? 'Новый LED-проект' : 'New LED Project'),
    screens,
    activeScreenId: screens[0].id,
    numberingMode: 'rows',
    language,
    updatedAt: new Date().toISOString(),
  };
};

const translations = {
  ru: {
    tagline: 'Инженерная платформа для LED-экранов',
    loginTitle: 'Вход в SHANTARAM Studio',
    loginSubtitle: 'Текущий режим: администратор без пароля. Позже заменим на нормальную авторизацию.',
    enterAsAdmin: 'Войти как admin',
    admin: 'admin',
    saved: 'Сохранено',
    saving: 'Сохранение...',
    local: 'Сохранено локально',
    error: 'Ошибка сохранения',
    localMode: 'локальный режим',
    dashboard: 'Проекты',
    openProject: 'Открыть проект',
    recentProjects: 'Сохранённые проекты',
    emptyProjects: 'Пока проектов нет. Создай первый, и тут появится маленький склад инженерных чудес.',
    newProject: 'Новый проект',
    backToProjects: 'Все проекты',
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
    canvas: 'Холст',
    addScreen: '+ Добавить экран',
    workspace: 'CAD-холст / Несколько экранов проекта',
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
    duplicateScreen: 'Дублировать экран',
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
    fitView: 'Вписать вид',
    contextAddScreen: 'Добавить экран здесь',
    snapToGrid: 'Привязка к сетке',
    rulers: 'Линейки',
    guides: 'Направляющие',
    grid: 'Сетка',
    panHint: 'Средняя кнопка мыши или Alt+ЛКМ двигает холст. Колесо мыши зумит в курсор. Shift при перетаскивании экрана ограничивает движение по оси.',
    updated: 'Изменён',
    logout: 'Выйти',
  },
  en: {
    tagline: 'Professional LED screen engineering platform',
    loginTitle: 'Sign in to SHANTARAM Studio',
    loginSubtitle: 'Current mode: admin without password. We will replace it with real auth later.',
    enterAsAdmin: 'Enter as admin',
    admin: 'admin',
    saved: 'Saved',
    saving: 'Saving...',
    local: 'Saved locally',
    error: 'Save error',
    localMode: 'local mode',
    dashboard: 'Projects',
    openProject: 'Open project',
    recentProjects: 'Saved projects',
    emptyProjects: 'No projects yet. Create the first one and this shelf will start glowing.',
    newProject: 'New Project',
    backToProjects: 'All Projects',
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
    canvas: 'Canvas',
    addScreen: '+ Add screen',
    workspace: 'CAD canvas / Multi-screen project',
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
    duplicateScreen: 'Duplicate screen',
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
    fitView: 'Fit view',
    contextAddScreen: 'Add screen here',
    snapToGrid: 'Snap to grid',
    rulers: 'Rulers',
    guides: 'Guides',
    grid: 'Grid',
    panHint: 'Middle mouse or Alt+Left Mouse pans the canvas. Mouse wheel zooms into cursor. Shift while dragging locks movement to an axis.',
    updated: 'Updated',
    logout: 'Logout',
  },
};

const getCabinet = (cabinetId: string): Cabinet => cabinetPresets.find((preset) => preset.id === cabinetId) ?? cabinetPresets[0];

const summarizeProject = (project: ProjectState): ProjectCard => {
  const totals = project.screens.reduce((acc, draft) => {
    const model = calculateScreen({
      name: draft.name,
      cabinet: getCabinet(draft.cabinetId),
      columns: toNumber(draft.columns, 1),
      rows: toNumber(draft.rows, 1),
    });
    return {
      cabinets: acc.cabinets + model.calculated.cabinets,
      areaM2: acc.areaM2 + model.calculated.areaM2,
    };
  }, { cabinets: 0, areaM2: 0 });

  return {
    id: project.id,
    name: project.projectName,
    screens: project.screens.length,
    cabinets: totals.cabinets,
    areaM2: totals.areaM2,
    updatedAt: project.updatedAt,
  };
};

export default function Home() {
  const [language, setLanguage] = useState<Language>('ru');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Summer Fest 2026');
  const [screens, setScreens] = useState<ScreenDraft[]>(makeInitialScreens('ru'));
  const [activeScreenId, setActiveScreenId] = useState('main');
  const [zoom, setZoom] = useState(90);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedCabinet, setSelectedCabinet] = useState(1);
  const [numberingMode, setNumberingMode] = useState<NumberingMode>('rows');
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('screen');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [draggingScreenId, setDraggingScreenId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const dragRef = useRef<{ id: string; startX: number; startY: number; originalX: number; originalY: number; axis?: 'x' | 'y' } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; originalX: number; originalY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
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

  const projectTotals = screens.reduce(
    (totals, draft) => {
      const model = calculateScreen({
        name: draft.name,
        cabinet: getCabinet(draft.cabinetId),
        columns: toNumber(draft.columns, 1),
        rows: toNumber(draft.rows, 1),
      });
      return {
        cabinets: totals.cabinets + model.calculated.cabinets,
        areaM2: totals.areaM2 + model.calculated.areaM2,
        weightKg: totals.weightKg + model.calculated.weightKg,
        avgPowerKw: totals.avgPowerKw + model.calculated.avgPowerKw,
        maxPowerKw: totals.maxPowerKw + model.calculated.maxPowerKw,
      };
    },
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
    id: currentProjectId ?? `project-${Date.now()}`,
    projectName,
    screens,
    activeScreenId,
    numberingMode,
    language,
    updatedAt: new Date().toISOString(),
  }), [currentProjectId, projectName, screens, activeScreenId, numberingMode, language]);

  const writeLocalProject = (payload: ProjectState) => {
    window.localStorage.setItem(`${PROJECT_KEY_PREFIX}${payload.id}`, JSON.stringify(payload));
    const currentIndex = JSON.parse(window.localStorage.getItem(PROJECT_INDEX_KEY) ?? '[]') as string[];
    const nextIndex = [payload.id, ...currentIndex.filter((id) => id !== payload.id)];
    window.localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(nextIndex));
  };

  const loadLocalProject = (id: string): ProjectState | null => {
    const raw = window.localStorage.getItem(`${PROJECT_KEY_PREFIX}${id}`);
    return raw ? JSON.parse(raw) as ProjectState : null;
  };

  const refreshProjects = async () => {
    const localIds = JSON.parse(window.localStorage.getItem(PROJECT_INDEX_KEY) ?? '[]') as string[];
    const localProjects = localIds
      .map(loadLocalProject)
      .filter(Boolean)
      .map((project) => summarizeProject(project as ProjectState));

    let cloudProjects: ProjectCard[] = [];
    if (supabase) {
      const { data } = await supabase.from('projects').select('id,name,data,updated_at').order('updated_at', { ascending: false });
      cloudProjects = (data ?? []).map((row) => summarizeProject({ ...(row.data as ProjectState), id: row.id, updatedAt: row.updated_at }));
    }

    const merged = [...cloudProjects, ...localProjects].reduce<ProjectCard[]>((acc, item) => {
      if (!acc.some((existing) => existing.id === item.id)) acc.push(item);
      return acc;
    }, []);

    setProjects(merged);
  };

  const saveProjectNow = async (payload = projectPayload) => {
    if (!currentProjectId) return;
    setSaveStatus('saving');
    writeLocalProject(payload);

    if (!supabase) {
      setSaveStatus('local');
      refreshProjects();
      return;
    }

    const { error } = await supabase.from('projects').upsert({
      id: payload.id,
      name: payload.projectName,
      data: payload,
      updated_at: payload.updatedAt,
    });

    setSaveStatus(error ? 'local' : 'saved');
    refreshProjects();
  };

  const openProject = async (id: string) => {
    let project = loadLocalProject(id);

    if (supabase) {
      const { data, error } = await supabase.from('projects').select('data,updated_at').eq('id', id).maybeSingle();
      if (!error && data?.data) project = { ...(data.data as ProjectState), updatedAt: data.updated_at };
    }

    if (!project) return;
    setCurrentProjectId(project.id);
    setProjectName(project.projectName);
    setScreens(project.screens?.length ? project.screens : makeInitialScreens(project.language ?? language));
    setActiveScreenId(project.activeScreenId ?? project.screens?.[0]?.id ?? 'main');
    setNumberingMode(project.numberingMode ?? 'rows');
    setLanguage(project.language ?? language);
    setSelectedCabinet(1);
    setPan({ x: 0, y: 0 });
    setZoom(90);
    setSaveStatus('saved');
    didLoadRef.current = true;
  };

  const makeNewProject = async () => {
    const project = createProject(language);
    writeLocalProject(project);
    setProjects((items) => [summarizeProject(project), ...items.filter((item) => item.id !== project.id)]);
    await openProject(project.id);
  };

  useEffect(() => {
    const session = window.localStorage.getItem(SESSION_KEY);
    setIsLoggedIn(session === 'admin');
    refreshProjects();
  }, []);

  useEffect(() => {
    if (!currentProjectId || !didLoadRef.current) return;
    setSaveStatus('saving');
    window.localStorage.setItem(`${PROJECT_KEY_PREFIX}${currentProjectId}`, JSON.stringify(projectPayload));
    const timeout = window.setTimeout(() => saveProjectNow(projectPayload), 700);
    return () => window.clearTimeout(timeout);
  }, [projectPayload, currentProjectId]);

  const login = () => {
    window.localStorage.setItem(SESSION_KEY, 'admin');
    setIsLoggedIn(true);
    refreshProjects();
  };

  const logout = () => {
    window.localStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
    setCurrentProjectId(null);
  };

  const updateActiveScreen = (patch: Partial<ScreenDraft>) => {
    setScreens((items) => items.map((item) => item.id === activeDraft.id ? { ...item, ...patch } : item));
  };

  const canvasPointFromClient = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 260, y: 180 };
    return {
      x: snap((clientX - rect.left - pan.x) / (zoom / 100), snapToGrid),
      y: snap((clientY - rect.top - pan.y) / (zoom / 100), snapToGrid),
    };
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
      x: snap(source.x + 40, snapToGrid),
      y: snap(source.y + 40, snapToGrid),
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

  const fitWorkspace = () => {
    setZoom(90);
    setPan({ x: 0, y: 0 });
    setContextMenu(null);
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const oldZoom = zoom / 100;
    const nextZoomValue = Math.min(180, Math.max(35, zoom + (event.deltaY > 0 ? -6 : 6)));
    const nextZoom = nextZoomValue / 100;
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;
    const worldX = (cursorX - pan.x) / oldZoom;
    const worldY = (cursorY - pan.y) / oldZoom;
    setZoom(nextZoomValue);
    setPan({ x: cursorX - worldX * nextZoom, y: cursorY - worldY * nextZoom });
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
    let deltaX = (event.clientX - drag.startX) / (zoom / 100);
    let deltaY = (event.clientY - drag.startY) / (zoom / 100);

    if (event.shiftKey) {
      if (!drag.axis) drag.axis = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
      if (drag.axis === 'x') deltaY = 0;
      if (drag.axis === 'y') deltaX = 0;
    } else {
      drag.axis = undefined;
    }

    const nextX = snap(drag.originalX + deltaX, snapToGrid);
    const nextY = snap(drag.originalY + deltaY, snapToGrid);
    setScreens((items) => items.map((item) => item.id === drag.id ? { ...item, x: nextX, y: nextY } : item));
  };

  const endScreenDrag = () => {
    dragRef.current = null;
    setDraggingScreenId(null);
  };

  const startPan = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 1 && !event.altKey) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = { startX: event.clientX, startY: event.clientY, originalX: pan.x, originalY: pan.y };
  };

  const movePan = (event: PointerEvent<HTMLDivElement>) => {
    if (!panRef.current) return;
    setPan({
      x: panRef.current.originalX + event.clientX - panRef.current.startX,
      y: panRef.current.originalY + event.clientY - panRef.current.startY,
    });
  };

  const endPan = () => {
    panRef.current = null;
  };

  const showStageContext = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const point = canvasPointFromClient(event.clientX, event.clientY);
    setContextMenu({ x: event.clientX, y: event.clientY, target: 'stage', canvasX: point.x, canvasY: point.y });
  };

  const showScreenContext = (event: ReactMouseEvent<HTMLDivElement>, screenId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveScreenId(screenId);
    setContextMenu({ x: event.clientX, y: event.clientY, target: 'screen', screenId });
  };

  if (!isLoggedIn) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <div className="login-mark">S</div>
          <h1>{t.loginTitle}</h1>
          <p>{t.loginSubtitle}</p>
          <button className="tool-button primary" onClick={login}>{t.enterAsAdmin}</button>
          <div className="lang login-lang">
            <button className={language === 'ru' ? 'active' : ''} onClick={() => setLanguage('ru')}>RU</button>
            <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
          </div>
        </section>
      </main>
    );
  }

  if (!currentProjectId) {
    return (
      <main className="dashboard-shell">
        <header className="topbar dashboard-topbar">
          <div className="brand">
            <strong>SHANTARAM Studio</strong>
            <span>{t.tagline}</span>
          </div>
          <div className="top-actions">
            <span>{t.admin}</span>
            <button className="tool-button ghost" onClick={logout}>{t.logout}</button>
            <div className="lang">
              <button className={language === 'ru' ? 'active' : ''} onClick={() => setLanguage('ru')}>RU</button>
              <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
            </div>
          </div>
        </header>
        <section className="dashboard-content">
          <div className="dashboard-hero">
            <div>
              <span>{t.dashboard}</span>
              <h1>SHANTARAM Studio</h1>
              <p>{t.recentProjects}</p>
            </div>
            <button className="tool-button primary" onClick={makeNewProject}>{t.newProject}</button>
          </div>
          {projects.length === 0 ? (
            <div className="empty-projects">{t.emptyProjects}</div>
          ) : (
            <div className="project-cards">
              {projects.map((project) => (
                <button className="project-card" key={project.id} onClick={() => openProject(project.id)}>
                  <strong>{project.name}</strong>
                  <span>{project.screens} {t.screens} · {project.cabinets} {t.cabinets} · {project.areaM2.toFixed(2)} m²</span>
                  <small>{t.updated}: {new Date(project.updatedAt).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')}</small>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    );
  }

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
          <span>{t.admin}</span>
          <div className="lang">
            <button className={language === 'ru' ? 'active' : ''} onClick={() => setLanguage('ru')}>RU</button>
            <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
          </div>
        </div>
      </header>

      <nav className="toolbar">
        <button className="tool-button" onClick={() => setCurrentProjectId(null)}>{t.backToProjects}</button>
        <button className="tool-button primary" onClick={() => addScreen()}>{t.newScreen}</button>
        <button className="tool-button" onClick={() => saveProjectNow()}>{t.saveProject}</button>
        <button className="tool-button ghost">{t.numbering}</button>
        <button className="tool-button ghost">{t.map}</button>
        <button className="tool-button ghost">{t.library}</button>
        <button className="tool-button ghost">{t.settings}</button>
        <div className="toolbar-spacer" />
        <button className={`tool-button ${snapToGrid ? '' : 'ghost'}`} onClick={() => setSnapToGrid((value) => !value)}>{t.snapToGrid}</button>
        <button className="tool-button ghost" onClick={fitWorkspace}>{t.fit}</button>
        <div className="zoom-controls">
          <button onClick={() => setZoom((value) => Math.max(35, value - 10))}>−</button>
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

        <div
          className="stage cad-stage"
          onWheel={handleWheel}
          onContextMenu={showStageContext}
          onPointerDown={startPan}
          onPointerMove={movePan}
          onPointerUp={endPan}
          onPointerCancel={endPan}
        >
          {showRulers && <><div className="ruler ruler-top" /><div className="ruler ruler-left" /></>}
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

          <div className="stage-inner project-canvas" ref={canvasRef}>
            <div className="canvas-plane cad-plane" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})` }}>
              {showGuides && <><div className="guide-line guide-x" style={{ top: activeDraft.y }} /><div className="guide-line guide-y" style={{ left: activeDraft.x }} /></>}
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
              <button onClick={() => addScreen(contextMenu.canvasX, contextMenu.canvasY)}>{t.contextAddScreen}</button>
              <button onClick={fitWorkspace}>{t.fitView}</button>
              <button onClick={() => saveProjectNow()}>{t.saveProject}</button>
            </div>
          )}
        </div>

        <aside className="inspector screen-builder">
          <h2>{screen.name}</h2>
          <p className="inspector-note">{t.activeScreenNote}</p>

          <div className="inspector-tabs four-tabs">
            <button className={inspectorTab === 'screen' ? 'active' : ''} onClick={() => setInspectorTab('screen')}>{t.screen}</button>
            <button className={inspectorTab === 'cabinet' ? 'active' : ''} onClick={() => setInspectorTab('cabinet')}>{t.cabinet}</button>
            <button className={inspectorTab === 'calc' ? 'active' : ''} onClick={() => setInspectorTab('calc')}>{t.calc}</button>
            <button className={inspectorTab === 'canvas' ? 'active' : ''} onClick={() => setInspectorTab('canvas')}>{t.canvas}</button>
          </div>

          {inspectorTab === 'screen' && (
            <div className="tab-panel">
              <label className="field"><span>{t.screenName}</span><input value={activeDraft.name} onChange={(event) => updateActiveScreen({ name: event.target.value })} /></label>
              <label className="field"><span>{t.cabinetType}</span><select value={activeDraft.cabinetId} onChange={(event) => updateActiveScreen({ cabinetId: event.target.value })}>{cabinetPresets.map((preset) => <option value={preset.id} key={preset.id}>{preset.name}</option>)}</select></label>
              <div className="section-title">{t.cabinetGrid}</div>
              <div className="field-row">
                <label className="field"><span>{t.width}</span><input value={activeDraft.columns} inputMode="numeric" onChange={(event) => updateActiveScreen({ columns: event.target.value })} /></label>
                <label className="field"><span>{t.height}</span><input value={activeDraft.rows} inputMode="numeric" onChange={(event) => updateActiveScreen({ rows: event.target.value })} /></label>
              </div>
              <div className="section-title">{t.numbering}</div>
              <div className="segmented"><button className={numberingMode === 'rows' ? 'active' : ''} onClick={() => setNumberingMode('rows')}>{t.rows}</button><button className={numberingMode === 'snake' ? 'active' : ''} onClick={() => setNumberingMode('snake')}>{t.snake}</button></div>
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

          {inspectorTab === 'canvas' && (
            <div className="tab-panel">
              <div className="section-title">CAD</div>
              <div className="segmented"><button className={snapToGrid ? 'active' : ''} onClick={() => setSnapToGrid(true)}>{t.snapToGrid}</button><button className={!snapToGrid ? 'active' : ''} onClick={() => setSnapToGrid(false)}>Free</button></div>
              <div className="segmented canvas-switch"><button className={showRulers ? 'active' : ''} onClick={() => setShowRulers((value) => !value)}>{t.rulers}</button><button className={showGuides ? 'active' : ''} onClick={() => setShowGuides((value) => !value)}>{t.guides}</button></div>
              <div className="prop"><span>Zoom</span><strong>{zoom}%</strong></div>
              <div className="prop"><span>Pan</span><strong>{Math.round(pan.x)}, {Math.round(pan.y)}</strong></div>
              <p className="inspector-note canvas-hint">{t.panHint}</p>
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
