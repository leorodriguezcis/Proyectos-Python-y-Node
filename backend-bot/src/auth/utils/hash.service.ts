import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';

@Injectable()
export class HashService {
  async data(pass: string): Promise<string> {
    const SALT = bcrypt.genSaltSync();
    return bcrypt.hash(pass, SALT);
  }

  compare(pass: string, hash: string): boolean {
    return bcrypt.compareSync(pass, hash);
  }
}
