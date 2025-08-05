import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnrichmentFieldsToIndicators1733432400000
  implements MigrationInterface
{
  name = 'AddEnrichmentFieldsToIndicators1733432400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "indicators" ADD "country_code" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "indicators" ADD "isp" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "indicators" ADD "abuse_score" integer`,
    );
    await queryRunner.query(`ALTER TABLE "indicators" ADD "domain_usage" text`);
    await queryRunner.query(
      `ALTER TABLE "indicators" ADD "latitude" numeric(10,7)`,
    );
    await queryRunner.query(
      `ALTER TABLE "indicators" ADD "longitude" numeric(10,7)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "indicators" DROP COLUMN "longitude"`);
    await queryRunner.query(`ALTER TABLE "indicators" DROP COLUMN "latitude"`);
    await queryRunner.query(
      `ALTER TABLE "indicators" DROP COLUMN "domain_usage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "indicators" DROP COLUMN "abuse_score"`,
    );
    await queryRunner.query(`ALTER TABLE "indicators" DROP COLUMN "isp"`);
    await queryRunner.query(
      `ALTER TABLE "indicators" DROP COLUMN "country_code"`,
    );
  }
}
