export async function uploadImage(file: File, pressReleaseId: number) {
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch(`/api/press-releases/${pressReleaseId}`, {
    method: 'POST',
    body: fd,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data: { id: number; url: string } = await res.json();
  return data;
}