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
import { Building2, Plus, Edit, Trash2, Search, Phone, Mail, MapPin, Hash, Loader2, RefreshCw } from 'lucide-react';
import { useCompanies } from '../utils/supabase/unified-hooks';
import { formatCNPJ, formatPhone } from '../utils/supabase/unified-client';
import type { Company } from '../utils/supabase/unified-client';

interface CompanyFormData {
  name: string;
  trade_name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  is_active: boolean;
}

export function CompanyManagement() {
  const { companies, isLoading, createCompany, updateCompany, deleteCompany, refreshCompanies } = useCompanies();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    trade_name: '',
    cnpj: '',
    address: '',
    phone: '',
    email: '',
    is_active: true
  });

  const [formErrors, setFormErrors] = useState<Partial<CompanyFormData>>({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (showCompanyDialog) {
      if (editingCompany) {
        // Editing existing company
        setFormData({
          name: editingCompany.name,
          trade_name: editingCompany.trade_name || '',
          cnpj: editingCompany.cnpj || '',
          address: editingCompany.address || '',
          phone: editingCompany.phone || '',
          email: editingCompany.email || '',
          is_active: editingCompany.is_active
        });
      } else {
        // Creating new company
        setFormData({
          name: '',
          trade_name: '',
          cnpj: '',
          address: '',
          phone: '',
          email: '',
          is_active: true
        });
      }
    } else {
      setEditingCompany(null);
      setFormErrors({});
    }
  }, [showCompanyDialog, editingCompany]);

  const handleInputChange = (field: keyof CompanyFormData, value: string | boolean) => {
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

  const validateCNPJ = (cnpj: string): boolean => {
    cnpj = cnpj.replace(/\D/g, '');
    
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    // Validação dos dígitos verificadores
    let sum = 0;
    let weight = 2;
    
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    
    let checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (checkDigit !== parseInt(cnpj.charAt(12))) return false;
    
    sum = 0;
    weight = 2;
    
    for (let i = 12; i >= 0; i--) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    
    checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return checkDigit === parseInt(cnpj.charAt(13));
  };

  const validateForm = (): boolean => {
    const errors: Partial<CompanyFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome da empresa é obrigatório';
    }

    if (formData.cnpj && !validateCNPJ(formData.cnpj)) {
      errors.cnpj = 'CNPJ inválido';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    // Check if CNPJ is unique (excluding current company if editing)
    if (formData.cnpj) {
      const cnpjNumbers = formData.cnpj.replace(/\D/g, '');
      const existingCompany = companies.find(company => 
        company.cnpj === cnpjNumbers && 
        (!editingCompany || company.id !== editingCompany.id)
      );
      if (existingCompany) {
        errors.cnpj = 'Este CNPJ já está cadastrado';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const companyData = {
        ...formData,
        cnpj: formData.cnpj ? formData.cnpj.replace(/\D/g, '') : undefined,
        phone: formData.phone ? formData.phone.replace(/\D/g, '') : undefined,
        trade_name: formData.trade_name || undefined,
        address: formData.address || undefined,
        email: formData.email || undefined
      };

      if (editingCompany) {
        await updateCompany(editingCompany.id, companyData);
      } else {
        await createCompany(companyData);
      }

      setShowCompanyDialog(false);
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (companyId: string) => {
    await deleteCompany(companyId);
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.trade_name && company.trade_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (company.cnpj && company.cnpj.includes(searchTerm.replace(/\D/g, '')));

    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && company.is_active) ||
      (filterStatus === 'inactive' && !company.is_active);

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card className="bg-white border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Empresas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
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
            <Building2 className="w-5 h-5 text-blue-600" />
            Empresas
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {filteredCompanies.length} de {companies.length}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshCompanies}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Empresa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" aria-describedby="company-form-description">
                <DialogHeader>
                  <DialogTitle>
                    {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
                  </DialogTitle>
                  <DialogDescription id="company-form-description">
                    {editingCompany ? 'Edite as informações da empresa abaixo.' : 'Preencha as informações para cadastrar uma nova empresa.'}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  {/* Nome da Empresa */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="name">Nome da Empresa *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={formErrors.name ? 'border-red-500' : ''}
                      placeholder="Digite o nome da empresa"
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Nome Fantasia */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="trade_name">Nome Fantasia</Label>
                    <Input
                      id="trade_name"
                      value={formData.trade_name}
                      onChange={(e) => handleInputChange('trade_name', e.target.value)}
                      placeholder="Nome fantasia (opcional)"
                    />
                  </div>

                  {/* CNPJ */}
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={formatCNPJ(formData.cnpj)}
                      onChange={(e) => handleInputChange('cnpj', e.target.value.replace(/\D/g, '').slice(0, 14))}
                      className={formErrors.cnpj ? 'border-red-500' : ''}
                      placeholder="00.000.000/0000-00"
                    />
                    {formErrors.cnpj && (
                      <p className="text-sm text-red-600">{formErrors.cnpj}</p>
                    )}
                  </div>

                  {/* Telefone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formatPhone(formData.phone)}
                      onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  {/* Email */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={formErrors.email ? 'border-red-500' : ''}
                      placeholder="contato@empresa.com"
                    />
                    {formErrors.email && (
                      <p className="text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Endereço */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Endereço completo da empresa..."
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
                    <Label htmlFor="is_active">Empresa ativa</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowCompanyDialog(false)}
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
                      editingCompany ? 'Atualizar' : 'Criar'
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
                placeholder="Buscar por nome, nome fantasia ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="inactive">Inativas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Companies Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {companies.length === 0 ? 'Nenhuma empresa cadastrada' : 'Nenhuma empresa encontrada com os filtros aplicados'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{company.name}</div>
                          {company.trade_name && company.trade_name !== company.name && (
                            <div className="text-sm text-gray-500">{company.trade_name}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.cnpj ? (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          <Hash className="w-3 h-3 mr-1" />
                          {formatCNPJ(company.cnpj)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">Não informado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {company.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />
                            {company.email}
                          </div>
                        )}
                        {company.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />
                            {formatPhone(company.phone)}
                          </div>
                        )}
                        {!company.email && !company.phone && (
                          <span className="text-gray-400 text-sm">Não informado</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={company.is_active ? "default" : "secondary"}
                        className={company.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {company.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCompany(company);
                            setShowCompanyDialog(true);
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
                              <AlertDialogTitle>Excluir empresa</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a empresa "{company.name}"? 
                                Esta ação não pode ser desfeita e todos os usuários e dados associados serão afetados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(company.id)}
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