import { WebSocket } from 'ws';
import { RoomManager } from './roomManager';
import { 
  WebSocketMessage, 
  JoinRoomMessage, 
  OfferMessage, 
  AnswerMessage, 
  IceCandidateMessage,
  PeerMessage 
} from './types';

export class MessageHandler {
  constructor(private roomManager: RoomManager) {}

  handleMessage(ws: WebSocket, data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      console.log(`Received message type: ${message.type}`);

      switch (message.type) {
        case 'join-room':
          this.handleJoinRoom(ws, message);
          break;
        case 'offer':
          this.handleOffer(message);
          break;
        case 'answer':
          this.handleAnswer(message);
          break;
        case 'ice-candidate':
          this.handleIceCandidate(message);
          break;
        case 'peer-message':
          this.handlePeerMessage(message);
          break;
        default:
          console.warn(`Unknown message type: ${(message as any).type}`);
          this.sendError(ws, `Unknown message type: ${(message as any).type}`);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      this.sendError(ws, 'Invalid message format');
    }
  }

  private handleJoinRoom(ws: WebSocket, message: JoinRoomMessage): void {
    const { roomId, userId } = message.payload;

    if (!roomId || !userId) {
      this.sendError(ws, 'Missing roomId or userId');
      return;
    }

    const success = this.roomManager.joinRoom(roomId, userId, ws);
    
    if (success) {
      ws.send(JSON.stringify({
        type: 'room-joined',
        payload: {
          roomId,
          userId,
          users: this.roomManager.getRoomUsers(roomId)
        }
      }));
    } else {
      this.sendError(ws, 'Failed to join room');
    }
  }

  private handleOffer(message: OfferMessage): void {
    const { to, from, sdp } = message.payload;

    if (!to || !from || !sdp) {
      console.error('Invalid offer message: missing required fields');
      return;
    }

    const success = this.roomManager.sendToUser(to, {
      type: 'offer',
      payload: { to, from, sdp }
    });

    if (!success) {
      console.error(`Failed to send offer from ${from} to ${to}`);
      this.roomManager.sendToUser(from, {
        type: 'error',
        payload: { message: `Failed to send offer to ${to}` }
      });
    }
  }

  private handleAnswer(message: AnswerMessage): void {
    const { to, from, sdp } = message.payload;

    if (!to || !from || !sdp) {
      console.error('Invalid answer message: missing required fields');
      return;
    }

    const success = this.roomManager.sendToUser(to, {
      type: 'answer',
      payload: { to, from, sdp }
    });

    if (!success) {
      console.error(`Failed to send answer from ${from} to ${to}`);
      this.roomManager.sendToUser(from, {
        type: 'error',
        payload: { message: `Failed to send answer to ${to}` }
      });
    }
  }

  private handleIceCandidate(message: IceCandidateMessage): void {
    const { to, from, candidate } = message.payload;

    if (!to || !from || !candidate) {
      console.error('Invalid ice-candidate message: missing required fields');
      return;
    }

    const success = this.roomManager.sendToUser(to, {
      type: 'ice-candidate',
      payload: { to, from, candidate }
    });

    if (!success) {
      console.error(`Failed to send ICE candidate from ${from} to ${to}`);
    }
  }

  private handlePeerMessage(message: PeerMessage): void {
    const { type, from } = message.payload;

    if (!type || !from) {
      console.error('Invalid peer-message: missing required fields');
      return;
    }

    const user = Array.from(this.roomManager['users'].values()).find(u => u.id === from);
    
    if (!user || !user.roomId) {
      console.error(`User ${from} not found or not in a room`);
      return;
    }

    this.roomManager.broadcastToRoom(user.roomId, {
      type: 'peer-message',
      payload: message.payload
    }, from);
  }

  private sendError(ws: WebSocket, errorMessage: string): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        error: errorMessage
      }));
    }
  }

  handleDisconnection(ws: WebSocket): void {
    this.roomManager.cleanupUser(ws);
  }
} 