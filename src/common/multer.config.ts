import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

/**
 * Multer configuration for file uploads.
 * Files are stored under <project-root>/uploads/<folder>
 * and served later via app.useStaticAssets('/uploads', ...).
 */
export const multerOptions = (folder: string) => {
  return {
    storage: diskStorage({
      destination: (req, file, cb) => {
        // ✅ absolute path based on project root
        const uploadPath = join(process.cwd(), 'uploads', folder);

        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + extname(file.originalname));
      },
    }),
  };
};
