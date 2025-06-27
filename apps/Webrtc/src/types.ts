import { WebSocket } from 'ws';

export interface JoinRoomMessage {
  type: 'join-room';
  payload: {
    roomId: string;
    userId: string;
  };
}

export interface UserJoinedMessage {
  type: 'user-joined';
  payload: {
    userId: string;
  };
}

export interface OfferMessage {
  type: 'offer';
  payload: {
    to: string;
    from: string;
    sdp: string;
  };
}

export interface AnswerMessage {
  type: 'answer';
  payload: {
    to: string;
    from: string;
    sdp: string;
  };
}

export interface IceCandidateMessage {
  type: 'ice-candidate';
  payload: {
    to: string;
    from: string;
    candidate: {
      candidate: string;
      sdpMid: string;
      sdpMLineIndex: number;
    };
  };
}

export interface PeerMessage {
  type: 'peer-message';
  payload: {
    type: 'offer' | 'answer' | 'ice-candidate';
    from: string;
    sdp?: string;
    candidate?: {
      candidate: string;
      sdpMid: string;
      sdpMLineIndex: number;
    };
  };
}

export interface UserLeftMessage {
  type: 'user-left';
  payload: {
    userId: string;
  };
}

export type WebSocketMessage = 
  | JoinRoomMessage
  | UserJoinedMessage
  | OfferMessage
  | AnswerMessage
  | IceCandidateMessage
  | PeerMessage
  | UserLeftMessage;

export interface User {
  id: string;
  ws: WebSocket;
  roomId?: string;
}

export interface Room {
  id: string;
  users: Map<string, User>;
  createdAt: Date;
}

export interface ServerMessage {
  type: string;
  payload: any;
  error?: string;
} 