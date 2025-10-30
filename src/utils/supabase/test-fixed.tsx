import { supabase as supabaseClient } from './unified-client';

// Teste de conectividade simples
export const testSupabaseConnection = async () => {
  console.log('🧪 Iniciando teste de conectividade com Supabase...');
  
  try {
    const isConnected = await supabaseClient.testConnection();
    
    if (isConnected) {
      console.log('✅ Supabase conectado com sucesso!');
      
      // Teste de busca de dados básicos
      try {
        const companies = await supabaseClient.getCompanies();
        console.log(`✅ Empresas carregadas: ${companies.length} encontradas`);
        
        const mealTypes = await supabaseClient.getMealTypes();
        console.log(`✅ Tipos de refeição carregados: ${mealTypes.length} encontrados`);
        
        console.log('🎉 Todos os testes passaram com sucesso!');
        return true;
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        return false;
      }
    } else {
      console.error('❌ Falha na conexão com Supabase');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro durante teste de conexão:', error);
    return false;
  }
};

// Teste específico para operações de voucher
export const testVoucherOperations = async (testVoucherCode: string = '1234') => {
  console.log(`🧪 Testando operações de voucher com código: ${testVoucherCode}`);
  
  try {
    const user = await supabaseClient.getUserByVoucher(testVoucherCode);
    
    if (user) {
      console.log(`✅ Usuário encontrado: ${user.full_name}`);
      
      // Test meal count check
      const today = new Date().toISOString().split('T')[0];
      const mealCount = await supabaseClient.getMealCountForUser(user.id, today);
      console.log(`✅ Contagem de refeições hoje: ${mealCount}`);
      
      return true;
    } else {
      console.log(`ℹ️ Nenhum usuário encontrado para o voucher ${testVoucherCode}`);
      return true; // Not an error, just no user found
    }
  } catch (error) {
    console.error('❌ Erro nas operações de voucher:', error);
    return false;
  }
};

// Executar testes automaticamente em desenvolvimento
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run tests after a short delay to allow the app to initialize
  setTimeout(() => {
    testSupabaseConnection();
  }, 2000);
}