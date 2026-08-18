import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { PromptDto } from './dto/prompt.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post("image")
  @Throttle({
    default:{
      limit:5,
      ttl:60000
    }
  })
  async generateImage(@Body() prompt:PromptDto, @Req() request:Request){
    return this.aiService.generateImage(prompt,request.user.userId)
  }

  @Get("count")
  async getAiGeneratedCountByUserId(@Req() request:Request){
    console.log("Reached ai genarte function")
    return this.aiService.getAiGeneratedCountByUserId(request.user.userId)
  }

  @Get("prompts")
  async getPrompts(@Req() requets:Request){
    return this.aiService.getPrompts(requets.user.userId)
  }
}
