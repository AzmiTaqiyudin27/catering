const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

/**
 * Check if Supabase Storage credentials are provided
 */
const isSupabaseConfigured = () => {
  return Boolean(
    process.env.SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
  );
};

let supabaseClient = null;

/**
 * Get or initialize the Supabase client
 */
const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL.trim();
    const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY).trim();
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  return supabaseClient;
};

const getBucketName = () => {
  return process.env.SUPABASE_BUCKET || 'catering';
};

/**
 * Upload a file buffer to Supabase Storage
 * @param {Buffer} buffer - File buffer
 * @param {string} originalname - Original file name
 * @param {string} mimetype - File MIME type
 * @param {string} folder - Target folder inside the bucket (e.g., 'menus', 'employees', 'avatars')
 * @returns {Promise<string>} Public URL of the uploaded file
 */
const uploadToSupabase = async (buffer, originalname, mimetype, folder = 'general') => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.');
  }

  const bucket = getBucketName();
  const fileExt = path.extname(originalname);
  const randomSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const fileName = `${randomSuffix}${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: mimetype,
      upsert: true,
    });

  if (error) {
    throw new Error(`Gagal upload ke Supabase Storage: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};

/**
 * Delete a file either from Supabase Storage or from local filesystem
 * @param {string} pathOrUrl - File URL or local path
 */
const deleteFromStorage = async (pathOrUrl) => {
  if (!pathOrUrl) return;

  // Case 1: Supabase Storage public URL
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const bucket = getBucketName();
      // Supabase public URL format:
      // https://<project>.supabase.co/storage/v1/object/public/<bucket>/<filePath>
      const marker = `/storage/v1/object/public/${bucket}/`;
      const markerIndex = pathOrUrl.indexOf(marker);

      if (markerIndex !== -1) {
        const filePath = pathOrUrl.substring(markerIndex + marker.length);
        await supabase.storage.from(bucket).remove([filePath]);
      }
    } catch (err) {
      console.warn('Gagal menghapus file dari Supabase Storage:', err.message);
    }
    return;
  }

  // Case 2: Local filesystem upload path
  try {
    const cleanPath = pathOrUrl.replace(/^\/?uploads\//, '');
    const localFilePath = path.join(__dirname, '../../uploads', cleanPath);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
  } catch (err) {
    console.warn('Gagal menghapus file lokal:', err.message);
  }
};

module.exports = {
  isSupabaseConfigured,
  getSupabaseClient,
  uploadToSupabase,
  deleteFromStorage,
  getBucketName,
};
