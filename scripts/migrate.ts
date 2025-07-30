// scripts/migrate.ts
import { migrator } from '../src/infrastructure/database/migrator';

async function main() {
    try {
        console.log('🔍 Testando conexão com banco...');
        const connected = await migrator.testConnection();

        if (!connected) {
            console.error('❌ Não foi possível conectar ao banco');
            process.exit(1);
        }

        console.log('\n🔄 Executando migrations...');
        await migrator.runPendingMigrations();

        console.log('\n🎉 Migrations concluídas com sucesso!');
    } catch (error) {
        console.error('💥 Erro durante migration:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

main();

