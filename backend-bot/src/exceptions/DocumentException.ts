export class DocumentException extends Error {
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }

  public status: number;
}
