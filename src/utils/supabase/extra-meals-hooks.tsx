import { useState, useCallback } from 'react';
import { supabase } from './unified-client';
import { notifications } from '../../components/NotificationSystem';

export interface ExtraMeal {
  id: string;
  user_id?: string;
  meal_type_id: string;
  meal_date: string;
  meal_time?: string;
  reason: string;
  requested_by_name: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  price?: number;
  notes?: string;
  external_name?: string;
  external_document?: string;
  external_company?: string;
  created_at: string;
  approved_at?: string;
  used_at?: string;
  // Joined data
  user?: {
    id: string;
    full_name: string;
    voucher_code: string;
    cpf?: string;
    department?: string;
    position?: string;
    company?: {
      name: string;
    };
  };
  meal_type?: {
    name: string;
    price?: number;
    is_special: boolean;
  };
  approver?: {
    full_name: string;
  };
}

export interface CreateExtraMealData {
  user_id?: string;
  meal_type_id: string;
  meal_date: string;
  meal_time?: string;
  reason: string;
  requested_by_name: string;
  status: 'pending';
  price?: number;
  notes?: string;
  // For external users (visitors)
  external_name?: string;
  external_document?: string;
  external_company?: string;
}

export function useExtraMeals() {
  const [extraMeals, setExtraMeals] = useState<ExtraMeal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // Check if table and schema exist
  const checkSchema = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 2;
    const BASE_RETRY_DELAY = 1200;
    const TIMEOUT_MS = 15000; // 15 seconds timeout for schema check

    try {
      console.log(`🔍 Verificando schema extra_meals (tentativa ${retryCount + 1}/${MAX_RETRIES + 1})`);
      
      // Create an abort controller for timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, TIMEOUT_MS);

      try {
        const { error } = await supabase
          .from('extra_meals')
          .select('id, requested_by_name')
          .limit(1);

        clearTimeout(timeoutId);

        if (error) {
          console.error('Schema check error:', error);
          
          // Check for schema-related errors
          if (error.code === 'PGRST204' || error.message.includes('schema cache') || error.message.includes('column') || error.message.includes('relation')) {
            setSchemaError('A tabela extra_meals precisa ser atualizada. Execute o script SQL de migração.');
            return false;
          }
          
          throw error; // Let the catch block handle retries
        }
        
        console.log('✅ Schema extra_meals válido');
        setSchemaError(null);
        return true;
      } catch (schemaError: any) {
        clearTimeout(timeoutId);
        throw schemaError;
      }

    } catch (error: any) {
      console.error(`Erro ao verificar schema (tentativa ${retryCount + 1}):`, error);
      
      // Enhanced error detection
      const isNetworkError = error.message?.includes('Failed to fetch') || 
                            error.message?.includes('fetch') ||
                            error.name === 'TypeError' ||
                            error.name === 'AbortError' ||
                            error.code === 'NETWORK_ERROR' ||
                            error.message?.includes('NetworkError') ||
                            error.message?.includes('ERR_NETWORK') ||
                            !navigator.onLine;
      
      if (retryCount < MAX_RETRIES && isNetworkError) {
        // Exponential backoff with jitter for schema check
        const jitter = Math.random() * 300;
        const delay = BASE_RETRY_DELAY * Math.pow(1.5, retryCount) + jitter;
        
        console.log(`🔄 Tentando novamente verificar schema em ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return checkSchema(retryCount + 1);
      }
      
      // Final error handling
      if (error.name === 'AbortError') {
        setSchemaError('Timeout na verificação do schema. Verifique sua conexão.');
      } else if (error.message?.includes('Failed to fetch') || !navigator.onLine) {
        setSchemaError('Sem conexão com o banco de dados. Verifique sua internet.');
      } else if (error.code === 'PGRST204' || error.message?.includes('schema') || error.message?.includes('column')) {
        setSchemaError('A tabela extra_meals precisa ser atualizada. Execute CORRIGIR_EXTRA_MEALS_AGORA.sql');
      } else {
        setSchemaError('Erro de conexão com o banco de dados.');
      }
      
      return false;
    }
  }, []);

  const fetchExtraMeals = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    const BASE_RETRY_DELAY = 1500;
    const TIMEOUT_MS = 30000; // 30 seconds timeout

    setIsLoading(true);
    try {
      console.log(`🔄 Buscando refeições extras (tentativa ${retryCount + 1}/${MAX_RETRIES + 1})`);
      console.log('🌐 Status da rede:', navigator.onLine ? 'Online' : 'Offline');
      console.log('🔧 Connection type:', (navigator as any).connection?.effectiveType || 'unknown');
      
      // First check if schema is valid
      const schemaValid = await checkSchema();
      if (!schemaValid) {
        setExtraMeals([]);
        return;
      }

      // Create an abort controller for timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏱️ Timeout atingido, cancelando requisição...');
        abortController.abort();
      }, TIMEOUT_MS);

      try {
        const startTime = Date.now();
        console.log('📡 Iniciando requisição ao Supabase...');
        
        const { data, error } = await supabase
          .from('extra_meals')
          .select(`
            *,
            user:users(
              id,
              full_name,
              voucher_code,
              cpf,
              department,
              position,
              company:companies(name)
            ),
            meal_type:meal_types(
              name,
              price,
              is_special
            ),
            approver:admins!approved_by(
              full_name
            )
          `)
          .order('created_at', { ascending: false });

        const duration = Date.now() - startTime;
        console.log(`📊 Requisição completada em ${duration}ms`);
        clearTimeout(timeoutId);

        if (error) {
          console.error('❌ Erro retornado pelo Supabase:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          if (error.code === 'PGRST204') {
            setSchemaError('Schema da tabela extra_meals está desatualizado. Execute a migração SQL.');
          } else {
            throw error; // Let the catch block handle retries
          }
          setExtraMeals([]);
          return;
        }

        console.log('✅ Refeições extras carregadas com sucesso:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('📝 Primeiros registros:', data.slice(0, 2).map(item => ({
            id: item.id,
            user: item.user?.full_name || item.external_name,
            meal_type: item.meal_type?.name,
            status: item.status
          })));
        }
        setExtraMeals(data || []);
        setSchemaError(null);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        console.error('❌ Erro na execução da requisição:', {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack?.split('\n').slice(0, 3).join('\n')
        });
        throw fetchError;
      }

    } catch (error: any) {
      console.error(`❌ Erro geral ao buscar refeições extras (tentativa ${retryCount + 1}):`, error);
      console.log('🔍 Detalhes do erro:', {
        name: error.name,
        message: error.message,
        code: error.code,
        networkState: navigator.onLine,
        connectionType: (navigator as any).connection?.effectiveType || 'unknown'
      });
      
      // Enhanced error detection
      const isNetworkError = error.message?.includes('Failed to fetch') || 
                            error.message?.includes('fetch') ||
                            error.name === 'TypeError' ||
                            error.name === 'AbortError' ||
                            error.code === 'NETWORK_ERROR' ||
                            error.message?.includes('NetworkError') ||
                            error.message?.includes('ERR_NETWORK') ||
                            !navigator.onLine; // Check if browser is offline
      
      console.log('🔬 Análise do erro:', {
        isNetworkError,
        shouldRetry: retryCount < MAX_RETRIES && isNetworkError,
        retryCount,
        maxRetries: MAX_RETRIES
      });
      
      if (retryCount < MAX_RETRIES && isNetworkError) {
        // Exponential backoff with jitter
        const jitter = Math.random() * 500; // Random delay up to 500ms
        const delay = BASE_RETRY_DELAY * Math.pow(1.5, retryCount) + jitter;
        
        console.log(`🔄 Tentando novamente buscar refeições extras em ${Math.round(delay)}ms...`);
        notifications.warning('Reconectando...', `Tentativa ${retryCount + 1} de ${MAX_RETRIES + 1} - Aguarde...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchExtraMeals(retryCount + 1);
      }
      
      // Final error handling based on error type
      console.log('❌ Todas as tentativas falharam ou erro não é passível de retry');
      if (error.name === 'AbortError') {
        console.log('⏱️ Erro de timeout - operação cancelada');
        notifications.error('Timeout de conexão', 'A conexão demorou muito para responder. Tente novamente.');
      } else if (error.message?.includes('Failed to fetch') || !navigator.onLine) {
        console.log('📡 Erro de conectividade de rede');
        notifications.error('Sem conexão', 'Verifique sua conexão com a internet e tente novamente.');
      } else if (error.code === 'PGRST204' || error.message?.includes('schema')) {
        console.log('🗄️ Erro de schema da tabela');
        setSchemaError('Tabela extra_meals precisa ser migrada. Execute CORRIGIR_EXTRA_MEALS_AGORA.sql');
      } else {
        console.log('🔥 Erro desconhecido do servidor');
        notifications.error('Erro no servidor', 'Falha ao carregar dados do servidor. Tente novamente em alguns minutos.');
      }
      
      setExtraMeals([]);
    } finally {
      setIsLoading(false);
    }
  }, [checkSchema]);

  const createExtraMeal = useCallback(async (mealData: CreateExtraMealData, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const BASE_RETRY_DELAY = 1500;
    const TIMEOUT_MS = 30000; // 30 seconds timeout

    try {
      console.log(`🔄 Criando refeição extra (tentativa ${retryCount + 1}/${MAX_RETRIES + 1})`);
      
      // Check schema first
      const schemaValid = await checkSchema();
      if (!schemaValid) {
        notifications.error('Erro de Schema', 'A tabela extra_meals precisa ser atualizada. Execute o script SQL de migração.');
        return null;
      }

      // Create an abort controller for timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, TIMEOUT_MS);

      try {
        const { data, error } = await supabase
          .from('extra_meals')
          .insert([mealData])
          .select(`
            *,
            user:users(
              id,
              full_name,
              voucher_code,
              cpf,
              department,
              position,
              company:companies(name)
            ),
            meal_type:meal_types(
              name,
              price,
              is_special
            )
          `)
          .single();

        clearTimeout(timeoutId);

        if (error) {
          console.error('Erro ao criar refeição extra:', error);
          if (error.code === 'PGRST204') {
            notifications.error('Erro de Schema', 'A coluna requested_by_name não existe. Execute o script de migração SQL.');
            setSchemaError('Schema desatualizado. Execute CORRIGIR_EXTRA_MEALS_AGORA.sql');
            return null;
          } else {
            throw error; // Let the catch block handle retries
          }
        }

        // Add to local state
        setExtraMeals(prev => [data, ...prev]);
        
        console.log('✅ Refeição extra criada com sucesso:', data.id);
        notifications.success('Refeição extra solicitada!', 'A solicitação foi registrada com sucesso.');
        return data;
      } catch (insertError: any) {
        clearTimeout(timeoutId);
        throw insertError;
      }

    } catch (error: any) {
      console.error(`Erro ao criar refeição extra (tentativa ${retryCount + 1}):`, error);
      
      // Enhanced error detection
      const isNetworkError = error.message?.includes('Failed to fetch') || 
                            error.message?.includes('fetch') ||
                            error.name === 'TypeError' ||
                            error.name === 'AbortError' ||
                            error.code === 'NETWORK_ERROR' ||
                            error.message?.includes('NetworkError') ||
                            error.message?.includes('ERR_NETWORK') ||
                            !navigator.onLine;
      
      if (retryCount < MAX_RETRIES && isNetworkError) {
        // Exponential backoff with jitter
        const jitter = Math.random() * 500; // Random delay up to 500ms
        const delay = BASE_RETRY_DELAY * Math.pow(1.5, retryCount) + jitter;
        
        console.log(`🔄 Tentando novamente criar refeição extra em ${Math.round(delay)}ms...`);
        notifications.warning('Reconectando...', `Salvando... Tentativa ${retryCount + 1} de ${MAX_RETRIES + 1}`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return createExtraMeal(mealData, retryCount + 1);
      }
      
      // Final error handling based on error type
      if (error.name === 'AbortError') {
        notifications.error('Timeout de conexão', 'A operação demorou muito para completar. Tente novamente.');
      } else if (error.message?.includes('Failed to fetch') || !navigator.onLine) {
        notifications.error('Sem conexão', 'Verifique sua conexão com a internet e tente novamente.');
      } else if (error.code === 'PGRST204' || error.message?.includes('schema')) {
        setSchemaError('Tabela extra_meals precisa ser migrada. Execute CORRIGIR_EXTRA_MEALS_AGORA.sql');
        notifications.error('Erro de Schema', 'Execute o script de migração SQL primeiro.');
      } else {
        notifications.error('Erro no servidor', `Não foi possível registrar a refeição: ${error.message || 'Erro desconhecido'}`);
      }
      
      return null;
    }
  }, [checkSchema]);

  const updateExtraMeal = useCallback(async (id: string, updates: Partial<CreateExtraMealData>) => {
    try {
      const schemaValid = await checkSchema();
      if (!schemaValid) {
        notifications.error('Erro de Schema', 'Execute o script de migração SQL primeiro.');
        return null;
      }

      const { data, error } = await supabase
        .from('extra_meals')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          user:users(
            id,
            full_name,
            voucher_code,
            cpf,
            department,
            position,
            company:companies(name)
          ),
          meal_type:meal_types(
            name,
            price,
            is_special
          ),
          approver:admins!approved_by(
            full_name
          )
        `)
        .single();

      if (error) throw error;

      // Update local state
      setExtraMeals(prev => prev.map(meal => 
        meal.id === id ? data : meal
      ));
      
      notifications.success('Refeição atualizada!', 'As alterações foram salvas com sucesso.');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar refeição extra:', error);
      notifications.error('Erro ao salvar', 'Não foi possível atualizar a refeição extra.');
      return null;
    }
  }, [checkSchema]);

  const deleteExtraMeal = useCallback(async (id: string) => {
    try {
      const schemaValid = await checkSchema();
      if (!schemaValid) {
        notifications.error('Erro de Schema', 'Execute o script de migração SQL primeiro.');
        return false;
      }

      const { error } = await supabase
        .from('extra_meals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      setExtraMeals(prev => prev.filter(meal => meal.id !== id));
      
      notifications.success('Refeição excluída!', 'A solicitação foi removida com sucesso.');
      return true;
    } catch (error) {
      console.error('Erro ao excluir refeição extra:', error);
      notifications.error('Erro ao excluir', 'Não foi possível excluir a refeição extra.');
      return false;
    }
  }, [checkSchema]);

  const approveExtraMeal = useCallback(async (id: string, approvedBy: string, notes?: string) => {
    try {
      const schemaValid = await checkSchema();
      if (!schemaValid) {
        notifications.error('Erro de Schema', 'Execute o script de migração SQL primeiro.');
        return null;
      }

      // Get admin ID from session or use the admin name for now
      const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('full_name', approvedBy)
        .single();

      const updateData: any = {
        status: 'approved',
        approved_by: admin?.id || null,
        approved_at: new Date().toISOString()
      };

      if (notes) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('extra_meals')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          user:users(
            id,
            full_name,
            voucher_code,
            cpf,
            department,
            position,
            company:companies(name)
          ),
          meal_type:meal_types(
            name,
            price,
            is_special
          ),
          approver:admins!approved_by(
            full_name
          )
        `)
        .single();

      if (error) throw error;

      // Update local state
      setExtraMeals(prev => prev.map(meal => 
        meal.id === id ? data : meal
      ));
      
      notifications.success('Refeição aprovada!', 'A solicitação foi aprovada com sucesso.');
      return data;
    } catch (error) {
      console.error('Erro ao aprovar refeição extra:', error);
      notifications.error('Erro na aprovação', 'Não foi possível aprovar a refeição extra.');
      return null;
    }
  }, [checkSchema]);

  const rejectExtraMeal = useCallback(async (id: string, approvedBy: string, rejectionReason: string) => {
    try {
      const schemaValid = await checkSchema();
      if (!schemaValid) {
        notifications.error('Erro de Schema', 'Execute o script de migração SQL primeiro.');
        return null;
      }

      // Get admin ID from session or use the admin name for now
      const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('full_name', approvedBy)
        .single();

      const { data, error } = await supabase
        .from('extra_meals')
        .update({
          status: 'rejected',
          approved_by: admin?.id || null,
          approved_at: new Date().toISOString(),
          notes: rejectionReason
        })
        .eq('id', id)
        .select(`
          *,
          user:users(
            id,
            full_name,
            voucher_code,
            cpf,
            department,
            position,
            company:companies(name)
          ),
          meal_type:meal_types(
            name,
            price,
            is_special
          ),
          approver:admins!approved_by(
            full_name
          )
        `)
        .single();

      if (error) throw error;

      // Update local state
      setExtraMeals(prev => prev.map(meal => 
        meal.id === id ? data : meal
      ));
      
      notifications.success('Refeição rejeitada!', 'A solicitação foi rejeitada com sucesso.');
      return data;
    } catch (error) {
      console.error('Erro ao rejeitar refeição extra:', error);
      notifications.error('Erro na rejeição', 'Não foi possível rejeitar a refeição extra.');
      return null;
    }
  }, [checkSchema]);

  const refreshExtraMeals = useCallback(() => {
    console.log('🔄 Atualizando lista de refeições extras...');
    fetchExtraMeals(0); // Start with retry count 0
  }, [fetchExtraMeals]);

  return {
    extraMeals,
    isLoading,
    schemaError,
    fetchExtraMeals,
    createExtraMeal,
    updateExtraMeal,
    deleteExtraMeal,
    approveExtraMeal,
    rejectExtraMeal,
    refreshExtraMeals,
    checkSchema
  };
}

