import express from 'express';
import {
  getConversation,
  getUnreadCounts,
  markMessagesAsRead,
  getLastMessages,
  uploadMedia,
} from '../controllers/messageController.js';
import upload from '../middlewares/cloudinaryUpload.js';
import { addReaction } from '../controllers/messageController.js';
import { deleteMessage } from '../controllers/messageController.js';

const router = express.Router();

router.post('/:messageId/react', addReaction);

router.delete('/:messageId', deleteMessage);

// 🔄 Upload to Cloudinary (supports image, video, audio)
router.post('/upload-media', upload.single('file'), (req, res, next) => {
  if (!req.file) {
    console.warn('⚠️ No file received by Cloudinary middleware');
  } else {
    console.log('✅ File received:', req.file.originalname);
  }
  next();
}, uploadMedia);

// 📨 Messaging routes
router.get('/conversation/:partnerId/:userId', getConversation);
router.get('/unread-counts/:userId', getUnreadCounts);
router.get('/last-messages/:userId', getLastMessages);
router.put('/mark-read/:fromId/:userId', markMessagesAsRead);

export default router;
