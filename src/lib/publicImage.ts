import fs from 'fs';
import path from 'path';
import { imageSize } from 'image-size';

export interface ImageSize {
  width: number;
  height: number;
}

/**
 * Pixel size of an image under public/, given the address the site serves it at
 * ("/figures/photo.jpg"), as it is displayed: a photo that carries a rotation in its
 * metadata is measured after turning. Undefined for an address elsewhere, a missing
 * file, or a format that cannot be read.
 */
export function readPublicImageSize(urlPath: string): ImageSize | undefined {
  if (!urlPath.startsWith('/')) return undefined;

  try {
    const file = path.join(process.cwd(), 'public', decodeURI(urlPath));
    const { width, height, orientation } = imageSize(fs.readFileSync(file));
    if (!width || !height) return undefined;

    // EXIF orientations 5 to 8 are quarter turns: the picture is shown on its side.
    const turned = orientation !== undefined && orientation >= 5;
    return turned ? { width: height, height: width } : { width, height };
  } catch {
    return undefined;
  }
}
