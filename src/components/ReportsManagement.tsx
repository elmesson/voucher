import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  FileText, 
  Filter, 
  Download, 
  Calendar, 
  Utensils, 
  DollarSign, 
  TrendingUp, 
  Users,
  FileDown,
  FileSpreadsheet
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { notifications } from './NotificationSystem';
import { supabase, getCurrentDateLocal } from '../utils/supabase/unified-client';
import type { Company, MealType, User } from '../utils/supabase/unified-client';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MealRecord {
  id: string;
  meal_date: string;
  meal_time: string;
  user_id: string;
  meal_type_id: string;
  voucher_code: string;
  price: number;
  status: string;
  validation_method: string;
  notes?: string;
  user?: User;
  meal_type?: MealType;
}

interface ExtraMealRecord {
  id: string;
  meal_date: string;
  meal_time: string;
  user_id?: string;
  meal_type_id: string;
  price: number;
  status: string;
  reason?: string;
  requested_by?: string;
  approved_by?: string;
  approved_at?: string;
  used_at?: string;
  notes?: string;
  requested_by_name?: string;
  external_name?: string;
  external_document?: string;
  external_company?: string;
  created_at?: string;
  updated_at?: string;
  user?: User;
  meal_type?: MealType;
}

interface FilterState {
  startDate: string;
  endDate: string;
  companyId: string;
  mealTypeId: string;
  status: string;
}

