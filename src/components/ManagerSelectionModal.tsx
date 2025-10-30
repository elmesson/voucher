import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Search, UserCheck, Building2, MapPin, Loader2, Shield, Lock, User, AlertCircle } from 'lucide-react';
import { useManagers } from '../utils/supabase/unified-hooks';
import { supabase } from '../utils/supabase/unified-client';
import { notifications } from './NotificationSystem';

import type { Manager } from '../utils/supabase/unified-client';

interface ManagerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManagerSelect: (manager: Manager) => void;
}

export function ManagerSelectionModal({ isOpen, onClose, onManagerSelect }: ManagerSelectionModalProps) {
  const { managers, isLoading, refreshManagers } = useManagers();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredManagers, setFilteredManagers] = useState<Manager[]>([]);
  const [viewMode, setViewMode] = useState<'select' | 'login'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      refreshManagers();
    }
  }, [isOpen, refreshManagers]);

  useEffect(() => {
    // Verificar se managers existe e é um array antes de filtrar
    if (!managers || !Array.isArray(managers)) {
      setFilteredManagers([]);
      return;
    }
    
    const activeManagers = managers.filter(manager => manager.is_active);
    
    if (searchTerm) {
      const filtered = activeManagers.filter(manager =>
        manager.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manager.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (manager.company?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (manager.department || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredManagers(filtered);
    } else {
      setFilteredManagers(activeManagers);
    }
  }, [managers, searchTerm]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleManagerSelect = (manager: Manager) => {
    onManagerSelect(manager);
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);

    try {
      // First get all managers to check credentials
      const { data: managers, error: fetchError } = await supabase
        .from('managers')
        .select(`
          *,
          company:companies(id, name)
        `)
        .eq('is_active', true);

      if (fetchError) {
        console.error('Erro ao buscar gerentes:', fetchError);
        setError('Erro de conexão com o banco de dados.');
        return;
      }

      // Check if login fields exist in the schema
      const hasUsernameField = managers && managers.length > 0 && 'username' in (managers[0] as any);
      const hasPasswordField = managers && managers.length > 0 && 'password' in (managers[0] as any);

      if (!hasUsernameField || !hasPasswordField) {
        setError('Sistema de login não configurado. Use a navegação por lista ou execute o script SQL.');
        // Auto switch to list view
        setTimeout(() => {
          setViewMode('select');
          setError('');
          refreshManagers();
        }, 2000);
        return;
      }

      // Find manager by username
      const manager = managers?.find(m => (m as any).username === username.trim());
      
      if (!manager) {
        setError('Nome de usuário não encontrado ou gerente inativo.');
        return;
      }

      // Check password (simple comparison for now)
      const storedPassword = (manager as any).password;
      if (storedPassword !== password.trim()) {
        setError('Senha incorreta.');
        return;
      }

      // Success
      notifications.success('Login realizado', `Bem-vindo(a), ${manager.full_name}!`);
      onManagerSelect(manager as Manager);
      onClose();
      resetForm();

    } catch (error) {
      console.error('Erro na autenticação:', error);
      setError('Erro interno do servidor. Tente novamente.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setError('');
    setSearchTerm('');
  };

  const handleClose = () => {
    resetForm();
    setViewMode('login');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Login de Gerente
          </DialogTitle>
          <DialogDescription>
            Digite suas credenciais para acessar o sistema de administração
          </DialogDescription>
        </DialogHeader>

        {viewMode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-6 py-4">


            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manager_username" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  Nome de Usuário
                </Label>
                <Input
                  id="manager_username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu nome de usuário"
                  required
                  className="h-12"
                  disabled={isAuthenticating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager_password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-500" />
                  Senha
                </Label>
                <Input
                  id="manager_password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  className="h-12"
                  disabled={isAuthenticating}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isAuthenticating}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isAuthenticating || !username || !password}
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </div>


          </form>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('login')}
                className="text-blue-600"
              >
                ← Voltar ao Login
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, email ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Carregando gerentes...</span>
                </div>
              </div>
            ) : (
              /* Managers List */
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredManagers.length === 0 ? (
                  <div className="text-center py-8">
                    <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchTerm ? 'Nenhum gerente encontrado' : 'Nenhum gerente ativo encontrado'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchTerm ? 'Tente ajustar sua busca' : 'Contate o administrador do sistema'}
                    </p>
                  </div>
                ) : (
                  filteredManagers.map((manager) => (
                    <Card 
                      key={manager.id} 
                      className="cursor-pointer hover:shadow-md transition-all duration-200 border-gray-200 hover:border-blue-300"
                      onClick={() => handleManagerSelect(manager)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                              {getInitials(manager.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900 truncate">
                                {manager.full_name}
                              </h3>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Ativo
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">{manager.position}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {manager.company && (
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  <span className="truncate">{manager.company.name}</span>
                                </div>
                              )}
                              {manager.department && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">{manager.department}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end">
                            <div className="text-xs text-gray-400 mb-2">
                              {Array.isArray(manager.permissions) ? manager.permissions.length : 0} permissões
                            </div>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleManagerSelect(manager);
                              }}
                            >
                              Acessar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}