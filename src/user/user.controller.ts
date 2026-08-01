import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {

    constructor(private userService:UserService){}

    @Get()
    @SkipThrottle()
    async getUserProfile(@Req() request:Request){
        return this.userService.getUserProfile(request.user.userId)
    }

    @Get("status")
    @SkipThrottle()
    async getUserStatus(@Req() request:Request){
        return this.userService.getUserStatus(request.user.userId)
    }
    
    @Put()
    @Throttle({
        default:{
            limit:2,
            ttl:60000
        }
    })
    async changeUserName(@Req() request:Request, @Body() body: {newName:string}){
        return this.userService.changeUserName(request.user.userId, body.newName)
    }
}
