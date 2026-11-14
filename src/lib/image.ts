'use client';
// 휴대폰 사진을 올리기 전에 브라우저에서 줄인다 (전송량·저장량을 작게, 회전 정보 반영)

async function load(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // HEIC 등 일부 형식은 아래 방법으로 다시 시도
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * @param square true면 가운데를 정사각으로 잘라 size×size (프로필 사진)
 *               false면 긴 변을 size로 맞춤 (명함)
 */
export async function shrinkImage(file: File, size: number, square: boolean, quality = 0.85): Promise<string> {
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) throw new Error('사진 파일을 골라 주세요.');
  let img: ImageBitmap | HTMLImageElement;
  try {
    img = await load(file);
  } catch {
    throw new Error('이 사진은 열 수 없어요. 다른 사진을 골라 주세요.');
  }
  const w = img.width;
  const h = img.height;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('사진을 처리하지 못했어요.');
  if (square) {
    const side = Math.min(w, h);
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
  } else {
    const scale = Math.min(1, size / Math.max(w, h));
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  if ('close' in img) img.close();
  return canvas.toDataURL('image/jpeg', quality);
}
