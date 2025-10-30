import { supabase } from './unified-client';

export async function testSupabaseConnection(): Promise<boolean> {
  try {
    console.log('🔄 Testando conexão com Supabase...');
    
    // Teste simples de conectividade usando uma query básica
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro no teste de conexão:', error);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro crítico no teste de conexão:', error);
    return false;
  }
}

export async function testAllTables(): Promise<{ [key: string]: boolean }> {
  const tables = ['companies', 'users', 'shifts', 'meal_types', 'meal_records', 'managers'];
  const results: { [key: string]: boolean } = {};
  
  for (const table of tables) {
    try {
      console.log(`🔄 Testando tabela: ${table}`);
      
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      results[table] = !error;
      
      if (error) {
        console.error(`❌ Erro na tabela ${table}:`, error);
      } else {
        console.log(`✅ Tabela ${table} OK`);
      }
    } catch (error) {
      console.error(`❌ Erro crítico na tabela ${table}:`, error);
      results[table] = false;
    }
  }
  
  return results;
}

export async function getConnectionInfo(): Promise<{
  connected: boolean;
  tables: { [key: string]: boolean };
  totalRecords: { [key: string]: number };
}> {
  try {
    const connected = await testSupabaseConnection();
    
    if (!connected) {
      return {
        connected: false,
        tables: {},
        totalRecords: {}
      };
    }
    
    const tables = await testAllTables();
    const totalRecords: { [key: string]: number } = {};
    
    // Contar registros em cada tabela
    for (const [table, isWorking] of Object.entries(tables)) {
      if (isWorking) {
        try {
          // Usar fallback direto: buscar todos e contar
          const { data: allData, error: countError } = await supabase
            .from(table)
            .select('id');
          
          totalRecords[table] = countError ? 0 : (allData?.length || 0);
        } catch (error) {
          console.error(`❌ Erro ao contar registros da tabela ${table}:`, error);
          totalRecords[table] = 0;
        }
      } else {
        totalRecords[table] = 0;
      }
    }
    
    return {
      connected,
      tables,
      totalRecords
    };
  } catch (error) {
    console.error('❌ Erro ao obter informações de conexão:', error);
    return {
      connected: false,
      tables: {},
      totalRecords: {}
    };
  }
}