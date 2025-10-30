import { supabase } from './unified-client';
import { notifications } from '../../components/NotificationSystem';
import type { User, Company, Shift, MealType, MealRecord } from './unified-client';

// Mock data for fallback when Supabase is not available
const mockCompanies: Company[] = [
  {
    id: 'mock-company-1',
    name: 'LOPES TRANSPORTES E LOGÍSTICA LTDA',
    trade_name: 'LOPES TRANSPORTES',
    cnpj: '12345678000190',
    address: 'Rua das Empresas, 123',
    phone: '11999998888',
    email: 'contato@lopes.com.br',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-company-2',
    name: 'MELLO TRANSPORTE DISTRIBUIÇÃO LTDA',
    trade_name: 'MELLO TRANSPORTE',
    cnpj: '98765432000110',
    address: 'Av. Logística, 456',
    phone: '11988887777',
    email: 'contato@mello.com.br',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-company-3',
    name: 'TURBO SUPERMERCADOS LTDA',
    trade_name: 'TURBO SUPERMERCADOS',
    cnpj: '11222333000144',
    address: 'Rua do Comércio, 789',
    phone: '11977776666',
    email: 'contato@turbo.com.br',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockShifts: Shift[] = [
  {
    id: 'mock-shift-1',
    name: '1° Turno - Manhã',
    start_time: '06:00:00',
    end_time: '14:00:00',
    is_active: true,
    description: 'Turno da manhã',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-shift-2',
    name: '2° Turno - Tarde',
    start_time: '14:00:00',
    end_time: '22:00:00',
    is_active: true,
    description: 'Turno da tarde',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-shift-3',
    name: '3° Turno - Noite',
    start_time: '22:00:00',
    end_time: '06:00:00',
    is_active: true,
    description: 'Turno da noite',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-shift-4',
    name: 'Administrativo',
    start_time: '08:00:00',
    end_time: '18:00:00',
    is_active: true,
    description: 'Turno administrativo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockMealTypes: MealType[] = [
  {
    id: 'mock-meal-1',
    name: 'Café da Manhã',
    start_time: '06:00:00',
    end_time: '09:00:00',
    is_special: false,
    is_active: true,
    price: 8.50,
    description: 'Café da manhã',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-meal-2',
    name: 'Almoço',
    start_time: '11:00:00',
    end_time: '14:00:00',
    is_special: false,
    is_active: true,
    price: 18.50,
    description: 'Almoço',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-meal-3',
    name: 'Lanche da Tarde',
    start_time: '15:00:00',
    end_time: '17:00:00',
    is_special: false,
    is_active: true,
    price: 12.00,
    description: 'Lanche da tarde',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-meal-4',
    name: 'Jantar',
    start_time: '18:00:00',
    end_time: '21:00:00',
    is_special: false,
    is_active: true,
    price: 22.00,
    description: 'Jantar',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-meal-5',
    name: 'Ceia',
    start_time: '22:00:00',
    end_time: '02:00:00',
    is_special: false,
    is_active: true,
    price: 15.50,
    description: 'Ceia',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockUsers: User[] = [
  {
    id: 'mock-user-1',
    voucher_code: '1234',
    full_name: 'João Silva Santos',
    cpf: '12345678900',
    company_id: 'mock-company-1',
    department: 'Operacional',
    position: 'Operador',
    shift_id: 'mock-shift-1',
    email: 'joao.silva@lopes.com.br',
    phone: '11999887766',
    is_active: true,
    hire_date: '2023-01-15',
    birth_date: '1990-05-20',
    address: 'Rua das Flores, 100',
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    company: mockCompanies[0],
    shift: mockShifts[0]
  },
  {
    id: 'mock-user-2',
    voucher_code: '2345',
    full_name: 'Maria Oliveira Costa',
    cpf: '98765432100',
    company_id: 'mock-company-2',
    department: 'Administrativo',
    position: 'Assistente',
    shift_id: 'mock-shift-4',
    email: 'maria.oliveira@mello.com.br',
    phone: '11888776655',
    is_active: true,
    hire_date: '2023-03-10',
    birth_date: '1985-12-15',
    address: 'Av. Central, 200',
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    company: mockCompanies[1],
    shift: mockShifts[3]
  },
  {
    id: 'mock-user-3',
    voucher_code: '3456',
    full_name: 'Pedro Alves Lima',
    cpf: '45678912300',
    company_id: 'mock-company-3',
    department: 'Logística',
    position: 'Conferente',
    shift_id: 'mock-shift-2',
    email: 'pedro.alves@turbo.com.br',
    phone: '11777665544',
    is_active: true,
    hire_date: '2023-02-20',
    birth_date: '1988-08-10',
    address: 'Rua do Porto, 300',
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    company: mockCompanies[2],
    shift: mockShifts[1]
  }
];

// Connection status
let connectionStatus: 'unknown' | 'connected' | 'disconnected' | 'checking' = 'unknown';
let isSupabaseAvailable = false;

// Check if Supabase is available and tables exist
export async function checkSupabaseConnection(): Promise<boolean> {
  if (connectionStatus === 'checking') {
    return isSupabaseAvailable;
  }

  connectionStatus = 'checking';
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('companies')
      .select('count(*)')
      .limit(1);

    if (error) {
      console.warn('Supabase não disponível:', error.message);
      connectionStatus = 'disconnected';
      isSupabaseAvailable = false;
      return false;
    }

    console.log('✅ Supabase conectado com sucesso!');
    connectionStatus = 'connected';
    isSupabaseAvailable = true;
    return true;

  } catch (error) {
    console.warn('Erro de conexão com Supabase:', error);
    connectionStatus = 'disconnected';
    isSupabaseAvailable = false;
    return false;
  }
}

// Get connection status
export function getConnectionStatus() {
  return { status: connectionStatus, isAvailable: isSupabaseAvailable };
}

// Hybrid functions that try Supabase first, fallback to mock data
export async function getCompanies(): Promise<Company[]> {
  const isConnected = await checkSupabaseConnection();
  
  if (isConnected) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Erro ao buscar empresas, usando dados mock:', error);
    }
  }
  
  return mockCompanies;
}

export async function getUsers(): Promise<User[]> {
  const isConnected = await checkSupabaseConnection();
  
  if (isConnected) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          company:companies(id, name),
          shift:shifts(id, name)
        `)
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Erro ao buscar usuários, usando dados mock:', error);
    }
  }
  
  return mockUsers;
}

export async function getShifts(): Promise<Shift[]> {
  const isConnected = await checkSupabaseConnection();
  
  if (isConnected) {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('start_time');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Erro ao buscar turnos, usando dados mock:', error);
    }
  }
  
  return mockShifts;
}

export async function getMealTypes(): Promise<MealType[]> {
  const isConnected = await checkSupabaseConnection();
  
  if (isConnected) {
    try {
      const { data, error } = await supabase
        .from('meal_types')
        .select('*')
        .order('start_time');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Erro ao buscar tipos de refeição, usando dados mock:', error);
    }
  }
  
  return mockMealTypes;
}

export async function getUserByVoucher(voucherCode: string): Promise<User | null> {
  const isConnected = await checkSupabaseConnection();
  
  if (isConnected) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          company:companies(id, name),
          shift:shifts(id, name)
        `)
        .eq('voucher_code', voucherCode)
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }
      
      return data || null;
    } catch (error) {
      console.warn('Erro ao buscar usuário por voucher, usando dados mock:', error);
    }
  }
  
  // Fallback to mock data
  const user = mockUsers.find(u => u.voucher_code === voucherCode && u.is_active);
  return user || null;
}

