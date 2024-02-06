import { Injectable } from '@nestjs/common';
import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlockBlobUploadResponse,
  BlobDeleteIfExistsResponse,
  StorageSharedKeyCredential,
  generateAccountSASQueryParameters,
  AccountSASSignatureValues,
  AccountSASPermissions,
  AccountSASResourceTypes,
  AccountSASServices,
  BlockBlobUploadOptions,
} from '@azure/storage-blob';
@Injectable()
export class AzureStorageService {
  private blobServiceClient: BlobServiceClient;
  private conectionString: string;
  private accountName: string;
  private accountKey: string;
  private sharedKeyCredential: StorageSharedKeyCredential;

  constructor() {
    this.conectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    this.accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    this.blobServiceClient = BlobServiceClient.fromConnectionString(this.conectionString);
    this.sharedKeyCredential = new StorageSharedKeyCredential(this.accountName, this.accountKey);
  }

  async upload(
    file: Express.Multer.File,
    containerName: string,
    fileName: string,
  ): Promise<BlockBlobUploadResponse> {
    try {
      const blobClient: BlockBlobClient = await this.getBlobClient(containerName, fileName);
      // Define las opciones de carga del Blob, incluyendo el Content-Type
      const uploadOptions: BlockBlobUploadOptions = {
        blobHTTPHeaders: {
          blobContentType: file.mimetype,
        },
      };

      const uploadFile = file.buffer;
      return blobClient.upload(uploadFile, file.size, uploadOptions);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async delete(containerName: string, fileName: string): Promise<BlobDeleteIfExistsResponse> {
    try {
      const blobClient: BlockBlobClient = await this.getBlobClient(containerName, fileName);
      return blobClient.deleteIfExists();
    } catch (err) {
      console.log(err);
    }
  }

  async getUrl(containerName: string, fileName: string): Promise<string> {
    try {
      const blobClient: BlockBlobClient = await this.getBlobClient(containerName, fileName);
      return blobClient.url;
    } catch (err) {
      console.log(err);
    }
  }

  async getSasUrl(containerName: string, fileName: string): Promise<string> {
    try {
      const blobClient: BlockBlobClient = await this.getBlobClient(containerName, fileName);
      return `${blobClient.url}?${this.getBlobSas()}`;
    } catch (err) {
      console.log(err);
    }
  }

  private getBlobSas(): string {
    const tokenValidDuration = 9 * 60 * 1000; // 9 minutes
    const adjustTime = 60 * 1000; // 1 minute for potential time discrepancies
    const blobSAS: AccountSASPermissions = AccountSASPermissions.parse('r');
    const sasOptions: AccountSASSignatureValues = {
      permissions: blobSAS,
      startsOn: new Date(new Date().valueOf() - adjustTime),
      expiresOn: new Date(new Date().valueOf() + tokenValidDuration),
      services: AccountSASServices.parse('bf').toString(), // blobs, tables, queues, files
      resourceTypes: AccountSASResourceTypes.parse('sco').toString(), // service, container, object
    };
    return generateAccountSASQueryParameters(sasOptions, this.sharedKeyCredential).toString();
  }

  private async getBlobClient(containerName: string, fileName: string): Promise<BlockBlobClient> {
    const containerClient: ContainerClient = this.blobServiceClient.getContainerClient(containerName);

    try {
      await containerClient.createIfNotExists();
    } catch (err) {
      console.log(err);
    }
    return containerClient.getBlockBlobClient(fileName);
  }

  async existBlob(containerName: string, fileName: string): Promise<boolean> {
    const blobClient: BlockBlobClient = await this.getBlobClient(containerName, fileName);
    return blobClient.exists();
  }

  async getBinary(containerName: string, fileName: string): Promise<Buffer> {
    const blobClient: BlockBlobClient = await this.getBlobClient(containerName, fileName);
    const downloadBlockBlobResponse = await blobClient.download();
    return await this.streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
  }

  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      readableStream.on('data', (data: Uint8Array) => {
        chunks.push(data);
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }
}
