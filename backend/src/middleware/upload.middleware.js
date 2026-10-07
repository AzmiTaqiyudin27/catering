const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isSupabaseConfigured, uploadToSupabase } = require('../services/storage.service');

// Ensure local upload directory exists if using disk storage
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper to determine destination folder
const resolveUploadFolder = (req) => {
  const urlPath = (req.baseUrl || req.originalUrl || '').toLowerCase();
  if (urlPath.includes('menus')) {
    return 'menus';
  } else if (urlPath.includes('employees')) {
    return 'employees';
  } else if (urlPath.includes('users') || urlPath.includes('auth')) {
    return 'avatars';
  }
  return 'general';
};

// Local Disk Storage
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = resolveUploadFolder(req);
    const uploadPath = path.join(uploadDir, folder);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Memory Storage (for Supabase Cloud Uploads)
const memoryStorage = multer.memoryStorage();

// File filter validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipe file tidak diizinkan. Hanya JPEG, PNG, GIF, dan WebP yang diperbolehkan.'), false);
  }
};

const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;

// Underlying Multer instances
const diskMulter = multer({
  storage: diskStorage,
  fileFilter,
  limits: { fileSize: maxFileSize },
});

const memoryMulter = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: maxFileSize },
});

/**
 * Universal upload middleware wrapping Multer.
 * Transparently uploads to Supabase Storage if configured;
 * otherwise saves to local disk in ./uploads.
 */
const upload = {
  single: (fieldName) => {
    return (req, res, next) => {
      const activeMulter = isSupabaseConfigured() ? memoryMulter : diskMulter;
      const multerHandler = activeMulter.single(fieldName);

      multerHandler(req, res, async (err) => {
        if (err) return next(err);
        if (!req.file) return next();

        if (isSupabaseConfigured() && req.file.buffer) {
          try {
            const folder = resolveUploadFolder(req);
            const publicUrl = await uploadToSupabase(
              req.file.buffer,
              req.file.originalname,
              req.file.mimetype,
              folder
            );
            req.file.publicUrl = publicUrl;
            req.file.filename = publicUrl; // For maximum backwards compatibility
          } catch (uploadError) {
            console.error('Supabase upload error:', uploadError);
            return res.status(500).json({
              success: false,
              message: 'Gagal mengunggah file ke Cloud Storage',
              error: uploadError.message,
            });
          }
        }

        next();
      });
    };
  },
  array: (fieldName, maxCount) => {
    return (req, res, next) => {
      const activeMulter = isSupabaseConfigured() ? memoryMulter : diskMulter;
      return activeMulter.array(fieldName, maxCount)(req, res, next);
    };
  },
  fields: (fields) => {
    return (req, res, next) => {
      const activeMulter = isSupabaseConfigured() ? memoryMulter : diskMulter;
      return activeMulter.fields(fields)(req, res, next);
    };
  },
};

module.exports = upload;
