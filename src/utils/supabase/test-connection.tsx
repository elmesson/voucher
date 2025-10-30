import { supabase } from './unified-client';

// Testa a conexão com o Supabase de forma simples
export async function testSupabaseConnection(): Promise<{ success: boolean; tablesExist: boolean; error?: string }> {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    
    // Teste básico: tentar buscar apenas 1 registro da tabela companies
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error);
      
      // Verifica se é erro de tabela não existente
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: false,
          tablesExist: false,
          error: 'Tabelas não encontradas. Execute o SQL no Supabase para criar as tabelas.'
        };
      }
      
      return {
        success: false,
        tablesExist: false,
        error: `Erro de conexão: ${error.message}`
      };
    }
    
    console.log('✅ Supabase conectado com sucesso!');
    return {
      success: true,
      tablesExist: true
    };
    
  } catch (error: any) {
    console.error('❌ Falha crítica na conexão:', error);
    return {
      success: false,
      tablesExist: false,
      error: `Erro crítico: ${error.message || 'Sem conexão com o servidor'}`
    };
  }
}

// Testa se as principais tabelas existem
export async function checkRequiredTables(): Promise<{ allTablesExist: boolean; missingTables: string[] }> {
  const requiredTables = [
    'admins',
    'companies', 
    'shifts',
    'meal_types',
    'users',
    'meal_records'
  ];
  
  const missingTables: string[] = [];
  
  for (const tableName of requiredTables) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);
      
      if (error && (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist'))) {
        missingTables.push(tableName);
      }
    } catch (error) {
      missingTables.push(tableName);
    }
  }
  
  return {
    allTablesExist: missingTables.length === 0,
    missingTables
  };
}

// Verifica se há dados básicos (admin padrão)
export async function checkBasicData(): Promise<{ hasAdminUser: boolean; hasBasicData: boolean }> {
  try {
    // Verifica se existe o admin padrão
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('id')
      .eq('username', 'admin')
      .limit(1);
    
    const hasAdminUser = !adminError && adminData && adminData.length > 0;
    
    // Verifica se há dados básicos nas outras tabelas
    const { data: companiesData, error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    const hasBasicData = !companiesError && !usersError && 
                        companiesData && companiesData.length > 0 &&
                        usersData && usersData.length > 0;
    
    return {
      hasAdminUser,
      hasBasicData
    };
    
  } catch (error) {
    console.error('Erro ao verificar dados básicos:', error);
    return {
      hasAdminUser: false,
      hasBasicData: false
    };
  }
}