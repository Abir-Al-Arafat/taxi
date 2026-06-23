import { MessageRepository } from "./message.repository";
import { SocketService } from "../../shared/services/socket.service";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import type { IMessage, SendMessageRequest } from "./message.types";

export class MessageService {
  private messageRepository: MessageRepository;

  constructor() {
    this.messageRepository = new MessageRepository();
  }

  async sendMessage(
    senderId: string,
    request: SendMessageRequest,
  ): Promise<IMessage> {
    if (senderId === request.receiverId) {
      throw new AppError(
        "Cannot send message to yourself",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const message = await this.messageRepository.create({
      senderId,
      receiverId: request.receiverId,
      rideId: request.rideId,
      content: request.content,
      isRead: false,
    });

    // Fire & Forget: Emit socket event to the receiver
    SocketService.sendToUser(request.receiverId, "newMessage", message);

    return message;
  }

  async getConversation(
    currentUserId: string,
    targetUserId: string,
    limit = 50,
    skip = 0,
  ): Promise<IMessage[]> {
    return this.messageRepository.getConversation(
      currentUserId,
      targetUserId,
      limit,
      skip,
    );
  }

  async markAsRead(currentUserId: string, senderId: string): Promise<void> {
    await this.messageRepository.markMessagesAsRead(senderId, currentUserId);
    SocketService.sendToUser(senderId, "messagesRead", {
      readerId: currentUserId,
    });
  }
}
