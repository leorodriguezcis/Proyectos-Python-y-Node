import { Injectable } from '@nestjs/common';
import {
  CloudAdapter,
  ConfigurationBotFrameworkAuthentication,
  ConfigurationBotFrameworkAuthenticationOptions,
  TurnContext,
} from 'botbuilder';
import { GenericChatbot } from 'src/bots/GenericChatbot';
import { CreateBotDTO } from 'src/bot/dtos/CreateBotDTO';
import { Bot, BotStatus } from 'src/entities/bot';
import { TransactionService } from 'src/transaction/transaction.service';
import { AzureStorageService } from 'src/azure-storage/azure-storage.service';
import { ApiDocument } from 'src/service-client/api.document';
import { BotResponseDTO } from './dtos/responses/BotResponseDTO';
import { ChatPromptDTO } from './dtos/ChatPromptDTO';
import { ChatPromptResponseDTO } from './dtos/responses/ChatPromptResponseDTO';
import { BotBuilderAzure } from 'src/bot-azure-creator/azure-services';
import { TaskTrainDTO } from './dtos/TaskTrainDTO';
import { PartialBotResponseDTO } from './dtos/responses/PartialBotResponseDTO';
import { UpdateBotDTO } from './dtos/UpdateBotDTO';
import { UpdateBotResponseDTO } from './dtos/responses/UpdateBotResponseDTO';
import MapperExceptions from 'src/mappers/MapperExClass';
import { TypeOrmToBotException } from 'src/mappers/TypeOrmToBotMapper';
import { DocumentResponse } from './dtos/responses/DocumentResponse';
import { EntityManager } from 'typeorm';
import { DocumentRequestDTO } from './dtos/DocumentRequestDTO';
import { Channel } from 'src/entities/channel';
import { TokenPayload } from 'src/types/token-payload.type';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/entities/user';

@Injectable()
@MapperExceptions(new TypeOrmToBotException())
export class BotService {
  statuses = {
    TO_TRAIN: 'TO_TRAIN',
    PROCESSING: 'TRAINING',
    COMPLETED: 'TRAINED',
    FAILED: 'FAILED',
  };
  adapter: CloudAdapter;
  constructor(
    private readonly transactionService: TransactionService,
    private readonly azureStorageService: AzureStorageService,
    private readonly apiDocument: ApiDocument,
    private readonly bot: GenericChatbot,
    private readonly botBuilderAzure: BotBuilderAzure,
    private readonly usersService: UsersService,
  ) {}

  onTurnErrorHandler = async (context, error) => {
    await context.sendTraceActivity(
      'OnTurnError Trace',
      `${error}`,
      'https://www.botframework.com/schemas/error',
      'TurnError',
    );
    await context.sendActivity('En este momento me encuentro ocupado. Hablame mas tarde.');
  };

  async authBot(id: number): Promise<Bot> {
    return await this.transactionService.transaction(async (manager) => {
      const bot = await manager.findOneOrFail(Bot, { where: { id: id } });
      const appId = bot.appId;
      const appPassword = bot.appPassword;
      const adapter = new CloudAdapter(
        new ConfigurationBotFrameworkAuthentication({
          MicrosoftAppId: appId,
          MicrosoftAppPassword: appPassword,
        } as ConfigurationBotFrameworkAuthenticationOptions),
      );
      this.adapter = adapter;
      this.adapter.onTurnError = this.onTurnErrorHandler;
      return bot;
    });
  }

  async postActivities(req, res, id: number): Promise<string> {
    const bot = await this.authBot(id);
    this.bot.memberAddedText = bot.newMemberWelcome;
    await this.adapter.process(req, res, async (context: TurnContext) => {
      await this.chatIfActive(bot, context, async (context) => {
        const data = await this.apiDocument.questionDocument(context.activity.text, +bot.groupId);
        context.activity.text = data.text;
      });
    });

    return 'OK';
  }

