const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export async function convertViaBackend(file, targetFormat) {
  const form = new FormData();
  form.append('file', file);
  form.append('target', targetFormat);

  const response = await fetch(`${BACKEND_URL}/convert`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `Conversion failed (${response.status})`);
  }

  return response.blob();
}