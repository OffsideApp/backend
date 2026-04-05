/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } }) // Allows React Native to connect!
export class MatchGateway {
  @WebSocketServer()
  server!: Server;

  private matchMessages: Record<string, any[]> = {}

  // 1. User joins a specific match room
  @SubscribeMessage('joinMatch')
  handleJoinMatch(@MessageBody() data: { matchId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.matchId);

    const history = this.matchMessages[data.matchId] || []
    client.emit('chatHistory', history)
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
    const message = {
      id: Math.random().toString(), 
      ...messageData,
    };

    // Initialize the memory array for this match if it's the first message
    if (!this.matchMessages[matchId]) {
      this.matchMessages[matchId] = [];
    }

    // Add new message to the top of the history list
    this.matchMessages[matchId].unshift(message);

    // Only keep the last 50 messages to prevent server RAM from overloading
    if (this.matchMessages[matchId].length > 50) {
      this.matchMessages[matchId].pop();
    }

    // Broadcast the single new message to everyone
    this.server.to(matchId).emit('newMessage', message);
  }

  broadcastScoreUpdate(matchId: string, matchData: any) {
    this.server.to(matchId).emit('scoreUpdate', matchData);
  }
}