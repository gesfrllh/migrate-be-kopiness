import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class MessageSenderDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() role: string;
}

class ReplyToDto {
  @ApiProperty() id: string;
  @ApiProperty() content: string;
  @ApiProperty() senderId: string;
}

export class MessageResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() chatId: string;
  @ApiProperty() senderId: string;
  @ApiProperty({ type: MessageSenderDto })
  sender: MessageSenderDto;
  @ApiProperty() content: string;
  @ApiPropertyOptional({ type: ReplyToDto })
  replyTo?: ReplyToDto;
  @ApiPropertyOptional() readAt: string | null;
  @ApiProperty() createdAt: string;
}

export class ChatListItemDto {
  @ApiProperty() id: string;
  @ApiProperty() storeId: string;
  @ApiProperty() storeName: string;
  @ApiProperty() storeLogo: string | null;
  @ApiProperty() customerId: string;
  @ApiProperty() customerName: string;
  @ApiPropertyOptional({ type: MessageResponseDto })
  lastMessage?: MessageResponseDto;
  @ApiProperty() unreadCount: number;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}

export class ChatDetailDto {
  @ApiProperty() id: string;
  @ApiProperty() storeId: string;
  @ApiProperty() storeName: string;
  @ApiProperty() storeLogo: string | null;
  @ApiProperty() customerId: string;
  @ApiProperty() customerName: string;
  @ApiProperty({ type: [MessageResponseDto] })
  messages: MessageResponseDto[];
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
