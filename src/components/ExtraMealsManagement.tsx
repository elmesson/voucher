import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Users, 
  Building2, 
  FileText, 
  Check, 
  X, 
  Eye,
  Edit,
  Trash2,
  Loader2,
  Save,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  RefreshCw,
  Utensils,
  Database,
  ExternalLink,
  Filter,
  Settings
} from 'lucide-react';
import { notifications } from './NotificationSystem';
import { useExtraMeals, type ExtraMeal, type CreateExtraMealData } from '../utils/supabase/extra-meals-hooks';
import { runFullExtraMealsTest } from '../utils/supabase/extra-meals-test';
import { useCompanies, useMealTypes, useUsers } from '../utils/supabase/unified-hooks';
import { getCurrentDateLocal, isDateNotInPast } from '../utils/supabase/unified-client';
import ConnectionDiagnostics from '../utils/supabase/connection-diagnostics';
import { ConnectionDiagnosticsButton } from './ConnectionDiagnostics';

interface ExtraMealFormData {
  user_id: string;
  meal_type_id: string;
  meal_date: string;
  meal_time: string;
  reason: string;
  requested_by_name: string;
  notes: string;
  status: string;
  // For external users (visitors)
  external_name: string;
  external_document: string;
  external_company: string;
  is_external: boolean;
}

// Interface para props do componente
interface ExtraMealsManagementProps {
  userSession?: {
    id: string;
    role: string;
    permissions?: string[];
    full_name?: string;
    fullName?: string;
  } | null;
}

