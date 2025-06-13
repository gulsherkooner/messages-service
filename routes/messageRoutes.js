import express from 'express';
import { getConversation } from '../controllers/messageController.js';
import { getUnreadCounts } from '../controllers/messageController.js';
import { markMessagesAsRead } from '../controllers/messageController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // or configure cloud storage later

router.post(
  '/upload-image',
  upload.single('image'), // still works for both image/video
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Determine extension
      const ext = path.extname(req.file.originalname);
      const oldPath = req.file.path;
      const newFilename = req.file.filename + ext;
      const newPath = path.join(req.file.destination, newFilename);

      // Rename file with extension
      fs.renameSync(oldPath, newPath);

      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${newFilename}`;

      res.json({ url: fileUrl });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

const audioUpload = multer({ dest: 'uploads/' });

router.post('/upload-audio', audioUpload.single('audio'), async (req, res) => {
  try {
    const ext = '.webm';
    const oldPath = req.file.path;
    const newPath = `${req.file.path}${ext}`;

    fs.renameSync(oldPath, newPath);

    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}${ext}`;
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: 'Audio upload failed' });
  }
});

router.get('/conversation/:partnerId/:userId', getConversation);
router.get('/unread-counts/:userId', getUnreadCounts);
router.put('/mark-read/:fromId/:userId', markMessagesAsRead);

export default router;
