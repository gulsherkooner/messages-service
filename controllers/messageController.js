import { Op } from 'sequelize';
import Sequelize from 'sequelize';
import { Message } from '../models/index.js';
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
