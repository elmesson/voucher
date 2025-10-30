// Diagnósticos completos do sistema para identificar problemas
import { testSupabaseConnection } from './connection-test';
import { testExtraMealsConnection, validateExtraMealsSchema } from './extra-meals-test';
import { supabase } from './unified-client';

interface SystemDiagnostics {
  timestamp: string;
  connection: {
    basic: boolean;
    supabase: boolean;
    networkError: boolean;
  };
  tables: {
    companies: boolean;
    users: boolean;
    meal_types: boolean;
    shifts: boolean;
    managers: boolean;
    extra_meals: boolean;
  };
  extraMeals: {
    tableExists: boolean;
    schemaValid: boolean;
    missingColumns: string[];
    canRead: boolean;
    canWrite: boolean;
  };
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export async function runSystemDiagnostics(): Promise<SystemDiagnostics> {
  const startTime = new Date();
  console.log('🏥 Iniciando diagnósticos completos do sistema...');
  
  const diagnostics: SystemDiagnostics = {
    timestamp: startTime.toISOString(),
    connection: {
      basic: false,
      supabase: false,
      networkError: false
    },
    tables: {
      companies: false,
      users: false,
      meal_types: false,
      shifts: false,
      managers: false,
      extra_meals: false
    },
    extraMeals: {
      tableExists: false,
      schemaValid: false,
      missingColumns: [],
      canRead: false,
      canWrite: false
    },
    errors: [],
    warnings: [],
    recommendations: []
  };

  try {
    // 1. Teste de conectividade básica
    console.log('🔌 Testando conectividade básica...');
    try {
      const response = await fetch('https://dhgomondxqugynhggqji.supabase.co/', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      diagnostics.connection.basic = response.ok || response.status < 500;
      
      if (!diagnostics.connection.basic) {
        diagnostics.errors.push('Conectividade básica com Supabase falhou');
      }
    } catch (error: any) {
      diagnostics.connection.networkError = error.name === 'TypeError' && error.message.includes('Failed to fetch');
      diagnostics.errors.push(`Erro de rede: ${error.message}`);
    }

    // 2. Teste de conexão Supabase
    console.log('🗄️ Testando conexão com banco Supabase...');
    try {
      diagnostics.connection.supabase = await testSupabaseConnection();
      
      if (!diagnostics.connection.supabase) {
        diagnostics.errors.push('Falha na autenticação ou acesso ao banco Supabase');
      }
    } catch (error: any) {
      diagnostics.errors.push(`Erro na conexão Supabase: ${error.message}`);
    }

    // 3. Teste das tabelas principais
    console.log('📋 Testando acesso às tabelas principais...');
    const mainTables = ['companies', 'users', 'meal_types', 'shifts', 'managers'];
    
    for (const table of mainTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        diagnostics.tables[table as keyof typeof diagnostics.tables] = !error;
        
        if (error) {
          diagnostics.errors.push(`Tabela ${table}: ${error.message}`);
        }
      } catch (error: any) {
        diagnostics.errors.push(`Erro crítico na tabela ${table}: ${error.message}`);
      }
    }

    // 4. Teste específico da tabela extra_meals
    console.log('🍽️ Testando sistema de refeições extras...');
    try {
      const extraMealsTest = await testExtraMealsConnection();
      diagnostics.tables.extra_meals = extraMealsTest;
      diagnostics.extraMeals.tableExists = extraMealsTest;
      
      if (extraMealsTest) {
        const schemaValidation = await validateExtraMealsSchema();
        diagnostics.extraMeals.schemaValid = schemaValidation.isValid;
        diagnostics.extraMeals.missingColumns = schemaValidation.missingColumns;
        
        // Teste de leitura
        try {
          const { error: readError } = await supabase
            .from('extra_meals')
            .select('id, requested_by_name')
            .limit(1);
          diagnostics.extraMeals.canRead = !readError;
          
          if (readError) {
            diagnostics.errors.push(`Erro de leitura extra_meals: ${readError.message}`);
          }
        } catch (error: any) {
          diagnostics.errors.push(`Erro crítico de leitura extra_meals: ${error.message}`);
        }
        
        if (!schemaValidation.isValid) {
          diagnostics.warnings.push(`Colunas faltando na extra_meals: ${schemaValidation.missingColumns.join(', ')}`);
          diagnostics.recommendations.push('Execute o script CORRIGIR_EXTRA_MEALS_AGORA.sql no Supabase SQL Editor');
        }
      } else {
        diagnostics.errors.push('Tabela extra_meals não está acessível');
        diagnostics.recommendations.push('Verifique se a tabela extra_meals foi criada no banco de dados');
      }
    } catch (error: any) {
      diagnostics.errors.push(`Erro no teste de refeições extras: ${error.message}`);
    }

    // 5. Análise geral e recomendações
    const workingTables = Object.values(diagnostics.tables).filter(Boolean).length;
    const totalTables = Object.keys(diagnostics.tables).length;
    
    if (workingTables === 0) {
      diagnostics.errors.push('CRÍTICO: Nenhuma tabela está acessível');
      diagnostics.recommendations.push('Verifique as credenciais do Supabase e execute os scripts de migração');
    } else if (workingTables < totalTables) {
      diagnostics.warnings.push(`Apenas ${workingTables} de ${totalTables} tabelas estão funcionando`);
    }

    if (diagnostics.connection.networkError) {
      diagnostics.recommendations.push('Verifique sua conexão com a internet');
    }

    if (!diagnostics.extraMeals.schemaValid && diagnostics.extraMeals.tableExists) {
      diagnostics.recommendations.push('Schema da tabela extra_meals precisa ser atualizado');
    }

  } catch (error: any) {
    diagnostics.errors.push(`Erro geral nos diagnósticos: ${error.message}`);
  }

  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();
  
  console.log(`🏁 Diagnósticos concluídos em ${duration}ms`);
  return diagnostics;
}

export function printDiagnosticsReport(diagnostics: SystemDiagnostics): void {
  console.log('\n🏥 RELATÓRIO DE DIAGNÓSTICOS DO SISTEMA');
  console.log('==========================================');
  console.log(`⏰ Executado em: ${new Date(diagnostics.timestamp).toLocaleString('pt-BR')}`);
  
  // Status de Conexão
  console.log('\n🔌 STATUS DE CONEXÃO:');
  console.log(`   Conectividade básica: ${diagnostics.connection.basic ? '✅' : '❌'}`);
  console.log(`   Supabase autenticado: ${diagnostics.connection.supabase ? '✅' : '❌'}`);
  console.log(`   Erro de rede: ${diagnostics.connection.networkError ? '⚠️ SIM' : '✅ NÃO'}`);
  
  // Status das Tabelas
  console.log('\n📋 STATUS DAS TABELAS:');
  Object.entries(diagnostics.tables).forEach(([table, working]) => {
    console.log(`   ${table}: ${working ? '✅' : '❌'}`);
  });
  
  // Refeições Extras
  console.log('\n🍽️ SISTEMA DE REFEIÇÕES EXTRAS:');
  console.log(`   Tabela existe: ${diagnostics.extraMeals.tableExists ? '✅' : '❌'}`);
  console.log(`   Schema válido: ${diagnostics.extraMeals.schemaValid ? '✅' : '❌'}`);
  console.log(`   Pode ler dados: ${diagnostics.extraMeals.canRead ? '✅' : '❌'}`);
  
  if (diagnostics.extraMeals.missingColumns.length > 0) {
    console.log(`   ⚠️ Colunas faltando: ${diagnostics.extraMeals.missingColumns.join(', ')}`);
  }
  
  // Erros
  if (diagnostics.errors.length > 0) {
    console.log('\n❌ ERROS ENCONTRADOS:');
    diagnostics.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  }
  
  // Avisos
  if (diagnostics.warnings.length > 0) {
    console.log('\n⚠️ AVISOS:');
    diagnostics.warnings.forEach((warning, i) => {
      console.log(`   ${i + 1}. ${warning}`);
    });
  }
  
  // Recomendações
  if (diagnostics.recommendations.length > 0) {
    console.log('\n💡 RECOMENDAÇÕES:');
    diagnostics.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  }
  
  // Status Geral
  const hasErrors = diagnostics.errors.length > 0;
  const hasWarnings = diagnostics.warnings.length > 0;
  
  console.log('\n🎯 STATUS GERAL:');
  if (!hasErrors && !hasWarnings) {
    console.log('   ✅ Sistema funcionando perfeitamente!');
  } else if (!hasErrors && hasWarnings) {
    console.log('   ⚠️ Sistema funcionando com algumas limitações');
  } else {
    console.log('   ❌ Sistema com problemas que precisam ser corrigidos');
  }
  
  console.log('\n==========================================');
}

// Função para executar diagnósticos e imprimir relatório
export async function runAndPrintDiagnostics(): Promise<SystemDiagnostics> {
  const diagnostics = await runSystemDiagnostics();
  printDiagnosticsReport(diagnostics);
  return diagnostics;
}