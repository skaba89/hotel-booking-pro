import { Controller, Post, Get, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Public()
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post()
  async ask(@Body() dto: ChatRequestDto) {
    // Trim to the last 10 turns to bound prompt size / cost.
    const turns = dto.messages.slice(-10);
    const result = await this.chat.ask(turns);
    return result;
  }

  // Lightweight diagnostics: which providers are configured (no secrets exposed).
  @Public()
  @Get('providers')
  providers() {
    return { enabled: this.chat.enabledProviders() };
  }
}
