import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class InitialSchema1708000000000 implements MigrationInterface {
  name = 'InitialSchema1708000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'walletAddress',
            type: 'varchar',
            length: '42',
            isUnique: true,
          },
          {
            name: 'nonce',
            type: 'varchar',
            length: '32',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'role',
            type: 'varchar',
            length: '20',
            default: "'user'",
          },
          {
            name: 'balance',
            type: 'text',
            default: "'0'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Markets table
    await queryRunner.createTable(
      new Table({
        name: 'markets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'symbol',
            type: 'varchar',
            length: '20',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'marketType',
            type: 'varchar',
            length: '20',
            default: "'15min'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'feeRate',
            type: 'decimal',
            precision: 5,
            scale: 4,
            default: 0.03,
          },
          {
            name: 'minBetAmount',
            type: 'text',
            default: "'1000000000000000'",
          },
          {
            name: 'maxBetAmount',
            type: 'text',
            default: "'1000000000000000000'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Rounds table
    await queryRunner.createTable(
      new Table({
        name: 'rounds',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'roundNumber',
            type: 'int',
          },
          {
            name: 'marketId',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'open'",
          },
          {
            name: 'startPrice',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'lockPrice',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'endPrice',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'outcome',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'totalUpPool',
            type: 'text',
            default: "'0'",
          },
          {
            name: 'totalDownPool',
            type: 'text',
            default: "'0'",
          },
          {
            name: 'startsAt',
            type: 'timestamp',
          },
          {
            name: 'bettingEndsAt',
            type: 'timestamp',
          },
          {
            name: 'settlesAt',
            type: 'timestamp',
          },
          {
            name: 'settledAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Bets table
    await queryRunner.createTable(
      new Table({
        name: 'bets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'roundId',
            type: 'uuid',
          },
          {
            name: 'position',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'amount',
            type: 'text',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'payout',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'payoutMultiplier',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'rounds',
      new TableForeignKey({
        columnNames: ['marketId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'markets',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'bets',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'bets',
      new TableForeignKey({
        columnNames: ['roundId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rounds',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_walletAddress',
        columnNames: ['walletAddress'],
      }),
    );

    await queryRunner.createIndex(
      'markets',
      new TableIndex({
        name: 'IDX_markets_symbol',
        columnNames: ['symbol'],
      }),
    );

    await queryRunner.createIndex(
      'rounds',
      new TableIndex({
        name: 'IDX_rounds_marketId_status',
        columnNames: ['marketId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'bets',
      new TableIndex({
        name: 'IDX_bets_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'bets',
      new TableIndex({
        name: 'IDX_bets_roundId',
        columnNames: ['roundId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const betsTable = await queryRunner.getTable('bets');
    if (betsTable) {
      const foreignKeys = betsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('bets', fk);
      }
    }

    const roundsTable = await queryRunner.getTable('rounds');
    if (roundsTable) {
      const foreignKeys = roundsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('rounds', fk);
      }
    }

    // Drop tables
    await queryRunner.dropTable('bets', true);
    await queryRunner.dropTable('rounds', true);
    await queryRunner.dropTable('markets', true);
    await queryRunner.dropTable('users', true);
  }
}
