import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// SISTEMA UNIFICADO PARA EVITAR MÚLTIPLAS INSTÂNCIAS

const supabaseUrl = `https://${projectId}.supabase.co`;

// Verificação básica
if (!projectId || !publicAnonKey) {
  throw new Error('Credenciais do Supabase não configuradas');
}

// Variável global para armazenar a ÚNICA instância
let _globalSupabaseInstance: SupabaseClient | null = null;
let _isCreating = false;

// Função para criar a instância única
function createUnifiedSupabaseClient(): SupabaseClient {
  // Se já existe uma instância, retorna ela
  if (_globalSupabaseInstance) {
    console.log('♻️ Reutilizando instância existente do Supabase');
    return _globalSupabaseInstance;
  }

  // Se está criando, espera ou retorna erro
  if (_isCreating) {
    throw new Error('Instância já está sendo criada');
  }

  _isCreating = true;

  try {
    console.log('🔄 Criando ÚNICA instância do Supabase...');
    
    _globalSupabaseInstance = createClient(supabaseUrl, publicAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: 'implicit'
      },
      global: {
        headers: {
          'X-Client-Info': 'unified-meal-system/1.0.0'
        }
      },
      db: {
        schema: 'public'
      }
    });

    console.log('✅ Instância única do Supabase criada com sucesso');
    return _globalSupabaseInstance;
    
  } catch (error) {
    console.error('❌ Erro ao criar instância do Supabase:', error);
    _globalSupabaseInstance = null;
    throw error;
  } finally {
    _isCreating = false;
  }
}

// Cliente exportado (ÚNICA instância)
export const supabase = createUnifiedSupabaseClient();

// Função para verificar se está pronto
export const isSupabaseReady = (): boolean => {
  return !!_globalSupabaseInstance && typeof _globalSupabaseInstance.from === 'function';
};

// Função para reset (apenas para casos extremos)
export const resetSupabaseInstance = (): void => {
  console.warn('🔄 Resetando instância do Supabase...');
  _globalSupabaseInstance = null;
  _isCreating = false;
};

// Teste de conexão simples
export const testConnection = async (timeoutMs: number = 3000): Promise<boolean> => {
  if (!isSupabaseReady()) {
    console.error('❌ Cliente Supabase não está pronto');
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (error) {
      console.error('❌ Erro no teste de conexão:', error.message);
      return false;
    }

    console.log('✅ Teste de conexão bem-sucedido');
    return true;
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('❌ Timeout no teste de conexão');
    } else {
      console.error('❌ Erro no teste de conexão:', error.message);
    }
    return false;
  }
};

// Types básicos necessários
export interface Company {
  id: string;
  name: string;
  trade_name?: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface MealType {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_special: boolean;
  is_active: boolean;
  price?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  voucher_code: string;
  full_name: string;
  cpf?: string;
  company_id?: string;
  department?: string;
  position?: string;
  shift_id?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  hire_date?: string;
  birth_date?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  company?: Company;
  shift?: Shift;
}

export interface Manager {
  id: string;
  full_name: string;
  email: string;
  username?: string;
  password?: string;
  phone?: string;
  company_id?: string;
  department?: string;
  position?: string;
  is_active: boolean;
  permissions?: string[] | Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
  company?: Company;
}

// Operações básicas com timeout
export class UnifiedOperations {
  private static instance: UnifiedOperations;
  private timeoutMs = 4000; // 4 segundos

  static getInstance(): UnifiedOperations {
    if (!UnifiedOperations.instance) {
      UnifiedOperations.instance = new UnifiedOperations();
    }
    return UnifiedOperations.instance;
  }

