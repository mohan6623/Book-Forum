/**
 * Cloudinary image transformation utilities
 * Optimizes images based on usage context (thumbnail, card, full-size)
 */

export type ImageSize = 'thumbnail' | 'card' | 'medium' | 'large' | 'original';

interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  dpr?: 'auto' | number; // Device Pixel Ratio
}

/**
 * Extracts the Cloudinary base URL and public ID from a full URL
 */
function parseCloudinaryUrl(url: string): { baseUrl: string; publicId: string } | null {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  // Example URL: https://res.cloudinary.com/bookforum/image/upload/v1234567890/abc123.jpg
  const regex = /^(https?:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/)(?:v\d+\/)?(.+)$/;
  const match = url.match(regex);

  if (match) {
    return {
      baseUrl: match[1], // https://res.cloudinary.com/bookforum/image/upload/
      publicId: match[2], // abc123.jpg or path/to/abc123.jpg
    };
  }

  return null;
}

/**
 * Builds Cloudinary transformation string
 */
function buildTransformation(options: TransformationOptions): string {
  const parts: string[] = [];

  if (options.width) parts.push(`w_${options.width}`);
  if (options.height) parts.push(`h_${options.height}`);
  if (options.crop) parts.push(`c_${options.crop}`);
  if (options.quality) parts.push(`q_${options.quality}`);
  if (options.format) parts.push(`f_${options.format}`);
  if (options.dpr) parts.push(`dpr_${options.dpr}`);

  return parts.join(',');
}

/**
 * Preset transformations for common use cases
 */
const PRESET_TRANSFORMATIONS: Record<ImageSize, TransformationOptions> = {
  // Small icon/avatar (e.g., user profile in comments)
  thumbnail: {
    width: 100,
    height: 100,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
    dpr: 'auto',
  },
  // Book card in grid view
  card: {
    width: 300,
    height: 400,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
    dpr: 'auto',
  },
  // Book details page sidebar
  medium: {
    width: 500,
    height: 700,
    crop: 'fit',
    quality: 'auto',
    format: 'auto',
    dpr: 'auto',
  },
  // Full-screen or high-res display
  large: {
    width: 1200,
    height: 1600,
    crop: 'fit',
    quality: 'auto',
    format: 'auto',
    dpr: 'auto',
  },
  // Original uploaded image (no transformation)
  original: {},
};

/**
 * Transforms a Cloudinary URL with specified size preset or custom options
 * 
 * @param url - Original Cloudinary URL
 * @param size - Preset size or custom transformation options
 * @returns Optimized Cloudinary URL with transformations
 * 
 * @example
 * // Using preset
 * transformCloudinaryImage(url, 'card')
 * 
 * // Using custom options
 * transformCloudinaryImage(url, { width: 150, height: 150, crop: 'thumb' })
 */
export function transformCloudinaryImage(
  url: string,
  size: ImageSize | TransformationOptions = 'original'
): string {
  // Return as-is if not a Cloudinary URL or empty
  if (!url) return url;

  const parsed = parseCloudinaryUrl(url);
  if (!parsed) {
    // Not a Cloudinary URL, return original (might be external URL or placeholder)
    return url;
  }

  const { baseUrl, publicId } = parsed;

  // Get transformation options
  const options: TransformationOptions =
    typeof size === 'string' ? PRESET_TRANSFORMATIONS[size] : size;

  // If no transformations, return original
  if (Object.keys(options).length === 0) {
    return url;
  }

  // Build transformation string
  const transformation = buildTransformation(options);

  // Construct new URL with transformations
  // Format: https://res.cloudinary.com/bookforum/image/upload/w_300,h_400,c_fill,q_auto,f_auto/publicId.jpg
  return `${baseUrl}${transformation}/${publicId}`;
}

/**
 * Helper to get optimized image URL for book cards
 */
export function getBookCardImage(url: string): string {
  return transformCloudinaryImage(url, 'card');
}

/**
 * Helper to get optimized image URL for book details page
 */
export function getBookDetailImage(url: string): string {
  return transformCloudinaryImage(url, 'medium');
}

/**
 * Helper to get optimized thumbnail
 */
export function getThumbnailImage(url: string): string {
  return transformCloudinaryImage(url, 'thumbnail');
}

/**
 * Helper for user profile pictures in comments/avatars
 * Optimized for 100x100 display with better compression
 */
export function getUserAvatarImage(url: string): string {
  return transformCloudinaryImage(url, {
    width: 100,
    height: 100,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
    dpr: 'auto',
  });
}

/**
 * Generate responsive srcset for <img> elements
 * Returns multiple sizes for different screen densities
 */
export function generateResponsiveSrcSet(url: string, baseWidth: number): string {
  if (!url || !parseCloudinaryUrl(url)) return '';

  const sizes = [1, 1.5, 2]; // 1x, 1.5x, 2x density
  const srcset = sizes
    .map((dpr) => {
      const transformed = transformCloudinaryImage(url, {
        width: Math.round(baseWidth * dpr),
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
      });
      return `${transformed} ${dpr}x`;
    })
    .join(', ');

  return srcset;
}
