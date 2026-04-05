/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } }) // Allows React Native to connect!
export class MatchGateway {
  @WebSocketServer()
  server!: Server;

  // 1. User joins a specific match room
  @SubscribeMessage('joinMatch')
  handleJoinMatch(@MessageBody() data: { matchId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.matchId);
    console.log(`Client ${client.id} joined match room: ${data.matchId}`);
  }

  // 2. User leaves the match room
  @SubscribeMessage('leaveMatch')
  handleLeaveMatch(@MessageBody() data: { matchId: string }, @ConnectedSocket() client: Socket) {
    client.leave(data.matchId);
    console.log(`Client ${client.id} left match room: ${data.matchId}`);
  }

  // 3. User sends a message -> Broadcast to everyone in that room
  @SubscribeMessage('sendMessage')
  handleMessage(@MessageBody() payload: any) {
    const { matchId, ...messageData } = payload;
    
    // Broadcast back to EVERYONE in the room (including the sender so it updates their UI)
    this.server.to(matchId).emit('newMessage', {
      id: Math.random().toString(), // Temporary ID until we save to Prisma
      ...messageData,
    });
  }

  // 🚀 NEW: The Service will call this when a goal happens!
  broadcastScoreUpdate(matchId: string, matchData: any) {
    this.server.to(matchId).emit('scoreUpdate', matchData);
  }
}