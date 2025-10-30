import { testSupabaseConnection, testAllTables, getConnectionInfo } from './connection-test';

export async function runFullDiagnostic() {
  console.log('🔧 === DIAGNÓSTICO COMPLETO DO SUPABASE ===');
  
  try {
    // 1. Teste básico de conexão
    console.log('\n📡 1. Testando conexão básica...');
    const basicConnection = await testSupabaseConnection();
    console.log(`Resultado: ${basicConnection ? '✅ Conectado' : '❌ Falha na conexão'}`);
    
    if (!basicConnection) {
      console.log('❌ Conexão básica falhou. Verifique:');
      console.log('   - URL do projeto Supabase');
      console.log('   - Chave pública (anon key)');
      console.log('   - Conectividade com a internet');
      return;
    }
    
    // 2. Teste de todas as tabelas
    console.log('\n📋 2. Testando tabelas...');
    const tables = await testAllTables();
    
    Object.entries(tables).forEach(([table, status]) => {
      console.log(`   ${table}: ${status ? '✅' : '❌'}`);
    });
    
    // 3. Informações completas
    console.log('\n📊 3. Obtendo informações detalhadas...');
    const info = await getConnectionInfo();
    
    console.log('\n📈 Contagem de registros por tabela:');
    Object.entries(info.totalRecords).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} registros`);
    });
    
    // 4. Verificações específicas
    console.log('\n🔍 4. Verificações específicas...');
    
    // Verificar se há dados de teste
    const hasCompanies = info.totalRecords.companies > 0;
    const hasUsers = info.totalRecords.users > 0;
    const hasMealTypes = info.totalRecords.meal_types > 0;
    
    console.log(`   Empresas cadastradas: ${hasCompanies ? '✅' : '⚠️'} (${info.totalRecords.companies})`);
    console.log(`   Usuários cadastrados: ${hasUsers ? '✅' : '⚠️'} (${info.totalRecords.users})`);
    console.log(`   Tipos de refeição: ${hasMealTypes ? '✅' : '⚠️'} (${info.totalRecords.meal_types})`);
    
    // 5. Recomendações
    console.log('\n💡 5. Recomendações:');
    
    if (!hasCompanies) {
      console.log('   ⚠️ Cadastre pelo menos uma empresa');
    }
    
    if (!hasMealTypes) {
      console.log('   ⚠️ Cadastre pelo menos um tipo de refeição');
    }
    
    if (!hasUsers) {
      console.log('   ⚠️ Cadastre pelo menos um usuário para testar o sistema');
    }
    
    if (hasCompanies && hasMealTypes && hasUsers) {
      console.log('   ✅ Sistema pronto para uso!');
    }
    
    console.log('\n🔧 === FIM DO DIAGNÓSTICO ===');
    
    return {
      connected: basicConnection,
      tables,
      info,
      recommendations: {
        needsCompanies: !hasCompanies,
        needsMealTypes: !hasMealTypes,
        needsUsers: !hasUsers,
        isReady: hasCompanies && hasMealTypes && hasUsers
      }
    };
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error);
    return null;
  }
}

// Função para executar diagnóstico via console
export function diagSupabase() {
  return runFullDiagnostic();
}

// Adicionar ao objeto window para facilitar uso no console
if (typeof window !== 'undefined') {
  (window as any).diagSupabase = diagSupabase;
  console.log('💡 Dica: Digite "diagSupabase()" no console para executar diagnóstico completo');
  
  // Executar diagnóstico automático do sistema de refeições extras
  import('./system-diagnostics').then(async ({ runAndPrintDiagnostics }) => {
    try {
      console.log('🔄 Executando diagnóstico automático do sistema...');
      await runAndPrintDiagnostics();
    } catch (error) {
      console.error('❌ Falha no diagnóstico automático:', error);
    }
  }).catch(() => {
    console.log('ℹ️ Diagnóstico detalhado não disponível - use diagSupabase() para teste básico');
  });
}