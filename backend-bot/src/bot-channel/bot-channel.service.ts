import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { AzureStorageService } from 'src/azure-storage/azure-storage.service';
import { Bot } from 'src/entities/bot';
import { Channel, ChannelStatus } from 'src/entities/channel';
import { TransactionService } from 'src/transaction/transaction.service';
import { CreateChannelDTO } from './dtos/CreateChannelDTO';
import MapperExceptions from 'src/mappers/MapperExClass';
import { TypeOrmToChannelException } from 'src/mappers/TypeOrmToChannelException';
import { TokenPayload } from 'src/types/token-payload.type';
import { UsersService } from 'src/users/users.service';

@Injectable()
@MapperExceptions(new TypeOrmToChannelException())
export class BotChannelService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly azureStorageService: AzureStorageService,
    private readonly usersService: UsersService,
    @InjectQueue('channel') private channelQueue: Queue,
  ) {}

  async addChannelToBot(botId: number, body: CreateChannelDTO, userDTO: TokenPayload) {
    const { channel, appId, appPassword, tenant, resource, subscriptionId } = body;
    return this.transactionService.transaction(async (manager) => {
      const user = await this.usersService.findOneById(userDTO.id, manager);
      const bot = await manager.findOneOrFail(Bot, { where: { id: botId, user: { id: user.id } } });
      const avatar = (await this.azureStorageService.existBlob('avatar', bot.id.toString()))
        ? await this.azureStorageService.getBinary('avatar', bot.id.toString())
        : null;
      const avatarUrl = avatar ? Buffer.from(avatar.buffer).toString('base64') : null;
      let channelbot = bot.channels.find((ch) => ch.name === channel);
      if (!channelbot) {
        channelbot = manager.create(Channel, { name: channel, status: ChannelStatus.CONNECTING });
        bot.addChannel(channelbot);
        channelbot = await manager.save(channelbot);
      } else {
        this.checkChannelStatus(channelbot);
        channelbot.status = ChannelStatus.CONNECTING;
        channelbot = await manager.save(channelbot);
      }
      await manager.save(bot);
      await this.channelQueue.add(
        'addChannel',
        {
          bot: bot,
          channel: channelbot,
          resource: resource,
          endpoint: `${process.env.SERVER_URL}/api/bot/messages/${bot.id}`,
          avatar: avatarUrl,
          appId: appId,
          appPassword: appPassword,
          tenant: tenant,
          subscriptionId: subscriptionId,
        },
        { removeOnComplete: true, removeOnFail: true },
      );

      return bot.channels;
    });
  }

  private checkChannelStatus(channelbot: Channel) {
    if (channelbot.status === ChannelStatus.CONNECTED || channelbot.status === ChannelStatus.CONNECTING) {
      throw new Error('Channel already connected');
    }
  }

  async getChannelsByBotId(botId: number, userDTO: TokenPayload) {
    return await this.transactionService.transaction(async (manager) => {
      const user = await this.usersService.findOneById(userDTO.id, manager);
      const channel = await manager.findOneOrFail(Bot, {
        where: { id: botId, user: { id: user.id } },
        relations: ['channels'],
      });
      return channel.channels;
    });
  }

  async getUrlBotChannel(channelId: number, botId: number, userDTO: TokenPayload) {
    return await this.transactionService.transaction(async (manager) => {
      const user = await this.usersService.findOneById(userDTO.id, manager);
      const botChannel = await manager.findOneOrFail(Bot, {
        where: { id: botId, user: { id: user.id } },
        relations: ['channels'],
      });
      botChannel.channels.find((channel) => channel.id === channelId);
      return { urlTeams: `https://teams.microsoft.com/l/chat/0/0?users=28:${botChannel.appId}` };
    });
  }
}
