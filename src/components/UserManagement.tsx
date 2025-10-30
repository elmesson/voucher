import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Skeleton } from './ui/skeleton';
import { User, Plus, Edit, Trash2, Search, Building2, Clock, Phone, Mail, Hash, MapPin, Loader2, RefreshCw } from 'lucide-react';
import { useUsers, useCompanies, useShifts } from '../utils/supabase/unified-hooks';
import { generateVoucherCode, validateCPF, formatCPF, formatPhone, supabase } from '../utils/supabase/unified-client';
import { notifications } from './NotificationSystem';
import type { User as UserType } from '../utils/supabase/unified-client';

interface UserFormData {
  voucher_code: string;
  full_name: string;
  cpf: string;
  company_id: string;
  department: string;
  position: string;
  shift_id: string;
  email: string;
  phone: string;
  is_active: boolean;
  hire_date: string;
  birth_date: string;
  address: string;
  notes: string;
}

export function UserManagement() {
  const { users, isLoading, refreshUsers } = useUsers();
  const { companies } = useCompanies();
  const { shifts } = useShifts();
  
  // Simplified options - use static arrays for now
  const departments = ['Administrativo', 'Operacional', 'Logística', 'Vendas', 'RH', 'TI'];
  const positions = ['Gerente', 'Supervisor', 'Analista', 'Assistente', 'Operador', 'Auxiliar'];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDepartmentInput, setShowDepartmentInput] = useState(false);
  const [showPositionInput, setShowPositionInput] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    voucher_code: '',
    full_name: '',
    cpf: '',
    company_id: '',
    department: '',
    position: '',
    shift_id: '',
    email: '',
    phone: '',
    is_active: true,
    hire_date: '',
    birth_date: '',
    address: '',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<Partial<UserFormData>>({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (showUserDialog) {
      if (editingUser) {
        // Editing existing user
        setFormData({
          voucher_code: editingUser.voucher_code,
          full_name: editingUser.full_name,
          cpf: editingUser.cpf || '',
          company_id: editingUser.company_id || '',
          department: editingUser.department || '',
          position: editingUser.position || '',
          shift_id: editingUser.shift_id || '',
          email: editingUser.email || '',
          phone: editingUser.phone || '',
          is_active: editingUser.is_active,
          hire_date: editingUser.hire_date || '',
          birth_date: editingUser.birth_date || '',
          address: editingUser.address || '',
          notes: editingUser.notes || ''
        });
        
        // Set input visibility based on existing values
        setShowDepartmentInput(editingUser.department ? !departments.includes(editingUser.department) : false);
        setShowPositionInput(editingUser.position ? !positions.includes(editingUser.position) : false);
      } else {
        // Creating new user
        setFormData({
          voucher_code: generateVoucherCode(),
          full_name: '',
          cpf: '',
          company_id: '',
          department: '',
          position: '',
          shift_id: '',
          email: '',
          phone: '',
          is_active: true,
          hire_date: '',
          birth_date: '',
          address: '',
          notes: ''
        });
        
        setShowDepartmentInput(false);
        setShowPositionInput(false);
      }
    } else {
      setEditingUser(null);
      setFormErrors({});
      setShowDepartmentInput(false);
      setShowPositionInput(false);
    }
  }, [showUserDialog, editingUser]);

  const handleInputChange = (field: keyof UserFormData, value: string | boolean) => {
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

  const validateForm = (): boolean => {
    const errors: Partial<UserFormData> = {};

    if (!formData.full_name.trim()) {
      errors.full_name = 'Nome completo é obrigatório';
    }

    if (!formData.voucher_code.trim()) {
      errors.voucher_code = 'Código do voucher é obrigatório';
    } else if (formData.voucher_code.length !== 4) {
      errors.voucher_code = 'Código deve ter 4 dígitos';
    }

    if (formData.cpf && !validateCPF(formData.cpf)) {
      errors.cpf = 'CPF inválido';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    // Check if voucher code is unique (excluding current user if editing)
    const existingUser = users.find(user => 
      user.voucher_code === formData.voucher_code && 
      (!editingUser || user.id !== editingUser.id)
    );
    if (existingUser) {
      errors.voucher_code = 'Este código de voucher já está em uso';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const userData = {
        voucher_code: formData.voucher_code,
        full_name: formData.full_name,
        cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : null,
        phone: formData.phone ? formData.phone.replace(/\D/g, '') : null,
        company_id: formData.company_id === 'none' ? null : formData.company_id || null,
        shift_id: formData.shift_id === 'none' ? null : formData.shift_id || null,
        department: formData.department || null,
        position: formData.position || null,
        email: formData.email || null,
        is_active: formData.is_active,
        hire_date: formData.hire_date || null,
        birth_date: formData.birth_date || null,
        address: formData.address || null,
        notes: formData.notes || null
      };

      if (editingUser) {
        // Update existing user
        console.log('💾 Atualizando usuário:', editingUser.id, userData);
        const { error } = await supabase
          .from('users')
          .update(userData)
          .eq('id', editingUser.id);

        if (error) throw error;
        
        notifications.success('Usuário atualizado!', `${formData.full_name} foi atualizado com sucesso.`);
      } else {
        // Create new user
        console.log('➕ Criando novo usuário:', userData);
        const { error } = await supabase
          .from('users')
          .insert(userData);

        if (error) throw error;
        
        notifications.success('Usuário criado!', `${formData.full_name} foi criado com sucesso.`);
      }

      // Refresh the users list
      await refreshUsers();
      
      setShowUserDialog(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error('❌ Erro ao salvar usuário:', error);
      notifications.error('Erro ao salvar', error.message || 'Não foi possível salvar o usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      console.log('🗑️ Deletando usuário:', userId);
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      notifications.success('Usuário excluído!', 'O usuário foi removido com sucesso.');
      
      // Refresh the users list
      await refreshUsers();
    } catch (error: any) {
      console.error('❌ Erro ao deletar usuário:', error);
      notifications.error('Erro ao excluir', error.message || 'Não foi possível excluir o usuário.');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.voucher_code.includes(searchTerm) ||
      (user.cpf && user.cpf.includes(searchTerm)) ||
      (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCompany = filterCompany === 'all' || user.company_id === filterCompany;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active);

    return matchesSearch && matchesCompany && matchesStatus;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card className="bg-white border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-blue-100 shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Usuários
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {filteredUsers.length} de {users.length}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshUsers}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="user-form-description">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                  </DialogTitle>
                  <DialogDescription id="user-form-description">
                    {editingUser ? 'Edite as informações do usuário abaixo.' : 'Preencha as informações para criar um novo usuário.'}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  {/* Nome Completo */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className={formErrors.full_name ? 'border-red-500' : ''}
                      placeholder="Digite o nome completo"
                    />
                    {formErrors.full_name && (
                      <p className="text-sm text-red-600">{formErrors.full_name}</p>
                    )}
                  </div>

                  {/* Voucher e CPF */}
                  <div className="space-y-2">
                    <Label htmlFor="voucher_code">Código Voucher *</Label>
                    <Input
                      id="voucher_code"
                      value={formData.voucher_code}
                      onChange={(e) => handleInputChange('voucher_code', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className={formErrors.voucher_code ? 'border-red-500' : ''}
                      placeholder="4 dígitos"
                      maxLength={4}
                    />
                    {formErrors.voucher_code && (
                      <p className="text-sm text-red-600">{formErrors.voucher_code}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formatCPF(formData.cpf)}
                      onChange={(e) => handleInputChange('cpf', e.target.value.replace(/\D/g, '').slice(0, 11))}
                      className={formErrors.cpf ? 'border-red-500' : ''}
                      placeholder="000.000.000-00"
                    />
                    {formErrors.cpf && (
                      <p className="text-sm text-red-600">{formErrors.cpf}</p>
                    )}
                  </div>

                  {/* Empresa e Turno */}
                  <div className="space-y-2">
                    <Label htmlFor="company_id">Empresa</Label>
                    <Select
                      value={formData.company_id || 'none'}
                      onValueChange={(value) => handleInputChange('company_id', value === 'none' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shift_id">Turno</Label>
                    <Select
                      value={formData.shift_id || 'none'}
                      onValueChange={(value) => handleInputChange('shift_id', value === 'none' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um turno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {shifts.map((shift) => (
                          <SelectItem key={shift.id} value={shift.id}>
                            {shift.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Departamento e Cargo */}
                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    {showDepartmentInput || departments.length === 0 ? (
                      <div className="space-y-2">
                        <Input
                          id="department"
                          value={formData.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          placeholder="Digite o departamento"
                        />
                        {departments.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowDepartmentInput(false);
                              handleInputChange('department', '');
                            }}
                          >
                            Escolher da lista
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Select
                        value={formData.department || 'empty'}
                        onValueChange={(value) => {
                          if (value === 'other') {
                            setShowDepartmentInput(true);
                            handleInputChange('department', '');
                          } else if (value === 'empty') {
                            handleInputChange('department', '');
                          } else {
                            handleInputChange('department', value);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um departamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="empty">Nenhum</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">Outro (novo)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo</Label>
                    {showPositionInput || positions.length === 0 ? (
                      <div className="space-y-2">
                        <Input
                          id="position"
                          value={formData.position}
                          onChange={(e) => handleInputChange('position', e.target.value)}
                          placeholder="Digite o cargo"
                        />
                        {positions.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowPositionInput(false);
                              handleInputChange('position', '');
                            }}
                          >
                            Escolher da lista
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Select
                        value={formData.position || 'empty'}
                        onValueChange={(value) => {
                          if (value === 'other') {
                            setShowPositionInput(true);
                            handleInputChange('position', '');
                          } else if (value === 'empty') {
                            handleInputChange('position', '');
                          } else {
                            handleInputChange('position', value);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cargo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="empty">Nenhum</SelectItem>
                          {positions.map((pos) => (
                            <SelectItem key={pos} value={pos}>
                              {pos}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">Outro (novo)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Email e Telefone */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={formErrors.email ? 'border-red-500' : ''}
                      placeholder="email@exemplo.com"
                    />
                    {formErrors.email && (
                      <p className="text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formatPhone(formData.phone)}
                      onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  {/* Datas */}
                  <div className="space-y-2">
                    <Label htmlFor="hire_date">Data de Contratação</Label>
                    <Input
                      id="hire_date"
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => handleInputChange('hire_date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => handleInputChange('birth_date', e.target.value)}
                    />
                  </div>

                  {/* Endereço */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Endereço completo"
                    />
                  </div>

                  {/* Observações */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Observações adicionais..."
                      rows={3}
                    />
                  </div>

                  {/* Status */}
                  <div className="md:col-span-2 flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                    />
                    <Label htmlFor="is_active">Usuário ativo</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowUserDialog(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      editingUser ? 'Atualizar' : 'Criar'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, código, CPF ou departamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterCompany} onValueChange={setFilterCompany}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Usuário</TableHead>
                <TableHead>Voucher</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Departamento/Cargo</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {users.length === 0 ? 'Nenhum usuário cadastrado' : 'Nenhum usuário encontrado com os filtros aplicados'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {getInitials(user.full_name)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.full_name}</div>
                          {user.email && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Hash className="w-3 h-3 mr-1" />
                        {user.voucher_code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        {user.company?.name || 'Não definida'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{user.department || 'Não definido'}</div>
                        {user.position && (
                          <div className="text-gray-500">{user.position}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {user.shift?.name || 'Não definido'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.is_active ? "default" : "secondary"}
                        className={user.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user);
                            setShowUserDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o usuário "{user.full_name}"? 
                                Esta ação não pode ser desfeita e todos os registros de refeições associados serão perdidos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
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
        </div>
      </CardContent>
    </Card>
  );
}