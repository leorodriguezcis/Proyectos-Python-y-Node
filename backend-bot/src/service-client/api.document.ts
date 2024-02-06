import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ChatPromptResponseDTO } from 'src/bot/dtos/responses/ChatPromptResponseDTO';
import { DocumentResponse } from 'src/bot/dtos/responses/DocumentResponse';
import { DocumentException } from 'src/exceptions/DocumentException';
import { DocumentExceptionMapper } from 'src/mappers/DocumentExceptionMapper';
import MapperExceptionsClass from 'src/mappers/MapperExClass';

@Injectable()
@MapperExceptionsClass(new DocumentExceptionMapper())
export class ApiDocument {
  apiDocumentUrl: string;
  constructor(private readonly httpService: HttpService) {
    this.apiDocumentUrl = process.env.DOCUMENT_ANALYZER_API;
  }
  async retrainBot(groupId: number): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.put<any>(
          `${this.apiDocumentUrl}/api/group/retry/${groupId}?callback=${process.env.CALLBACK_URL}`,
        ),
      );
      return data;
    } catch (error) {
      throw new DocumentException(error.message, error.response.status);
    }
  }

  async updateDocument(docId: number, file: FormData): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.put<any>(
          `${this.apiDocumentUrl}/api/group/update/${docId}?callback=${process.env.CALLBACK_URL}`,
          file,
        ),
      );
      return data;
    } catch (error) {
      throw new DocumentException(error.message, error.response.status);
    }
  }

  async uploadDocuments(files: FormData): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<any>(
          `${this.apiDocumentUrl}/api/group/upload?callback=${process.env.CALLBACK_URL}`,
          files,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        ),
      );
      return data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error?.response?.status) {
        throw new DocumentException('Document Analyzer API is not available', 503);
      }
      throw new DocumentException(error.message, error?.response?.status);
    }
  }

  async questionDocument(question: string, groupId: number): Promise<ChatPromptResponseDTO> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<any>(`${process.env.DOCUMENT_ANALYZER_API}/api/group/text/${groupId}`, {
          prompt: question,
        }),
      );
      return data;
    } catch (error) {
      throw new DocumentException(error.message, error.response.status);
    }
  }

  /* async trainDocument(docId: number): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<any>(`${process.env.DOCUMENT_ANALYZER_API}/api/document/train`, {
          documentId: docId,
        }),
      );
      return data;
    } catch (error) {
      throw new DocumentException(error.message, error.response.status);
    }
  }
*/
  async getDocuments(groupId: number): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<any>(`${process.env.DOCUMENT_ANALYZER_API}/api/group/info/${groupId}`),
      );
      return data;
    } catch (error) {
      throw new DocumentException(error.message, error.response.status);
    }
  }

  async deleteDocument(groupId: number, docId: number): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.delete<any>(
          `${process.env.DOCUMENT_ANALYZER_API}/api/group/${groupId}/delete/${docId}`,
        ),
      );
      return data;
    } catch (error) {
      throw new DocumentException(error.message, error.response.status);
    }
  }

  async addDocumentToGroup(groupId: number, files: FormData): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.put<any>(
          `${process.env.DOCUMENT_ANALYZER_API}/api/group/add/${groupId}?callback=${process.env.CALLBACK_URL}`,
          files,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        ),
      );
      return data;
    } catch (error) {
      throw new DocumentException(error.message, error.response.status);
    }
  }
  async deleteGroup(groupId: number): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.delete<any>(`${process.env.DOCUMENT_ANALYZER_API}/api/group/${groupId}`),
      );
      return data;
    } catch (error) {
      throw new DocumentException(error?.message, error?.response?.status);
    }
  }
}
