import { supabase } from '@/integrations/supabase/client';
export const LOGO_MAX_BYTES = 5 * 1024 * 1024;
export function validateLogo(file: Pick<File, 'type' | 'size'>): string | null {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return 'Choose a PNG, JPEG or WebP image.';
  if (file.size > LOGO_MAX_BYTES) return 'Choose an image smaller than 5 MB.';
  return null;
}
export async function uploadLogo(userId: string, file: File): Promise<string> {
  const message = validateLogo(file); if (message) throw new Error(message);
  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('invoice-logos').upload(path, file);
  if (error) throw error; return path;
}
export async function resolveLogo(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from('invoice-logos').download(path);
  if (error || !data) throw error ?? new Error('Logo unavailable');
  return URL.createObjectURL(data);
}
export async function invoiceLogoData(path: string): Promise<string> {
  const url = await resolveLogo(path); if (!url) throw new Error('Logo unavailable');
  try {
    const img = new Image(); img.src = url; await img.decode();
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 600 / Math.max(img.width, img.height));
    canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Cannot render logo');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally { URL.revokeObjectURL(url); }
}