import { Test, TestingModule } from '@nestjs/testing';
import { BotChannelController } from './bot-channel.controller';
import { BotChannelService } from './bot-channel.service';

describe('BotChannelController', () => {
  let controller: BotChannelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BotChannelController],
      providers: [BotChannelService],
    }).compile();

    controller = module.get<BotChannelController>(BotChannelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
