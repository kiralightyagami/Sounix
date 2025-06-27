import { WebSocket } from 'ws';
import { Room, User, ServerMessage } from './types';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private users: Map<string, User> = new Map();

  createRoom(roomId: string): Room {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId)!;
    }

    const room: Room = {
      id: roomId,
      users: new Map(),
      createdAt: new Date(),
    };

    this.rooms.set(roomId, room);
    console.log(`Room created: ${roomId}`);
    return room;
  }

  joinRoom(roomId: string, userId: string, ws: WebSocket): boolean {
    try {
     
      if (this.users.has(userId)) {
        const existingUser = this.users.get(userId)!;
        if (existingUser.roomId === roomId) {
          console.log(`User ${userId} is already in room ${roomId}`);
          return false;
        }
        
        this.leaveRoom(userId);
      }

    
      const room = this.createRoom(roomId);
      
      
      const user: User = {
        id: userId,
        ws,
        roomId,
      };

      
      room.users.set(userId, user);
      this.users.set(userId, user);

      console.log(`User ${userId} joined room ${roomId}`);
      
      
      this.broadcastToRoom(roomId, {
        type: 'user-joined',
        payload: { userId },
      }, userId);

      return true;
    } catch (error) {
      console.error(`Error joining room: ${error}`);
      return false;
    }
  }

  leaveRoom(userId: string): boolean {
    try {
      const user = this.users.get(userId);
      if (!user || !user.roomId) {
        return false;
      }

      const room = this.rooms.get(user.roomId);
      if (room) {
        room.users.delete(userId);
        
        if (room.users.size > 0) {
          
          this.broadcastToRoom(user.roomId, {
            type: 'user-left',
            payload: { userId },
          }, userId);
        }           
        this.broadcastToRoom(user.roomId, {
          type: 'user-left',
          payload: { userId },
        }, userId);

        
        if (room.users.size === 0) {
          this.rooms.delete(user.roomId);
          console.log(`Room ${user.roomId} deleted (empty)`);
        }
      }

      this.users.delete(userId);
      console.log(`User ${userId} left room ${user.roomId}`);
      return true;
    } catch (error) {
      console.error(`Error leaving room: ${error}`);
      return false;
    }
  }

  sendToUser(userId: string, message: ServerMessage): boolean {
    try {
      const user = this.users.get(userId);
      if (!user || user.ws.readyState !== WebSocket.OPEN) {
        return false;
      }

      user.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Error sending message to user ${userId}: ${error}`);
      return false;
    }
  }

  broadcastToRoom(roomId: string, message: ServerMessage, excludeUserId?: string): void {
    try {
      const room = this.rooms.get(roomId);
      if (!room) {
        return;
      }

      room.users.forEach((user, userId) => {
        if (excludeUserId && userId === excludeUserId) {
          return;
        }

        if (user.ws.readyState === WebSocket.OPEN) {
          user.ws.send(JSON.stringify(message));
        }
      });
    } catch (error) {
      console.error(`Error broadcasting to room ${roomId}: ${error}`);
    }
  }

  getRoomUsers(roomId: string): string[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.users.keys()) : [];
  }

  getUserByWebSocket(ws: WebSocket): User | undefined {
    for (const user of this.users.values()) {
      if (user.ws === ws) {
        return user;
      }
    }
    return undefined;
  }

  cleanupUser(ws: WebSocket): void {
    const user = this.getUserByWebSocket(ws);
    if (user) {
      this.leaveRoom(user.id);
    }
  }

  getRoomStats(): { totalRooms: number; totalUsers: number } {
    return {
      totalRooms: this.rooms.size,
      totalUsers: this.users.size,
    };
  }

  getRoomInfo(roomId: string): { users: string[]; createdAt?: Date } | null {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    return {
      users: Array.from(room.users.keys()),
      createdAt: room.createdAt,
    };
  }
} 