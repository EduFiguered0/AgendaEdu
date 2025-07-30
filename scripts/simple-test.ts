import { Pool } from 'pg';

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'agendaedu',
    user: 'postgres',
    password: 'postgres123',
});

async function test() {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Conexão funcionando!', result.rows[0]);
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await pool.end();
    }
}

test();