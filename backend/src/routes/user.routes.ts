import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { updateProfileValidator } from '../validators/auth.validators';
import multer from 'multer';
import path from 'path';

// Configure multer for temporary avatar storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const isValid =
      allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
      allowedTypes.test(file.mimetype);
    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  },
});

const router = Router();

// All routes require authentication
router.use(authenticate);

// Profile routes (any authenticated user)
router.get('/profile', getProfile);
router.patch('/profile', validate(updateProfileValidator), updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/avatar', deleteAvatar);

// User directory routes (any authenticated user can search/list team members)
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.patch('/:id/role', authorize('admin'), updateUserRole);
router.patch('/:id/status', authorize('admin'), toggleUserStatus);

export default router;
