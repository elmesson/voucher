import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import { Toaster } from './components/ui/sonner';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Separator } from './components/ui/separator';
import { 
  Users, 
  Building2, 
  Utensils, 
  FileText, 
  ImageIcon, 
  UserCheck, 
  Clock, 
  Plus, 
  LogOut, 
  Ticket, 
  X,
  CheckCircle,
  User,
  Settings,

} from 'lucide-react';
import { UserManagement } from './components/UserManagement';
import { CompanyManagement } from './components/CompanyManagement';
import { MealTypeManagement } from './components/MealTypeManagement';
import { ShiftManagement } from './components/ShiftManagement';
import { ManagerManagement } from './components/ManagerManagement';
import { ExtraMealsManagement } from './components/ExtraMealsManagement';
import { ReportsManagement } from './components/ReportsManagement';
import { ManagerSelectionModal } from './components/ManagerSelectionModal';
import { UnifiedConnectionBadge, UnifiedConnectionDot } from './components/UnifiedConnectionStatus';
import { notifications } from './components/NotificationSystem';
import { SafeDebugLogger } from './components/SafeDebugLogger';
// Sistema de limpeza removido para evitar múltiplas instâncias
import { 
  formatTime, 
  formatDate, 
  isUserInShift, 
  getCurrentDateLocal,
  fetchUserByVoucher,
  checkUserMealCount,
  checkUserMealTypeUsage,
  createUserMealRecord
} from './utils/supabase/unified-client';
import { useMealTypes, useUsers } from './utils/supabase/unified-hooks';
import type { User as UserType, MealType, MealRecord } from './utils/supabase/unified-client';
import type { Manager } from './utils/supabase/unified-client';

interface ManagerSession {
  id: string;
  full_name: string;
  email: string;
  company?: { id: string; name: string };
  department?: string;
  position?: string;
  permissions: string[];
  role: 'manager';
}

type UserSession = ManagerSession;

