const multer = require("multer");
const path = require("path");

// Files are held in memory briefly before being streamed to Cloudinary.
const storage = multer.memoryStorage();

const IMAGE_TYPES = [".jpg", ".jpeg", ".png", ".webp"];
const AUDIO_TYPES = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".webm"];
const VIDEO_TYPES = [".mp4", ".mov", ".webm", ".mkv"];

const fileFilter = (allowedExtensions) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    return cb(null, true);
  }
  cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", `Unsupported file type: ${ext}`));
};

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter(IMAGE_TYPES),
});

const uploadAudio = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: fileFilter(AUDIO_TYPES),
});

const uploadEvidence = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: fileFilter([...IMAGE_TYPES, ...AUDIO_TYPES, ...VIDEO_TYPES]),
});

module.exports = { uploadImage, uploadAudio, uploadEvidence };
