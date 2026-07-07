import { supabase } from './supabase';

export type CloudProjectRecord<TProject> = {
  id: string;
  name: string;
  description: string;
  data: TProject;
  createdAt: string;
  updatedAt: string;
};

const mapProjectFromRow = <TProject>(row: any): CloudProjectRecord<TProject> => ({
  id: row.id,
  name: row.name,
  description: row.description ?? row.data?.description ?? '',
  data: row.data as TProject,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function listCloudProjects<TProject>(): Promise<CloudProjectRecord<TProject>[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('projects')
    .select('id,name,description,data,created_at,updated_at')
    .order('updated_at', { ascending: false });

  if (error) return [];
  return (data ?? []).map(mapProjectFromRow<TProject>);
}

export async function getCloudProject<TProject>(id: string): Promise<CloudProjectRecord<TProject> | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('projects')
    .select('id,name,description,data,created_at,updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return mapProjectFromRow<TProject>(data);
}

export async function saveCloudProject<TProject extends { id: string; projectName: string; description?: string; updatedAt?: string }>(project: TProject): Promise<boolean> {
  if (!supabase) return false;

  const now = new Date().toISOString();
  const { error } = await supabase.from('projects').upsert({
    id: project.id,
    name: project.projectName,
    description: project.description ?? '',
    data: { ...project, updatedAt: project.updatedAt ?? now },
    updated_at: now,
  });

  return !error;
}

export async function deleteCloudProject(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('projects').delete().eq('id', id);
  return !error;
}
