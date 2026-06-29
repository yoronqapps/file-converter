import { convertImage } from './imageConverter';
import { convertPdfToImage, convertImageToPdf } from './pdfConverter';
import { convertData } from './dataConverter';
import { convertViaBackend } from './backendConverter';

const IMAGE_FORMATS = new Set(['png', 'jpg', 'jpeg', 'webp', 'bmp']);
const DATA_FORMATS = new Set(['csv', 'json', 'xlsx']);

export async function convertFile(file, sourceExt, targetFormat) {
  if (IMAGE_FORMATS.has(sourceExt) && IMAGE_FORMATS.has(targetFormat)) {
    return convertImage(file, targetFormat);
  }

  if (sourceExt === 'pdf' && IMAGE_FORMATS.has(targetFormat)) {
    return convertPdfToImage(file, targetFormat);
  }

  if (IMAGE_FORMATS.has(sourceExt) && targetFormat === 'pdf') {
    return convertImageToPdf(file);
  }

  if (DATA_FORMATS.has(sourceExt) && DATA_FORMATS.has(targetFormat)) {
    return convertData(file, sourceExt, targetFormat);
  }

  // DOCX <-> PDF go through the Railway backend
  if (
    (sourceExt === 'docx' && targetFormat === 'pdf') ||
    (sourceExt === 'cfb' && targetFormat === 'pdf') ||
    (sourceExt === 'txt' && targetFormat === 'pdf') ||
    (sourceExt === 'xlsx' && targetFormat === 'pdf') ||
    (sourceExt === 'xls' && targetFormat === 'pdf') ||  
    (sourceExt === 'pptx' && targetFormat === 'pdf') || 
    (sourceExt === 'ppt' && targetFormat === 'pdf') ||
    (sourceExt === 'pdf' && targetFormat === 'docx')
  ) {
    return convertViaBackend(file, targetFormat);
  }

  throw new Error(`No converter available yet for ${sourceExt} -> ${targetFormat}`);
}