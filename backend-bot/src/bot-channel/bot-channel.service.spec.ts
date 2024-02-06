import { Test, TestingModule } from '@nestjs/testing';
import { BotChannelService } from './bot-channel.service';

describe('BotChannelService', () => {
  let service: BotChannelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BotChannelService],
    }).compile();

    service = module.get<BotChannelService>(BotChannelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