export async function createMealRecord(record: Omit<MealRecord, 'id' | 'created_at' | 'updated_at'>): Promise<MealRecord | null> {
  const isConnected = await checkSupabaseConnection();
  
  if (isConnected) {
    try {
      const { data, error } = await supabase
        .from('meal_records')
        .insert(record)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Erro ao criar registro de refeição:', error);
      notifications.error('Erro de conexão', 'Não foi possível registrar no banco de dados.');
      return null;
    }
  }
  
  // Mock successful creation for demo purposes
  const mockRecord: MealRecord = {
    id: 'mock-record-' + Date.now(),
    ...record,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  console.log('📝 Registro mock criado:', mockRecord);
  notifications.success('Modo Demo', 'Refeição registrada em modo demonstração.');
  return mockRecord;
}

export async function checkDailyMealLimit(userId: string, date: string): Promise<number> {
  const isConnected = await checkSupabaseConnection();
  
  if (isConnected) {
    try {
      const { data, error } = await supabase
        .from('meal_records')
        .select('id')
        .eq('user_id', userId)
        .eq('meal_date', date)
        .eq('status', 'used');
      
      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.warn('Erro ao verificar limite diário:', error);
    }
  }
  
  // Mock: return 0 for demo purposes
  return 0;
}

export async function checkMealTypeUsage(userId: string, date: string, mealTypeId: string): Promise<boolean> {
  const isConnected = await checkSupabaseConnection();
  
  if (isConnected) {
    try {
      const { data, error } = await supabase
        .from('meal_records')
        .select('id')
        .eq('user_id', userId)
        .eq('meal_date', date)
        .eq('meal_type_id', mealTypeId)
        .eq('status', 'used');
      
      if (error) throw error;
      return (data?.length || 0) > 0;
    } catch (error) {
      console.warn('Erro ao verificar uso do tipo de refeição:', error);
    }
  }
  
  // Mock: return false for demo purposes
  return false;
}

// Show connection status notification
export function showConnectionStatus() {
  const { status, isAvailable } = getConnectionStatus();
  
  if (status === 'connected') {
    notifications.success('Supabase Conectado', 'Sistema operando com dados reais do banco.');
  } else if (status === 'disconnected') {
    notifications.warning('Modo Demonstração', 'Sistema operando com dados de exemplo. Execute o SQL no Supabase para usar dados reais.');
  }
}

// Export mock data for development/testing
export const mockData = {
  companies: mockCompanies,
  users: mockUsers,
  shifts: mockShifts,
  mealTypes: mockMealTypes
};