import sequelize from '../config/db.js';
import Message from './Message.js';

const syncDatabase = async () => {
  await sequelize.authenticate();
  await sequelize.sync();
};

export { sequelize, Message, syncDatabase };
