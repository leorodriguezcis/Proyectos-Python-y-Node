import { Column, Entity, OneToMany, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Channel } from './channel';
import { User } from './user';

export enum BotStatus {
  TO_TRAIN = 'TO_TRAIN',
  TRAINING = 'TRAINING',
  TRAINED = 'TRAINED',
  FAILED = 'FAILED',
}
@Entity()
export class Bot {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column()
  objective: string;
  @Column()
  groupId: number;
  @Column({ default: true })
  active: boolean;
  @Column({ default: BotStatus.TO_TRAIN })
  status: BotStatus;
  @Column({ default: 'Encantado de saludarte' })
  newMemberWelcome: string;
  @Column({ default: 'En este momento no me encuentro disponible, por favor intenta más tarde.' })
  inactivityMessage: string;
  @Column({ default: '' })
  appId: string;
  @Column({ default: '' })
  appPassword: string;
  @Column({ default: '' })
  tenant: string;
  @Column({ default: '' })
  resource: string;
  @Column({ default: '' })
  subscriptionId: string;
  @Column({ nullable: true })
  appName: string;
  @OneToMany(() => Channel, (channel) => channel.bot, { eager: true, cascade: true, onUpdate: 'CASCADE' })
  channels: Array<Channel>;
  @ManyToOne(() => User, (user) => user.bots, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'soft-delete',
  })
  user: User;
  avatar: string | null = null;

  constructor(
    name: string,
    objective: string,
    documentId: number,
    appId: string,
    appPassword: string,
    id?: number,
    active?: boolean,
    status?: BotStatus,
  ) {
    this.id = id;
    this.name = name;
    this.objective = objective;
    this.groupId = documentId;
    this.appId = appId;
    this.appPassword = appPassword;
    this.active = active;
    this.status = status;
  }

  addChannel(channel: Channel) {
    this.channels.push(channel);
  }
}
