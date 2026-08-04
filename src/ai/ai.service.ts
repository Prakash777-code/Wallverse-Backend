import { Inject, Injectable } from '@nestjs/common';
import { PromptDto } from './dto/prompt.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class AiService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  async generateImage(prompt: PromptDto) {
    const key = `prompt:${prompt.prompt.toLowerCase()}`;
    const cachedData = await this.cacheManager.get<string>(key);
    if (cachedData) {
      return {
        source: 'Cache',
        imageUrl: cachedData,
      };
    }
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt.prompt,
    )}?model=flux&width=1920&height=1080&enhance=true&nologo=true`;

    await this.cacheManager.set(key, imageUrl, 24 * 60 * 60 * 1000);

    return {
      source: 'Api',
      imageUrl,
    };
  }
}
