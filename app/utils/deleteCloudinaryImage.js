const cloudinary = require('../config/cloudinary');
const logger = require('./logger');

const deleteCloudinaryImage = async (url) => {
    try {
        if (!url.includes('cloudinary.com')) return;

        // Extract public_id from Cloudinary URL
        // Example URL: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/heritedge/artworks/file_name.png
        // Split by '/upload/' -> ['...', 'v1234567890/heritedge/artworks/file_name.png']
        const pathAfterUpload = url.split('/upload/')[1];
        if (!pathAfterUpload) return;

        // Split by '/' and remove the version tag (e.g. v1234567890)
        const parts = pathAfterUpload.split('/');
        const pathWithoutVersion = parts.slice(1).join('/');

        // Extract public ID without the extension
        const publicId = pathWithoutVersion.split('.')[0];

        await cloudinary.uploader.destroy(publicId);
        logger.info(`Deleted image from Cloudinary: ${publicId}`);
    } catch (err) {
        logger.error(`Failed to delete image from Cloudinary: ${url}`, { error: err.message });
    }
};

module.exports = deleteCloudinaryImage;
