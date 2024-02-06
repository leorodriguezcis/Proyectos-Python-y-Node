import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BotService } from './bot.service';
import { ChatPromptDTO } from './dtos/ChatPromptDTO';
import { CreateBotDTO } from './dtos/CreateBotDTO';
import { BotResponseDTO } from './dtos/responses/BotResponseDTO';
import { CreateBotResponseDTO } from './dtos/responses/CreateBotResponseDTO';
import { ChatPromptResponseDTO } from './dtos/responses/ChatPromptResponseDTO';
import { TaskTrainDTO } from './dtos/TaskTrainDTO';
import { PartialBotResponseDTO } from './dtos/responses/PartialBotResponseDTO';
import { DocumentResponse } from './dtos/responses/DocumentResponse';
import { UpdateBotDTO } from './dtos/UpdateBotDTO';
import { UpdateBotResponseDTO } from './dtos/responses/UpdateBotResponseDTO';
import { validationPipe } from 'src/pipes/ValidationPipe';
import { Bot } from 'src/entities/bot';
import { TransformInterceptor } from 'src/middlewares/TransformInterceptor';
import { DocumentRequestDTO } from './dtos/DocumentRequestDTO';
import { DocumentsRequestDTO } from './dtos/DocumentsRequestDTO';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { TokenPayload } from 'src/types/token-payload.type';

@Controller('bot')
@ApiTags('Chatbot')
@UsePipes(validationPipe)
export class BotController {
  constructor(private readonly botService: BotService) {}

  @ApiExcludeEndpoint()
  @Post('messages/:id')
  async postActivities(
    @Param('id') id: number,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<string> {
    return await this.botService.postActivities(req, res, id);
  }

  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'avatar', maxCount: 1 }, { name: 'documents' }]),
    new TransformInterceptor(CreateBotResponseDTO),
  )
  @ApiOperation({ summary: 'Create a bot' })
  @ApiResponse({ type: CreateBotResponseDTO, status: 201 })
  @Post('create')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createBot(
    @Body() bot: CreateBotDTO,
    @Req() req: { user: TokenPayload },
    @UploadedFiles() files: { avatar?: Express.Multer.File; documents: Express.Multer.File[] },
  ): Promise<Bot> {
    return await this.botService.createBot({ ...bot, ...files }, req.user);
  }

  @UseInterceptors(new TransformInterceptor(PartialBotResponseDTO))
  @ApiOperation({ summary: 'Change active bot' })
  @ApiOkResponse({ type: PartialBotResponseDTO })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('active/:id')
  async activeBot(
    @Param('id') id: number,
    @Req() req: { user: TokenPayload },
  ): Promise<PartialBotResponseDTO> {
    return await this.botService.changeActive(id, req.user);
  }

  @UseInterceptors(new TransformInterceptor(BotResponseDTO))
  @ApiOperation({ summary: 'Get a bot' })
  @ApiOkResponse({ type: BotResponseDTO })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getBot(@Param('id') id: number, @Req() req: { user: TokenPayload }): Promise<BotResponseDTO> {
    return await this.botService.getBot(id, req.user);
  }

  @UseInterceptors(new TransformInterceptor(PartialBotResponseDTO))
  @ApiOperation({ summary: 'Get all bots' })
  @ApiOkResponse({ type: PartialBotResponseDTO, isArray: true })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  async getBots(@Req() req: { user: TokenPayload }): Promise<PartialBotResponseDTO[]> {
    return await this.botService.getBots(req.user);
  }

  @ApiOperation({ summary: 'Delete a bot' })
  @ApiOkResponse()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteBot(@Param('id') id: number, @Req() req: { user: TokenPayload }): Promise<void> {
    await this.botService.deleteBot(id, req.user);
  }

  @ApiOperation({ summary: 'Test a bot' })
  @ApiOkResponse({ type: ChatPromptResponseDTO })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('test/:id')
  async test(
    @Param('id') id: number,
    @Body() body: ChatPromptDTO,
    @Req() req: { user: TokenPayload },
  ): Promise<ChatPromptResponseDTO> {
    return await this.botService.testChat(id, body, req.user);
  }
  @ApiExcludeEndpoint()
  @Post('/notify')
  async notifyTrain(@Body() body: TaskTrainDTO) {
    return await this.botService.notifyTrain(body);
  }

  @ApiOperation({ summary: 'Get bot documents' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('/:id/documents')
  async getDocuments(@Param('id') botId: number, @Req() req: { user: TokenPayload }): Promise<any> {
    return await this.botService.getDocuments(botId, req.user);
  }

  @UseInterceptors(new TransformInterceptor(BotResponseDTO))
  @ApiOperation({ summary: 'Retry training' })
  @ApiOkResponse({ type: BotResponseDTO })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('/:id/retry')
  async retryTraining(
    @Param('id') botId: number,
    @Req() req: { user: TokenPayload },
  ): Promise<BotResponseDTO> {
    return await this.botService.retryTraining(botId, req.user);
  }

  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update document by bot id "DEPRECATED"' })
  @ApiOkResponse({ type: DocumentResponse })
  @UseInterceptors(FileInterceptor('document'))
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('/:id/document')
  async updateDocument(
    @Param('id') botId: number,
    @Body() docFile: DocumentRequestDTO,
    @UploadedFile() document: Express.Multer.File,
  ): Promise<DocumentResponse> {
    return await this.botService.updateDocument(botId, { document });
  }

  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Update bot' })
  @ApiOkResponse({ type: UpdateBotResponseDTO })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('/update/:id')
  async updateBot(
    @Param('id') botId: number,
    @Body() updateBot: UpdateBotDTO,
    @UploadedFile() avatar: Express.Multer.File,
    @Req() req: { user: TokenPayload },
  ): Promise<UpdateBotResponseDTO> {
    return await this.botService.updateBot(botId, { ...updateBot, avatar }, req.user);
  }

  @ApiOperation({ summary: 'Delete document by bot id and docId' })
  @ApiOkResponse({ type: DocumentResponse })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('/:id/document/:docId')
  async deleteDocument(
    @Param('id') botId: number,
    @Param('docId') docId: number,
    @Req() req: { user: TokenPayload },
  ): Promise<DocumentResponse> {
    return await this.botService.deleteDocument(botId, docId, req.user);
  }

  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Add new document to bot' })
  @UseInterceptors(FilesInterceptor('documents'))
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('/:id/document/add')
  async addDocumentToBot(
    @Param('id') botId: number,
    @Body() docFile: DocumentsRequestDTO,
    @UploadedFiles() documents: Express.Multer.File[],
    @Req() req: { user: TokenPayload },
  ): Promise<any> {
    return await this.botService.addDocumentToBot(botId, documents, req.user);
  }
}
