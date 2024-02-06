import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Bot } from './bot';

export enum ChannelStatus {
  CONNECTED = 'CONNECTED',
  CONNECTING = 'CONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  FAILED = 'FAILED',
}

@Entity()
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column({ default: ChannelStatus.DISCONNECTED })
  status: ChannelStatus;
  @ManyToOne(() => Bot, (bot) => bot.channels, { orphanedRowAction: 'delete' })
  @JoinColumn({ name: 'bot_id' })
  bot: Bot;
}
