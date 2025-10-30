import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Shield, User, Lock, AlertCircle, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../utils/supabase/unified-client';
import { testSupabaseConnection, checkBasicData } from '../utils/supabase/test-connection';
import { notifications } from './NotificationSystem';

interface AdminData {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  token: string;
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (adminData: AdminData) => void;
}

export function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error' | 'no-data'>('checking');
  const [statusMessage, setStatusMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  // Test connection when modal opens
  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen]);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    setStatusMessage('Verificando conexão...');
    
    try {
      const connectionTest = await testSupabaseConnection();
      
      if (!connectionTest.success) {
        setConnectionStatus('error');
        setStatusMessage(connectionTest.error || 'Erro de conexão');
        return;
      }
      
      // Check if basic data exists
      const dataCheck = await checkBasicData();
      
      if (!dataCheck.hasAdminUser) {
        setConnectionStatus('no-data');
        setStatusMessage('Tabelas criadas, mas dados iniciais não encontrados. Execute o SQL completo.');
        return;
      }
      
      setConnectionStatus('connected');
      setStatusMessage('Conectado com sucesso');
      
    } catch (error) {
      console.error('Erro na verificação:', error);
      setConnectionStatus('error');
      setStatusMessage('Falha na verificação de conexão');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDebugInfo('');
    setIsLoading(true);

    try {
      console.log('🔐 Tentando autenticar:', { username });

      // First, let's get the admin user and see what we have
      const { data: admin, error: supabaseError } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (supabaseError) {
        console.error('❌ Erro na consulta:', supabaseError);
        setError('Erro na consulta ao banco de dados.');
        notifications.error('Erro de consulta', 'Problema ao acessar o banco de dados.');
        setIsLoading(false);
        return;
      }

      if (!admin) {
        console.error('❌ Usuário não encontrado');
        setError('Usuário não encontrado ou inativo.');
        notifications.error('Erro de autenticação', 'Usuário não encontrado.');
        setIsLoading(false);
        return;
      }

      // Debug: show what we got from database
      console.log('📊 Dados do admin encontrado:', {
        username: admin.username,
        password_hash: admin.password_hash,
        full_name: admin.full_name,
        role: admin.role
      });

      setDebugInfo(`Usuário encontrado: ${admin.full_name} (${admin.role})`);

      // Try multiple password comparison methods
      const passwordInput = password.trim();
      const storedPassword = admin.password_hash?.trim();
      
      console.log('🔑 Comparando senhas:', {
        input: passwordInput,
        stored: storedPassword,
        inputLength: passwordInput.length,
        storedLength: storedPassword?.length
      });

      let isValidPassword = false;

      // Method 1: Direct comparison (most likely for our simple setup)
      if (storedPassword === passwordInput) {
        isValidPassword = true;
        console.log('✅ Senha válida: comparação direta');
      }
      
      // Method 2: Case insensitive comparison
      else if (storedPassword?.toLowerCase() === passwordInput.toLowerCase()) {
        isValidPassword = true;
        console.log('✅ Senha válida: comparação case-insensitive');
      }

      // Method 3: Try common variations
      else if (storedPassword === 'admin123' && passwordInput === 'admin123') {
        isValidPassword = true;
        console.log('✅ Senha válida: admin123 exato');
      }

      // Method 4: Check if it's a BCrypt hash (starts with $2b$)
      else if (storedPassword?.startsWith('$2b$') || storedPassword?.startsWith('$2a$')) {
        // This would require bcrypt library, but for now we'll skip
        console.log('⚠️ Senha parece ser hash BCrypt, mas não temos bcrypt no frontend');
        setError('Senha está hasheada. Use a interface administrativa para redefinir.');
        setIsLoading(false);
        return;
      }

      if (!isValidPassword) {
        console.error('❌ Senha incorreta:', {
          tentativa: passwordInput,
          esperado: storedPassword,
          tipoComparacao: 'Todas as tentativas falharam'
        });
        
        setError(`Senha incorreta. Esperado: "${storedPassword}", Recebido: "${passwordInput}"`);
        notifications.error('Erro de autenticação', 'Senha incorreta.');
        setIsLoading(false);
        return;
      }

      console.log('✅ Autenticação bem-sucedida!');

      // Update last login
      await supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id);

      const adminData: AdminData = {
        id: admin.id,
        username: admin.username,
        fullName: admin.full_name,
        email: admin.email || '',
        role: admin.role,
        token: `auth_token_${admin.id}_${Date.now()}`
      };

      notifications.success('Login realizado', `Bem-vindo, ${admin.full_name}!`);
      onLoginSuccess(adminData);
      onClose();
      resetForm();

    } catch (error) {
      console.error('❌ Erro crítico no login:', error);
      setError('Erro interno do servidor. Verifique se as tabelas foram criadas no Supabase.');
      notifications.error('Erro de conexão', 'Não foi possível conectar ao banco de dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setError('');
    setDebugInfo('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const fillAdminCredentials = () => {
    setUsername('admin');
    setPassword('admin123');
    setError('');
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'no-data':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'checking':
      default:
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'no-data':
        return 'border-amber-200 bg-amber-50';
      case 'checking':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Shield className="w-5 h-5" />
            Acesso Administrativo
          </DialogTitle>
          <DialogDescription>
            Entre com suas credenciais para acessar o painel administrativo do sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Connection Status */}
          <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">Status da Conexão</span>
            </div>
            <p className="text-sm text-gray-700">{statusMessage}</p>
            {debugInfo && (
              <p className="text-xs text-blue-600 mt-1">{debugInfo}</p>
            )}
          </div>

          {/* Default Credentials Info */}
          {connectionStatus === 'connected' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Credenciais Padrão</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700">Admin Padrão:</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fillAdminCredentials}
                    className="text-xs h-7 border-blue-200 text-blue-600 hover:bg-blue-100"
                  >
                    admin / admin123
                  </Button>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Criados automaticamente pelo SQL. Senha está em texto plano no banco.
              </p>
            </div>
          )}

          {/* Instructions for error cases */}
          {connectionStatus === 'error' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Problema de conexão:</strong> Execute o SQL fornecido no Supabase Dashboard para criar as tabelas necessárias.
              </AlertDescription>
            </Alert>
          )}

          {connectionStatus === 'no-data' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Dados não encontrados:</strong> Execute o SQL completo no Supabase para criar o usuário admin padrão.
              </AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          {connectionStatus === 'connected' && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    Usuário
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Digite seu usuário"
                    required
                    className="h-12"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    className="h-12"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="break-words">{error}</AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            {connectionStatus === 'connected' ? (
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || !username || !password}
              >
                {isLoading ? (
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
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={checkConnection}
                className="flex-1"
                disabled={connectionStatus === 'checking'}
              >
                {connectionStatus === 'checking' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Reconectar
                  </>
                )}
              </Button>
            )}
          </div>
        </form>

        {/* Database Status */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            🔗 Projeto Supabase: dhgomondxqugynhggqji
          </p>
          {debugInfo && (
            <p className="text-xs text-center mt-1 text-blue-600">
              Debug: Verificar console do navegador para logs detalhados
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}