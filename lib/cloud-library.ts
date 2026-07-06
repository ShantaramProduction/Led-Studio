import { supabase } from './supabase';

export type CabinetLibraryItem = {
  id: string;
  name: string;
  manufacturer: string;
  widthMm: number;
  heightMm: number;
  pixelsX: number;
  pixelsY: number;
  weightKg: number;
  avgPowerW: number;
  maxPowerW: number;
  receiverCard: string;
  configFileName: string;
  notes: string;
  isPublic: boolean;
};

export type CabinetFileItem = {
  id: string;
  cabinetId: string;
  fileName: string;
  fileType: string;
  storagePath: string;
};

export type ProjectFileItem = {
  id: string;
  projectId: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  purpose: 'reference' | 'capture' | 'config' | 'export';
};

export type BrandingSettings = {
  logoFileName?: string;
  logoStoragePath?: string;
  cabinetPalette: string[];
  cabinetDisplay: {
    showNumber: boolean;
    showPort: boolean;
    showPower: boolean;
    showRx: boolean;
  };
};

const mapCabinetFromRow = (row: any): CabinetLibraryItem => ({
  id: row.id,
  name: row.name,
  manufacturer: row.manufacturer ?? '',
  widthMm: row.width_mm,
  heightMm: row.height_mm,
  pixelsX: row.pixels_x,
  pixelsY: row.pixels_y,
  weightKg: Number(row.weight_kg ?? 0),
  avgPowerW: Number(row.avg_power_w ?? 0),
  maxPowerW: Number(row.max_power_w ?? 0),
  receiverCard: row.receiver_card ?? '',
  configFileName: row.config_file_name ?? '',
  notes: row.notes ?? '',
  isPublic: Boolean(row.is_public),
});

const mapCabinetToRow = (cabinet: Partial<CabinetLibraryItem>) => ({
  name: cabinet.name,
  manufacturer: cabinet.manufacturer,
  width_mm: cabinet.widthMm,
  height_mm: cabinet.heightMm,
  pixels_x: cabinet.pixelsX,
  pixels_y: cabinet.pixelsY,
  weight_kg: cabinet.weightKg,
  avg_power_w: cabinet.avgPowerW,
  max_power_w: cabinet.maxPowerW,
  receiver_card: cabinet.receiverCard,
  config_file_name: cabinet.configFileName,
  notes: cabinet.notes,
  is_public: cabinet.isPublic,
  updated_at: new Date().toISOString(),
});

export async function listCloudCabinets(): Promise<CabinetLibraryItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('cabinet_library')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) return [];
  return (data ?? []).map(mapCabinetFromRow);
}

export async function createCloudCabinet(cabinet: Omit<CabinetLibraryItem, 'id'>): Promise<CabinetLibraryItem | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('cabinet_library')
    .insert(mapCabinetToRow(cabinet))
    .select('*')
    .single();

  if (error || !data) return null;
  return mapCabinetFromRow(data);
}

export async function updateCloudCabinet(id: string, patch: Partial<CabinetLibraryItem>): Promise<CabinetLibraryItem | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('cabinet_library')
    .update(mapCabinetToRow(patch))
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return null;
  return mapCabinetFromRow(data);
}

export async function deleteCloudCabinet(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('cabinet_library').delete().eq('id', id);
  return !error;
}

export async function uploadCloudFile(bucket: 'cabinet-files' | 'project-files' | 'branding', path: string, file: File): Promise<string | null> {
  if (!supabase) return null;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) return null;
  return path;
}
