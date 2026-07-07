import { getCloudProject, listCloudProjects, saveCloudProject, deleteCloudProject } from './cloud-projects';

export type ProjectCloudStatus = 'cloud' | 'fallback' | 'sync-pending' | 'error';

export async function loadProjectsFromCloud<TProject>() {
  const records = await listCloudProjects<TProject>();
  return records.map((record) => record.data);
}

export async function loadProjectFromCloud<TProject>(id: string) {
  const record = await getCloudProject<TProject>(id);
  return record?.data ?? null;
}

export async function writeProjectToCloud<TProject extends { id: string; projectName: string; description?: string; updatedAt?: string }>(project: TProject): Promise<ProjectCloudStatus> {
  const ok = await saveCloudProject(project);
  return ok ? 'cloud' : 'sync-pending';
}

export async function removeProjectFromCloud(id: string): Promise<ProjectCloudStatus> {
  const ok = await deleteCloudProject(id);
  return ok ? 'cloud' : 'sync-pending';
}
