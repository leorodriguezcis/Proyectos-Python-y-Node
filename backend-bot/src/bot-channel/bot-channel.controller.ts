import { Body, Controller, Get, Param, Post, Req, UseGuards, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { validationPipe } from 'src/pipes/ValidationPipe';
import { BotChannelService } from './bot-channel.service';
import { CreateChannelDTO } from './dtos/CreateChannelDTO';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ChannelResponseDTO } from './dtos/responses/ChannelResponseDTO';
import { TokenPayload } from 'src/types/token-payload.type';

@Controller('channel')
@ApiTags('Channel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(validationPipe)
export class BotChannelController {
  constructor(private readonly botChannelService: BotChannelService) {}

  @ApiOperation({ summary: 'Connect to channel' })
  @ApiResponse({ status: 200, type: ChannelResponseDTO, isArray: true })
  @Post('add/:botId')
  async addChannelToBot(
    @Param('botId') botId: number,
    @Body() addChannelDTO: CreateChannelDTO,
    @Req() req: { user: TokenPayload },
  ) {
    return await this.botChannelService.addChannelToBot(botId, addChannelDTO, req.user);
  }

  @ApiOperation({ summary: 'Get channels by bot' })
  @Post('/:botId')
  async getChannelsByBotId(@Param('botId') botId: number, @Req() req: { user: TokenPayload }) {
    return await this.botChannelService.getChannelsByBotId(botId, req.user);
  }

  @ApiOperation({ summary: 'Get url bot' })
  @Get(':channelId/:botId/url')
  async getUrlBot(
    @Param('botId') botId: number,
    @Param('channelId') channelId: number,
    @Req() req: { user: TokenPayload },
  ) {
    return await this.botChannelService.getUrlBotChannel(channelId, botId,req.user);
  }
}
