import { supabase as supabaseClient } from './unified-client';

export async function testConnectionFinal(): Promise<boolean> {
  try {
    console.log('🔄 Teste final de conexão com Supabase...');
    
    // Teste básico de conectividade
    const { data, error } = await supabaseClient.supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro no teste de conexão final:', error);
      return false;
    }
    
    console.log('✅ Conexão final estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro crítico no teste de conexão final:', error);
    return false;
  }
}

export async function testReportsQuery(): Promise<boolean> {
  try {
    console.log('🔄 Testando query de relatórios...');
    
    const { data, error } = await supabaseClient.supabase
      .from('meal_records')
      .select(`
        id,
        meal_date,
        meal_time,
        price,
        status,
        validation_method,
        created_at,
        user_id,
        meal_type_id,
        user:users!inner(
          id,
          full_name,
          voucher_code,
          department,
          position,
          company_id,
          company:companies(name),
          shift:shifts(
            name,
            start_time,
            end_time
          )
        ),
        meal_type:meal_types!inner(
          name,
          price
        )
      `)
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na query de relatórios:', error);
      return false;
    }
    
    console.log('✅ Query de relatórios funcionando:', data?.length || 0, 'registros');
    return true;
  } catch (error) {
    console.error('❌ Erro crítico na query de relatórios:', error);
    return false;
  }
}