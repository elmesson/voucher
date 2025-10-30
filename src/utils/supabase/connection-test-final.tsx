import { supabase } from './client-stable';
import { projectId, publicAnonKey } from './info';

// Teste de conectividade mais simples e direto
export async function testBasicConnection(): Promise<boolean> {
  try {
    console.log('🔗 Iniciando teste básico de conectividade...');
    
    // Teste 1: Verificar se as credenciais existem
    if (!projectId || !publicAnonKey) {
      console.error('❌ Credenciais não configuradas');
      return false;
    }

    console.log('✅ Credenciais presentes');

    // Teste 2: Ping simples ao servidor
    try {
      const pingResponse = await fetch(`https://${projectId}.supabase.co`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      console.log('✅ Servidor acessível:', pingResponse.status);
    } catch (pingError) {
      console.warn('⚠️ Ping falhou, mas continuando...', pingError);
    }

    // Teste 3: Query simples
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Erro na query:', error);
      return false;
    }

    console.log('✅ Query executada com sucesso');
    console.log('📊 Dados retornados:', data ? `${data.length} registros` : 'nenhum registro');
    
    return true;

  } catch (error: any) {
    console.error('❌ Erro no teste de conectividade:', error);
    return false;
  }
}

// Teste abrangente de todas as operações principais
export async function testAllOperations(): Promise<{
  overall: boolean;
  details: { [key: string]: boolean };
}> {
  const results: { [key: string]: boolean } = {};
  
  try {
    console.log('🔍 Iniciando testes abrangentes...');

    // Teste de conexão básica
    results.connection = await testBasicConnection();
    
    // Teste de busca de empresas
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name')
        .limit(5);
      results.companies = Array.isArray(companies);
      console.log(`✅ Empresas: ${companies?.length || 0} encontradas`);
    } catch (error) {
      console.error('❌ Erro ao buscar empresas:', error);
      results.companies = false;
    }

    // Teste de busca de usuários
    try {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, voucher_code')
        .limit(5);
      results.users = Array.isArray(users);
      console.log(`✅ Usuários: ${users?.length || 0} encontrados`);
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      results.users = false;
    }

    // Teste de busca de tipos de refeição
    try {
      const { data: mealTypes } = await supabase
        .from('meal_types')
        .select('id, name, is_active')
        .limit(5);
      results.mealTypes = Array.isArray(mealTypes);
      console.log(`✅ Tipos de refeição: ${mealTypes?.length || 0} encontrados`);
    } catch (error) {
      console.error('❌ Erro ao buscar tipos de refeição:', error);
      results.mealTypes = false;
    }

    // Teste de busca de turnos
    try {
      const { data: shifts } = await supabase
        .from('shifts')
        .select('id, name, is_active')
        .limit(5);
      results.shifts = Array.isArray(shifts);
      console.log(`✅ Turnos: ${shifts?.length || 0} encontrados`);
    } catch (error) {
      console.error('❌ Erro ao buscar turnos:', error);
      results.shifts = false;
    }

    const overall = Object.values(results).some(result => result === true);
    
    console.log('📊 Resultados dos testes:', results);
    console.log(`🎯 Resultado geral: ${overall ? 'SUCESSO' : 'FALHA'}`);
    
    return { overall, details: results };

  } catch (error) {
    console.error('❌ Erro crítico nos testes:', error);
    return { 
      overall: false, 
      details: { 
        error: false,
        ...results 
      } 
    };
  }
}

// Função para debugging rápido no console do navegador
export async function debugConnection() {
  console.log('🚀 === DEBUG DE CONEXÃO SUPABASE ===');
  console.log('📋 Informações básicas:');
  console.log('  - Project ID:', projectId);
  console.log('  - API Key presente:', !!publicAnonKey);
  console.log('  - URL:', `https://${projectId}.supabase.co`);
  
  const basicTest = await testBasicConnection();
  console.log('🔗 Teste básico:', basicTest ? 'PASSOU' : 'FALHOU');
  
  if (basicTest) {
    const fullTest = await testAllOperations();
    console.log('🎯 Teste completo:', fullTest.overall ? 'PASSOU' : 'FALHOU');
    console.log('📊 Detalhes:', fullTest.details);
  }
  
  console.log('='.repeat(40));
  
  return basicTest;
}

// Tornar disponível no window para debugging manual
if (typeof window !== 'undefined') {
  (window as any).debugSupabase = debugConnection;
  console.log('🔧 Use window.debugSupabase() para testar a conexão');
}