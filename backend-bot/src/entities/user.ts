import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Bot } from './bot';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ nullable: false })
  firstName: string;
  @Column({ nullable: false })
  lastName: string;
  @Column({ default: true })
  isActive: boolean;
  @Column({ nullable: false, unique: true })
  username: string;
  @Column({ nullable: false, unique: true })
  email: string;
  @Column({ nullable: false })
  password: string;
  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
  @DeleteDateColumn({ type: 'datetime' })
  deletedAt: Date;
  @OneToMany(() => Bot, (bot) => bot.user, { eager: true, cascade: true })
  bots: Bot[];
}
