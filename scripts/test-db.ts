// scripts/test-db.ts
import { migrator } from '../src/infrastructure/database/migrator';

async function testDatabase() {
    console.log('🧪 Testando conexão com PostgreSQL...\n');

    const connected = await migrator.testConnection();

    if (connected) {
        console.log('\n✅ Banco de dados configurado corretamente!');
    } else {
        console.log('\n❌ Problemas na configuração do banco');
    }

    process.exit(0);
}

testDatabase();