import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MailService } from './mail.service';
// import { JwtAuthGuard } from 'modules/auth/jwt-auth.guard';
import { LoginUserDto } from '../users/create-user.dto';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201 })
  //   @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() userDto: LoginUserDto) {
    return this.mailService.sendUserInformation(userDto);
  }
}