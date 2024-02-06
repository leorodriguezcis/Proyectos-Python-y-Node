import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  OnQueueProgress,
  Process,
  Processor,
} from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { BotBuilderAzure } from 'src/bot-azure-creator/azure-services';
import { Bot } from 'src/entities/bot';
import { Channel, ChannelStatus } from 'src/entities/channel';
import { TransactionService } from 'src/transaction/transaction.service';

@Processor('channel')
@Injectable()
export class ChannelProcessorConsumer {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly botBuilderAzure: BotBuilderAzure,
  ) {}

  @Process('addChannel')
  async addChannel(job: any) {
    const { bot, resource, endpoint, avatar, channel, appId, appPassword, tenant, subscriptionId } =
      job.data;
    const app = await this.botBuilderAzure.createBotAzure(
      appId,
      appPassword,
      tenant,
      bot.name,
      resource,
      endpoint,
      avatar,
      subscriptionId,
    );

    return { app, bot, channel };
  }

  @OnQueueActive()
  onActive(job: any) {
    console.log(`Processing job ${job.id} of type ${job.name}`);
  }
  @OnQueueCompleted()
  async onCompleted(job: any, result: any) {
    console.log(`Completed job ${job.id} of type ${job.name}`);
    const { bot, app, channel } = result;
    await this.transactionService.transaction(async (manager) => {
      bot.appId = app['appId'];
      bot.appPassword = app['appPassword'];
      bot.tenant = app['tenant'];
      bot.resource = app['botResourceGroup'];
      bot.subscriptionId = app['subscriptionId'];
      bot.appName = app['botServiceApp'];
      channel.status = ChannelStatus.CONNECTED;
      const ch = await manager.save(Channel, channel);
      bot.channels.find((c) => c.id === ch.id).status = ChannelStatus.CONNECTED;
      return await manager.save(Bot, bot);
    });
  }

  @OnQueueFailed()
  async onError(job: any, err: any) {
    console.log(`Failed job ${job.id} of type ${job.name}: ${err.message}`);
    const { bot, channel } = job.data;
    return await this.transactionService.transaction(async (manager) => {
      channel.status = ChannelStatus.DISCONNECTED;
      bot.channels.find((c) => c.id === channel.id).status = ChannelStatus.FAILED;
      await manager.save(Channel, channel);
      await manager.save(Bot, bot);
    });
  }

  @OnQueueProgress()
  onProgress(job: any, progress: any) {
    console.log(`Progress job ${job.id} of type ${job.name}: ${progress}`);
  }
}
