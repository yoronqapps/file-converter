/**
 * Converts an image file to a target format using the Canvas API.
 * Works for: png, jpg, jpeg, webp, bmp <-> each other.
 * Returns a Blob in the target format.
 */
export async function convertImage(file, targetFormat) {
  const mimeMap = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    bmp: 'image/bmp',
  };

  const targetMime = mimeMap[targetFormat];
  if (!targetMime) {
    throw new Error(`Unsupported image target format: ${targetFormat}`);
  }

  // Load the file into an Image element
  const imageUrl = URL.createObjectURL(file);
  const img = await loadImage(imageUrl);
  URL.revokeObjectURL(imageUrl);

  // Draw it onto a canvas at full resolution
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');

  // JPG has no transparency — fill white behind it first,
  // otherwise transparent pixels turn black on export.
  if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  // Canvas can't export BMP natively — handle that separately
  if (targetFormat === 'bmp') {
    return canvasToBmp(canvas);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas export failed'));
      },
      targetMime,
      0.92 // quality, only affects jpg/webp
    );
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

// Minimal uncompressed BMP encoder — canvas.toBlob doesn't support 'image/bmp'
// in most browsers, so we build the BMP byte-by-byte from raw pixel data.
function canvasToBmp(canvas) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height).data;

  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BMP header
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4d); // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true); // pixel data offset

  // DIB header
  view.setUint32(14, 40, true); // header size
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true); // bits per pixel
  view.setUint32(34, pixelArraySize, true);

  // Pixel data — BMP stores rows bottom-to-top, BGR order
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      view.setUint8(offset++, imageData[i + 2]); // B
      view.setUint8(offset++, imageData[i + 1]); // G
      view.setUint8(offset++, imageData[i]);     // R
    }
    // pad row to multiple of 4 bytes
    while (offset % 4 !== 0 && offset < 54 + (y === 0 ? pixelArraySize : 0) + rowSize) {
      offset++;
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}