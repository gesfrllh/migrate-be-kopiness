import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getPusher } from '../../lib/pusher';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { TypingDto } from './dto/typing.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  private chatChannel(chatId: string) {
    return `private-chat-${chatId}`;
  }

  private async assertMember(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { customerId: true, store: { select: { ownerId: true } } },
    });
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.customerId !== userId && chat.store.ownerId !== userId) {
      throw new ForbiddenException('Not your chat');
    }
  }

  async authorizeChannel(chatId: string, userId: string, socketId: string) {
    if (!socketId) throw new BadRequestException('socket_id is required');
    await this.assertMember(chatId, userId);
    const pusher = getPusher();
    if (!pusher) throw new BadRequestException('Realtime chat is not configured');
    return pusher.authorizeChannel(socketId, this.chatChannel(chatId), { user_id: userId });
  }

  async createChat(userId: string, dto: CreateChatDto) {
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
      select: { id: true, ownerId: true, name: true },
    });
    if (!store) throw new NotFoundException('Store not found');
    if (store.ownerId === userId) throw new BadRequestException('Cannot chat with your own store');

    const existing = await this.prisma.chat.findUnique({
      where: { customerId_storeId: { customerId: userId, storeId: dto.storeId } },
    });
    if (existing) return this.getChatDetail(existing.id, userId);

    const chat = await this.prisma.chat.create({
      data: { customerId: userId, storeId: dto.storeId },
      include: {
        customer: { select: { id: true, name: true } },
        store: { select: { id: true, name: true, logoUrl: true, ownerId: true } },
      },
    });

    return {
      id: chat.id,
      storeId: chat.storeId,
      storeName: chat.store.name,
      storeLogo: chat.store.logoUrl,
      customerId: chat.customerId,
      customerName: chat.customer.name,
      messages: [],
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    };
  }

  async listChats(userId: string, role: UserRole) {
    const where = role === UserRole.STOREOWNER
      ? { store: { ownerId: userId } }
      : { customerId: userId };

    const chats = await this.prisma.chat.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        store: { select: { id: true, name: true, logoUrl: true, ownerId: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, name: true, role: true } },
            replyTo: { select: { id: true, content: true, senderId: true } },
          },
        },
        _count: {
          select: { messages: { where: { readAt: null, senderId: { not: userId } } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return chats.map((chat) => ({
      id: chat.id,
      storeId: chat.storeId,
      storeName: chat.store.name,
      storeLogo: chat.store.logoUrl,
      customerId: chat.customerId,
      customerName: chat.customer.name,
      lastMessage: chat.messages[0]
        ? {
            id: chat.messages[0].id,
            chatId: chat.messages[0].chatId,
            senderId: chat.messages[0].senderId,
            sender: chat.messages[0].sender,
            content: chat.messages[0].content,
            replyTo: chat.messages[0].replyTo
              ? { id: chat.messages[0].replyTo.id, content: chat.messages[0].replyTo.content, senderId: chat.messages[0].replyTo.senderId }
              : undefined,
            readAt: chat.messages[0].readAt?.toISOString() ?? null,
            createdAt: chat.messages[0].createdAt.toISOString(),
          }
        : undefined,
      unreadCount: chat._count.messages,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    }));
  }

  async getChatDetail(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        customer: { select: { id: true, name: true } },
        store: { select: { id: true, name: true, logoUrl: true, ownerId: true } },
      },
    });
    if (!chat) throw new NotFoundException('Chat not found');

    const isStoreOwner = chat.store.ownerId === userId;
    if (chat.customerId !== userId && !isStoreOwner) {
      throw new ForbiddenException('Not your chat');
    }

    const messages = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        replyTo: { select: { id: true, content: true, senderId: true } },
      },
    });

    return {
      id: chat.id,
      storeId: chat.storeId,
      storeName: chat.store.name,
      storeLogo: chat.store.logoUrl,
      customerId: chat.customerId,
      customerName: chat.customer.name,
      messages: messages.map((m) => ({
        id: m.id,
        chatId: m.chatId,
        senderId: m.senderId,
        sender: m.sender,
        content: m.content,
        replyTo: m.replyTo
          ? { id: m.replyTo.id, content: m.replyTo.content, senderId: m.replyTo.senderId }
          : undefined,
        readAt: m.readAt?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
      })),
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    };
  }

  async sendMessage(chatId: string, userId: string, dto: SendMessageDto) {
    const [chat, user] = await Promise.all([
      this.prisma.chat.findUnique({
        where: { id: chatId },
        select: { customerId: true, store: { select: { ownerId: true } } },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, role: true },
      }),
    ]);
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.customerId !== userId && chat.store.ownerId !== userId) {
      throw new ForbiddenException('Not your chat');
    }

    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content: dto.content,
        replyToId: dto.replyToId ?? null,
      },
      select: { id: true, createdAt: true },
    });

    let replyTo: { id: string; content: string; senderId: string } | undefined;
    if (dto.replyToId) {
      replyTo = await this.prisma.message.findUnique({
        where: { id: dto.replyToId },
        select: { id: true, content: true, senderId: true },
      }) ?? undefined;
    }

    this.prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } })
      .catch(() => {});

    const payload = {
      id: message.id,
      chatId,
      senderId: userId,
      sender: user,
      content: dto.content,
      replyTo,
      readAt: null,
      createdAt: message.createdAt.toISOString(),
    };

    getPusher()?.trigger(this.chatChannel(chatId), 'new-message', payload)
      .catch((err) => console.error('Pusher trigger failed:', err));

    return payload;
  }

  async markAsRead(chatId: string, messageId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { store: { select: { id: true, ownerId: true } } },
    });
    if (!chat) throw new NotFoundException('Chat not found');

    const isStoreOwner = chat.store.ownerId === userId;
    if (chat.customerId !== userId && !isStoreOwner) {
      throw new ForbiddenException('Not your chat');
    }

    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.chatId !== chatId) {
      throw new NotFoundException('Message not found in this chat');
    }
    if (message.senderId === userId) {
      throw new BadRequestException('Cannot mark own message as read');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date() },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    const payload = {
      id: updated.id,
      chatId: updated.chatId,
      readAt: updated.readAt!.toISOString(),
    };

    getPusher()?.trigger(this.chatChannel(chatId), 'message-read', payload)
      .catch((err) => console.error('Pusher trigger failed:', err));

    return payload;
  }

  async broadcastTyping(chatId: string, userId: string, dto: TypingDto) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { store: { select: { id: true, ownerId: true } } },
    });
    if (!chat) throw new NotFoundException('Chat not found');

    const isStoreOwner = chat.store.ownerId === userId;
    if (chat.customerId !== userId && !isStoreOwner) {
      throw new ForbiddenException('Not your chat');
    }

    const payload = {
      chatId,
      senderId: userId,
      isTyping: dto.isTyping,
    };

    getPusher()?.trigger(this.chatChannel(chatId), 'typing', payload)
      .catch((err) => console.error('Pusher trigger failed:', err));

    return payload;
  }

  async deleteChat(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { store: { select: { id: true, ownerId: true } } },
    });
    if (!chat) throw new NotFoundException('Chat not found');

    if (chat.customerId !== userId && chat.store.ownerId !== userId) {
      throw new ForbiddenException('Not your chat');
    }

    await this.prisma.chat.delete({ where: { id: chatId } });
    return { message: 'Chat deleted' };
  }
}
