import { supabase } from './client-stable';
import { projectId, publicAnonKey } from './info';

// Diagnóstico simples e rápido
export async function quickDiagnostic(): Promise<{
  success: boolean;
  errors: string[];
  details: { [key: string]: any };
}> {
  const errors: string[] = [];
  const details: { [key: string]: any } = {};

  try {
    // 1. Verificar credenciais
    if (!projectId || !publicAnonKey) {
      errors.push('Credenciais do Supabase não configuradas');
      details.credentials = { projectId: !!projectId, publicAnonKey: !!publicAnonKey };
    } else {
      details.credentials = 'OK';
    }

    // 2. Verificar se o cliente foi criado
    if (!supabase || typeof supabase.from !== 'function') {
      errors.push('Cliente Supabase não inicializado corretamente');
      details.client = 'FALHA';
    } else {
      details.client = 'OK';
    }

    // 3. Teste de query simples com timeout curto
    try {
      console.log('🔍 Executando teste de query simples...');
      
      const { data, error } = await Promise.race([
        supabase.from('companies').select('id').limit(1),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);

      if (error) {
        errors.push(`Erro na query: ${error.message}`);
        details.query = `ERRO: ${error.message}`;
      } else {
        details.query = 'OK';
        details.queryResult = Array.isArray(data) ? `${data.length} registros` : 'Vazio';
      }
    } catch (queryError: any) {
      const errorMsg = queryError.message || 'Erro desconhecido na query';
      errors.push(`Falha na query: ${errorMsg}`);
      details.query = `FALHA: ${errorMsg}`;
    }

    // 4. Verificar informações do projeto
    details.projectInfo = {
      url: `https://${projectId}.supabase.co`,
      projectId: projectId?.substring(0, 8) + '...',
      timestamp: new Date().toISOString()
    };

    const success = errors.length === 0;
    
    console.log('📊 Resultado do diagnóstico:', { success, errors, details });
    
    return { success, errors, details };

  } catch (criticalError: any) {
    const errorMsg = criticalError.message || 'Erro crítico no diagnóstico';
    errors.push(`Erro crítico: ${errorMsg}`);
    details.criticalError = errorMsg;
    
    return { success: false, errors, details };
  }
}

// Função para executar diagnóstico e logar resultado
export async function runQuickDiagnostic(): Promise<boolean> {
  try {
    console.log('🚀 Iniciando diagnóstico rápido...');
    const result = await quickDiagnostic();
    
    if (result.success) {
      console.log('✅ Diagnóstico bem-sucedido:', result.details);
    } else {
      console.error('❌ Problemas encontrados:', result.errors);
      console.log('📋 Detalhes:', result.details);
    }
    
    return result.success;
  } catch (error) {
    console.error('❌ Falha no diagnóstico:', error);
    return false;
  }
}