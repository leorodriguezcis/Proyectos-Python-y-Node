import { plainToInstance } from 'class-transformer';

export type Class<T> = { new (...args: any[]): T };

export function toInstance<T, V>(cls: Class<T>, plain: V): T;
export function toInstance<T, V>(cls: Class<T>, plain: V[]): T[];
export function toInstance<T, V>(cls: Class<T>, plain: V | V[]): T | T[] {
  return plainToInstance(cls, plain, { exposeDefaultValues: true });
}
