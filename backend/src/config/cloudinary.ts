import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';

/**
 * Configures Cloudinary with credentials from environment variables.
 */
export const configureCloudinary = (): void => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    logger.warn('Cloudinary credentials not fully configured. File uploads may not work.');
    return;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  logger.info('Cloudinary configured successfully');
};

export { cloudinary };
