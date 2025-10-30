// Teste específico para o sistema de refeições extras
import { supabase } from './unified-client';
import { notifications } from '../../components/NotificationSystem';

export async function testExtraMealsConnection(): Promise<boolean> {
  console.log('🧪 Iniciando teste de conexão para extra_meals...');
  
  try {
    // 1. Testar conexão básica
    console.log('📡 Testando conexão básica com Supabase...');
    const { error: pingError } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    if (pingError) {
      console.error('❌ Erro na conexão básica:', pingError);
      return false;
    }
    console.log('✅ Conexão básica OK');

    // 2. Testar se a tabela extra_meals existe
    console.log('📋 Verificando existência da tabela extra_meals...');
    const { error: tableError } = await supabase
      .from('extra_meals')
      .select('id')
      .limit(1);
    
    if (tableError) {
      if (tableError.code === '42P01' || tableError.message.includes('does not exist')) {
        console.error('❌ Tabela extra_meals não existe');
        notifications.error('Schema Necessário', 'A tabela extra_meals não existe. Execute o script CORRIGIR_EXTRA_MEALS_AGORA.sql');
        return false;
      }
      console.error('❌ Erro ao acessar extra_meals:', tableError);
      return false;
    }
    console.log('✅ Tabela extra_meals existe');

    // 3. Testar se as colunas necessárias existem
    console.log('🔍 Verificando colunas obrigatórias...');
    const { error: schemaError } = await supabase
      .from('extra_meals')
      .select('id, requested_by_name, external_name, external_company')
      .limit(1);
    
    if (schemaError) {
      if (schemaError.message.includes('column') && schemaError.message.includes('does not exist')) {
        console.error('❌ Colunas obrigatórias ausentes:', schemaError.message);
        notifications.error('Schema Desatualizado', 'Colunas necessárias não encontradas. Execute o script CORRIGIR_EXTRA_MEALS_AGORA.sql');
        return false;
      }
      console.error('❌ Erro no schema:', schemaError);
      return false;
    }
    console.log('✅ Schema das colunas OK');

    // 4. Testar query completa com relacionamentos
    console.log('🔗 Testando query com relacionamentos...');
    const { error: relationError } = await supabase
      .from('extra_meals')
      .select(`
        id,
        user:users(
          id,
          full_name,
          company:companies(name)
        ),
        meal_type:meal_types(
          name,
          price
        )
      `)
      .limit(1);
    
    if (relationError) {
      console.error('❌ Erro nos relacionamentos:', relationError);
      // Não bloquear por relacionamentos, apenas avisar
      console.warn('⚠️ Relacionamentos podem ter problemas, mas tabela principal está acessível');
    } else {
      console.log('✅ Relacionamentos OK');
    }

    console.log('🎉 Teste de conexão extra_meals concluído com sucesso!');
    return true;

  } catch (error: any) {
    console.error('❌ Erro crítico no teste de extra_meals:', error);
    
    if (error.message?.includes('Failed to fetch')) {
      notifications.error('Erro de Rede', 'Não foi possível conectar ao Supabase. Verifique sua conexão com a internet.');
    } else {
      notifications.error('Erro de Teste', 'Falha no teste de conexão do sistema de refeições extras.');
    }
    
    return false;
  }
}

export async function validateExtraMealsSchema(): Promise<{ isValid: boolean; missingColumns: string[] }> {
  const requiredColumns = [
    'id', 
    'user_id', 
    'meal_type_id', 
    'meal_date', 
    'reason', 
    'requested_by_name', 
    'status',
    'external_name',
    'external_company',
    'external_document'
  ];
  
  const missingColumns: string[] = [];
  
  try {
    console.log('🔍 Validando schema completo da tabela extra_meals...');
    
    // Tentar selecionar cada coluna individualmente para identificar quais estão faltando
    for (const column of requiredColumns) {
      try {
        const { error } = await supabase
          .from('extra_meals')
          .select(column)
          .limit(1);
        
        if (error && error.message.includes('does not exist')) {
          missingColumns.push(column);
        }
      } catch (columnError: any) {
        if (columnError.message?.includes('does not exist')) {
          missingColumns.push(column);
        }
      }
    }
    
    const isValid = missingColumns.length === 0;
    
    if (isValid) {
      console.log('✅ Schema completo válido');
    } else {
      console.error('❌ Colunas faltando:', missingColumns);
    }
    
    return { isValid, missingColumns };
    
  } catch (error) {
    console.error('❌ Erro na validação do schema:', error);
    return { isValid: false, missingColumns: [...requiredColumns] };
  }
}

// Função para executar teste completo e exibir resultados
export async function runFullExtraMealsTest(): Promise<void> {
  console.log('🚀 Executando teste completo do sistema de refeições extras...');
  
  const connectionOk = await testExtraMealsConnection();
  const schemaValidation = await validateExtraMealsSchema();
  
  if (connectionOk && schemaValidation.isValid) {
    console.log('🎉 Teste completo passou! Sistema de refeições extras está funcionando.');
    notifications.success('Teste Concluído', 'Sistema de refeições extras está funcionando perfeitamente.');
  } else {
    console.error('❌ Teste completo falhou!');
    
    if (!connectionOk) {
      console.error('- Problema de conexão');
    }
    
    if (!schemaValidation.isValid) {
      console.error('- Problemas no schema:', schemaValidation.missingColumns);
      notifications.error(
        'Schema Incompleto', 
        `Colunas faltando: ${schemaValidation.missingColumns.join(', ')}. Execute o script SQL de correção.`
      );
    }
  }
}