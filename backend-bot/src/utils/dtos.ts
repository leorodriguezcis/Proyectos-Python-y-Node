import { BotResponseDTO } from 'src/bot/dtos/responses/BotResponseDTO';
import { ChatPromptResponseDTO } from 'src/bot/dtos/responses/ChatPromptResponseDTO';
import { CreateBotResponseDTO } from 'src/bot/dtos/responses/CreateBotResponseDTO';
import { DocumentResponse } from 'src/bot/dtos/responses/DocumentResponse';
import { PartialBotResponseDTO } from 'src/bot/dtos/responses/PartialBotResponseDTO';
import { UpdateBotResponseDTO } from 'src/bot/dtos/responses/UpdateBotResponseDTO';

export type ChatBotDTO =
  | BotResponseDTO
  | PartialBotResponseDTO
  | ChatPromptResponseDTO
  | DocumentResponse
  | UpdateBotResponseDTO
  | CreateBotResponseDTO;
