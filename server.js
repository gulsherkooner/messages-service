import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocket } from './sockets/index.js';
import messageRoutes from './routes/messageRoutes.js';
import { syncDatabase } from './models/index.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
setupSocket(server);

app.use(cors());
app.use(express.json());

app.use('/', messageRoutes);
app.use('/uploads', express.static('uploads'));
const PORT = process.env.PORT || 5000;

syncDatabase().then(() => {
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
