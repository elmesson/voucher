import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Skeleton } from './ui/skeleton';
import { Clock, Plus, Edit, Trash2, Search, Users, RefreshCw, Loader2 } from 'lucide-react';
import { useShifts } from '../utils/supabase/unified-hooks';
import { formatTime } from '../utils/supabase/unified-client';
import type { Shift } from '../utils/supabase/unified-client';

interface ShiftFormData {
  name: string;
  start_time: string;
  end_time: string;
  description: string;
  is_active: boolean;
}

export function ShiftManagement() {
  const { shifts, isLoading, createShift, updateShift, deleteShift, refreshShifts } = useShifts();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ShiftFormData>({
    name: '',
    start_time: '',
    end_time: '',
    description: '',
    is_active: true
  });

  const [formErrors, setFormErrors] = useState<Partial<ShiftFormData>>({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (showShiftDialog) {
      if (editingShift) {
        // Editing existing shift
        setFormData({
          name: editingShift.name,
          start_time: editingShift.start_time,
          end_time: editingShift.end_time,
          description: editingShift.description || '',
          is_active: editingShift.is_active
        });
      } else {
        // Creating new shift
        setFormData({
          name: '',
          start_time: '',
          end_time: '',
          description: '',
          is_active: true
        });
      }
    } else {
      setEditingShift(null);
      setFormErrors({});
    }
  }, [showShiftDialog, editingShift]);

  const handleInputChange = (field: keyof ShiftFormData, value: string | boolean) => {
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
    const errors: Partial<ShiftFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome do turno é obrigatório';
    }

    if (!formData.start_time) {
      errors.start_time = 'Horário de início é obrigatório';
    }

    if (!formData.end_time) {
      errors.end_time = 'Horário de fim é obrigatório';
    }

    // Allow overnight shifts (like 22:00 to 06:00)
    if (formData.start_time && formData.end_time && formData.start_time === formData.end_time) {
      errors.end_time = 'Horário de início e fim não podem ser iguais';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const shiftData = {
        name: formData.name,
        start_time: formData.start_time,
        end_time: formData.end_time,
        description: formData.description || undefined,
        is_active: formData.is_active
      };

      if (editingShift) {
        await updateShift(editingShift.id, shiftData);
      } else {
        await createShift(shiftData);
      }

      setShowShiftDialog(false);
    } catch (error) {
      console.error('Erro ao salvar turno:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (shiftId: string) => {
    await deleteShift(shiftId);
  };

  const getShiftDuration = (startTime: string, endTime: string) => {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    
    let duration = end.getTime() - start.getTime();
    
    // Handle overnight shifts
    if (duration < 0) {
      duration += 24 * 60 * 60 * 1000; // Add 24 hours
    }
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  };

  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = 
      shift.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shift.description && shift.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && shift.is_active) ||
      (statusFilter === 'inactive' && !shift.is_active);

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card className="bg-white border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Turnos de Trabalho
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
            <Clock className="w-5 h-5 text-blue-600" />
            Turnos de Trabalho
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {filteredShifts.length} de {shifts.length}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshShifts}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Dialog open={showShiftDialog} onOpenChange={setShowShiftDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Turno
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" aria-describedby="shift-form-description">
                <DialogHeader>
                  <DialogTitle>
                    {editingShift ? 'Editar Turno' : 'Novo Turno'}
                  </DialogTitle>
                  <DialogDescription id="shift-form-description">
                    {editingShift ? 'Edite as informações do turno de trabalho.' : 'Preencha as informações para criar um novo turno de trabalho.'}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  {/* Nome do Turno */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="name">Nome do Turno *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={formErrors.name ? 'border-red-500' : ''}
                      placeholder="Ex: 1° Turno - Manhã, Administrativo"
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Horário de Início */}
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

                  {/* Horário de Fim */}
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
                    {formData.start_time && formData.end_time && formData.start_time > formData.end_time && (
                      <p className="text-sm text-blue-600">
                        💡 Turno noturno detectado (passa da meia-noite)
                      </p>
                    )}
                  </div>

                  {/* Descrição */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Descreva as características do turno..."
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
                    <Label htmlFor="is_active">Turno ativo</Label>
                  </div>

                  {/* Duração Calculada */}
                  {formData.start_time && formData.end_time && (
                    <div className="md:col-span-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Duração do Turno:</span>
                        <span className="text-sm text-blue-700">
                          {getShiftDuration(formData.start_time, formData.end_time)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowShiftDialog(false)}
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
                      editingShift ? 'Atualizar' : 'Criar'
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

        {/* Shifts Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Turno</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {shifts.length === 0 ? 'Nenhum turno cadastrado' : 'Nenhum turno encontrado com os filtros aplicados'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredShifts.map((shift) => (
                  <TableRow key={shift.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{shift.name}</div>
                          {shift.description && (
                            <div className="text-sm text-gray-500">{shift.description}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">
                          {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                        </span>
                      </div>
                      {shift.start_time > shift.end_time && (
                        <div className="text-xs text-blue-600 mt-1">
                          Turno noturno
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-900 font-medium">
                        {getShiftDuration(shift.start_time, shift.end_time)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={shift.is_active ? "default" : "secondary"}
                        className={shift.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {shift.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingShift(shift);
                            setShowShiftDialog(true);
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
                              <AlertDialogTitle>Excluir turno</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o turno "{shift.name}"? 
                                Esta ação não pode ser desfeita e pode afetar usuários associados a este turno.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(shift.id)}
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