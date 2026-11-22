export const maxPhotoBytes = 5 * 1024 * 1024;
const maxPhotoPixels = 24_000_000;

export async function validateReportPhoto(file: File, url: string): Promise<string | null> {
  const view = new DataView(await file.arrayBuffer());
  if (view.byteLength < 12) return 'Selecciona una imagen JPEG, PNG o WebP válida.';

  const jpeg = view.getUint16(0) === 0xffd8 && view.getUint8(2) === 0xff;
  const png = view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a;
  const webp = view.getUint32(0) === 0x52494646 && view.getUint32(8) === 0x57454250;
  if (!jpeg && !png && !webp) return 'Selecciona una imagen JPEG, PNG o WebP válida.';

  if (webp && view.byteLength > 20 && view.getUint32(12) === 0x56503858 && (view.getUint8(20) & 2)) {
    return 'Selecciona una fotografía estática.';
  }
  if (png) {
    for (let chunk = 8; chunk + 12 <= view.byteLength; chunk += 12 + view.getUint32(chunk)) {
      const type = view.getUint32(chunk + 4);
      if (type === 0x6163544c) return 'Selecciona una fotografía estática.';
      if (type === 0x49444154) break;
    }
  }

  const image = new Image();
  image.src = url;
  try {
    await image.decode();
  } catch {
    return 'No se pudo abrir la imagen seleccionada.';
  }
  return image.naturalWidth * image.naturalHeight > maxPhotoPixels
    ? 'La fotografía no puede superar los 24 millones de píxeles.'
    : null;
}
