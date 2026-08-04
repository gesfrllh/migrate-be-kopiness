import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { TypingDto } from './dto/typing.dto';
import { ChatDetailDto, ChatListItemDto } from './dto/chat-response.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { ApiTags, ApiBearerAuth, ApiBody, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiBody({ type: CreateChatDto })
  @ApiOkResponse({ type: ChatDetailDto })
  create(@Req() req, @Body() dto: CreateChatDto) {
    return this.chatService.createChat(req.user.id, dto);
  }

  @Get()
  @ApiOkResponse({ type: [ChatListItemDto] })
  findAll(@Req() req) {
    return this.chatService.listChats(req.user.id, req.user.role);
  }

  @Get(':id')
  @ApiOkResponse({ type: ChatDetailDto })
  findOne(@Req() req, @Param('id') id: string) {
    return this.chatService.getChatDetail(id, req.user.id);
  }

  @Post(':id/messages')
  @ApiBody({ type: SendMessageDto })
  sendMessage(@Req() req, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(id, req.user.id, dto);
  }

  @Post(':id/typing')
  @ApiBody({ type: TypingDto })
  typing(@Req() req, @Param('id') id: string, @Body() dto: TypingDto) {
    return this.chatService.broadcastTyping(id, req.user.id, dto);
  }

  @Patch(':id/messages/:messageId/read')
  markAsRead(@Req() req, @Param('id') id: string, @Param('messageId') messageId: string) {
    return this.chatService.markAsRead(id, messageId, req.user.id);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.chatService.deleteChat(id, req.user.id);
  }
}
