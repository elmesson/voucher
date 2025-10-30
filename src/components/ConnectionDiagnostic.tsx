import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Globe,
  Database,
  Shield
} from 'lucide-react';
import { supabase as supabaseClient, isSupabaseReady } from '../utils/supabase/unified-client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: string;
}

export function ConnectionDiagnostic() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // 1. Verificar credenciais
    try {
      if (!projectId || !publicAnonKey) {
        results.push({
          name: 'Credenciais',
          status: 'error',
          message: 'Credenciais não configuradas',
          details: 'Project ID ou API Key não encontrados'
        });
      } else {
        results.push({
          name: 'Credenciais',
          status: 'success',
          message: 'Credenciais configuradas',
          details: `Project ID: ${projectId.substring(0, 8)}...`
        });
      }
    } catch (error) {
      results.push({
        name: 'Credenciais',
        status: 'error',
        message: 'Erro ao verificar credenciais',
        details: String(error)
      });
    }

    setDiagnostics([...results]);

    // 2. Verificar cliente Supabase
    try {
      const clientReady = isSupabaseReady();
      if (clientReady) {
        results.push({
          name: 'Cliente Supabase',
          status: 'success',
          message: 'Cliente inicializado',
          details: 'Métodos disponíveis'
        });
      } else {
        results.push({
          name: 'Cliente Supabase',
          status: 'error',
          message: 'Cliente não inicializado',
          details: 'Falha na criação do cliente'
        });
      }
    } catch (error) {
      results.push({
        name: 'Cliente Supabase',
        status: 'error',
        message: 'Erro no cliente',
        details: String(error)
      });
    }

    setDiagnostics([...results]);

    // 3. Teste de conectividade básica
    try {
      const url = `https://${projectId}.supabase.co`;
      console.log('🌐 Testando conectividade para:', url);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
        headers: {
          'apikey': publicAnonKey,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Resposta da conectividade:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok || response.status === 404) {
        results.push({
          name: 'Conectividade',
          status: 'success',
          message: 'Servidor acessível',
          details: `Status: ${response.status} - ${response.statusText}`
        });
      } else {
        results.push({
          name: 'Conectividade',
          status: 'warning',
          message: 'Resposta inesperada',
          details: `Status: ${response.status} - ${response.statusText}`
        });
      }
    } catch (error: any) {
      console.error('❌ Erro na conectividade:', error);
      results.push({
        name: 'Conectividade',
        status: 'error',
        message: 'Falha na conectividade',
        details: `${error.name}: ${error.message}`
      });
    }

    setDiagnostics([...results]);

    // 4. Teste direto da API REST 
    try {
      const restUrl = `https://${projectId}.supabase.co/rest/v1/companies?select=id&limit=1`;
      console.log('🔗 Testando API REST diretamente:', restUrl);
      
      const restResponse = await fetch(restUrl, {
        method: 'GET',
        headers: {
          'apikey': publicAnonKey,
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        signal: AbortSignal.timeout(10000)
      });

      console.log('📊 Resposta da API REST:', {
        status: restResponse.status,
        statusText: restResponse.statusText,
        headers: Object.fromEntries(restResponse.headers.entries())
      });

      if (restResponse.ok) {
        const data = await restResponse.json();
        results.push({
          name: 'API REST Direta',
          status: 'success',
          message: 'API REST funcionando',
          details: `Status: ${restResponse.status}, Dados: ${JSON.stringify(data).substring(0, 100)}...`
        });
      } else {
        const errorText = await restResponse.text();
        results.push({
          name: 'API REST Direta',
          status: 'error',
          message: 'Erro na API REST',
          details: `Status: ${restResponse.status}, Erro: ${errorText.substring(0, 200)}...`
        });
      }
    } catch (error: any) {
      console.error('❌ Erro na API REST direta:', error);
      results.push({
        name: 'API REST Direta',
        status: 'error',
        message: 'Falha na API REST',
        details: `${error.name}: ${error.message}`
      });
    }

    setDiagnostics([...results]);

    // 5. Teste da API via cliente Supabase
    try {
      const testResult = await supabaseClient.testConnection();
      if (testResult) {
        results.push({
          name: 'Cliente Supabase',
          status: 'success',
          message: 'Cliente funcionando',
          details: 'Query executada com sucesso'
        });
      } else {
        results.push({
          name: 'Cliente Supabase',
          status: 'error',
          message: 'Cliente com problemas',
          details: 'Falha na execução da query'
        });
      }
    } catch (error: any) {
      results.push({
        name: 'Cliente Supabase',
        status: 'error',
        message: 'Erro no cliente',
        details: error.message
      });
    }

    setDiagnostics([...results]);

    // 6. Teste de tabelas
    try {
      const companies = await supabaseClient.getCompanies();
      results.push({
        name: 'Acesso a Tabelas',
        status: 'success',
        message: 'Acesso às tabelas OK',
        details: `${companies.length} empresas encontradas`
      });
    } catch (error: any) {
      results.push({
        name: 'Acesso a Tabelas',
        status: 'error',
        message: 'Erro no acesso às tabelas',
        details: error.message
      });
    }

    setDiagnostics([...results]);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'loading':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'loading':
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  const overallStatus = diagnostics.length > 0 ? (
    diagnostics.every(d => d.status === 'success') ? 'success' :
    diagnostics.some(d => d.status === 'error') ? 'error' : 'warning'
  ) : 'loading';

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {overallStatus === 'success' && <Wifi className="w-5 h-5 text-green-600" />}
          {overallStatus === 'error' && <WifiOff className="w-5 h-5 text-red-600" />}
          {overallStatus === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
          {overallStatus === 'loading' && <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />}
          Diagnóstico de Conexão
        </CardTitle>
        <div className="flex justify-between items-center">
          <Badge className={getStatusColor(overallStatus)}>
            {overallStatus === 'success' && 'Tudo OK'}
            {overallStatus === 'error' && 'Problemas Detectados'}
            {overallStatus === 'warning' && 'Avisos'}
            {overallStatus === 'loading' && 'Testando...'}
          </Badge>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            Executar Novamente
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {diagnostics.map((diagnostic, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnostic.status)}
                <span className="font-medium">{diagnostic.name}</span>
              </div>
              <span className="text-sm text-gray-600">
                {diagnostic.message}
              </span>
            </div>
            {diagnostic.details && (
              <div className="ml-6 text-sm text-gray-500 bg-gray-50 p-2 rounded border">
                {diagnostic.details}
              </div>
            )}
          </div>
        ))}

        {diagnostics.length === 0 && isRunning && (
          <div className="text-center py-4">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-sm text-gray-600">Executando diagnósticos...</p>
          </div>
        )}

        {overallStatus === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Foram detectados problemas na conexão. Verifique sua conectividade com a internet e 
              as configurações do Supabase. Se o problema persistir, entre em contato com o suporte.
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Informações do Sistema</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Project:</span>
              <span className="font-mono text-gray-900">{projectId}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">URL:</span>
              <span className="font-mono text-gray-900 text-xs">
                https://{projectId}.supabase.co
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Key:</span>
              <span className="font-mono text-gray-900 text-xs">
                {publicAnonKey.substring(0, 20)}...
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}