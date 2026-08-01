import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { PromptDto } from './dto/prompt.dto';
import { AuthGuard } from '../auth/auth.guard';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post("image")
  @SkipThrottle()
  async generateImage(@Body() prompt:PromptDto){
    return this.aiService.generateImage(prompt)
  }
}
