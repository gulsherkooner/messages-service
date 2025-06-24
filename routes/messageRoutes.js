import express from 'express';
import {
  getConversation,
  getUnreadCounts,
  markMessagesAsRead,
  getLastMessages,
  uploadMedia,
} from '../controllers/messageController.js';
import upload from '../middlewares/cloudinaryUpload.js';

const router = express.Router();

// 🔄 Upload to Cloudinary (supports image, video, audio)
router.post('/upload-media', upload.single('file'), uploadMedia);

// 📨 Messaging routes
router.get('/conversation/:partnerId/:userId', getConversation);
router.get('/unread-counts/:userId', getUnreadCounts);
router.get('/last-messages/:userId', getLastMessages);
router.put('/mark-read/:fromId/:userId', markMessagesAsRead);

export default router;
