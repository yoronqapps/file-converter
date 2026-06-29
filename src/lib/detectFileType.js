import { fileTypeFromBuffer } from 'file-type';

// Formats file-type's magic-byte detection doesn't cover well —
// these are text-based, so we fall back to extension + content sniffing.
const TEXT_BASED_FALLBACKS = {
  csv: { mime: 'text/csv', ext: 'csv' },
  json: { mime: 'application/json', ext: 'json' },
  txt: { mime: 'text/plain', ext: 'txt' },
  svg: { mime: 'image/svg+xml', ext: 'svg' },
};

/**
 * Detects the real file type by reading magic bytes.
 * Falls back to extension-based + content sniffing for text formats
 * (which don't have reliable magic bytes).
 */
export async function detectFileType(file) {
  const buffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(buffer);

  // 1. Try magic-byte detection first (reliable for binary formats)
  const detected = await fileTypeFromBuffer(uint8);
  if (detected) {
    return {
      ext: detected.ext,
      mime: detected.mime,
      confidence: 'high',
      method: 'magic-bytes',
    };
  }

  // 2. Magic bytes found nothing — likely a text-based format.
  // Sniff the content itself rather than trusting the filename.
  const text = new TextDecoder().decode(uint8.slice(0, 1000));
  const trimmed = text.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(text.length < 1000 ? text : trimmed);
      return { ...TEXT_BASED_FALLBACKS.json, confidence: 'high', method: 'content-sniff' };
    } catch {
      // starts like JSON but isn't valid (truncated sample) — keep checking
    }
  }

  if (trimmed.startsWith('<svg') || trimmed.includes('<svg')) {
    return { ...TEXT_BASED_FALLBACKS.svg, confidence: 'high', method: 'content-sniff' };
  }

  // CSV heuristic: multiple lines, consistent comma counts
  const lines = trimmed.split('\n').slice(0, 5);
  if (lines.length > 1) {
    const commaCounts = lines.map(l => l.split(',').length);
    const consistent = commaCounts.every(c => c === commaCounts[0]) && commaCounts[0] > 1;
    if (consistent) {
      return { ...TEXT_BASED_FALLBACKS.csv, confidence: 'medium', method: 'content-sniff' };
    }
  }

  // 3. Last resort — fall back to the file extension, flagged as low confidence
  const extFromName = file.name.split('.').pop()?.toLowerCase();
  if (extFromName && TEXT_BASED_FALLBACKS[extFromName]) {
    return { ...TEXT_BASED_FALLBACKS[extFromName], confidence: 'low', method: 'extension-fallback' };
  }

  return {
    ext: extFromName || 'unknown',
    mime: file.type || 'application/octet-stream',
    confidence: 'low',
    method: 'extension-fallback',
  };
}

/**
 * Returns the list of formats a given detected type can convert TO.
 * This is the routing table — expand this as we add more converters.
 */
export function getAvailableConversions(ext) {
  const conversionMap = {
    // Images
    png: ['jpg', 'webp', 'bmp', 'pdf'],
    jpg: ['png', 'webp', 'bmp', 'pdf'],
    jpeg: ['png', 'webp', 'bmp', 'pdf'],
    webp: ['png', 'jpg', 'bmp', 'pdf'],
    bmp: ['png', 'jpg', 'webp', 'pdf'],
    gif: ['png', 'jpg', 'webp'],

    // PDF
    pdf: ['png', 'jpg', 'docx'],
    docx: ['pdf'],
    cfb: ['pdf'],
    txt: ['pdf'],
    xlsx: ['pdf'], 
    xls: ['pdf'],  
    pptx: ['pdf'], 
    ppt: ['pdf'],
    md: ['pdf'],

    // Data
    csv: ['json', 'xlsx'],
    json: ['csv'],
    xlsx: ['csv', 'json'],
  };

  return conversionMap[ext] || [];
}