  private async withTimeout<T>(promise: Promise<T>, operation: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const result = await promise;
      clearTimeout(timeoutId);
      return result;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Timeout em ${operation}`);
      }
      throw error;
    }
  }

  async getUsers(): Promise<User[]> {
    const { data, error } = await this.withTimeout(
      supabase
        .from('users')
        .select(`
          *,
          company:companies(id, name),
          shift:shifts(id, name, start_time, end_time, is_active, description)
        `)
        .order('full_name'),
      'buscar usuários'
    );

    if (error) throw error;
    return data || [];
  }

  async getCompanies(): Promise<Company[]> {
    const { data, error } = await this.withTimeout(
      supabase
        .from('companies')
        .select('*')
        .order('name'),
      'buscar empresas'
    );

    if (error) throw error;
    return data || [];
  }

  async getMealTypes(): Promise<MealType[]> {
    const { data, error } = await this.withTimeout(
      supabase
        .from('meal_types')
        .select('*')
        .order('start_time'),
      'buscar tipos de refeição'
    );

    if (error) throw error;
    return data || [];
  }

  async getShifts(): Promise<Shift[]> {
    const { data, error } = await this.withTimeout(
      supabase
        .from('shifts')
        .select('*')
        .order('start_time'),
      'buscar turnos'
    );

    if (error) throw error;
    return data || [];
  }

  async createShift(shiftData: Omit<Shift, 'id' | 'created_at' | 'updated_at'>): Promise<Shift> {
    const { data, error } = await this.withTimeout(
      supabase
        .from('shifts')
        .insert([shiftData])
        .select()
        .single(),
      'criar turno'
    );

    if (error) throw error;
    return data;
  }

  async updateShift(id: string, updates: Partial<Omit<Shift, 'id' | 'created_at' | 'updated_at'>>): Promise<Shift> {
    const { data, error } = await this.withTimeout(
      supabase
        .from('shifts')
        .update(updates)
        .eq('id', id)
        .select()
        .single(),
      'atualizar turno'
    );

    if (error) throw error;
    return data;
  }

  async deleteShift(id: string): Promise<void> {
    const { error } = await this.withTimeout(
      supabase
        .from('shifts')
        .delete()
        .eq('id', id),
      'deletar turno'
    );

    if (error) throw error;
  }

  async getUserByVoucher(voucherCode: string): Promise<User | null> {
    const { data, error } = await this.withTimeout(
      supabase
        .from('users')
        .select(`
          *,
          company:companies(id, name),
          shift:shifts(id, name, start_time, end_time, is_active, description)
        `)
        .eq('voucher_code', voucherCode)
        .eq('is_active', true)
        .single(),
      'buscar usuário por voucher'
    );

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }
}

export const unifiedOps = UnifiedOperations.getInstance();

// Helper functions
export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

export const formatTime = (time: string) => {
  return time.slice(0, 5); // HH:MM
};

export const formatDateTime = (datetime: string) => {
  return new Date(datetime).toLocaleString('pt-BR');
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const generateVoucherCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const validateCPF = (cpf: string) => {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
  if (checkDigit !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  checkDigit = 11 - (sum % 11);
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
  if (checkDigit !== parseInt(cpf.charAt(10))) return false;
  
  return true;
};

export const formatCPF = (cpf: string) => {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length <= 11) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
};

export const formatCNPJ = (cnpj: string) => {
  cnpj = cnpj.replace(/\D/g, '');
  if (cnpj.length <= 14) {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return cnpj;
};

export const formatPhone = (phone: string) => {
  phone = phone.replace(/\D/g, '');
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (phone.length === 10) {
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};

// Função para verificar se o usuário está dentro do seu turno
export const isUserInShift = (user: User): { isInShift: boolean; message?: string } => {
  if (!user.shift_id || !user.shift) {
    return { isInShift: true };
  }

  if (!user.shift.is_active) {
    return { 
      isInShift: false, 
      message: `O turno "${user.shift.name}" está inativo no momento.`
    };
  }

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const shiftStart = user.shift.start_time.slice(0, 5);
  const shiftEnd = user.shift.end_time.slice(0, 5);

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const currentMinutes = timeToMinutes(currentTime);
  const startMinutes = timeToMinutes(shiftStart);
  const endMinutes = timeToMinutes(shiftEnd);

  if (startMinutes > endMinutes) {
    const toleranceMinutes = 15;
    const endWithTolerance = endMinutes + toleranceMinutes;
    
    const isInNightShift = currentMinutes >= startMinutes || currentMinutes <= endWithTolerance;
    if (!isInNightShift) {
      return { 
        isInShift: false, 
        message: `Fora do turno "${user.shift.name}" (${formatTime(shiftStart)} às ${formatTime(shiftEnd)} + 15min tolerância). Horário atual: ${currentTime}`
      };
    }
  } else {
    const toleranceMinutes = 15;
    const endWithTolerance = endMinutes + toleranceMinutes;
    
    const isInDayShift = currentMinutes >= startMinutes && currentMinutes <= endWithTolerance;
    if (!isInDayShift) {
      return { 
        isInShift: false, 
        message: `Fora do turno "${user.shift.name}" (${formatTime(shiftStart)} às ${formatTime(shiftEnd)} + 15min tolerância). Horário atual: ${currentTime}`
      };
    }
  }

  return { isInShift: true };
};

// Função para obter a data atual no formato YYYY-MM-DD considerando timezone local
export const getCurrentDateLocal = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Função auxiliar para validar se uma data não é no passado
export const isDateNotInPast = (dateString: string): boolean => {
  try {
    const inputDate = new Date(dateString + 'T12:00:00');
    const today = new Date();
    
    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
    
    return inputDate >= today;
  } catch (error) {
    console.error('Erro ao validar data:', error);
    return false;
  }
};

// Interface para meal_records
export interface MealRecord {
  id: string;
  user_id: string;
  meal_type_id: string;
  voucher_code: string;
  meal_date: string;
  meal_time: string;
  price: number;
  status: 'used' | 'cancelled' | 'pending';
  validation_method: 'voucher' | 'manual' | 'admin';
  validated_by?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Função para buscar usuário pelo voucher
export async function fetchUserByVoucher(voucherCode: string): Promise<User | null> {
  try {
    console.log('🔍 Buscando usuário com voucher:', voucherCode);
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        company:companies(id, name),
        shift:shifts(id, name, start_time, end_time, is_active, description)
      `)
      .eq('voucher_code', voucherCode)
      .eq('is_active', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        console.log('❌ Usuário não encontrado');
        return null;
      }
      throw error;
    }
    
