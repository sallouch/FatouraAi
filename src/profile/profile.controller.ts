import {
  Controller, Get, Put, Post, Patch, Body, Request, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@Request() req) {
    return this.profileService.getProfile(req.user.sub);
  }

  @Put()
  updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.sub, dto);
  }

  @Put('password')
  updatePassword(@Request() req, @Body() dto: UpdatePasswordDto) {
    return this.profileService.updatePassword(req.user.sub, dto);
  }

  @Patch('company')
  updateCompany(@Request() req, @Body() dto: UpdateCompanyDto) {
    return this.profileService.updateCompany(req.user.sub, dto);
  }

  @Post('avatar')
  uploadAvatar(@Request() req, @Body() body: { base64: string; mimeType: string }) {
    return this.profileService.updateAvatar(req.user.sub, body.base64, body.mimeType);
  }
}