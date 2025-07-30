// src/infrastructure/database/migrator.ts
import { pool } from './connection';
import fs from 'fs';
import path from 'path';

interface Migration {
    id: number;
    name: string;
    sql: string;
}

class Migrator {
    private migrationsPath = path.join(__dirname, '../../../migrations');

    async init() {
        // Criar tabela de migrations se não existir
        await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    }

    async getExecutedMigrations(): Promise<number[]> {
        const result = await pool.query('SELECT id FROM migrations ORDER BY id');
        return result.rows.map(row => row.id);
    }

    async getMigrationFiles(): Promise<Migration[]> {
        const files = fs.readdirSync(this.migrationsPath)
            .filter(file => file.endsWith('.sql'))
            .sort();

        return files.map(file => {
            const match = file.match(/^(\d+)_(.+)\.sql$/);
            if (!match) throw new Error(`Invalid migration filename: ${file}`);

            const [, idStr, name] = match;
            const sql = fs.readFileSync(path.join(this.migrationsPath, file), 'utf8');

            return {
                id: parseInt(idStr || '0'),
                name: (name || 'unnamed').replace(/_/g, ' '),
                sql
            };
        });
    }

    async runPendingMigrations() {
        await this.init();

        const executed = await this.getExecutedMigrations();
        const migrations = await this.getMigrationFiles();

        const pending = migrations.filter(m => !executed.includes(m.id));

        if (pending.length === 0) {
            console.log('✅ Nenhuma migration pendente');
            return;
        }

        console.log(`🔄 Executando ${pending.length} migration(s)...`);

        for (const migration of pending) {
            try {
                await pool.query('BEGIN');
                await pool.query(migration.sql);
                await pool.query(
                    'INSERT INTO migrations (id, name) VALUES ($1, $2)',
                    [migration.id, migration.name]
                );
                await pool.query('COMMIT');
                console.log(`✅ Migration ${migration.id}: ${migration.name}`);
            } catch (error) {
                await pool.query('ROLLBACK');
                console.error(`❌ Erro na migration ${migration.id}:`, error);
                throw error;
            }
        }
    }

    async testConnection() {
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT NOW() as server_time, version() as postgres_version');
            console.log('✅ Conexão com PostgreSQL funcionando!');
            console.log('📅 Hora do servidor:', result.rows[0].server_time);
            console.log('🐘 Versão PostgreSQL:', result.rows[0].postgres_version.split(' ')[0]);
            client.release();
            return true;
        } catch (error) {
            console.error('❌ Erro na conexão:', error);
            return false;
        }
    }
}

export const migrator = new Migrator();