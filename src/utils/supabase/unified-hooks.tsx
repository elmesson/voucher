import { useState, useEffect, useCallback, useRef } from 'react';
import { unifiedOps, testConnection, supabase } from './unified-client';
import { notifications } from '../../components/NotificationSystem';
import type { User, Company, Shift, MealType, Manager } from './unified-client';

// Hook para status de conexão
export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkConnection = useCallback(async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const result = await testConnection(3000);
      setIsConnected(result);
      setLastCheck(new Date());
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  useEffect(() => {
    // Check inicial
    checkConnection();

    // Check periódico a cada 30s apenas se não estiver conectado
    intervalRef.current = setInterval(() => {
      if (!isConnected) {
        checkConnection();
      }
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkConnection, isConnected]);

  return {
    isConnected,
    isChecking,
    lastCheck,
    checkConnection
  };
}

// Hook para usuários
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchUsers = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setError(null);
      console.log('📝 Carregando usuários...');
      
      const data = await unifiedOps.getUsers();
      
      if (mountedRef.current) {
        setUsers(data);
        console.log('✅ Usuários carregados:', data.length);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar usuários:', error);
      if (mountedRef.current) {
        setError(error.message || 'Erro ao carregar usuários');
        setUsers([]);
        notifications.error('Erro', 'Não foi possível carregar os usuários.');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchUsers();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchUsers]);

  const getUserByVoucher = useCallback(async (voucherCode: string): Promise<User | null> => {
    try {
      return await unifiedOps.getUserByVoucher(voucherCode);
    } catch (error) {
      console.error('Erro ao buscar usuário por voucher:', error);
      throw error;
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsLoading(true);
    await fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    error,
    getUserByVoucher,
    refreshUsers
  };
}

// Hook para empresas
export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchCompanies = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setError(null);
      console.log('🏢 Carregando empresas...');
      
      const data = await unifiedOps.getCompanies();
      
      if (mountedRef.current) {
        setCompanies(data);
        console.log('✅ Empresas carregadas:', data.length);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar empresas:', error);
      if (mountedRef.current) {
        setError(error.message || 'Erro ao carregar empresas');
        setCompanies([]);
        notifications.error('Erro', 'Não foi possível carregar as empresas.');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchCompanies();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchCompanies]);

  const refreshCompanies = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsLoading(true);
    await fetchCompanies();
  }, [fetchCompanies]);

  const createCompany = useCallback(async (companyData: any) => {
    try {
      console.log('➕ Criando nova empresa:', companyData);
      const { error } = await supabase
        .from('companies')
        .insert(companyData);

      if (error) throw error;
      
      notifications.success('Empresa criada!', `${companyData.name} foi criada com sucesso.`);
      await refreshCompanies();
    } catch (error: any) {
      console.error('❌ Erro ao criar empresa:', error);
      notifications.error('Erro ao criar', error.message || 'Não foi possível criar a empresa.');
      throw error;
    }
  }, [refreshCompanies]);

  const updateCompany = useCallback(async (companyId: string, companyData: any) => {
    try {
      console.log('💾 Atualizando empresa:', companyId, companyData);
      const { error } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', companyId);

      if (error) throw error;
      
      notifications.success('Empresa atualizada!', `${companyData.name} foi atualizada com sucesso.`);
      await refreshCompanies();
    } catch (error: any) {
      console.error('❌ Erro ao atualizar empresa:', error);
      notifications.error('Erro ao atualizar', error.message || 'Não foi possível atualizar a empresa.');
      throw error;
    }
  }, [refreshCompanies]);

  const deleteCompany = useCallback(async (companyId: string) => {
    try {
      console.log('🗑️ Deletando empresa:', companyId);
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;
      
      notifications.success('Empresa excluída!', 'A empresa foi removida com sucesso.');
      await refreshCompanies();
    } catch (error: any) {
      console.error('❌ Erro ao deletar empresa:', error);
      notifications.error('Erro ao excluir', error.message || 'Não foi possível excluir a empresa.');
      throw error;
    }
  }, [refreshCompanies]);

  return {
    companies,
    isLoading,
    error,
    refreshCompanies,
    createCompany,
    updateCompany,
    deleteCompany
  };
}

