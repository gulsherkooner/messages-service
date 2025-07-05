import { Op } from 'sequelize';
import Sequelize from 'sequelize';
import { Message } from '../models/index.js';
// At the top
import cloudinary from '../config/cloudinary.js';

export const uploadMedia = async (req, res) => {
  try {
    const fileUrl = req.file.path; // Cloudinary-hosted URL
    const mediaType = req.file.mimetype.startsWith('image/')
      ? 'image'
      : req.file.mimetype.startsWith('video/')
      ? 'video'
      : 'audio';

    res.status(200).json({
      url: fileUrl,
      type: mediaType,
      public_id: req.file.filename,
    });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
};
export const addReaction = async (req, res) => {
  const { messageId } = req.params;
  const { emoji, userId } = req.body;

  console.log('📥 Reaction endpoint hit');
  console.log('➡️ Message ID:', messageId);
  console.log('➡️ Emoji:', emoji);
  console.log('➡️ User ID:', userId);

  try {
    const message = await Message.findByPk(messageId);
    if (!message) {
      console.log('❌ Message not found');
      return res.status(404).json({ error: 'Message not found' });
    }

    const currentReactions = message.reactions || {};
    console.log('📦 Current reactions:', currentReactions);

    if (!currentReactions[emoji]) {
      currentReactions[emoji] = [userId];
    } else if (!currentReactions[emoji].includes(userId)) {
      currentReactions[emoji].push(userId);
    } else {
      currentReactions[emoji] = currentReactions[emoji].filter(id => id !== userId);
      if (currentReactions[emoji].length === 0) {
        delete currentReactions[emoji];
      }
    }

    console.log('✅ Final reactions to save:', currentReactions);

    // ✅ Force Sequelize to detect change
    message.set({ reactions: currentReactions });
    message.changed('reactions', true); // 🔥 this is the key line
    await message.save();
    await message.reload();

    console.log('📦 Saved reactions:', message.reactions);

    res.status(200).json({ success: true, reactions: message.reactions });
  } catch (err) {
    console.error('🔥 Reaction update error:', err);
    res.status(500).json({ error: 'Failed to update reactions' });
  }
};

export const getConversation = async (req, res) => {
  const { userId } = req.params; // from auth middleware
  const { partnerId } = req.params;

  try {
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { sender: userId, receiver: partnerId },
          { sender: partnerId, receiver: userId },
        ]
      },
      order: [['timestamp', 'ASC']],
    });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
    console.log(err);
  }
};
export const markMessagesAsRead = async (req, res) => {
  const { fromId } = req.params;
  const { userId } = req.params;
  try {
    await Message.update(
      { status: 'read' },
      {
        where: {
          sender: fromId,
          receiver: userId,
          status: { [Op.not]: 'read' }
        }
      }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};
export const getUnreadCounts = async (req, res) => {
  const { userId } = req.params

  try {
    const result = await Message.findAll({
      attributes: [
        'sender',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        receiver: userId,
        status: { [Op.ne]: 'read' }
      },
      group: ['sender']
    });

    res.json(result); // [{ sender: '...', count: 2 }, ...]
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch unread counts' });
  }
};
export const getLastMessages = async (req, res) => {
  const { userId } = req.params;

  try {
    const messages = await Message.findAll({
      attributes: [
        [Sequelize.literal(`CASE WHEN sender = '${userId}' THEN receiver ELSE sender END`), 'contactId'],
        [Sequelize.fn('MAX', Sequelize.col('timestamp')), 'lastTimestamp']
      ],
      where: {
        [Op.or]: [
          { sender: userId },
          { receiver: userId }
        ]
      },
      group: ['contactId'],
      order: [[Sequelize.fn('MAX', Sequelize.col('timestamp')), 'DESC']]
    });

    // Fetch the actual last message text for each contact
    const results = await Promise.all(
      messages.map(async (entry) => {
        const contactId = entry.get('contactId');
        const lastMessage = await Message.findOne({
          where: {
            [Op.or]: [
              { sender: userId, receiver: contactId },
              { sender: contactId, receiver: userId }
            ]
          },
          order: [['timestamp', 'DESC']],
          limit: 1
        });

        return {
          contactId,
          lastMessage: lastMessage?.text || '',
          timestamp: lastMessage?.timestamp || ''
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error('Error fetching last messages:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;

  try {
    const deleted = await Message.destroy({
      where: { id: messageId },
    });

    if (deleted === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    return res.status(200).json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Error deleting message:', err);
    return res.status(500).json({ error: 'Failed to delete message' });
  }
};
