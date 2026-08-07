const storageUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const storageKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || 'store-erp-assets';

export const isObjectStorageConfigured = () => Boolean(storageUrl && storageKey && storageBucket);

const objectEndpoint = (key: string) =>
  `${storageUrl}/storage/v1/object/${encodeURIComponent(storageBucket)}/${key.split('/').map(encodeURIComponent).join('/')}`;

export async function putObject(key: string, body: Buffer, contentType: string): Promise<string> {
  if (!isObjectStorageConfigured()) throw new Error('Object storage is not configured');
  const response = await fetch(objectEndpoint(key), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${storageKey}`,
      apikey: storageKey,
      'Content-Type': contentType,
      'x-upsert': 'false',
      'Cache-Control': '31536000',
    },
    body,
  });
  if (!response.ok) {
    throw new Error(`Object storage upload failed (${response.status})`);
  }
  return `${storageUrl}/storage/v1/object/public/${encodeURIComponent(storageBucket)}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

export async function deleteObjectByPublicUrl(publicUrl: string): Promise<boolean> {
  if (!isObjectStorageConfigured() || !publicUrl.startsWith(storageUrl)) return false;
  const marker = `/storage/v1/object/public/${encodeURIComponent(storageBucket)}/`;
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex < 0) return false;
  const key = publicUrl.slice(markerIndex + marker.length).split('/').map(decodeURIComponent).join('/');
  if (!key || key.includes('..')) return false;
  const response = await fetch(objectEndpoint(key), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${storageKey}`, apikey: storageKey },
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Object storage deletion failed (${response.status})`);
  }
  return true;
}