// Hook para tipos de refeição
export function useMealTypes() {
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchMealTypes = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setError(null);
      console.log('🍽️ Carregando tipos de refeição...');
      
      const data = await unifiedOps.getMealTypes();
      
      if (mountedRef.current) {
        setMealTypes(data);
        console.log('✅ Tipos de refeição carregados:', data.length);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar tipos de refeição:', error);
      if (mountedRef.current) {
        setError(error.message || 'Erro ao carregar tipos de refeição');
        setMealTypes([]);
        notifications.error('Erro', 'Não foi possível carregar os tipos de refeição.');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchMealTypes();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchMealTypes]);

  const refreshMealTypes = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsLoading(true);
    await fetchMealTypes();
  }, [fetchMealTypes]);

  const createMealType = useCallback(async (mealTypeData: any) => {
    try {
      console.log('➕ Criando novo tipo de refeição:', mealTypeData);
      const { error } = await supabase
        .from('meal_types')
        .insert(mealTypeData);

      if (error) throw error;
      
      notifications.success('Tipo de refeição criado!', `${mealTypeData.name} foi criado com sucesso.`);
      await refreshMealTypes();
    } catch (error: any) {
      console.error('❌ Erro ao criar tipo de refeição:', error);
      notifications.error('Erro ao criar', error.message || 'Não foi possível criar o tipo de refeição.');
      throw error;
    }
  }, [refreshMealTypes]);

  const updateMealType = useCallback(async (mealTypeId: string, mealTypeData: any) => {
    try {
      console.log('💾 Atualizando tipo de refeição:', mealTypeId, mealTypeData);
      const { error } = await supabase
        .from('meal_types')
        .update(mealTypeData)
        .eq('id', mealTypeId);

      if (error) throw error;
      
      notifications.success('Tipo de refeição atualizado!', `${mealTypeData.name} foi atualizado com sucesso.`);
      await refreshMealTypes();
    } catch (error: any) {
      console.error('❌ Erro ao atualizar tipo de refeição:', error);
      notifications.error('Erro ao atualizar', error.message || 'Não foi possível atualizar o tipo de refeição.');
      throw error;
    }
  }, [refreshMealTypes]);

  const deleteMealType = useCallback(async (mealTypeId: string) => {
    try {
      console.log('🗑️ Deletando tipo de refeição:', mealTypeId);
      const { error } = await supabase
        .from('meal_types')
        .delete()
        .eq('id', mealTypeId);

      if (error) throw error;
      
      notifications.success('Tipo de refeição excluído!', 'O tipo de refeição foi removido com sucesso.');
      await refreshMealTypes();
    } catch (error: any) {
      console.error('❌ Erro ao deletar tipo de refeição:', error);
      notifications.error('Erro ao excluir', error.message || 'Não foi possível excluir o tipo de refeição.');
      throw error;
    }
  }, [refreshMealTypes]);

  return {
    mealTypes,
    isLoading,
    error,
    refreshMealTypes,
    createMealType,
    updateMealType,
    deleteMealType
  };
}

// Hook para turnos
export function useShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchShifts = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setError(null);
      console.log('⏰ Carregando turnos...');
      
      const data = await unifiedOps.getShifts();
      
      if (mountedRef.current) {
        setShifts(data);
        console.log('✅ Turnos carregados:', data.length);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar turnos:', error);
      if (mountedRef.current) {
        setError(error.message || 'Erro ao carregar turnos');
        setShifts([]);
        notifications.error('Erro', 'Não foi possível carregar os turnos.');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchShifts();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchShifts]);

  const refreshShifts = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsLoading(true);
    await fetchShifts();
  }, [fetchShifts]);

  const createShift = useCallback(async (shiftData: Omit<Shift, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('➕ Criando turno...');
      const newShift = await unifiedOps.createShift(shiftData);
      
      if (mountedRef.current) {
        setShifts(prev => [...prev, newShift]);
        console.log('✅ Turno criado com sucesso:', newShift.id);
        notifications.success('Turno criado!', 'O turno foi criado com sucesso.');
      }
      return newShift;
    } catch (error: any) {
      console.error('❌ Erro ao criar turno:', error);
      notifications.error('Erro', 'Não foi possível criar o turno.');
      throw error;
    }
  }, []);

  const updateShift = useCallback(async (id: string, updates: Partial<Omit<Shift, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      console.log('✏️ Atualizando turno:', id);
      const updatedShift = await unifiedOps.updateShift(id, updates);
      
      if (mountedRef.current) {
        setShifts(prev => prev.map(shift => shift.id === id ? updatedShift : shift));
        console.log('✅ Turno atualizado com sucesso:', id);
        notifications.success('Turno atualizado!', 'O turno foi atualizado com sucesso.');
      }
      return updatedShift;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar turno:', error);
      notifications.error('Erro', 'Não foi possível atualizar o turno.');
      throw error;
    }
  }, []);

  const deleteShift = useCallback(async (id: string) => {
    try {
      console.log('🗑️ Deletando turno:', id);
      await unifiedOps.deleteShift(id);
      
      if (mountedRef.current) {
        setShifts(prev => prev.filter(shift => shift.id !== id));
        console.log('✅ Turno deletado com sucesso:', id);
        notifications.success('Turno excluído!', 'O turno foi excluído com sucesso.');
      }
    } catch (error: any) {
      console.error('❌ Erro ao deletar turno:', error);
      notifications.error('Erro', 'Não foi possível excluir o turno.');
      throw error;
    }
  }, []);

  return {
    shifts,
    isLoading,
    error,
    createShift,
    updateShift,
    deleteShift,
    refreshShifts
  };
}

// Hook para gerentes com integração real ao Supabase
export function useManagers() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadManagers = useCallback(async () => {
    console.log('=== useManagers: loadManagers chamado ===');
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('managers')
        .select(`
          *,
          company:companies(id, name)
        `)
        .order('full_name');

      if (fetchError) {
        console.error('Erro ao carregar gerentes:', fetchError);
        setError(fetchError.message);
        setManagers([]);
        setIsLoading(false);
        return;
      }

      console.log('Gerentes carregados do banco:', data?.length || 0);
      setManagers(data || []);
    } catch (err: any) {
      console.error('Erro inesperado ao carregar gerentes:', err);
      setError(err?.message || 'Erro ao carregar gerentes');
      setManagers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('=== useManagers: useEffect executado ===');
    loadManagers();
  }, [loadManagers]);

  const refreshManagers = useCallback(async () => {
    console.log('=== useManagers: refreshManagers chamado ===');
    await loadManagers();
  }, [loadManagers]);

  return {
    managers,
    isLoading,
    error,
    refreshManagers
  };
}