export function ReportsManagement() {
  const [activeTab, setActiveTab] = useState('regular');
  const [regularMeals, setRegularMeals] = useState<MealRecord[]>([]);
  const [extraMeals, setExtraMeals] = useState<ExtraMealRecord[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [extraMealsTableExists, setExtraMealsTableExists] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    startDate: getCurrentDateLocal(),
    endDate: getCurrentDateLocal(),
    companyId: 'all',
    mealTypeId: 'all',
    status: 'all'
  });

  const [currentManagerName, setCurrentManagerName] = useState<string>('Administrador Master');
  
  const loadManagerName = () => {
    console.log('🔍 ReportsManagement: Verificando sessão do gerente...');
    try {
      const stored = localStorage.getItem('manager_session');
      console.log('📦 Sessão armazenada:', stored);
      if (stored) {
        const session = JSON.parse(stored);
        console.log('👤 Dados da sessão:', session);
        if (session?.full_name) {
          console.log('✅ Nome do gerente encontrado:', session.full_name);
          setCurrentManagerName(session.full_name);
          return session.full_name;
        } else {
          console.warn('⚠️ Sessão existe mas não tem full_name');
        }
      } else {
        console.warn('⚠️ Nenhuma sessão de gerente encontrada no localStorage');
      }
    } catch (e) {
      console.error('❌ Erro ao ler sessão do gerente:', e);
    }
    return 'Administrador Master';
  };

  useEffect(() => {
    loadManagerName();
    
    const handleStorageChange = () => {
      console.log('🔄 Sessão alterada, recarregando nome do gerente...');
      loadManagerName();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Load companies and meal types
  useEffect(() => {
    loadCompanies();
    loadMealTypes();
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (activeTab === 'regular') {
      loadRegularMeals();
    } else {
      loadExtraMeals();
    }
  }, [filters, activeTab]);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const loadMealTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('meal_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMealTypes(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de refeição:', error);
    }
  };

  const loadRegularMeals = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('meal_records')
        .select(`
          *,
          user:users(id, full_name, voucher_code, company_id, company:companies(id, name), department, position, shift:shifts(id, name, start_time, end_time)),
          meal_type:meal_types(name, price)
        `)
        .gte('meal_date', filters.startDate)
        .lte('meal_date', filters.endDate)
        .order('meal_date', { ascending: false })
        .order('meal_time', { ascending: false });

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('Dados retornados do Supabase:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('Exemplo de registro:', data[0]);
      }

      // Filter by company and meal type on client side
      let filteredData = data || [];
      
      if (filters.companyId !== 'all') {
        console.log('Filtrando por empresa:', filters.companyId);
        filteredData = filteredData.filter(meal => {
          const companyId = meal.user?.company?.id || meal.user?.company_id;
          console.log('Refeição:', meal.id, 'Company ID:', companyId);
          return companyId === filters.companyId;
        });
        console.log('Dados filtrados:', filteredData.length, 'de', data?.length);
      }

      if (filters.mealTypeId !== 'all') {
        filteredData = filteredData.filter(meal => 
          meal.meal_type_id === filters.mealTypeId
        );
      }

      setRegularMeals(filteredData as MealRecord[]);
    } catch (error) {
      console.error('Erro ao carregar refeições regulares:', error);
      notifications.error('Erro', 'Não foi possível carregar as refeições regulares');
    } finally {
      setLoading(false);
    }
  };

  const loadExtraMeals = async () => {
    setLoading(true);
    try {
      // First, get the extra meal records from extra_meals table
      let query = supabase
        .from('extra_meals')
        .select('*')
        .gte('meal_date', filters.startDate)
        .lte('meal_date', filters.endDate)
        .order('meal_date', { ascending: false })
        .order('meal_time', { ascending: false });

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data: extraMealsData, error: mealsError } = await query;

      // If table doesn't exist, show empty state
      if (mealsError && mealsError.code === '42P01') {
        console.warn('⚠️ Tabela extra_meals não existe. Sistema de refeições extras não configurado.');
        setExtraMeals([]);
        setExtraMealsTableExists(false);
        return;
      }
      
      setExtraMealsTableExists(true);

      if (mealsError) throw mealsError;

      if (!extraMealsData || extraMealsData.length === 0) {
        setExtraMeals([]);
        return;
      }

      // Get unique user IDs (filter out null/undefined for external users)
      const userIds = [...new Set(extraMealsData.map(meal => meal.user_id).filter(id => id))];

      // Fetch users data only if there are internal users
      let usersData = [];
      if (userIds.length > 0) {
        const { data, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, voucher_code, company_id, department, position, company:companies(id, name)')
          .in('id', userIds);

        if (usersError) {
          console.error('Erro ao buscar usuários:', usersError);
        } else {
          usersData = data || [];
        }
      }

      // Get unique meal type IDs
      const mealTypeIds = [...new Set(extraMealsData.map(meal => meal.meal_type_id))];

      // Fetch meal types data
      const { data: mealTypesData, error: mealTypesError } = await supabase
        .from('meal_types')
        .select('id, name, price')
        .in('id', mealTypeIds);

      if (mealTypesError) {
        console.error('Erro ao buscar tipos de refeição:', mealTypesError);
      }

      // Combine the data
      const combinedData = extraMealsData.map(meal => ({
        ...meal,
        user: usersData?.find(u => u.id === meal.user_id),
        meal_type: mealTypesData?.find(mt => mt.id === meal.meal_type_id)
      }));

      // Filter by company and meal type on client side
      let filteredData = combinedData;
      
      if (filters.companyId !== 'all') {
        const selectedCompany = companies.find(c => c.id === filters.companyId);
        filteredData = filteredData.filter(meal => 
          meal.user?.company?.id === filters.companyId ||
          meal.external_company === selectedCompany?.name
        );
      }

      if (filters.mealTypeId !== 'all') {
        console.log('Filtrando por tipo de refeição:', filters.mealTypeId);
        filteredData = filteredData.filter(meal => 
          meal.meal_type_id === filters.mealTypeId
        );
        console.log('Dados após filtro de tipo:', filteredData.length);
      }

      console.log('Total final de refeições extras:', filteredData.length);
      setExtraMeals(filteredData as ExtraMealRecord[]);
    } catch (error) {
      console.error('Erro ao carregar refeições extras:', error);
      notifications.error('Erro', 'Não foi possível carregar as refeições extras');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const meals = activeTab === 'regular' ? regularMeals : extraMeals;
    
    const total = meals.length;
    const revenue = meals.reduce((sum, meal) => sum + (meal.price || 0), 0);
    const average = total > 0 ? revenue / total : 0;
    const uniqueUsers = new Set(meals.map(meal => meal.user_id)).size;

    return { total, revenue, average, uniqueUsers };
  }, [regularMeals, extraMeals, activeTab]);

  const handleSetToday = () => {
    const today = getCurrentDateLocal();
    setFilters(prev => ({ ...prev, startDate: today, endDate: today }));
  };

  const handleGenerateReport = () => {
    if (activeTab === 'regular') {
      loadRegularMeals();
    } else {
      loadExtraMeals();
    }
    notifications.success('Relatório gerado!', 'Dados atualizados com sucesso');
  };

  const exportToPDF = () => {
    try {
      console.log('Iniciando geração de PDF...');
      
      const managerName = loadManagerName();
      console.log('📝 PDF: Usando nome do gerente:', managerName);
      
      const doc = new jsPDF();
      const meals = activeTab === 'regular' ? regularMeals : extraMeals;
      const reportType = activeTab === 'regular' ? 'Consumo de Refeições' : 'Refeições Extras';

      console.log(`Gerando PDF com ${meals.length} registros...`);

      // Título principal
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Relatório ${reportType}`, 14, 20);
      
      // Subtítulo - Gerado por
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      doc.text(`Relatório gerado por ${managerName}`, 14, 28);
      doc.text(`Data de exportação: ${dateStr} às ${timeStr}`, 14, 34);
      
      // Totalizadores
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Totalizadores:', 14, 45);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Total de Registros: ${stats.total}`, 14, 52);
      doc.text(`Valor Total: R$ ${stats.revenue.toFixed(2)}`, 14, 58);
      
      // Período e Empresa
      doc.text(`Período: ${formatDate(filters.startDate)} a ${formatDate(filters.endDate)}`, 14, 66);
      
      // Pegar nome da empresa do primeiro registro ou usar filtro
      let companyName = 'Todas as empresas';
      if (filters.companyId !== 'all') {
        const selectedCompany = companies.find(c => c.id === filters.companyId);
        companyName = selectedCompany?.name || 'N/A';
      } else if (meals.length > 0) {
        companyName = (meals[0] as any).external_company || meals[0].user?.company?.name || 'N/A';
      }
      doc.text(`Empresa: ${companyName}`, 14, 72);

      // Tabela com colunas específicas
      const tableData = meals.map(meal => {
        const mealTime = meal.meal_time || '00:00';
        const timeFormatted = mealTime.slice(0, 5); // HH:MM
        
        // Usar o turno cadastrado do usuário
        const turno = meal.user?.shift?.name || 'N/A';
        
        return [
          `${formatDate(meal.meal_date)} ${timeFormatted}`,
          ((meal as any).external_name || meal.user?.full_name || 'N/A').toUpperCase(),
          meal.meal_type?.name || 'N/A',
          `R$ ${meal.price?.toFixed(2) || '0.00'}`,
          turno,
          meal.user?.department || ((meal as any).external_name ? 'EXTERNO' : 'N/A')
        ];
      });

      console.log('Adicionando tabela ao PDF...');
      
      // Use autoTable with jspdf-autotable 5.x
      autoTable(doc, {
        startY: 80,
        head: [['Data/Hora', 'Nome', 'Refeição', 'Valor', 'Turno', 'Setor']],
        body: tableData,
        styles: { 
          fontSize: 8,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [70, 70, 70],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 35 },  // Data/Hora
          1: { cellWidth: 50 },  // Nome
          2: { cellWidth: 30 },  // Refeição
          3: { cellWidth: 25 },  // Valor
          4: { cellWidth: 25 },  // Turno
          5: { cellWidth: 'auto' } // Setor
        }
      });

      console.log('Salvando PDF...');
      const filename = `relatorio-consumo-refeicoes-${getCurrentDateLocal()}.pdf`;
      doc.save(filename);
      notifications.success('PDF exportado!', 'Arquivo baixado com sucesso');
      console.log('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      notifications.error('Erro', `Não foi possível gerar o PDF: ${error}`);
    }
  };

  const exportToExcel = async () => {
    try {
      const managerName = loadManagerName();
      console.log('📊 Excel: Usando nome do gerente:', managerName);
      
      const XLSX = await import('xlsx');
      const meals = activeTab === 'regular' ? regularMeals : extraMeals;
      const reportType = activeTab === 'regular' ? 'Refeições Regulares' : 'Refeições Extras';

      // Prepare data
      const excelData = meals.map(meal => ({
        'Data': formatDate(meal.meal_date),
        'Hora': meal.meal_time,
        'Usuário': (meal as any).external_name || meal.user?.full_name || 'N/A',
        'Tipo': (meal as any).external_name ? 'Visitante' : 'Funcionário',
        'Voucher': meal.user?.voucher_code || (meal as any).external_document || 'N/A',
        'Refeição': meal.meal_type?.name || 'N/A',
        'Valor': meal.price || 0,
        'Status': meal.status === 'used' ? 'Utilizada' : meal.status === 'approved' ? 'Aprovada' : meal.status === 'pending' ? 'Pendente' : meal.status === 'rejected' ? 'Rejeitada' : meal.status,
        'Empresa': (meal as any).external_company || meal.user?.company?.name || 'N/A',
        'Setor': meal.user?.department || ((meal as any).external_name ? 'Externo' : 'N/A'),
        'Cargo': meal.user?.position || 'N/A'
      }));

      // Add summary at the top
      const summaryData = [
        { 'Relatório': reportType },
        { 'Período': `${formatDate(filters.startDate)} até ${formatDate(filters.endDate)}` },
        { 'Gerado por': managerName },
        { 'Total de Refeições': stats.total },
        { 'Receita Total': `R$ ${stats.revenue.toFixed(2)}` },
        { 'Preço Médio': `R$ ${stats.average.toFixed(2)}` },
        { 'Usuários Únicos': stats.uniqueUsers },
        {} // Empty row
      ];

      const worksheet = XLSX.utils.json_to_sheet([...summaryData, ...excelData]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, reportType);
      
      XLSX.writeFile(workbook, `relatorio-${activeTab}-${getCurrentDateLocal()}.xlsx`);
      notifications.success('Excel exportado!', 'Arquivo baixado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      notifications.error('Erro', 'Não foi possível exportar para Excel');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'N/A';
    return timeStr.slice(0, 5); // HH:MM
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const currentMeals = activeTab === 'regular' ? regularMeals : extraMeals;

  return (
    <Card className="bg-white border-blue-100 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Relatórios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tabs Header */}
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-blue-100">
              <TabsTrigger 
                value="regular" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Utensils className="w-4 h-4 mr-2" />
                Refeições Regulares
              </TabsTrigger>
              <TabsTrigger 
                value="extra"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Utensils className="w-4 h-4 mr-2" />
                Refeições Extras
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-gray-300"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button
              variant="outline"
              onClick={handleSetToday}
              className="border-gray-300"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Hoje
            </Button>
            <Button
              onClick={handleGenerateReport}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Gerar Relatório
            </Button>
            <div className="ml-auto">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {stats.total} registros
              </Badge>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Início
                  </label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Fim
                  </label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa
                  </label>
                  <Select
                    value={filters.companyId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, companyId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas empresas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas empresas</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Refeição
                  </label>
                  <Select
                    value={filters.mealTypeId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, mealTypeId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {mealTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-700">Total de Refeições</p>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-blue-900">{stats.total}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-green-700">Receita Total</p>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-green-900">
                R$ {stats.revenue.toFixed(2)}
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-purple-700">Preço Médio</p>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-purple-900">
                R$ {stats.average.toFixed(2)}
              </p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-orange-700">Usuários Únicos</p>
                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-orange-900">{stats.uniqueUsers}</p>
            </div>
          </div>

          {/* Export Section */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Exportar Relatório</h4>
            <p className="text-sm text-gray-600 mb-3">
              Baixe os dados em diferentes formatos
            </p>
            <div className="flex gap-3">
              <Button
                onClick={exportToPDF}
                variant="outline"
                className="flex-1"
                disabled={currentMeals.length === 0}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
              <Button
                onClick={exportToExcel}
                variant="outline"
                className="flex-1"
                disabled={currentMeals.length === 0}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>

          {/* Data Table */}
          <TabsContent value="regular" className="mt-0">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">Dados do Relatório</h4>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                  <p className="text-gray-600">Carregando dados...</p>
                </div>
              ) : currentMeals.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600">Nenhum registro encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Data/Hora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Refeição
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Empresa
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentMeals.map((meal) => (
                        <tr key={meal.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(meal.meal_date)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatTime(meal.meal_time)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                  {getInitials(meal.user?.full_name || 'N/A')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm text-gray-900">
                                  {meal.user?.full_name || 'N/A'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {'voucher_code' in meal ? meal.voucher_code : meal.user?.voucher_code || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              {meal.meal_type?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {meal.user?.shift?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              R$ {meal.price?.toFixed(2) || '0.00'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {(meal as any).status === 'approved' ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Aprovada
                              </Badge>
                            ) : (meal as any).status === 'pending' ? (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                Pendente
                              </Badge>
                            ) : (meal as any).status === 'rejected' ? (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">
                                Rejeitada
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Utilizada
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              {(meal as any).external_company || meal.user?.company?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {meal.user?.department || ((meal as any).external_name ? 'Externo' : 'Não definido')}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="extra" className="mt-0">
            {!extraMealsTableExists ? (
              <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-2">
                      Sistema de Refeições Extras Não Configurado
                    </h3>
                    <p className="text-sm text-amber-800 mb-4">
                      A tabela <code className="bg-amber-100 px-2 py-1 rounded">extra_meals</code> não existe no banco de dados. 
                      Esta tabela é necessária para o módulo "RH Refeições Extras" funcionar.
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-amber-200">
                      <h4 className="font-medium text-amber-900 mb-2">Para ativar este módulo:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-amber-800">
                        <li>Acesse o módulo "RH Refeições Extras"</li>
                        <li>A tabela será criada automaticamente</li>
                        <li>Ou contate o administrador do sistema</li>
                        <li>Recarregue esta página após a criação</li>
                      </ol>
                    </div>
                    <p className="text-xs text-amber-700 mt-3">
                      💡 A tabela extra_meals será criada automaticamente quando necessário.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">Dados do Relatório</h4>
                </div>
                
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                    <p className="text-gray-600">Carregando dados...</p>
                  </div>
                ) : currentMeals.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-600">Nenhum registro encontrado</p>
                  </div>
                ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Data/Hora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Refeição
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Empresa
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentMeals.map((meal) => (
                        <tr key={meal.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(meal.meal_date)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatTime(meal.meal_time)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                  {getInitials((meal as any).external_name || meal.user?.full_name || 'N/A')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm text-gray-900">
                                  {(meal as any).external_name || meal.user?.full_name || 'N/A'}
                                  {(meal as any).external_name && (
                                    <Badge variant="outline" className="ml-2 text-xs">Visitante</Badge>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {(meal as any).external_name 
                                    ? ((meal as any).external_document || 'Visitante')
                                    : (meal.user?.voucher_code || 'N/A')}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              {meal.meal_type?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              RH Extra
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              R$ {meal.price?.toFixed(2) || '0.00'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge 
                              variant="secondary" 
                              className="bg-green-100 text-green-800"
                            >
                              Utilizada
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              {meal.user?.company?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {meal.user?.department || 'Não definido'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
