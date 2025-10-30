import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { 
  UserCheck, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Shield, 
  Loader2, 
  Eye,
  Save,
  Calendar,
  FileText,
  Clock,
  Key,
  RefreshCw
} from 'lucide-react';
import { notifications } from './NotificationSystem';
import { useManagers, useCompanies } from '../utils/supabase/unified-hooks';
import { supabase } from '../utils/supabase/unified-client';
import type { Manager } from '../utils/supabase/unified-client';

interface ManagerFormData {
  full_name: string;
  email: string;
  phone: string;
  company_id: string;
  department: string;
  position: string;
  permissions: string[];
  notes: string;
  is_active: boolean;
  username: string;
  password: string;
}

export function ManagerManagement() {
  console.log('>>> ManagerManagement: Componente renderizado <<<');
  
  const { managers, isLoading, refreshManagers } = useManagers();
  const { companies } = useCompanies();
  
  console.log('>>> managers:', managers);
  console.log('>>> isLoading:', isLoading);
  console.log('>>> companies:', companies);

  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<ManagerFormData>({
    full_name: '',
    email: '',
    phone: '',
    company_id: '',
    department: '',
    position: '',
    permissions: [],
    notes: '',
    is_active: true,
    username: '',
    password: ''
  });

  const [formErrors, setFormErrors] = useState<Partial<ManagerFormData>>({});


  const availablePermissions = useMemo(() => [
    { id: 'usuarios', label: 'Gestão de Usuários' },
    { id: 'empresas', label: 'Gestão de Empresas' },
    { id: 'tipos-refeicao', label: 'Tipos de Refeição' },
    { id: 'relatorios', label: 'Relatórios' },
    { id: 'gerentes', label: 'Gestão de Gerentes' },
    { id: 'turnos', label: 'Gestão de Turnos' },
    { id: 'rh-extras', label: 'RH Refeições Extras' },
    { id: 'configuracoes', label: 'Configurações do Sistema' }
  ], []);

  const departments = useMemo(() => [
    'Administrativo',
    'Operacional', 
    'Logística',
    'Vendas',
    'Recursos Humanos',
    'Financeiro',
    'Tecnologia da Informação',
    'Comercial',
    'Marketing',
    'Compras'
  ], []);

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      company_id: '',
      department: '',
      position: '',
      permissions: [],
      notes: '',
      is_active: true,
      username: '',
      password: ''
    });
    setFormErrors({});
  };

  const loadManagerToForm = (manager: Manager) => {
    setFormData({
      full_name: manager.full_name,
      email: manager.email,
      phone: manager.phone || '',
      company_id: manager.company_id || '',
      department: manager.department || '',
      position: manager.position || '',
      permissions: Array.isArray(manager.permissions) 
        ? manager.permissions 
        : (manager.permissions && typeof manager.permissions === 'object' 
          ? Object.keys(manager.permissions).filter(key => (manager.permissions as Record<string, any>)[key]) 
          : []),
      notes: manager.notes || '',
      is_active: manager.is_active
    });
    setFormErrors({});
  };

  const handleInputChange = (field: keyof ManagerFormData, value: string | boolean | string[]) => {
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
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(p => p !== permissionId)
    }));

    // Clear permissions error
    if (formErrors.permissions) {
      setFormErrors(prev => ({
        ...prev,
        permissions: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<ManagerFormData> = {};

    if (!formData.full_name.trim()) {
      errors.full_name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.company_id) {
      errors.company_id = 'Empresa é obrigatória';
    }

    if (!formData.department) {
      errors.department = 'Departamento é obrigatório';
    }

    if (!formData.position) {
      errors.position = 'Cargo é obrigatório';
    }

    if (formData.permissions.length === 0) {
      errors.permissions = 'Selecione pelo menos uma permissão';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      console.log('=== Criando gerente ===');
      console.log('FormData completo:', formData);
      console.log('Username:', formData.username);
      console.log('Password:', formData.password);
      
      const insertData = {
        full_name: formData.full_name,
        email: formData.email,
        username: formData.username || null,
        password: formData.password || null,
        phone: formData.phone || null,
        company_id: formData.company_id,
        department: formData.department,
        position: formData.position,
        permissions: formData.permissions,
        notes: formData.notes || null,
        is_active: formData.is_active
      };
      
      console.log('Dados que serão inseridos:', insertData);
      
      const { data, error } = await supabase
        .from('managers')
        .insert([insertData])
        .select();
      
      console.log('Resposta do Supabase - data:', data);
      console.log('Resposta do Supabase - error:', error);

      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }

      console.log('Gerente criado com sucesso!');
      console.log('Dados retornados do banco:', data);
      if (data && data.length > 0) {
        console.log('Username salvo:', data[0].username);
        console.log('Password salvo:', data[0].password ? '***' : '(null)');
      }
      notifications.success('Gerente criado!', `${formData.full_name} foi adicionado com sucesso.`);
      setShowCreateDialog(false);
      resetForm();
      console.log('Chamando refreshManagers...');
      await refreshManagers();
      console.log('refreshManagers concluído');
    } catch (error: any) {
      console.error('Erro ao cadastrar gerente:', error);
      notifications.error('Erro', error.message || 'Não foi possível criar o gerente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!validateForm() || !selectedManager) return;
    
    setIsSubmitting(true);
    try {
      console.log('Editando gerente:', selectedManager.id, formData);
      
      console.log('=== Editando gerente ===');
      console.log('Username atual:', formData.username);
      console.log('Password fornecida:', formData.password ? '***' : '(vazia)');
      
      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        username: formData.username || null,
        phone: formData.phone || null,
        company_id: formData.company_id,
        department: formData.department,
        position: formData.position,
        permissions: formData.permissions,
        notes: formData.notes || null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };

      // Só atualiza a senha se foi fornecida
      if (formData.password && formData.password.trim()) {
        updateData.password = formData.password;
        console.log('Senha será atualizada');
      } else {
        console.log('Senha não será alterada (campo vazio)');
      }
      
      console.log('Dados que serão atualizados:', { ...updateData, password: updateData.password ? '***' : undefined });

      const { error } = await supabase
        .from('managers')
        .update(updateData)
        .eq('id', selectedManager.id);

      if (error) {
        throw error;
      }

      console.log('Gerente atualizado com sucesso');
      notifications.success('Gerente atualizado!', `${formData.full_name} foi atualizado com sucesso.`);
      setShowEditDialog(false);
      setSelectedManager(null);
      resetForm();
      await refreshManagers();
    } catch (error: any) {
      console.error('Erro ao atualizar gerente:', error);
      notifications.error('Erro', error.message || 'Não foi possível atualizar o gerente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (manager: Manager) => {
    try {
      console.log('Excluindo gerente:', manager.id);
      
      const { error } = await supabase
        .from('managers')
        .delete()
        .eq('id', manager.id);

      if (error) {
        throw error;
      }

      console.log('Gerente excluído com sucesso');
      notifications.success('Gerente removido!', `${manager.full_name} foi removido com sucesso.`);
      await refreshManagers();
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir gerente:', error);
      notifications.error('Erro', error.message || 'Não foi possível remover o gerente.');
      return false;
    }
  };

  const handleToggleStatus = async (manager: Manager) => {
    try {
      const newStatus = !manager.is_active;
      console.log('Alterando status do gerente:', manager.id, 'para:', newStatus);
      
      const { error } = await supabase
        .from('managers')
        .update({ 
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', manager.id);

      if (error) {
        throw error;
      }

      console.log('Status alterado com sucesso');
      notifications.success('Status atualizado!', `${manager.full_name} foi ${newStatus ? 'ativado' : 'desativado'}.`);
      await refreshManagers();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      notifications.error('Erro', error.message || 'Não foi possível alterar o status.');
    }
  };

  const openEditDialog = (manager: Manager) => {
    setSelectedManager(manager);
    loadManagerToForm(manager);
    setShowEditDialog(true);
  };

  const openViewDialog = (manager: Manager) => {
    setSelectedManager(manager);
    setShowViewDialog(true);
  };

  const filteredManagers = useMemo(() => {
    console.log('=== Filtrando gerentes ===');
    console.log('Total de gerentes:', managers?.length || 0);
    console.log('Filtros:', { searchTerm, companyFilter, departmentFilter, statusFilter });
    
    if (!managers || !Array.isArray(managers)) {
      console.log('managers é inválido ou não é array');
      return [];
    }
    
    const filtered = managers.filter(manager => {
      const matchesSearch = 
        manager.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manager.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (manager.company?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (manager.department || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCompany = companyFilter === 'all' || manager.company_id === companyFilter;
      const matchesDepartment = departmentFilter === 'all' || manager.department === departmentFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && manager.is_active) ||
                           (statusFilter === 'inactive' && !manager.is_active);

      return matchesSearch && matchesCompany && matchesDepartment && matchesStatus;
    });

    console.log('Gerentes filtrados:', filtered.length);
    return filtered;
  }, [managers, searchTerm, companyFilter, departmentFilter, statusFilter]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPermissionLabel = (permissionId: string) => {
    const permission = availablePermissions.find(p => p.id === permissionId);
    return permission ? permission.label : permissionId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <Card className="bg-white border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Gestão de Gerentes
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
              <UserCheck className="w-5 h-5 text-blue-600" />
              Gestão de Gerentes
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {filteredManagers.length} de {managers?.length || 0}
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshManagers}
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Gerente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto" aria-describedby="create-manager-description">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-blue-600" />
                      Cadastrar Novo Gerente
                    </DialogTitle>
                    <DialogDescription id="create-manager-description">
                      Adicione um novo gerente ao sistema com permissões específicas.
                    </DialogDescription>
                  </DialogHeader>
            
                  <div className="space-y-6 py-4">
                    {/* Campos Básicos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Nome Completo */}
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Nome Completo *</Label>
                        <Input
                          id="full_name"
                          placeholder="Digite o nome completo"
                          value={formData.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          className={formErrors.full_name ? 'border-red-500' : ''}
                        />
                        {formErrors.full_name && (
                          <p className="text-sm text-red-600">{formErrors.full_name}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="gerente@empresa.com.br"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={formErrors.email ? 'border-red-500' : ''}
                        />
                        {formErrors.email && (
                          <p className="text-sm text-red-600">{formErrors.email}</p>
                        )}
                      </div>

                      {/* Telefone */}
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Telefone
                        </Label>
                        <Input
                          id="phone"
                          placeholder="(11) 99999-9999"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>

                      {/* Cargo */}
                      <div className="space-y-2">
                        <Label htmlFor="position">Cargo *</Label>
                        <Input
                          id="position"
                          placeholder="Ex: Gerente de Operações"
                          value={formData.position}
                          onChange={(e) => handleInputChange('position', e.target.value)}
                          className={formErrors.position ? 'border-red-500' : ''}
                        />
                        {formErrors.position && (
                          <p className="text-sm text-red-600">{formErrors.position}</p>
                        )}
                      </div>

                      {/* Empresa */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Empresa *
                        </Label>
                        <Select 
                          value={formData.company_id} 
                          onValueChange={(value) => handleInputChange('company_id', value)}
                        >
                          <SelectTrigger className={formErrors.company_id ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Selecione a empresa" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.company_id && (
                          <p className="text-sm text-red-600">{formErrors.company_id}</p>
                        )}
                      </div>

                      {/* Departamento */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Departamento *
                        </Label>
                        <Select 
                          value={formData.department} 
                          onValueChange={(value) => handleInputChange('department', value)}
                        >
                          <SelectTrigger className={formErrors.department ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Selecione o departamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.department && (
                          <p className="text-sm text-red-600">{formErrors.department}</p>
                        )}
                      </div>

                      {/* Login (Username) */}
                      <div className="space-y-2">
                        <Label htmlFor="create_username" className="flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          Login
                        </Label>
                        <Input
                          id="create_username"
                          placeholder="Digite o login do gerente"
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          className={formErrors.username ? 'border-red-500' : ''}
                        />
                        {formErrors.username && (
                          <p className="text-sm text-red-600">{formErrors.username}</p>
                        )}
                      </div>

                      {/* Senha (Password) */}
                      <div className="space-y-2">
                        <Label htmlFor="create_password" className="flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          Senha
                        </Label>
                        <Input
                          id="create_password"
                          type="password"
                          placeholder="Digite a senha"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className={formErrors.password ? 'border-red-500' : ''}
                        />
                        {formErrors.password && (
                          <p className="text-sm text-red-600">{formErrors.password}</p>
                        )}
                      </div>
                    </div>

                    {/* Permissões */}
                    <div className="space-y-4">
                      <Label className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Permissões de Acesso *
                      </Label>
                      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border ${formErrors.permissions ? 'border-red-500' : 'border-gray-200'}`}>
                        {availablePermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`permission-${permission.id}`}
                              checked={formData.permissions.includes(permission.id)}
                              onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <Label htmlFor={`permission-${permission.id}`} className="text-sm cursor-pointer">
                              {permission.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {formErrors.permissions && (
                        <p className="text-sm text-red-600">{formErrors.permissions}</p>
                      )}
                    </div>

                    {/* Observações */}
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Observações
                      </Label>
                      <textarea
                        id="notes"
                        placeholder="Informações adicionais sobre responsabilidades, notas especiais..."
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-blue-500 transition-colors min-h-[80px] resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Status Ativo */}
                    <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                      />
                      <Label>Conta ativa</Label>
                      <span className="text-sm text-gray-500">(O gerente poderá acessar o sistema)</span>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowCreateDialog(false)}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleCreate}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Cadastrando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Cadastrar Gerente
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card className="bg-white border-blue-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, email ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Empresa" />
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

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos departamentos</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Managers Table */}
      <Card className="bg-white border-blue-100 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-blue-100">
                <TableHead className="text-blue-700">Gerente</TableHead>
                <TableHead className="text-blue-700">Empresa / Departamento</TableHead>
                <TableHead className="text-blue-700">Permissões</TableHead>
                <TableHead className="text-blue-700">Status</TableHead>
                <TableHead className="text-blue-700 text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredManagers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <UserCheck className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">Nenhum gerente encontrado</p>
                      <p className="text-sm text-gray-400">
                        {searchTerm || companyFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all'
                          ? 'Tente ajustar os filtros de busca'
                          : 'Cadastre o primeiro gerente do sistema'
                        }
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredManagers.map((manager) => (
                  <TableRow key={manager.id} className="hover:bg-blue-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {getInitials(manager.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{manager.full_name}</div>
                          <div className="text-sm text-gray-500">{manager.email}</div>
                          {manager.position && (
                            <div className="text-xs text-blue-600">{manager.position}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          {manager.company?.name || 'Sem empresa'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {manager.department || 'Sem departamento'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {Array.isArray(manager.permissions) && manager.permissions.length > 0 ? (
                          manager.permissions.slice(0, 2).map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {getPermissionLabel(permission)}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            Sem permissões
                          </Badge>
                        )}
                        {Array.isArray(manager.permissions) && manager.permissions.length > 2 && (
                          <Badge variant="outline" className="text-xs text-blue-600">
                            +{manager.permissions.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={manager.is_active ? "default" : "secondary"}
                          className={manager.is_active ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800"}
                        >
                          {manager.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewDialog(manager)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(manager)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
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
                                Tem certeza que deseja excluir o gerente <strong>{manager.full_name}</strong>? 
                                Esta ação não pode ser desfeita e o gerente perderá o acesso ao sistema.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(manager)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Excluir Gerente
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Manager Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto" aria-describedby="edit-manager-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Editar Gerente
            </DialogTitle>
            <DialogDescription id="edit-manager-description">
              Modifique as informações do gerente selecionado.
            </DialogDescription>
          </DialogHeader>
    
          <div className="space-y-6 py-4">
            {/* Campos Básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Nome Completo */}
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Nome Completo *</Label>
                <Input
                  id="edit_full_name"
                  placeholder="Digite o nome completo"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className={formErrors.full_name ? 'border-red-500' : ''}
                />
                {formErrors.full_name && (
                  <p className="text-sm text-red-600">{formErrors.full_name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="edit_email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email *
                </Label>
                <Input
                  id="edit_email"
                  type="email"
                  placeholder="gerente@empresa.com.br"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={formErrors.email ? 'border-red-500' : ''}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="edit_phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone
                </Label>
                <Input
                  id="edit_phone"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              {/* Cargo */}
              <div className="space-y-2">
                <Label htmlFor="edit_position">Cargo *</Label>
                <Input
                  id="edit_position"
                  placeholder="Ex: Gerente de Operações"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className={formErrors.position ? 'border-red-500' : ''}
                />
                {formErrors.position && (
                  <p className="text-sm text-red-600">{formErrors.position}</p>
                )}
              </div>

              {/* Empresa */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Empresa *
                </Label>
                <Select 
                  value={formData.company_id} 
                  onValueChange={(value) => handleInputChange('company_id', value)}
                >
                  <SelectTrigger className={formErrors.company_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.company_id && (
                  <p className="text-sm text-red-600">{formErrors.company_id}</p>
                )}
              </div>

              {/* Departamento */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Departamento *
                </Label>
                <Select 
                  value={formData.department} 
                  onValueChange={(value) => handleInputChange('department', value)}
                >
                  <SelectTrigger className={formErrors.department ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.department && (
                  <p className="text-sm text-red-600">{formErrors.department}</p>
                )}
              </div>

              {/* Login (Username) */}
              <div className="space-y-2">
                <Label htmlFor="edit_username" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Login *
                </Label>
                <Input
                  id="edit_username"
                  placeholder="Digite o login do gerente"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={formErrors.username ? 'border-red-500' : ''}
                />
                {formErrors.username && (
                  <p className="text-sm text-red-600">{formErrors.username}</p>
                )}
              </div>

              {/* Senha (Password) */}
              <div className="space-y-2">
                <Label htmlFor="edit_password" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Senha {!selectedManager && '*'}
                </Label>
                <Input
                  id="edit_password"
                  type="password"
                  placeholder={selectedManager ? "Deixe em branco para manter a senha atual" : "Digite a senha"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={formErrors.password ? 'border-red-500' : ''}
                />
                {formErrors.password && (
                  <p className="text-sm text-red-600">{formErrors.password}</p>
                )}
              </div>
            </div>

            {/* Permissões */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Permissões de Acesso *
              </Label>
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border ${formErrors.permissions ? 'border-red-500' : 'border-gray-200'}`}>
                {availablePermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={`edit-permission-${permission.id}`}
                      checked={formData.permissions.includes(permission.id)}
                      onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor={`edit-permission-${permission.id}`} className="text-sm cursor-pointer">
                      {permission.label}
                    </Label>
                  </div>
                ))}
              </div>
              {formErrors.permissions && (
                <p className="text-sm text-red-600">{formErrors.permissions}</p>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="edit_notes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Observações
              </Label>
              <textarea
                id="edit_notes"
                placeholder="Informações adicionais sobre responsabilidades, notas especiais..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-blue-500 transition-colors min-h-[80px] resize-none"
                rows={3}
              />
            </div>

            {/* Status Ativo */}
            <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label>Conta ativa</Label>
              <span className="text-sm text-gray-500">(O gerente poderá acessar o sistema)</span>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleEdit}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Manager Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="view-manager-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Detalhes do Gerente
            </DialogTitle>
            <DialogDescription id="view-manager-description">
              Visualize todas as informações detalhadas do gerente selecionado.
            </DialogDescription>
          </DialogHeader>
          
          {selectedManager && (
            <div className="space-y-6 py-4">
              {/* Manager Info */}
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                    {getInitials(selectedManager.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{selectedManager.full_name}</h3>
                  <p className="text-blue-600">{selectedManager.position || 'Posição não definida'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      variant={selectedManager.is_active ? "default" : "secondary"}
                      className={selectedManager.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    >
                      {selectedManager.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="outline" className="text-blue-600">
                      {Array.isArray(selectedManager.permissions) ? selectedManager.permissions.length : 0} permissões
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">Informações de Contato</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium">{selectedManager.email}</span>
                    </div>
                    {selectedManager.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Telefone:</span>
                        <span className="text-sm font-medium">{selectedManager.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">Informações da Empresa</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Empresa:</span>
                      <span className="text-sm font-medium">{selectedManager.company?.name || 'Não definida'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Departamento:</span>
                      <span className="text-sm font-medium">{selectedManager.department || 'Não definido'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Permissões de Acesso</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.isArray(selectedManager.permissions) && selectedManager.permissions.length > 0 ? (
                    selectedManager.permissions.map((permission) => (
                      <div key={permission} className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {getPermissionLabel(permission)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-4">
                      <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">Nenhuma permissão atribuída</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedManager.notes && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">Observações</h4>
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedManager.notes}</p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Informações do Sistema</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Cadastrado em:</span>
                    <span className="font-medium">{formatDateTime(selectedManager.created_at)}</span>
                  </div>
                  {selectedManager.updated_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Última atualização:</span>
                      <span className="font-medium">{formatDateTime(selectedManager.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}