export function ExtraMealsManagement({ userSession }: ExtraMealsManagementProps = {}) {
  const { extraMeals, isLoading, schemaError, fetchExtraMeals, createExtraMeal, updateExtraMeal, deleteExtraMeal, approveExtraMeal, rejectExtraMeal, refreshExtraMeals, checkSchema } = useExtraMeals();
  const { companies } = useCompanies();
  const { mealTypes } = useMealTypes();
  const { users } = useUsers();

  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mealTypeFilter, setMealTypeFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<ExtraMeal | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [approvalJustification, setApprovalJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Date filters for filtering data
  const [dateFilters, setDateFilters] = useState({
    startDate: '',
    endDate: ''
  });

  const [formData, setFormData] = useState<ExtraMealFormData>({
    user_id: '',
    meal_type_id: '',
    meal_date: '',
    meal_time: '',
    reason: '',
    requested_by_name: '',
    notes: '',
    status: 'pending',
    external_name: '',
    external_document: '',
    external_company: '',
    is_external: false
  });

  const [formErrors, setFormErrors] = useState<Partial<ExtraMealFormData>>({});

  // Load data on component mount
  useEffect(() => {
    fetchExtraMeals(0); // Start with retry count 0
  }, [fetchExtraMeals]);

  // Set default date filters (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setDateFilters({
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: getCurrentDateLocal()
    });
  }, []);

  // Get special meal types only
  const specialMealTypes = mealTypes.filter(type => type.is_special && type.is_active);

  // Check user permissions
  const canApproveRejects = () => {
    if (!userSession) return false;
    if (userSession.role === 'super_admin' || userSession.role === 'admin') return true;
    if (userSession.role === 'manager' && userSession.permissions) {
      return userSession.permissions.includes('rh-extras');
    }
    return false;
  };

  const canEditStatus = () => {
    return canApproveRejects();
  };

  const canCreateExtra = () => {
    return canApproveRejects();
  };

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (showCreateDialog) {
      const today = getCurrentDateLocal();
      const currentTime = new Date().toTimeString().slice(0, 5);
      
      setFormData({
        user_id: '',
        meal_type_id: '',
        meal_date: today,
        meal_time: currentTime,
        reason: '',
        requested_by_name: '',
        notes: '',
        status: canEditStatus() ? 'pending' : 'pending', // Default status
        external_name: '',
        external_document: '',
        external_company: '',
        is_external: false
      });
      setFormErrors({});
    } else if (showEditDialog && selectedMeal) {
      setFormData({
        user_id: selectedMeal.user_id || '',
        meal_type_id: selectedMeal.meal_type_id,
        meal_date: selectedMeal.meal_date,
        meal_time: selectedMeal.meal_time || '',
        reason: selectedMeal.reason,
        requested_by_name: selectedMeal.requested_by_name,
        notes: selectedMeal.notes || '',
        status: selectedMeal.status || 'pending',
        external_name: selectedMeal.external_name || '',
        external_document: selectedMeal.external_document || '',
        external_company: selectedMeal.external_company || '',
        is_external: !selectedMeal.user_id
      });
      setFormErrors({});
    } else if (!showCreateDialog && !showEditDialog) {
      setFormErrors({});
    }
  }, [showCreateDialog, showEditDialog, selectedMeal]);

  const handleInputChange = (field: keyof ExtraMealFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    // Clear user selection when switching to external
    if (field === 'is_external' && value === true) {
      setFormData(prev => ({
        ...prev,
        user_id: ''
      }));
    }
  };

  const handleDateFilterChange = (field: string, value: string) => {
    setDateFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    const errors: Partial<ExtraMealFormData> = {};

    if (formData.is_external) {
      if (!formData.external_name.trim()) {
        errors.external_name = 'Nome é obrigatório para visitantes';
      }
      // Campo CPF/RG é opcional para visitantes
      if (!formData.external_company.trim()) {
        errors.external_company = 'Empresa é obrigatória para visitantes';
      }
    } else {
      if (!formData.user_id) {
        errors.user_id = 'Usuário é obrigatório';
      }
    }

    if (!formData.meal_type_id) {
      errors.meal_type_id = 'Tipo de refeição é obrigatório';
    }

    if (!formData.meal_date) {
      errors.meal_date = 'Data da refeição é obrigatória';
    }

    if (!formData.meal_time) {
      errors.meal_time = 'Horário da refeição é obrigatório';
    }

    if (!formData.reason.trim()) {
      errors.reason = 'Motivo da solicitação é obrigatório';
    }

    if (!formData.requested_by_name.trim()) {
      errors.requested_by_name = 'Nome do solicitante é obrigatório';
    }

    // Check if meal date is not in the past (allow today's date)
    if (!isDateNotInPast(formData.meal_date)) {
      errors.meal_date = 'Data da refeição não pode ser no passado';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getSelectedMealTypePrice = (): number => {
    const selectedMealType = specialMealTypes.find(type => type.id === formData.meal_type_id);
    return selectedMealType?.price || 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const mealTypePrice = getSelectedMealTypePrice();

      const mealData: CreateExtraMealData = {
        meal_type_id: formData.meal_type_id,
        meal_date: formData.meal_date,
        meal_time: formData.meal_time,
        reason: formData.reason,
        requested_by_name: formData.requested_by_name,
        status: formData.status || 'pending',
        price: mealTypePrice,
        notes: formData.notes || undefined
      };

      if (formData.is_external) {
        mealData.external_name = formData.external_name;
        mealData.external_document = formData.external_document;
        mealData.external_company = formData.external_company;
      } else {
        mealData.user_id = formData.user_id;
      }

      if (selectedMeal) {
        await updateExtraMeal(selectedMeal.id, mealData);
        setShowEditDialog(false);
        notifications.success('Refeição atualizada!', 'Dados foram atualizados com sucesso.');
      } else {
        await createExtraMeal(mealData);
        setShowCreateDialog(false);
        notifications.success('Refeição criada!', 'Nova refeição extra foi solicitada.');
      }

      setSelectedMeal(null);
    } catch (error) {
      console.error('Erro ao salvar refeição extra:', error);
      notifications.error('Erro ao salvar', 'Não foi possível salvar a refeição. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (meal: ExtraMeal) => {
    if (meal.status === 'approved') {
      notifications.error('Não é possível excluir', 'Refeições já aprovadas não podem ser excluídas.');
      return;
    }

    await deleteExtraMeal(meal.id);
  };

  const handleApproval = async () => {
    if (!selectedMeal || !approvalAction) return;
    
    if (approvalAction === 'reject' && !approvalJustification.trim()) {
      notifications.error('Justificativa obrigatória', 'Por favor, informe o motivo da rejeição.');
      return;
    }

    setIsSubmitting(true);
    try {
      const adminName = userSession?.role === 'manager' 
        ? `${userSession.full_name || 'Gerente'}` 
        : `${userSession?.fullName || 'Administrador Sistema'}`;

      if (approvalAction === 'approve') {
        await approveExtraMeal(selectedMeal.id, adminName, approvalJustification || undefined);
        notifications.success('Refeição aprovada!', 'A refeição foi aprovada com sucesso.');
      } else {
        await rejectExtraMeal(selectedMeal.id, adminName, approvalJustification);
        notifications.success('Refeição rejeitada!', 'A refeição foi rejeitada com justificativa.');
      }

      setShowApprovalDialog(false);
      setSelectedMeal(null);
      setApprovalAction(null);
      setApprovalJustification('');
    } catch (error) {
      console.error('Erro ao processar aprovação:', error);
      notifications.error('Erro de aprovação', 'Não foi possível processar a aprovação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (meal: ExtraMeal) => {
    if (meal.status === 'approved' && !canEditStatus()) {
      notifications.error('Não é possível editar', 'Refeições já aprovadas não podem ser editadas.');
      return;
    }
    setSelectedMeal(meal);
    setShowEditDialog(true);
  };

  const openViewDialog = (meal: ExtraMeal) => {
    setSelectedMeal(meal);
    setShowViewDialog(true);
  };

  const openApprovalDialog = (meal: ExtraMeal, action: 'approve' | 'reject') => {
    setSelectedMeal(meal);
    setApprovalAction(action);
    setApprovalJustification('');
    setShowApprovalDialog(true);
  };

  const filteredMeals = extraMeals.filter(meal => {
    const matchesSearch = 
      (meal.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (meal.external_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (meal.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (meal.user?.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (meal.external_company?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCompany = companyFilter === 'all' || 
      (meal.user?.company?.name === companies.find(c => c.id === companyFilter)?.name) ||
      (meal.external_company === companies.find(c => c.id === companyFilter)?.name);

    const matchesUserType = userTypeFilter === 'all' || 
      (userTypeFilter === 'internal' && meal.user_id) ||
      (userTypeFilter === 'external' && !meal.user_id);

    const matchesStatus = statusFilter === 'all' || meal.status === statusFilter;

    const matchesMealType = mealTypeFilter === 'all' || meal.meal_type_id === mealTypeFilter;

    // Date range filter
    const matchesDateRange = (!dateFilters.startDate || meal.meal_date >= dateFilters.startDate) &&
                             (!dateFilters.endDate || meal.meal_date <= dateFilters.endDate);

    return matchesSearch && matchesCompany && matchesUserType && matchesStatus && matchesMealType && matchesDateRange;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovada</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejeitada</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Timer className="w-3 h-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const formatDate = (dateString: string) => {
    // Adiciona horário do meio-dia para evitar problemas de timezone
    // que podem fazer a data aparecer como dia anterior
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string) => {
    return timeString?.slice(0, 5) || ''; // HH:MM
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRetrySchema = async () => {
    await checkSchema();
    if (!schemaError) {
      await fetchExtraMeals();
    }
  };

  // Show schema error if exists
  if (schemaError) {
    return (
      <div className="space-y-6">
        <Card className="bg-white border-red-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Database className="w-5 h-5" />
              Erro de Schema da Base de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {schemaError}
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Como corrigir:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
                <li>Abra o <strong>Supabase SQL Editor</strong></li>
                <li>Execute o script <code className="bg-yellow-200 px-1 rounded">CORRIGIR_EXTRA_MEALS_AGORA.sql</code></li>
                <li>Aguarde a mensagem de sucesso</li>
                <li>Clique em "Tentar Novamente" abaixo</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleRetrySchema}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir Supabase
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-white border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            RH Refeições Extras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white border-blue-100 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              RH Refeições Extras
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {filteredMeals.length} de {extraMeals.length}
              </Badge>
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshExtraMeals}
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              {canCreateExtra() && (
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Refeição Extra
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="create-extra-meal-description">
                    <DialogHeader>
                      <DialogTitle>Nova Refeição Extra</DialogTitle>
                      <DialogDescription id="create-extra-meal-description">
                        Solicite uma refeição especial para funcionário ou visitante.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                      {/* User Type Toggle */}
                      <div className="md:col-span-2 space-y-2">
                        <Label>Tipo de Pessoa</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="userType"
                              checked={!formData.is_external}
                              onChange={() => handleInputChange('is_external', false)}
                              className="text-blue-600"
                            />
                            <span>Funcionário</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="userType"
                              checked={formData.is_external}
                              onChange={() => handleInputChange('is_external', true)}
                              className="text-blue-600"
                            />
                            <span>Visitante</span>
                          </label>
                        </div>
                      </div>

                      {/* User Selection or External Fields */}
                      {formData.is_external ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="external_name">Nome do Visitante *</Label>
                            <Input
                              id="external_name"
                              placeholder="Nome completo do visitante"
                              value={formData.external_name}
                              onChange={(e) => handleInputChange('external_name', e.target.value)}
                            />
                            {formErrors.external_name && (
                              <p className="text-red-500 text-sm">{formErrors.external_name}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="external_document">CPF/RG</Label>
                            <Input
                              id="external_document"
                              placeholder="CPF ou RG (opcional)"
                              value={formData.external_document}
                              onChange={(e) => handleInputChange('external_document', e.target.value)}
                            />
                          </div>

                          <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="external_company">Empresa do Visitante *</Label>
                            <Input
                              id="external_company"
                              placeholder="Nome da empresa do visitante"
                              value={formData.external_company}
                              onChange={(e) => handleInputChange('external_company', e.target.value)}
                            />
                            {formErrors.external_company && (
                              <p className="text-red-500 text-sm">{formErrors.external_company}</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="user_id">Funcionário *</Label>
                          <Select
                            value={formData.user_id}
                            onValueChange={(value) => handleInputChange('user_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um funcionário" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.full_name} ({user.voucher_code}) - {user.company?.name || 'Sem empresa'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formErrors.user_id && (
                            <p className="text-red-500 text-sm">{formErrors.user_id}</p>
                          )}
                        </div>
                      )}

                      {/* Meal Type */}
                      <div className="space-y-2">
                        <Label htmlFor="meal_type_id">Tipo de Refeição *</Label>
                        <Select
                          value={formData.meal_type_id}
                          onValueChange={(value) => handleInputChange('meal_type_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {specialMealTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name} {type.price && `- ${formatCurrency(type.price)}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.meal_type_id && (
                          <p className="text-red-500 text-sm">{formErrors.meal_type_id}</p>
                        )}
                      </div>

                      {/* Date and Time */}
                      <div className="space-y-2">
                        <Label htmlFor="meal_date">Data da Refeição *</Label>
                        <Input
                          id="meal_date"
                          type="date"
                          value={formData.meal_date}
                          onChange={(e) => handleInputChange('meal_date', e.target.value)}
                        />
                        {formErrors.meal_date && (
                          <p className="text-red-500 text-sm">{formErrors.meal_date}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="meal_time">Horário da Refeição *</Label>
                        <Input
                          id="meal_time"
                          type="time"
                          value={formData.meal_time}
                          onChange={(e) => handleInputChange('meal_time', e.target.value)}
                        />
                        {formErrors.meal_time && (
                          <p className="text-red-500 text-sm">{formErrors.meal_time}</p>
                        )}
                      </div>

                      {/* Reason */}
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="reason">Motivo da Solicitação *</Label>
                        <Textarea
                          id="reason"
                          placeholder="Descreva o motivo da refeição extra..."
                          value={formData.reason}
                          onChange={(e) => handleInputChange('reason', e.target.value)}
                          rows={3}
                        />
                        {formErrors.reason && (
                          <p className="text-red-500 text-sm">{formErrors.reason}</p>
                        )}
                      </div>

                      {/* Requested by */}
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="requested_by_name">Solicitante *</Label>
                        <Input
                          id="requested_by_name"
                          placeholder="Nome de quem está fazendo a solicitação"
                          value={formData.requested_by_name}
                          onChange={(e) => handleInputChange('requested_by_name', e.target.value)}
                        />
                        {formErrors.requested_by_name && (
                          <p className="text-red-500 text-sm">{formErrors.requested_by_name}</p>
                        )}
                      </div>

                      {/* Notes */}
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                          id="notes"
                          placeholder="Observações adicionais (opcional)..."
                          value={formData.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          rows={2}
                        />
                      </div>

                      {/* Status - Only for managers */}
                      {canEditStatus() && (
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) => handleInputChange('status', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="approved">Aprovada</SelectItem>
                              <SelectItem value="rejected">Rejeitada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                        disabled={isSubmitting}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {selectedMeal ? 'Atualizar' : 'Criar'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Filters Section */}
        {showFilters && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 p-4 bg-gray-50 rounded-lg">
              {/* Date Filters - NOVA FUNCIONALIDADE */}
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateFilters.startDate}
                  onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateFilters.endDate}
                  onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="Nome, empresa, motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
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

              <div className="space-y-2">
                <Label htmlFor="userType">Tipo de Usuário</Label>
                <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="internal">Funcionários</SelectItem>
                    <SelectItem value="external">Visitantes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovada</SelectItem>
                    <SelectItem value="rejected">Rejeitada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mealType">Tipo de Refeição</Label>
                <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {specialMealTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Meals Table */}
      <Card className="bg-white border-blue-100 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Refeição</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMeals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Nenhuma refeição extra encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMeals.map((meal) => (
                    <TableRow key={meal.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {getInitials(meal.user?.full_name || meal.external_name || 'N/A')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {meal.user?.full_name || meal.external_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {meal.user?.voucher_code ? `#${meal.user.voucher_code}` : meal.external_document}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={meal.user_id ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"}>
                          {meal.user_id ? "Funcionário" : "Visitante"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {meal.user?.company?.name || meal.external_company}
                          </div>
                          {meal.user?.department && (
                            <div className="text-sm text-gray-500">{meal.user.department}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          {meal.meal_type?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{formatDate(meal.meal_date)}</div>
                          <div className="text-gray-500">{formatTime(meal.meal_time)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(meal.price || 0)}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(meal.status)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{meal.requested_by_name}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewDialog(meal)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {canEditStatus() && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(meal)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>

                              {meal.status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openApprovalDialog(meal, 'approve')}
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openApprovalDialog(meal, 'reject')}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}

                              {meal.status !== 'approved' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir esta refeição extra? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(meal)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Refeição Extra</DialogTitle>
          </DialogHeader>
          
          {selectedMeal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <div className="p-2 bg-gray-50 rounded">
                    {selectedMeal.user?.full_name || selectedMeal.external_name}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <div className="p-2 bg-gray-50 rounded">
                    {selectedMeal.user_id ? "Funcionário" : "Visitante"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <div className="p-2 bg-gray-50 rounded">
                    {selectedMeal.user?.company?.name || selectedMeal.external_company}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Refeição</Label>
                  <div className="p-2 bg-gray-50 rounded">
                    {selectedMeal.meal_type?.name}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <div className="p-2 bg-gray-50 rounded">
                    {formatDate(selectedMeal.meal_date)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <div className="p-2 bg-gray-50 rounded">
                    {formatTime(selectedMeal.meal_time)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motivo</Label>
                <div className="p-2 bg-gray-50 rounded min-h-[60px]">
                  {selectedMeal.reason}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Solicitante</Label>
                  <div className="p-2 bg-gray-50 rounded">
                    {selectedMeal.requested_by_name}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="p-2 bg-gray-50 rounded">
                    {getStatusBadge(selectedMeal.status)}
                  </div>
                </div>
              </div>

              {selectedMeal.notes && (
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <div className="p-2 bg-gray-50 rounded">
                    {selectedMeal.notes}
                  </div>
                </div>
              )}

              {selectedMeal.admin_notes && (
                <div className="space-y-2">
                  <Label>Observações do Administrador</Label>
                  <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                    {selectedMeal.admin_notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Refeição Extra</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Same form as create dialog */}
            <div className="md:col-span-2 space-y-2">
              <Label>Tipo de Pessoa</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="editUserType"
                    checked={!formData.is_external}
                    onChange={() => handleInputChange('is_external', false)}
                    className="text-blue-600"
                  />
                  <span>Funcionário</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="editUserType"
                    checked={formData.is_external}
                    onChange={() => handleInputChange('is_external', true)}
                    className="text-blue-600"
                  />
                  <span>Visitante</span>
                </label>
              </div>
            </div>

            {formData.is_external ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit_external_name">Nome do Visitante *</Label>
                  <Input
                    id="edit_external_name"
                    placeholder="Nome completo do visitante"
                    value={formData.external_name}
                    onChange={(e) => handleInputChange('external_name', e.target.value)}
                  />
                  {formErrors.external_name && (
                    <p className="text-red-500 text-sm">{formErrors.external_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_external_document">CPF/RG</Label>
                  <Input
                    id="edit_external_document"
                    placeholder="CPF ou RG (opcional)"
                    value={formData.external_document}
                    onChange={(e) => handleInputChange('external_document', e.target.value)}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="edit_external_company">Empresa do Visitante *</Label>
                  <Input
                    id="edit_external_company"
                    placeholder="Nome da empresa do visitante"
                    value={formData.external_company}
                    onChange={(e) => handleInputChange('external_company', e.target.value)}
                  />
                  {formErrors.external_company && (
                    <p className="text-red-500 text-sm">{formErrors.external_company}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="edit_user_id">Funcionário *</Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(value) => handleInputChange('user_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.voucher_code}) - {user.company?.name || 'Sem empresa'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.user_id && (
                  <p className="text-red-500 text-sm">{formErrors.user_id}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit_meal_type_id">Tipo de Refeição *</Label>
              <Select
                value={formData.meal_type_id}
                onValueChange={(value) => handleInputChange('meal_type_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {specialMealTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} {type.price && `- ${formatCurrency(type.price)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.meal_type_id && (
                <p className="text-red-500 text-sm">{formErrors.meal_type_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_meal_date">Data da Refeição *</Label>
              <Input
                id="edit_meal_date"
                type="date"
                value={formData.meal_date}
                onChange={(e) => handleInputChange('meal_date', e.target.value)}
              />
              {formErrors.meal_date && (
                <p className="text-red-500 text-sm">{formErrors.meal_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_meal_time">Horário da Refeição *</Label>
              <Input
                id="edit_meal_time"
                type="time"
                value={formData.meal_time}
                onChange={(e) => handleInputChange('meal_time', e.target.value)}
              />
              {formErrors.meal_time && (
                <p className="text-red-500 text-sm">{formErrors.meal_time}</p>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="edit_reason">Motivo da Solicitação *</Label>
              <Textarea
                id="edit_reason"
                placeholder="Descreva o motivo da refeição extra..."
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                rows={3}
              />
              {formErrors.reason && (
                <p className="text-red-500 text-sm">{formErrors.reason}</p>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="edit_requested_by_name">Solicitante *</Label>
              <Input
                id="edit_requested_by_name"
                placeholder="Nome de quem está fazendo a solicitação"
                value={formData.requested_by_name}
                onChange={(e) => handleInputChange('requested_by_name', e.target.value)}
              />
              {formErrors.requested_by_name && (
                <p className="text-red-500 text-sm">{formErrors.requested_by_name}</p>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="edit_notes">Observações</Label>
              <Textarea
                id="edit_notes"
                placeholder="Observações adicionais (opcional)..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={2}
              />
            </div>

            {canEditStatus() && (
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovada</SelectItem>
                    <SelectItem value="rejected">Rejeitada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Atualizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Aprovar Refeição' : 'Rejeitar Refeição'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMeal && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium">{selectedMeal.user?.full_name || selectedMeal.external_name}</div>
                <div className="text-sm text-gray-600">{selectedMeal.meal_type?.name}</div>
                <div className="text-sm text-gray-600">
                  {formatDate(selectedMeal.meal_date)} às {formatTime(selectedMeal.meal_time)}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approval_justification">
                  {approvalAction === 'approve' ? 'Observações (opcional)' : 'Motivo da rejeição *'}
                </Label>
                <Textarea
                  id="approval_justification"
                  placeholder={
                    approvalAction === 'approve' 
                      ? 'Observações sobre a aprovação...'
                      : 'Explique o motivo da rejeição...'
                  }
                  value={approvalJustification}
                  onChange={(e) => setApprovalJustification(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowApprovalDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleApproval}
                  disabled={isSubmitting}
                  className={
                    approvalAction === 'approve' 
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : approvalAction === 'approve' ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  {approvalAction === 'approve' ? 'Aprovar' : 'Rejeitar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}