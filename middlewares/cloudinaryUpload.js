import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let resourceType = 'image'; // default

    if (file.mimetype.startsWith('video/')) resourceType = 'video';
    else if (file.mimetype.startsWith('audio/')) resourceType = 'video'; // Cloudinary treats audio as "video"

    return {
      folder: 'messenger_uploads',
      resource_type: resourceType,
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

const upload = multer({ storage });
export default upload;