    console.log('✅ Usuário encontrado:', data?.full_name);
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    throw error;
  }
}

// Função para verificar contagem de refeições do dia
export async function checkUserMealCount(userId: string, date: string): Promise<number> {
  try {
    console.log('📊 Verificando refeições do usuário:', userId, 'na data:', date);
    
    const { data, error } = await supabase
      .from('meal_records')
      .select('id')
      .eq('user_id', userId)
      .eq('meal_date', date)
      .eq('status', 'used');
    
    if (error) throw error;
    
    const count = data?.length || 0;
    console.log('✅ Total de refeições hoje:', count);
    return count;
  } catch (error) {
    console.error('❌ Erro ao verificar contagem:', error);
    throw error;
  }
}

// Função para verificar se usuário já usou um tipo de refeição hoje
export async function checkUserMealTypeUsage(
  userId: string, 
  date: string, 
  mealTypeId: string
): Promise<boolean> {
  try {
    console.log('🔍 Verificando uso de tipo de refeição:', { userId, date, mealTypeId });
    
    const { data, error } = await supabase
      .from('meal_records')
      .select('id')
      .eq('user_id', userId)
      .eq('meal_date', date)
      .eq('meal_type_id', mealTypeId)
      .eq('status', 'used');
    
    if (error) throw error;
    
    const hasUsed = (data?.length || 0) > 0;
    console.log('✅ Já utilizou este tipo?', hasUsed);
    return hasUsed;
  } catch (error) {
    console.error('❌ Erro ao verificar uso do tipo:', error);
    throw error;
  }
}

// Função para criar registro de refeição
export async function createUserMealRecord(
  record: Omit<MealRecord, 'id' | 'created_at' | 'updated_at'>
): Promise<MealRecord | null> {
  try {
    console.log('📝 Criando registro de refeição:', record);
    
    const { data, error } = await supabase
      .from('meal_records')
      .insert(record)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Registro criado com sucesso:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erro ao criar registro:', error);
    throw error;
  }
}