export function useExtraMealStats() {
  const [stats, setStats] = useState({
    totalMeals: 0,
    pendingMeals: 0,
    approvedMeals: 0,
    rejectedMeals: 0,
    totalValue: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const calculateStats = useCallback(async (filters?: {
    startDate?: string;
    endDate?: string;
    companyId?: string;
    status?: string;
  }, retryCount = 0) => {
    const MAX_RETRIES = 2;
    const BASE_RETRY_DELAY = 1200;
    const TIMEOUT_MS = 25000; // 25 seconds timeout

    setIsLoading(true);
    try {
      console.log(`📊 Calculando estatísticas (tentativa ${retryCount + 1}/${MAX_RETRIES + 1})`);
      
      // Create an abort controller for timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, TIMEOUT_MS);

      try {
        let query = supabase
          .from('extra_meals')
          .select(`
            id,
            status,
            price,
            meal_date,
            user:users(company_id)
          `);

        // Apply filters with debug
        if (filters?.startDate) {
          console.log('🗓️ Aplicando filtro startDate para estatísticas:', filters.startDate);
          query = query.gte('meal_date', filters.startDate);
        }
        if (filters?.endDate) {
          console.log('🗓️ Aplicando filtro endDate para estatísticas:', filters.endDate);
          query = query.lte('meal_date', filters.endDate);
        }
        if (filters?.status && filters.status !== 'all') {
          console.log('📊 Aplicando filtro de status:', filters.status);
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;

        clearTimeout(timeoutId);

        if (error) {
          throw error; // Let the catch block handle retries
        }

        const filteredData = data || [];
        
        // Further filter by company if needed
        const finalData = filters?.companyId && filters.companyId !== 'all'
          ? filteredData.filter(item => item.user?.company_id === filters.companyId)
          : filteredData;

        // Debug: mostrar amostras dos dados encontrados
        if (finalData.length > 0) {
          console.log('📊 Dados encontrados para estatísticas:', finalData.length);
          console.log('📅 Primeiras datas encontradas:', finalData.slice(0, 3).map(item => item.meal_date));
        } else {
          console.log('⚠️ Nenhum dado encontrado para estatísticas com os filtros aplicados');
        }

        const newStats = {
          totalMeals: finalData.length,
          pendingMeals: finalData.filter(item => item.status === 'pending').length,
          approvedMeals: finalData.filter(item => item.status === 'approved').length,
          rejectedMeals: finalData.filter(item => item.status === 'rejected').length,
          totalValue: finalData.reduce((sum, item) => sum + (item.price || 0), 0)
        };

        console.log('✅ Estatísticas calculadas:', newStats);
        setStats(newStats);
        return newStats;
      } catch (queryError: any) {
        clearTimeout(timeoutId);
        throw queryError;
      }

    } catch (error: any) {
      console.error(`Erro ao calcular estatísticas (tentativa ${retryCount + 1}):`, error);
      
      // Enhanced error detection
      const isNetworkError = error.message?.includes('Failed to fetch') || 
                            error.message?.includes('fetch') ||
                            error.name === 'TypeError' ||
                            error.name === 'AbortError' ||
                            error.code === 'NETWORK_ERROR' ||
                            error.message?.includes('NetworkError') ||
                            error.message?.includes('ERR_NETWORK') ||
                            !navigator.onLine;
      
      if (retryCount < MAX_RETRIES && isNetworkError) {
        // Exponential backoff with jitter
        const jitter = Math.random() * 400;
        const delay = BASE_RETRY_DELAY * Math.pow(1.5, retryCount) + jitter;
        
        console.log(`🔄 Tentando novamente calcular estatísticas em ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return calculateStats(filters, retryCount + 1);
      }
      
      // Log the final error for debugging
      if (error.name === 'AbortError') {
        console.warn('⏱️ Timeout ao calcular estatísticas - operação cancelada');
      } else if (!navigator.onLine) {
        console.warn('📡 Sem conexão de rede para calcular estatísticas');
      } else {
        console.error('❌ Erro final ao calcular estatísticas:', error);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    stats,
    isLoading,
    calculateStats
  };
}