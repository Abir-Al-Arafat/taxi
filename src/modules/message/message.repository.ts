import { BaseRepository } from "../../repositories/base.repository";
import { MessageModel } from "./message.schema";
import type { IMessage } from "./message.types";

export class MessageRepository extends BaseRepository<IMessage> {
  constructor() {
    super(MessageModel);
  }

  async getConversation(
    userId1: string,
    userId2: string,
    limit: number = 50,
    skip: number = 0,
  ): Promise<IMessage[]> {
    return this.model
      .find({
        $or: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  async markMessagesAsRead(
    senderId: string,
    receiverId: string,
  ): Promise<void> {
    await this.model
      .updateMany(
        { senderId, receiverId, isRead: false },
        { $set: { isRead: true } },
      )
      .exec();
  }
}
