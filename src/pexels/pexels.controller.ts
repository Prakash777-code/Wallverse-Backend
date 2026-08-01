import { Controller, Get, Query } from '@nestjs/common';
import { PexelsQueryDto } from './dto/pexels.quer.dto';
import { PexelsService } from './pexels.service';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('pexels')
@SkipThrottle()
export class PexelsController {

    constructor(private pexlesService:PexelsService){}

    @Get()
    async getWallpapers(@Query() pexelsQueryDto:PexelsQueryDto){
        return this.pexlesService.getWallpapers(pexelsQueryDto)
    }
}
