import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { RoomManager } from './roomManager';
import { MessageHandler } from './messageHandler';


const PORT = process.env.PORT || 8080;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';


const app = express();
const server = createServer(app);


app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());


const roomManager = new RoomManager();
const messageHandler = new MessageHandler(roomManager);


const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});


wss.on('connection', (ws: WebSocket, req) => {
  console.log(`New WebSocket connection from ${req.socket.remoteAddress}`);


  ws.on('message', (data: Buffer) => {
    messageHandler.handleMessage(ws, data.toString());
  });


  ws.on('close', (code, reason) => {
    console.log(`WebSocket connection closed: ${code} ${reason}`);
    messageHandler.handleDisconnection(ws);
  });


  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    messageHandler.handleDisconnection(ws);
  });


  ws.send(JSON.stringify({
    type: 'connected',
    payload: { message: 'Connected to WebRTC signaling server' }
  }));
});


app.get('/health', (req, res) => {
  const stats = roomManager.getRoomStats();
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    stats
  });
});

app.get('/rooms', (req, res) => {
  const stats = roomManager.getRoomStats();
  res.json(stats);
});

app.get('/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const roomInfo = roomManager.getRoomInfo(roomId);
  
  if (!roomInfo) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json(roomInfo);
});


app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express error:', error);
  res.status(500).json({ error: 'Internal server error' });
});


server.listen(PORT, () => {
  console.log(`🚀 WebRTC Signaling Server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws`);
});


process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, server, wss, roomManager };