export default function App() {
  // DEBUG: forçar admin/gerentes para destravar a tela
  const [currentView, setCurrentView] = useState<'voucher' | 'admin' | 'confirmation' | 'success'>('admin');
  const [activeTab, setActiveTab] = useState('gerentes');
  const [voucherCode, setVoucherCode] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [validationStep, setValidationStep] = useState<'initial' | 'validating' | 'confirmed'>('initial');
  const [currentTime, setCurrentTime] = useState('');
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [availableMealTypes, setAvailableMealTypes] = useState<MealType[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);

  const { mealTypes } = useMealTypes();

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().slice(0, 8)); // HH:MM:SS format
    };

    updateTime(); // Set initial time immediately
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load available meal types based on current time - memoized to prevent loops
  const loadAvailableMealTypes = useCallback(() => {
    try {
      const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format
      console.log('⏰ Carregando tipos de refeição para horário:', currentTime);
      
      // Filter meal types available at current time (non-special only for voucher system)
      const available = mealTypes.filter(type => {
        if (type.is_special) return false; // Only regular meal types
        if (!type.is_active) return false;
        
        const start = type.start_time;
        const end = type.end_time;
        
        // Handle overnight meals (like Ceia: 22:00 to 02:00)
        if (start > end) {
          return currentTime >= start || currentTime <= end;
        } else {
          return currentTime >= start && currentTime <= end;
        }
      });

      console.log('🍽️ Tipos de refeição disponíveis:', available.map(t => t.name));
      
      setAvailableMealTypes(prev => {
        // Only update if the array is different
        if (prev.length !== available.length || 
            !prev.every((item, index) => item.id === available[index]?.id)) {
          return available;
        }
        return prev;
      });
      
      // Auto-select the first available meal type only if none is selected or current is not available
      setSelectedMealType(prev => {
        if (available.length === 0) return null;
        if (!prev || !available.find(t => t.id === prev.id)) {
          console.log('✅ Selecionando automaticamente:', available[0].name);
          return available[0];
        }
        return prev;
      });
    } catch (error) {
      console.error('Erro ao carregar tipos de refeição:', error);
    }
  }, [mealTypes]);

  useEffect(() => {
    loadAvailableMealTypes();
    
    // Reload meal types every minute to check for time changes
    const interval = setInterval(loadAvailableMealTypes, 60000);
    return () => clearInterval(interval);
  }, [loadAvailableMealTypes]);

  // Check for existing manager session on load
  useEffect(() => {
    const checkUserSession = () => {
      // Check manager session
      const storedManager = localStorage.getItem('manager_session');
      if (storedManager) {
        try {
          const managerSession = JSON.parse(storedManager);
          setUserSession(managerSession);
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem('manager_session');
        }
      }
    };

    checkUserSession();
  }, []);

  // Define tabs based on manager permissions - memoized to prevent infinite loops
  const availableTabs = useMemo(() => {
    const allTabs = [
      { id: 'usuarios', label: 'Usuários', icon: Users, permission: 'usuarios' },
      { id: 'empresas', label: 'Empresas', icon: Building2, permission: 'empresas' },
      { id: 'tipos-refeicao', label: 'Tipos de Refeição', icon: Utensils, permission: 'tipos-refeicao' },
      { id: 'relatorios', label: 'Relatórios', icon: FileText, permission: 'relatorios' },
      { id: 'imagens-fundo', label: 'Imagens do Fundo', icon: ImageIcon, permission: 'configuracoes' },
      { id: 'gerentes', label: 'Gerentes', icon: UserCheck, permission: 'gerentes' },
      { id: 'turnos', label: 'Turnos', icon: Clock, permission: 'turnos' },
      { id: 'rh-extras', label: 'RH Refeições Extras', icon: Plus, permission: 'rh-extras' }
    ];

    // Verificar se há sessão de gerente autenticado
    if (!userSession || !('permissions' in userSession)) {
      console.log('⚠️ Nenhuma sessão de gerente encontrada');
      return [];
    }

    // Filtrar abas baseado nas permissões do gerente
    const managerPermissions = userSession.permissions || [];
    console.log('🔑 Permissões do gerente:', managerPermissions);
    
    const filteredTabs = allTabs.filter(tab => 
      managerPermissions.includes(tab.permission)
    );
    
    console.log('📋 Abas disponíveis:', filteredTabs.map(t => t.label));
    return filteredTabs;
  }, [userSession]);

  // Auto-select first available tab when user logs in - only when tabs change
  useEffect(() => {
    if (availableTabs.length > 0) {
      const hasValidTab = availableTabs.some(tab => tab.id === activeTab);
      if (!hasValidTab) {
        console.log('🔄 Selecionando primeira tab disponível:', availableTabs[0].id);
        setActiveTab(availableTabs[0].id);
      }
    }
  }, [availableTabs.length]);

  // Memoize grid class for tabs layout
  const tabsGridClass = useMemo(() => {
    if (availableTabs.length <= 4) {
      return 'grid-cols-' + availableTabs.length;
    } else if (availableTabs.length <= 8) {
      return 'grid-cols-4 lg:grid-cols-' + availableTabs.length;
    } else {
      return 'grid-cols-4 lg:grid-cols-8';
    }
  }, [availableTabs.length]);

  const handleNumberClick = useCallback((number: string) => {
    setVoucherCode(prev => {
      if (prev.length < 4) {
        return prev + number;
      }
      return prev;
    });
  }, []);

  const handleClear = useCallback(() => {
    setVoucherCode('');
  }, []);

  const handleBackspace = useCallback(() => {
    setVoucherCode(prev => prev.slice(0, -1));
  }, []);

  // Usar a função utilitária correta para obter data atual
  const getCurrentDate = useCallback((): string => {
    const dateStr = getCurrentDateLocal();
    console.log('📅 Data atual gerada (LOCAL):', dateStr, 'Timestamp:', new Date().toISOString());
    return dateStr;
  }, []);

  const validateVoucher = async (code: string, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    try {
      console.log(`🔄 Iniciando validação do voucher: ${code} (tentativa ${retryCount + 1}/${MAX_RETRIES + 1})`);

      // 1. Find user by voucher code with retry mechanism
      console.log('📝 Buscando usuário pelo voucher...');
      let user;
      try {
        user = await fetchUserByVoucher(code);
      } catch (fetchError) {
        console.error('❌ Error fetching user by voucher:', fetchError);
        throw new Error('Failed to fetch user data');
      }

      if (!user) {
        console.log('❌ Usuário não encontrado para o voucher:', code);
        notifications.error('Voucher inválido', 'Código não encontrado no sistema ou usuário inativo.');
        return null;
      }

      console.log('✅ Usuário encontrado:', user.full_name);

      // 2. Check if user is within their shift
      console.log('⏰ Verificando turno do usuário...');
      const shiftCheck = isUserInShift(user);
      if (!shiftCheck.isInShift) {
        console.log('❌ Usuário fora do turno:', shiftCheck.message);
        notifications.error('Acesso negado', shiftCheck.message || 'Usuário fora do turno de trabalho.');
        return null;
      }

      console.log('✅ Usuário dentro do turno');

      // 3. Check daily meal limit with retry mechanism
      console.log('🍽️ Verificando limite diário de refeições...');
      const today = getCurrentDate();
      console.log('📅 Data para verificação:', today);
      console.log('📅 Data atual no sistema:', new Date().toISOString());
      console.log('📅 Data local brasileira:', new Date().toLocaleString('pt-BR'));
      
      let mealCount;
      try {
        mealCount = await checkUserMealCount(user.id, today);
        console.log('✅ Contagem de refeições hoje:', mealCount);
      } catch (fetchError) {
        console.error('❌ Error checking today records:', fetchError);
        throw new Error('Failed to check meal count');
      }

      // Check meal limit (2 per day)
      if (mealCount >= 2) {
        console.log('❌ Limite diário atingido:', mealCount);
        notifications.error('Limite diário atingido', 'Você já utilizou o limite de 2 refeições por dia.');
        return null;
      }

      // 4. Check if user already had a meal of this type today
      if (selectedMealType) {
        console.log('🍴 Verificando uso do tipo de refeição:', selectedMealType.name);
        let hasUsedMealType;
        try {
          hasUsedMealType = await checkUserMealTypeUsage(user.id, today, selectedMealType.id);
          console.log('✅ Verificação de tipo de refeição:', hasUsedMealType ? 'Já utilizado' : 'Disponível');
        } catch (fetchError) {
          console.error('❌ Error checking recent records:', fetchError);
          throw new Error('Failed to check meal type usage');
        }

        if (hasUsedMealType) {
          console.log('❌ Refeição já utilizada:', selectedMealType.name);
          notifications.error('Refeição já utilizada', `Você já utilizou ${selectedMealType.name} hoje.`);
          return null;
        }
      }

      // 5. Check if meal types are available
      if (availableMealTypes.length === 0) {
        console.log('❌ Nenhum tipo de refeição disponível');
        notifications.error('Horário indisponível', 'Nenhum tipo de refeição está disponível no momento.');
        return null;
      }

      console.log('✅ Validação concluída com sucesso!');
      notifications.success('Voucher válido!', `Bem-vindo(a), ${user.full_name}`);
      return user;

    } catch (error: any) {
      console.error(`❌ Erro na validação (tentativa ${retryCount + 1}):`, error);
      console.error('❌ Detalhes do erro:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Check if this is a network error and we haven't exceeded retry limit
      const isNetworkError = (
        error.message?.includes('Failed to fetch') || 
        error.message?.includes('fetch') ||
        error.name === 'TypeError' ||
        error.code === 'NETWORK_ERROR' ||
        error instanceof TypeError
      );

      if (retryCount < MAX_RETRIES && isNetworkError) {
        const nextDelay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
        console.log(`🔄 Tentando novamente em ${nextDelay}ms... (tentativa ${retryCount + 1}/${MAX_RETRIES})`);
        notifications.warning('Conectando...', `Tentativa ${retryCount + 1} de ${MAX_RETRIES + 1} - Aguarde...`);
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, nextDelay));
        
        // Retry
        return validateVoucher(code, retryCount + 1);
      }

      // If all retries failed or this is not a network error
      console.error('❌ Todas as tentativas falharam ou erro não relacionado à rede');
      
      if (isNetworkError) {
        notifications.error('Erro de conexão', 'Não foi possível conectar ao banco de dados. Verifique sua conexão com a internet e tente novamente.');
      } else if (error.message?.includes('Project ID')) {
        notifications.error('Erro de configuração', 'Problema na configuração do banco de dados. Entre em contato com o suporte.');
      } else {
        notifications.error('Erro de validação', `Erro: ${error.message || 'Tente novamente em alguns segundos.'}`);
      }
      
      return null;
    }
  };

  const handleUseVoucher = async () => {
    if (!voucherCode || voucherCode.length !== 4) {
      notifications.error('Código incompleto', 'Por favor, digite um código de 4 dígitos.');
      return;
    }

    if (availableMealTypes.length === 0) {
      notifications.error('Horário indisponível', 'Nenhum tipo de refeição está disponível no momento.');
      return;
    }

    setValidationStep('validating');
    
    const validatedUser = await validateVoucher(voucherCode);
    
    if (validatedUser) {
      setSelectedUser(validatedUser);
      setCurrentView('confirmation');
      setValidationStep('confirmed');
    } else {
      setValidationStep('initial');
    }
  };

  const handleConfirmMeal = async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;

    if (!selectedUser || !selectedMealType) {
      notifications.error('Erro', 'Dados insuficientes para registrar a refeição.');
      return;
    }

    try {
      console.log(`📝 Registrando refeição (tentativa ${retryCount + 1}/${MAX_RETRIES + 1})...`);
      
      const now = new Date();
      const currentDate = getCurrentDate();
      const mealRecord: Omit<MealRecord, 'id' | 'created_at' | 'updated_at'> = {
        user_id: selectedUser.id,
        meal_type_id: selectedMealType.id,
        voucher_code: selectedUser.voucher_code,
        meal_date: currentDate, // Usando função que considera timezone local
        meal_time: now.toTimeString().slice(0, 8), // HH:MM:SS
        price: selectedMealType.price || 0,
        status: 'used',
        validation_method: 'voucher',
        validated_by: null, // No admin validation for voucher system
        notes: `Refeição registrada via voucher - ${selectedMealType.name}`
      };

      console.log('📊 Dados do registro da refeição:');
      console.log('  - Data da refeição:', currentDate);
      console.log('  - Horário da refeição:', mealRecord.meal_time);
      console.log('  - Usuário:', selectedUser.full_name);
      console.log('  - Tipo de refeição:', selectedMealType.name);

      console.log('🍽️ Dados da refeição:', {
        user: selectedUser.full_name,
        meal_type: selectedMealType.name,
        date: mealRecord.meal_date,
        time: mealRecord.meal_time
      });

      const result = await createUserMealRecord(mealRecord);

      if (result) {
        console.log('✅ Refeição registrada com sucesso:', result.id);
        setCurrentView('success');
        notifications.success('Refeição registrada!', 'Sua refeição foi registrada com sucesso. Bom apetite!');
      } else {
        console.log('❌ Resultado vazio do registro');
        notifications.error('Erro no registro', 'Não foi possível registrar a refeição. Tente novamente.');
      }

    } catch (error: any) {
      console.error(`❌ Erro ao registrar refeição (tentativa ${retryCount + 1}):`, error);

      // Check if this is a network error and we haven't exceeded retry limit
      if (retryCount < MAX_RETRIES && (
        error.message?.includes('Failed to fetch') || 
        error.message?.includes('fetch') ||
        error.name === 'TypeError' ||
        error.code === 'NETWORK_ERROR'
      )) {
        console.log(`🔄 Tentando registrar novamente em ${RETRY_DELAY}ms...`);
        notifications.warning('Conectando...', `Registrando refeição... Tentativa ${retryCount + 1} de ${MAX_RETRIES + 1}`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        
        // Retry with exponential backoff
        return handleConfirmMeal(retryCount + 1);
      }

      // If all retries failed or this is not a network error
      if (error.message?.includes('Failed to fetch')) {
        notifications.error('Erro de conexão', 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
      } else {
        notifications.error('Erro de registro', 'Não foi possível registrar a refeição. Tente novamente.');
      }
    }
  };

  const handleCancelConfirmation = useCallback(() => {
    setCurrentView('voucher');
    setSelectedUser(null);
    setVoucherCode('');
    setValidationStep('initial');
  }, []);

  const handleBackToVoucher = useCallback(() => {
    setCurrentView('voucher');
    setSelectedUser(null);
    setVoucherCode('');
    setValidationStep('initial');
  }, []);



  const handleManagerAccess = useCallback(() => {
    if (isAuthenticated && userSession && 'role' in userSession && userSession.role === 'manager') {
      // Manager já autenticado, ir direto para admin
      setCurrentView('admin');
    } else {
      // Selecionar gerente
      setShowManagerModal(true);
    }
  }, [isAuthenticated, userSession]);

  const handleManagerSelect = useCallback((manager: Manager) => {
    const managerSession: ManagerSession = {
      id: manager.id,
      full_name: manager.full_name,
      email: manager.email,
      company: manager.company,
      department: manager.department,
      position: manager.position,
      permissions: Array.isArray(manager.permissions) ? manager.permissions : [],
      role: 'manager'
    };

    setUserSession(managerSession);
    setIsAuthenticated(true);
    
    // Store session in localStorage
    localStorage.setItem('manager_session', JSON.stringify(managerSession));
    
    // Navigate to admin panel
    setCurrentView('admin');
    
    notifications.success('Acesso concedido!', `Bem-vindo(a), ${manager.full_name}`);
  }, []);

  const handleLogout = useCallback(() => {
    setUserSession(null);
    setIsAuthenticated(false);
    localStorage.removeItem('manager_session');
    setCurrentView('voucher');
    setVoucherCode('');
    setSelectedUser(null);
    setValidationStep('initial');
    notifications.success('Logout realizado', 'Você foi desconectado com sucesso.');
  }, []);

  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const getUserDisplayName = useCallback(() => {
    if (!userSession) return '';
    
    if ('fullName' in userSession) {
      return userSession.fullName; // Admin
    }
    
    return userSession.full_name; // Manager
  }, [userSession]);

  const getUserRole = useCallback(() => {
    if (!userSession || !('role' in userSession)) return '';
    
    if (userSession.role === 'manager') {
      return 'GERENTE';
    }
    
    return userSession.role.toUpperCase();
  }, [userSession]);

  const numbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫']
  ];

  // Success Screen
  if (currentView === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-600 to-green-700 flex items-center justify-center relative">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto shadow-lg mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-green-600 mb-2">Sucesso!</h1>
            <p className="text-lg text-gray-700 mb-4">
              Sua refeição foi registrada com sucesso.
            </p>
            <p className="text-xl font-medium text-green-600">
              Bom apetite!
            </p>
          </div>

          {selectedUser && selectedMealType && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-green-100 text-green-600">
                    {getInitials(selectedUser.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">{selectedUser.full_name}</h3>
                  <p className="text-sm text-gray-600">{selectedMealType.name}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>Registrado em: {new Date().toLocaleString('pt-BR')}</p>
                {selectedMealType.price && (
                  <p>Valor: R$ {selectedMealType.price.toFixed(2)}</p>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={handleBackToVoucher}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-base font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Ticket className="w-5 h-5 mr-2" />
            Voltar ao Voucher
          </Button>
        </div>

        <Toaster 
          position="top-right"
          expand={true}
          richColors
          closeButton
        />
      </div>
    );
  }

  // Confirmation Screen
  if (currentView === 'confirmation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center relative">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-blue-600 mb-2">Confirmar Refeição</h1>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto shadow-lg">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
          </div>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                      {getInitials(selectedUser.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{selectedUser.full_name}</h3>
                    <p className="text-gray-600">{selectedUser.position || 'Funcionário'}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        ATIVO
                      </Badge>
                      {selectedUser.shift ? (
                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                          NO TURNO
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                          VISITANTE
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Empresa:</span>
                    <span className="font-medium text-gray-900">{selectedUser.company?.name || 'Não definida'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Setor:</span>
                    <span className="font-medium text-gray-900">{selectedUser.department || 'Não definido'}</span>
                  </div>
                  {selectedUser.shift && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Turno:</span>
                      <span className="font-medium text-gray-900">
                        {selectedUser.shift.name} ({formatTime(selectedUser.shift.start_time)} às {formatTime(selectedUser.shift.end_time)})
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Voucher:</span>
                    <span className="font-medium text-gray-900">{selectedUser.voucher_code}</span>
                  </div>
                </div>
              </div>

              {/* Meal Info */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <Utensils className="w-4 h-4" />
                  Informações da Refeição
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Tipo:</span>
                    <span className="font-medium text-blue-900">
                      {selectedMealType?.name || 'Não definido'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Data:</span>
                    <span className="font-medium text-blue-900">
                      {new Date().toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Horário:</span>
                    <span className="font-medium text-blue-900">
                      {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {selectedMealType?.price && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Valor:</span>
                      <span className="font-medium text-blue-900">
                        R$ {selectedMealType.price.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Meal Type Selection */}
              {availableMealTypes.length > 1 && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <h4 className="font-medium text-amber-900 mb-3">Tipos de Refeição Disponíveis</h4>
                  <div className="space-y-2">
                    {availableMealTypes.map((mealType) => (
                      <label key={mealType.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="mealType"
                          value={mealType.id}
                          checked={selectedMealType?.id === mealType.id}
                          onChange={() => setSelectedMealType(mealType)}
                          className="text-blue-600"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{mealType.name}</span>
                          <div className="text-sm text-gray-600">
                            {formatTime(mealType.start_time)} às {formatTime(mealType.end_time)}
                            {mealType.price && ` - R$ ${mealType.price.toFixed(2)}`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCancelConfirmation}
                  variant="outline"
                  className="flex-1 h-14 text-base font-medium rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <X className="w-5 h-5 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmMeal}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-14 text-base font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={!selectedMealType}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Registrar
                </Button>
              </div>
            </div>
          )}
        </div>

        <Toaster 
          position="top-right"
          expand={true}
          richColors
          closeButton
        />
      </div>
    );
  }

  // Voucher Screen
  if (currentView === 'voucher') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center relative">
        {/* Manager Access Button */}
        <div className="absolute top-6 right-6">
          <Button
            onClick={handleManagerAccess}
            className="bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 shadow-lg"
            size="sm"
          >
            {isAuthenticated && userSession && 'role' in userSession && userSession.role === 'manager' ? (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Gerente
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 text-xs">
                  ATIVO
                </Badge>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Gerente
              </>
            )}
          </Button>
        </div>

        {/* Current Time and Connection Status Display */}
        <div className="absolute top-6 left-6 space-y-3">
          {/* Time Display */}
          <div className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white/20">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{currentTime}</span>
            </div>
            <div className="text-xs mt-1 opacity-90">
              {availableMealTypes.length > 0 ? (
                `${availableMealTypes[0].name} Disponível`
              ) : (
                'Nenhuma refeição disponível'
              )}
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
            <UnifiedConnectionDot />
          </div>
        </div>

        {/* Voucher Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-blue-600 mb-2">Voucher</h1>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto shadow-lg">
              <Utensils className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Validation Status */}
          {validationStep === 'validating' && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <p className="text-sm text-blue-700 font-medium">Validando voucher...</p>
                </div>
                <p className="text-xs text-blue-600">Verificando dados do usuário e disponibilidade</p>
              </div>
            </div>
          )}

          {/* Available Meal Types Info */}
          {validationStep === 'initial' && availableMealTypes.length > 0 && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-center">
                <p className="text-sm text-blue-700 font-medium">Refeição Disponível Agora</p>
                <p className="text-blue-900 font-semibold">{availableMealTypes[0].name}</p>
                <p className="text-xs text-blue-600">
                  {formatTime(availableMealTypes[0].start_time)} às {formatTime(availableMealTypes[0].end_time)}
                </p>
              </div>
            </div>
          )}

          {validationStep === 'initial' && availableMealTypes.length === 0 && (
            <div className="mb-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-center">
                <p className="text-sm text-amber-700 font-medium">Atenção</p>
                <p className="text-amber-900">Nenhuma refeição disponível no momento</p>
                <p className="text-xs text-amber-600">Verifique os horários de funcionamento</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Input Display */}
            <div className="relative">
              <Input
                value={voucherCode}
                readOnly
                placeholder="Digite o código do voucher (4 dígitos)"
                className="text-center text-lg bg-gray-50 border-gray-200 h-14 text-gray-800 rounded-xl"
              />
              {validationStep === 'validating' && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                </div>
              )}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3">
              {numbers.flat().map((num, index) => (
                <div key={index}>
                  {num === '' ? (
                    <div className="h-14" />
                  ) : num === '⌫' ? (
                    <Button
                      variant="outline"
                      className="h-14 w-full border-gray-300 text-gray-600 hover:bg-gray-50 text-lg rounded-xl"
                      onClick={handleBackspace}
                      disabled={validationStep === 'validating'}
                    >
                      {num}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="h-14 w-full border-gray-300 text-gray-800 hover:bg-gray-50 text-lg font-medium rounded-xl"
                      onClick={() => handleNumberClick(num)}
                      disabled={validationStep === 'validating'}
                    >
                      {num}
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <Button
                onClick={handleUseVoucher}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 text-base font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={!voucherCode || voucherCode.length !== 4 || validationStep === 'validating' || availableMealTypes.length === 0}
              >
                {validationStep === 'validating' ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Validando...
                  </>
                ) : (
                  'Utilizar Voucher'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Modals */}
        <ManagerSelectionModal
          isOpen={showManagerModal}
          onClose={() => setShowManagerModal(false)}
          onManagerSelect={handleManagerSelect}
        />

        {/* Toast Notifications */}
        <Toaster 
          position="top-right"
          expand={true}
          richColors
          closeButton
        />
      </div>
    );
  }

  // Admin Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Utensils className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Administração</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Sistema de Gestão de Refeições</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setCurrentView('voucher')}
                className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Ticket className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Voucher</span>
              </Button>
              <div className="flex items-center space-x-3">
                {userSession && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 font-medium">
                      <UserCheck className="w-3 h-3 mr-1" />
                      {getUserDisplayName()}
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {getUserRole()}
                    </Badge>
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {availableTabs.length === 0 ? (
          <Card className="bg-white border-blue-100 shadow-sm">
            <CardContent className="text-center py-12">
              <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Restrito</h3>
              <p className="text-gray-600">
                Você não tem permissões para acessar nenhum módulo do sistema.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Entre em contato com o administrador para solicitar acesso.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tabs Navigation */}
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-2">
                <TabsList className={`grid gap-1 h-auto p-0 bg-transparent ${tabsGridClass}`}>
                  {availableTabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="flex flex-col items-center gap-2 p-3 text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 rounded-lg border-0 font-medium"
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="hidden sm:inline text-center leading-tight">
                          {tab.label}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="animate-in fade-in-50 duration-200">
              <TabsContent value="usuarios" className="mt-0">
                <UserManagement />
              </TabsContent>

              <TabsContent value="empresas" className="mt-0">
                <CompanyManagement />
              </TabsContent>

              <TabsContent value="tipos-refeicao" className="mt-0">
                <MealTypeManagement />
              </TabsContent>

              <TabsContent value="relatorios" className="mt-0">
                <ReportsManagement />
              </TabsContent>

              <TabsContent value="imagens-fundo" className="mt-0">
                <Card className="bg-white border-blue-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                      Imagens do Fundo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Personalização Visual</h3>
                      <p className="text-gray-600">Configure as imagens de fundo do sistema.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gerentes" className="mt-0">
                <ManagerManagement />
              </TabsContent>

              <TabsContent value="turnos" className="mt-0">
                <ShiftManagement />
              </TabsContent>

              <TabsContent value="rh-extras" className="mt-0">
                <ExtraMealsManagement userSession={userSession} />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>

      {/* Debug Logger para Filtros (apenas quando em admin) */}
      {currentView === 'admin' && <SafeDebugLogger />}

      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        expand={true}
        richColors
        closeButton
      />
    </div>
  );
}