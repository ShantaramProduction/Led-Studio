import { getCloudProject, listCloudProjects, saveCloudProject, deleteCloudProject } from './cloud-projects';

const PROJECT_INDEX_KEY = 'shantaram-studio-project-index-v3';
const PROJECT_KEY_PREFIX = 'shantaram-studio-project-v3:';
const LEGACY_INDEX_KEY = 'shantaram-studio-project-index-v2';
const LEGACY_KEY_PREFIX = 'shantaram-studio-project-v2:';

export type ProjectCloudStatus = 'cloud' | 'fallback' | 'sync-pending' | 'error';

const canUseBrowserStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage);

export function loadLocalProjectCopy<TProject>(id: string): TProject | null {
  if (!canUseBrowserStorage()) return null;
  const raw = window.localStorage.getItem(`${PROJECT_KEY_PREFIX}${id}`) ?? window.localStorage.getItem(`${LEGACY_KEY_PREFIX}${id}`);
  return raw ? JSON.parse(raw) as TProject : null;
}

export function writeLocalProjectCopy<TProject extends { id: string }>(project: TProject) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(`${PROJECT_KEY_PREFIX}${project.id}`, JSON.stringify(project));
  const index = JSON.parse(window.localStorage.getItem(PROJECT_INDEX_KEY) ?? window.localStorage.getItem(LEGACY_INDEX_KEY) ?? '[]') as string[];
  window.localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify([project.id, ...index.filter((id) => id !== project.id)]));
}

export function removeLocalProjectCopy(id: string) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.removeItem(`${PROJECT_KEY_PREFIX}${id}`);
  const index = JSON.parse(window.localStorage.getItem(PROJECT_INDEX_KEY) ?? window.localStorage.getItem(LEGACY_INDEX_KEY) ?? '[]') as string[];
  window.localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(index.filter((item) => item !== id)));
}

export function listLocalProjectCopies<TProject>(): TProject[] {
  if (!canUseBrowserStorage()) return [];
  const index = JSON.parse(window.localStorage.getItem(PROJECT_INDEX_KEY) ?? window.localStorage.getItem(LEGACY_INDEX_KEY) ?? '[]') as string[];
  return index.map((id) => loadLocalProjectCopy<TProject>(id)).filter(Boolean) as TProject[];
}

export async function loadProjectsFromCloud<TProject>() {
  const records = await listCloudProjects<TProject>();
  const projects = records.map((record) => record.data);
  projects.forEach((project: any) => project?.id && writeLocalProjectCopy(project));
  return projects;
}

export async function loadProjectsCloudFirst<TProject>(): Promise<{ projects: TProject[]; status: ProjectCloudStatus }> {
  const cloudProjects = await loadProjectsFromCloud<TProject>();
  if (cloudProjects.length) return { projects: cloudProjects, status: 'cloud' };
  const localProjects = listLocalProjectCopies<TProject>();
  return { projects: localProjects, status: localProjects.length ? 'fallback' : 'cloud' };
}

export async function loadProjectFromCloud<TProject>(id: string) {
  const record = await getCloudProject<TProject>(id);
  if (record?.data) writeLocalProjectCopy(record.data as any);
  return record?.data ?? null;
}

export async function loadProjectCloudFirst<TProject>(id: string): Promise<{ project: TProject | null; status: ProjectCloudStatus }> {
  const cloudProject = await loadProjectFromCloud<TProject>(id);
  if (cloudProject) return { project: cloudProject, status: 'cloud' };
  const localProject = loadLocalProjectCopy<TProject>(id);
  return { project: localProject, status: localProject ? 'fallback' : 'error' };
}

export async function writeProjectToCloud<TProject extends { id: string; projectName: string; description?: string; updatedAt?: string }>(project: TProject): Promise<ProjectCloudStatus> {
  writeLocalProjectCopy(project);
  const ok = await saveCloudProject(project);
  return ok ? 'cloud' : 'sync-pending';
}

export async function removeProjectFromCloud(id: string): Promise<ProjectCloudStatus> {
  removeLocalProjectCopy(id);
  const ok = await deleteCloudProject(id);
  return ok ? 'cloud' : 'sync-pending';
}
