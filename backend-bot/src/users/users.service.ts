import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { HashService } from 'src/auth/utils/hash.service';
import { User } from '../entities/user';
import { NotFoundException } from 'src/exceptions/NotFoundException';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { InvalidArgumentException } from 'src/exceptions/InvalidArgumentException';
import { TransactionService } from 'src/transaction/transaction.service';

@Injectable()
export class UsersService {
  constructor(
    private hashService: HashService,
    private readonly transactionService: TransactionService,
  ) {}

  async findAll(manager?: EntityManager): Promise<User[]> {
    return await this.transactionService.transaction(async (manager) => {
      return await manager.find(User);
    }, manager);
  }

  async findOneById(id: string, manager?: EntityManager): Promise<User> {
    return await this.transactionService.transaction(async (manager) => {
      const user = await manager.findOneBy(User, { id });
      if (!user) throw new NotFoundException();
      return user;
    }, manager);
  }

  async findOneByIdWithResults(id: string, manager?: EntityManager): Promise<User> {
    return await this.transactionService.transaction(async (manager) => {
      return await manager.findOne(User, { where: { id }, relations: ['results'] });
    }, manager);
  }

  async findOneByUsername(username: string, manager?: EntityManager): Promise<User> {
    return await this.transactionService.transaction(async (manager) => {
      return await manager.findOneBy(User, { username });
    }, manager);
  }

  async remove(id: string, manager?: EntityManager): Promise<void> {
    await this.transactionService.transaction(async (manager) => {
      await manager.softDelete(User, id);
    }, manager);
  }

  async create(_user: CreateUserDto, manager?: EntityManager): Promise<User | any> {
    return await this.transactionService.transaction(async (manager) => {
      try {
        const password = await this.hashService.data(_user.password);
        _user.password = password;
        const newUser = manager.create(User, _user);
        return await manager.save(newUser);
      } catch (error) {
        if (/\bViolation of UNIQUE KEY\b/.test(error.message)) {
          throw new InvalidArgumentException(['Account with this email already exists']);
        }
      }
    }, manager);
  }
}
