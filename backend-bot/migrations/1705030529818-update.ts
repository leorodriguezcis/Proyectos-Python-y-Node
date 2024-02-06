import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1705030529818 implements MigrationInterface {
    name = 'Update1705030529818'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "channel" ("id" int NOT NULL IDENTITY(1,1), "name" nvarchar(255) NOT NULL, "status" nvarchar(255) NOT NULL CONSTRAINT "DF_9a8e4f4087b5f8abcf37e84506b" DEFAULT 'DISCONNECTED', "bot_id" int, CONSTRAINT "PK_590f33ee6ee7d76437acf362e39" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_cace4a159ff9f2512dd42373760" DEFAULT NEWSEQUENTIALID(), "firstName" nvarchar(255) NOT NULL, "lastName" nvarchar(255) NOT NULL, "isActive" bit NOT NULL CONSTRAINT "DF_fde2ce12ab12b02ae583dd76c7c" DEFAULT 1, "username" nvarchar(255) NOT NULL, "email" nvarchar(255) NOT NULL, "password" nvarchar(255) NOT NULL, "createdAt" datetime NOT NULL CONSTRAINT "DF_e11e649824a45d8ed01d597fd93" DEFAULT getdate(), "updatedAt" datetime NOT NULL CONSTRAINT "DF_80ca6e6ef65fb9ef34ea8c90f42" DEFAULT getdate(), "deletedAt" datetime, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bot" ("id" int NOT NULL IDENTITY(1,1), "name" nvarchar(255) NOT NULL, "objective" nvarchar(255) NOT NULL, "groupId" int NOT NULL, "active" bit NOT NULL CONSTRAINT "DF_24ebc7f57cba755fabf20c9d372" DEFAULT 1, "status" nvarchar(255) NOT NULL CONSTRAINT "DF_3d4bbdb9a52b8c09ebe6eb3d12b" DEFAULT 'TO_TRAIN', "newMemberWelcome" nvarchar(255) NOT NULL CONSTRAINT "DF_f8061a4a123c4496b776c51d27f" DEFAULT 'Encantado de saludarte', "inactivityMessage" nvarchar(255) NOT NULL CONSTRAINT "DF_ba2fce4df6ea71b97e1f68836a1" DEFAULT 'En este momento no me encuentro disponible, por favor intenta más tarde.', "appId" nvarchar(255) NOT NULL CONSTRAINT "DF_ee559e79af06fbe93ddd0480297" DEFAULT '', "appPassword" nvarchar(255) NOT NULL CONSTRAINT "DF_40cf1ad16850beac4981a655b4c" DEFAULT '', "tenant" nvarchar(255) NOT NULL CONSTRAINT "DF_8d200cb009dea012ddf6921f89f" DEFAULT '', "resource" nvarchar(255) NOT NULL CONSTRAINT "DF_3d393992fe3b48fa13f0903c09e" DEFAULT '', "subscriptionId" nvarchar(255) NOT NULL CONSTRAINT "DF_03b97dc0925f1781f669cf77ba4" DEFAULT '', "appName" nvarchar(255), "userId" uniqueidentifier, CONSTRAINT "PK_bc6d59d7870eb2efd5f7f61e5ca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "channel" ADD CONSTRAINT "FK_82da258fe45382a03c820a8daf4" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bot" ADD CONSTRAINT "FK_21a08745ccbe41631b8fc8d8e7e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bot" DROP CONSTRAINT "FK_21a08745ccbe41631b8fc8d8e7e"`);
        await queryRunner.query(`ALTER TABLE "channel" DROP CONSTRAINT "FK_82da258fe45382a03c820a8daf4"`);
        await queryRunner.query(`DROP TABLE "bot"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "channel"`);
    }

}