  createFormData(key: string, file: Express.Multer.File, formdata: FormData): FormData {
    formdata.append(key, new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    return formdata;
  }

  async createBot(newBot: CreateBotDTO, userDTO: TokenPayload): Promise<Bot> {
    return await this.transactionService.transaction(async (manager) => {
      const { name, objective, avatar, documents } = newBot;
      const user = await this.usersService.findOneById(userDTO.id, manager);
      const formdata = new FormData();
      documents.forEach((doc) => this.createFormData('documents', doc, formdata));
      const data = await this.apiDocument.uploadDocuments(formdata);
      const bot = this.createBotEntity(manager, name, objective, BotStatus.TRAINING, data.group_id, user);
      const botSaved = await manager.save(bot);
      if (avatar) {
        await this.azureStorageService.upload(avatar[0], 'avatar', botSaved.id.toString());
      }
      return botSaved;
    });
  }

  private async chatIfActive(
    bot: Bot,
    context: TurnContext,
    executeChat: (context: TurnContext) => Promise<void>,
  ): Promise<void> {
    if (bot.active && context.activity.text) {
      await executeChat(context);
    } else {
      context.activity.text = bot.inactivityMessage;
    }
    await this.bot.run(context);
  }

  async changeActive(id: number, userDTO: TokenPayload): Promise<PartialBotResponseDTO> {
    return await this.transactionService.transaction(async (manager) => {
      const user = await this.usersService.findOneById(userDTO.id, manager);
      const bot = await manager.findOneOrFail(Bot, { where: [{ id: id, user: { id: user.id } }] });
      bot.active = !bot.active;

      return await manager.save(bot);
    });
  }

  async getBot(id: number, userDTO: TokenPayload): Promise<BotResponseDTO> {
    return await this.transactionService.transaction(async (manager) => {
      const user = await this.usersService.findOneById(userDTO.id, manager);
      const bot = await manager.findOneOrFail(Bot, { where: [{ id: id, user: { id: user.id } }] });
      const sasBot = (await this.azureStorageService.existBlob('avatar', bot.id.toString()))
        ? await this.azureStorageService.getSasUrl('avatar', bot.id.toString())
        : null;
      bot.avatar = sasBot;
      return bot;
    });
  }

  async getBots(userDTO: TokenPayload): Promise<Bot[]> {
    return await this.transactionService.transaction(async (manager) => {
      const user = await this.usersService.findOneById(userDTO.id, manager);
      const bots = user.bots;
      const ret = bots.map(async (bot) => {
        bot.avatar = (await this.azureStorageService.existBlob('avatar', bot.id.toString()))
          ? await this.azureStorageService.getSasUrl('avatar', bot.id.toString())
          : null;
        return bot;
      });
      return Promise.all(ret);
    });
  }

  async deleteBot(id: number, userDTO: TokenPayload): Promise<void> {
    return await this.transactionService.transaction(async (manager) => {
      const user = await this.usersService.findOneById(userDTO.id, manager);
      const bot = await manager.findOneOrFail(Bot, { where: [{ id: id, user: { id: user.id } }] });
      if (bot.channels.length > 0) {
        await this.botBuilderAzure.deleteBotService(
          bot.resource,
          bot.appName,
          bot.appId,
          bot.tenant,
          bot.appPassword,
          bot.subscriptionId,
        );
        await this.apiDocument.deleteGroup(bot.groupId);
        await manager.delete(Channel, bot.channels[0].id);
      }
      await this.azureStorageService.delete('avatar', id.toString());
      await manager.delete(Bot, id);
    });
  }

  async testChat(id: number, chat: ChatPromptDTO, userDTO: TokenPayload): Promise<ChatPromptResponseDTO> {
    return await this.transactionService.transaction(async (manager) => {
      const user = await this.usersService.findOneById(userDTO.id, manager);
      const bot = await manager.findOneOrFail(Bot, { where: [{ id: id, user: { id: user.id } }] });
      const data = await this.apiDocument.questionDocument(chat.prompt, bot.groupId);
      return data;
    });
  }
  async notifyTrain(body: TaskTrainDTO) {
    return await this.transactionService.transaction(async (manager) => {
      const bot = await manager.findOneOrFail(Bot, { where: { groupId: body.group_id } });
      if (bot) {
        bot.status = this.statuses[body.status_docs];
      }
      await manager.save(bot);
      return { notified: true };
    });
  }
  async getTrainStatus(id: number) {
    return await this.transactionService.transaction(async (manager) => {
      const bot = await manager.findOneOrFail(Bot, { where: { id: id } });
      return bot.status;
    });
  }
  async getDocuments(id: number, userDTO: TokenPayload) {
    return await this.transactionService.transaction(async (manager) => {
      const user = await this.usersService.findOneById(userDTO.id, manager);
      const bot = await manager.findOneOrFail(Bot, { where: [{ id: id, user: { id: user.id } }] });
      return await this.apiDocument.getDocuments(bot.groupId);
    });
  }
  async retryTraining(id: number, userDTO: TokenPayload): Promise<Bot> {
    return await this.transactionService.transaction(async (manager) => {
      const user = await this.usersService.findOneById(userDTO.id, manager);
      const bot = await manager.findOneOrFail(Bot, { where: [{ id: id, user: { id: user.id } }] });
      bot.status = BotStatus.TRAINING;
      await this.apiDocument.retrainBot(bot.groupId);
      return await manager.save(bot);
    });
  }

  async updateBot(
    id: number,
    updateBot: UpdateBotDTO,
    userDTO: TokenPayload,
  ): Promise<UpdateBotResponseDTO> {
    return await this.transactionService.transaction(async (manager) => {
      const user = await this.usersService.findOneById(userDTO.id, manager);
      const bot = await manager.findOneOrFail(Bot, { where: [{ id: id, user: { id: user.id } }] });
      const { appId, appPassword, tenant, resource } = bot;
      const { name, objective, avatar, newMemberWelcome, inactivityMessage } = updateBot;
      if (name) {
        bot.name = name;
        if (bot.channels.length > 0) {
          await this.botBuilderAzure.updateDisplayNameBotService(
            resource,
            bot.appName,
            appId,
            name,
            appPassword,
            tenant,
            bot.subscriptionId,
          );
        }
      }
      if (objective) bot.objective = objective;
      if (newMemberWelcome) bot.newMemberWelcome = newMemberWelcome;
      if (inactivityMessage) bot.inactivityMessage = inactivityMessage;
      if (avatar) {
        await this.azureStorageService.upload(avatar, 'avatar', bot.id.toString());
        if (bot.channels.length > 0) {
          const avatarUrl = Buffer.from(avatar.buffer).toString('base64');
          await this.botBuilderAzure.uploadImage(
            bot.appName,
            resource,
            avatarUrl,
            bot.subscriptionId,
            bot.appId,
            bot.appPassword,
            bot.tenant,
          );
        }
      }

      await manager.save(bot);
      return { isUpdated: true };
    });
  }

  async deleteDocument(botId: number, docId: number, userDTO: TokenPayload): Promise<any> {
    return await this.transactionService.transaction(async (manager) => {
      const user = await this.usersService.findOneById(userDTO.id, manager);
      const bot = await manager.findOneOrFail(Bot, { where: [{ id: botId, user: { id: user.id } }] });
      return await this.apiDocument.deleteDocument(bot.groupId, docId);
    });
  }

  /**
   *
   * @deprecated
   */
  async updateDocument(id: number, doc: DocumentRequestDTO): Promise<DocumentResponse> {
    return await this.transactionService.transaction(async (manager) => {
      const bot = await manager.findOneOrFail(Bot, { where: { id: id } });
      bot.status = BotStatus.TRAINING;
      const formdata = new FormData();
      const form = this.createFormData('document', doc.document, formdata);
      await this.apiDocument.updateDocument(bot.groupId, form);
      await manager.save(bot);
      return await this.apiDocument.getDocuments(bot.groupId);
    });
  }
  private createBotEntity(
    manager: EntityManager,
    name: string,
    objective: string,
    status: BotStatus,
    group_id: number,
    user: User,
    app = { appId: '', password: '' },
  ): Bot {
    return manager.create(Bot, {
      name: name,
      objective: objective,
      status: status,
      groupId: group_id,
      appId: app['appId'],
      appPassword: app['password'],
      user: user,
    });
  }

  async addDocumentToBot(id: number, file: Express.Multer.File[], userDTO: TokenPayload): Promise<any> {
    return await this.transactionService.transaction(async (manager) => {
      const user = await this.usersService.findOneById(userDTO.id, manager);
      const bot = await manager.findOneOrFail(Bot, { where: [{ id: id, user: { id: user.id } }] });
      const formdata = new FormData();

      file.forEach((doc) => this.createFormData('documents', doc, formdata));
      return await this.apiDocument.addDocumentToGroup(bot.groupId, formdata);
    });
  }
}
