import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTagsAndJoinTable1754422672667 implements MigrationInterface {
    name = 'CreateTagsAndJoinTable1754422672667'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(50) NOT NULL, CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "indicator_tags" ("indicator_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_8d624e6a648b516dd9a76e86988" PRIMARY KEY ("indicator_id", "tag_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f944265c707b75388b536301bd" ON "indicator_tags" ("indicator_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0b725f31a16dbadf6bd8d57d8b" ON "indicator_tags" ("tag_id") `);
        await queryRunner.query(`ALTER TABLE "indicator_tags" ADD CONSTRAINT "FK_f944265c707b75388b536301bdb" FOREIGN KEY ("indicator_id") REFERENCES "indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "indicator_tags" ADD CONSTRAINT "FK_0b725f31a16dbadf6bd8d57d8b0" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "indicator_tags" DROP CONSTRAINT "FK_0b725f31a16dbadf6bd8d57d8b0"`);
        await queryRunner.query(`ALTER TABLE "indicator_tags" DROP CONSTRAINT "FK_f944265c707b75388b536301bdb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0b725f31a16dbadf6bd8d57d8b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f944265c707b75388b536301bd"`);
        await queryRunner.query(`DROP TABLE "indicator_tags"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }

}
