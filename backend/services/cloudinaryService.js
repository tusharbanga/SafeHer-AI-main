const cloudinary = require("../config/cloudinary");
const ApiError = require("../utils/ApiError");

/**
 * Uploads a file buffer (from multer memoryStorage) to Cloudinary
 * inside the given folder and returns { url, publicId }.
 */
const uploadBufferToCloudinary = (buffer, folder, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `future-safe-her/${folder}`, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(new ApiError(502, `Cloudinary upload failed: ${error.message}`));
        resolve({ url: result.secure_url, publicId: result.public_id, duration: result.duration || 0 });
      }
    );
    stream.end(buffer);
  });
};

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = { uploadBufferToCloudinary, deleteFromCloudinary };
