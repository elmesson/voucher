import React, { useState, useEffect } from 'react';
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
import { Skeleton } from './ui/skeleton';
import { 
  Utensils, 
  Clock, 
  DollarSign, 
  Users, 
  Timer, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Save,
  Loader2,
  FileText,
  RefreshCw
} from 'lucide-react';
import { useMealTypes } from '../utils/supabase/unified-hooks';
import { formatTime, formatCurrency } from '../utils/supabase/unified-client';
import type { MealType } from '../utils/supabase/unified-client';

interface MealTypeFormData {
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  price: string;
  is_special: boolean;
  is_active: boolean;
}

export function MealTypeManagement() {
  const { mealTypes, isLoading, createMealType, updateMealType, deleteMealType, refreshMealTypes } = useMealTypes();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<MealTypeFormData>({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    price: '',
    is_special: false,
    is_active: true
  });

  const [formErrors, setFormErrors] = useState<Partial<MealTypeFormData>>({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (showCreateDialog || showEditDialog) {
      if (selectedMealType && showEditDialog) {
        // Editing existing meal type
        setFormData({
          name: selectedMealType.name,
          description: selectedMealType.description || '',
          start_time: selectedMealType.start_time,
          end_time: selectedMealType.end_time,
          price: selectedMealType.price?.toString() || '',
          is_special: selectedMealType.is_special,
          is_active: selectedMealType.is_active
        });
      } else if (showCreateDialog) {
        // Creating new meal type
        setFormData({
          name: '',
          description: '',
          start_time: '',
          end_time: '',
          price: '',
          is_special: false,
          is_active: true
        });
      }
    } else {
      setSelectedMealType(null);
      setFormErrors({});
    }
  }, [showCreateDialog, showEditDialog, selectedMealType]);

  const handleInputChange = (field: keyof MealTypeFormData, value: string | boolean) => {
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
    const errors: Partial<MealTypeFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (!formData.start_time) {
      errors.start_time = 'Horário de início é obrigatório';
    }

    if (!formData.end_time) {
      errors.end_time = 'Horário de fim é obrigatório';
    }

    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      // Allow overnight meals (like Ceia: 22:00 to 02:00)
      if (formData.start_time <= formData.end_time) {
        errors.end_time = 'Horário de fim deve ser posterior ao início (ou configurar refeição noturna)';
      }
    }

    if (formData.price && (isNaN(Number(formData.price)) || Number(formData.price) < 0)) {
      errors.price = 'Preço deve ser um valor válido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const mealTypeData = {
        name: formData.name,
        description: formData.description || undefined,
        start_time: formData.start_time,
        end_time: formData.end_time,
        price: formData.price ? Number(formData.price) : undefined,
        is_special: formData.is_special,
        is_active: formData.is_active
      };

      if (selectedMealType) {
        await updateMealType(selectedMealType.id, mealTypeData);
        setShowEditDialog(false);
      } else {
        await createMealType(mealTypeData);
        setShowCreateDialog(false);
      }
    } catch (error) {
      console.error('Erro ao salvar tipo de refeição:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (mealTypeId: string) => {
    await deleteMealType(mealTypeId);
  };

  const openEditDialog = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setShowEditDialog(true);
  };

  const openViewDialog = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setShowViewDialog(true);
  };

  const getTimeCategory = (startTime: string) => {
    const hour = parseInt(startTime.split(':')[0]);
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  };

  const filteredMealTypes = mealTypes.filter(mealType => {
    const matchesSearch = 
      mealType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mealType.description && mealType.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && mealType.is_active) ||
      (statusFilter === 'inactive' && !mealType.is_active);

    const matchesType = typeFilter === 'all' ||
      (typeFilter === 'regular' && !mealType.is_special) ||
      (typeFilter === 'special' && mealType.is_special);

    return matchesSearch && matchesStatus && matchesType;
  });

  if (isLoading) {
    return (
      <Card className="bg-white border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-blue-600" />
            Tipos de Refeição
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
            <Utensils className="w-5 h-5 text-blue-600" />
            Tipos de Refeição
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {filteredMealTypes.length} de {mealTypes.length}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshMealTypes}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Tipo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" aria-describedby="create-meal-type-description">
                <DialogHeader>
                  <DialogTitle>
                    Novo Tipo de Refeição
                  </DialogTitle>
                  <DialogDescription id="create-meal-type-description">
                    Preencha as informações para criar um novo tipo de refeição.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  {/* Nome */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={formErrors.name ? 'border-red-500' : ''}
                      placeholder="Ex: Almoço, Jantar, Coffee Break"
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Horários */}
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Horário de Início *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                      className={formErrors.start_time ? 'border-red-500' : ''}
                    />
                    {formErrors.start_time && (
                      <p className="text-sm text-red-600">{formErrors.start_time}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_time">Horário de Fim *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => handleInputChange('end_time', e.target.value)}
                      className={formErrors.end_time ? 'border-red-500' : ''}
                    />
                    {formErrors.end_time && (
                      <p className="text-sm text-red-600">{formErrors.end_time}</p>
                    )}
                  </div>

                  {/* Preço */}
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className={formErrors.price ? 'border-red-500' : ''}
                      placeholder="0.00"
                    />
                    {formErrors.price && (
                      <p className="text-sm text-red-600">{formErrors.price}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_special"
                        checked={formData.is_special}
                        onCheckedChange={(checked) => handleInputChange('is_special', checked)}
                      />
                      <Label htmlFor="is_special">Tipo especial (RH)</Label>
                    </div>
                    <p className="text-xs text-gray-500">
                      Tipos especiais são exclusivos para o módulo "RH Refeições Extras"
                    </p>
                  </div>

                  {/* Descrição */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Descreva os detalhes do tipo de refeição..."
                    />
                  </div>

                  {/* Status */}
                  <div className="md:col-span-2 flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                    />
                    <Label htmlFor="is_active">Tipo ativo</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
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
                      'Criar'
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
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="regular">Regulares</SelectItem>
              <SelectItem value="special">Especiais (RH)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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

        {/* Meal Types Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Tipo de Refeição</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMealTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {mealTypes.length === 0 ? 'Nenhum tipo de refeição cadastrado' : 'Nenhum tipo encontrado com os filtros aplicados'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMealTypes.map((mealType) => (
                  <TableRow key={mealType.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Utensils className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{mealType.name}</div>
                          {mealType.description && (
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {mealType.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">
                          {formatTime(mealType.start_time)} - {formatTime(mealType.end_time)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {mealType.price ? (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {formatCurrency(mealType.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Não definido</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={mealType.is_special ? "secondary" : "outline"}
                        className={mealType.is_special ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}
                      >
                        {mealType.is_special ? 'Especial' : 'Regular'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={mealType.is_active ? "default" : "secondary"}
                        className={mealType.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {mealType.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewDialog(mealType)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(mealType)}
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
                              <AlertDialogTitle>Excluir tipo de refeição</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o tipo "{mealType.name}"? 
                                Esta ação não pode ser desfeita e pode afetar registros existentes.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(mealType.id)}
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl" aria-describedby="edit-meal-type-description">
          <DialogHeader>
            <DialogTitle>
              Editar Tipo de Refeição
            </DialogTitle>
            <DialogDescription id="edit-meal-type-description">
              Edite as informações do tipo de refeição abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Same form fields as create dialog */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="edit_name">Nome *</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={formErrors.name ? 'border-red-500' : ''}
                placeholder="Ex: Almoço, Jantar, Coffee Break"
              />
              {formErrors.name && (
                <p className="text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_start_time">Horário de Início *</Label>
              <Input
                id="edit_start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                className={formErrors.start_time ? 'border-red-500' : ''}
              />
              {formErrors.start_time && (
                <p className="text-sm text-red-600">{formErrors.start_time}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_end_time">Horário de Fim *</Label>
              <Input
                id="edit_end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
                className={formErrors.end_time ? 'border-red-500' : ''}
              />
              {formErrors.end_time && (
                <p className="text-sm text-red-600">{formErrors.end_time}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_price">Preço (R$)</Label>
              <Input
                id="edit_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className={formErrors.price ? 'border-red-500' : ''}
                placeholder="0.00"
              />
              {formErrors.price && (
                <p className="text-sm text-red-600">{formErrors.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_is_special"
                  checked={formData.is_special}
                  onCheckedChange={(checked) => handleInputChange('is_special', checked)}
                />
                <Label htmlFor="edit_is_special">Tipo especial (RH)</Label>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="edit_description">Descrição</Label>
              <textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Descreva os detalhes do tipo de refeição..."
              />
            </div>

            <div className="md:col-span-2 flex items-center space-x-2">
              <Switch
                id="edit_is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="edit_is_active">Tipo ativo</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
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
                'Atualizar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl" aria-describedby="view-meal-type-description">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Tipo de Refeição
            </DialogTitle>
            <DialogDescription id="view-meal-type-description">
              Visualize as informações detalhadas do tipo de refeição.
            </DialogDescription>
          </DialogHeader>

          {selectedMealType && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">Nome</Label>
                    <p className="font-medium text-gray-900">{selectedMealType.name}</p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Horário</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {formatTime(selectedMealType.start_time)} - {formatTime(selectedMealType.end_time)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Preço</Label>
                    {selectedMealType.price ? (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {formatCurrency(selectedMealType.price)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Não definido</span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">Categoria</Label>
                    <div>
                      <Badge
                        variant={selectedMealType.is_special ? "secondary" : "outline"}
                        className={selectedMealType.is_special ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}
                      >
                        {selectedMealType.is_special ? 'Especial (RH)' : 'Regular'}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Status</Label>
                    <div>
                      <Badge
                        variant={selectedMealType.is_active ? "default" : "secondary"}
                        className={selectedMealType.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {selectedMealType.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Período</Label>
                    <p className="text-gray-900 capitalize">
                      {getTimeCategory(selectedMealType.start_time) === 'morning' && 'Manhã'}
                      {getTimeCategory(selectedMealType.start_time) === 'afternoon' && 'Tarde'}
                      {getTimeCategory(selectedMealType.start_time) === 'evening' && 'Noite'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedMealType.description && (
                <div>
                  <Label className="text-sm text-gray-600">Descrição</Label>
                  <p className="text-gray-900 mt-1">{selectedMealType.description}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <Label className="text-sm text-gray-600">Informações do Sistema</Label>
                <div className="mt-2 space-y-1 text-sm text-gray-500">
                  <div>ID: {selectedMealType.id}</div>
                  <div>Criado em: {new Date(selectedMealType.created_at).toLocaleString('pt-BR')}</div>
                  <div>Última atualização: {new Date(selectedMealType.updated_at).toLocaleString('pt-BR')}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowViewDialog(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl" aria-describedby="view-meal-type-description">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Tipo de Refeição
            </DialogTitle>
            <DialogDescription id="view-meal-type-description">
              Informações detalhadas do tipo de refeição selecionado.
            </DialogDescription>
          </DialogHeader>

          {selectedMealType && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedMealType.name}</h3>
                  <p className="text-sm text-gray-600">{selectedMealType.is_special ? 'Especial' : 'Regular'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Horário de Início</label>
                  <p className="text-gray-900">{formatTime(selectedMealType.start_time)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Horário de Fim</label>
                  <p className="text-gray-900">{formatTime(selectedMealType.end_time)}</p>
                </div>
              </div>

              {selectedMealType.price && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Preço</label>
                  <p className="text-gray-900">{formatCurrency(selectedMealType.price)}</p>
                </div>
              )}

              {selectedMealType.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Descrição</label>
                  <p className="text-gray-900">{selectedMealType.description}</p>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <Badge
                    variant={selectedMealType.is_special ? "secondary" : "outline"}
                    className={selectedMealType.is_special ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}
                  >
                    {selectedMealType.is_special ? 'Especial (RH)' : 'Regular'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Badge
                    variant={selectedMealType.is_active ? "default" : "secondary"}
                    className={selectedMealType.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                  >
                    {selectedMealType.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowViewDialog(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}