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
  Shield,
  Clock
} from 'lucide-react';
import { supabaseClientWithRetry, isSupabaseReady } from '../utils/supabase/client-stable';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: string;
  timestamp?: string;
}

export function ConnectionDiagnosticFixed() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const addDiagnostic = (diagnostic: Omit<DiagnosticResult, 'timestamp'>) => {
    setDiagnostics(prev => [...prev, { ...diagnostic, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setStartTime(new Date());
    setDiagnostics([]);

    // 1. Verificar configuração
    console.log('🔧 Iniciando diagnósticos de conexão...');
    
    try {
      if (!projectId || !publicAnonKey) {
        addDiagnostic({
          name: 'Configuração',
          status: 'error',
          message: 'Credenciais não configuradas',
          details: `Project ID: ${projectId ? 'OK' : 'FALTANDO'}, API Key: ${publicAnonKey ? 'OK' : 'FALTANDO'}`
        });
      } else if (!projectId.match(/^[a-z0-9]{20}$/)) {
        addDiagnostic({
          name: 'Configuração',
          status: 'error',
          message: 'Project ID com formato inválido',
          details: `Project ID: ${projectId} (deve ter 20 caracteres alfanuméricos)`
        });
      } else {
        addDiagnostic({
          name: 'Configuração',
          status: 'success',
          message: 'Credenciais válidas',
          details: `Project: ${projectId.substring(0, 8)}..., Key: ${publicAnonKey.substring(0, 20)}...`
        });
      }
    } catch (error) {
      addDiagnostic({
        name: 'Configuração',
        status: 'error',
        message: 'Erro na verificação',
        details: String(error)
      });
    }

    // 2. Verificar cliente
    try {
      const clientReady = isSupabaseReady();
      if (clientReady) {
        addDiagnostic({
          name: 'Cliente Supabase',
          status: 'success',
          message: 'Cliente inicializado',
          details: 'Métodos disponíveis e funcionais'
        });
      } else {
        addDiagnostic({
          name: 'Cliente Supabase',
          status: 'error',
          message: 'Cliente não inicializado',
          details: 'Falha na criação do cliente'
        });
      }
    } catch (error) {
      addDiagnostic({
        name: 'Cliente Supabase',
        status: 'error',
        message: 'Erro no cliente',
        details: String(error)
      });
    }

    // 3. Teste de conectividade básica (ping)
    try {
      const url = `https://${projectId}.supabase.co`;
      console.log('🌐 Testando conectividade básica:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'Accept': '*/*',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.status < 500) { // Qualquer resposta abaixo de 500 indica que o servidor está acessível
        addDiagnostic({
          name: 'Conectividade Básica',
          status: 'success',
          message: 'Servidor acessível',
          details: `Status HTTP: ${response.status} - ${response.statusText}`
        });
      } else {
        addDiagnostic({
          name: 'Conectividade Básica',
          status: 'warning',
          message: 'Servidor com problemas',
          details: `Status HTTP: ${response.status} - ${response.statusText}`
        });
      }
    } catch (error: any) {
      console.error('❌ Erro na conectividade básica:', error);
      
      let errorMessage = 'Falha na conectividade';
      let errorDetails = `${error.name}: ${error.message}`;
      
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout na conexão';
        errorDetails = 'Servidor não respondeu em 8 segundos';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Erro de rede';
        errorDetails = 'Possível problema de conexão à internet ou CORS';
      }
      
      addDiagnostic({
        name: 'Conectividade Básica',
        status: 'error',
        message: errorMessage,
        details: errorDetails
      });
    }

    // 4. Teste da API REST diretamente
    try {
      const restUrl = `https://${projectId}.supabase.co/rest/v1/companies?select=id&limit=1`;
      console.log('🔗 Testando API REST:', restUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const restResponse = await fetch(restUrl, {
        method: 'GET',
        headers: {
          'apikey': publicAnonKey,
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (restResponse.ok) {
        const data = await restResponse.json();
        addDiagnostic({
          name: 'API REST',
          status: 'success',
          message: 'API funcionando',
          details: `Status: ${restResponse.status}, Registros: ${Array.isArray(data) ? data.length : 'N/A'}`
        });
      } else {
        let errorText = 'Resposta não disponível';
        try {
          errorText = await restResponse.text();
        } catch (e) {
          console.warn('Não foi possível ler o texto da resposta de erro');
        }
        
        addDiagnostic({
          name: 'API REST',
          status: 'error',
          message: 'Erro na API',
          details: `Status: ${restResponse.status}, Erro: ${errorText.substring(0, 150)}...`
        });
      }
    } catch (error: any) {
      console.error('❌ Erro na API REST:', error);
      
      let errorMessage = 'Falha na API';
      let errorDetails = `${error.name}: ${error.message}`;
      
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout na API';
        errorDetails = 'API não respondeu em 10 segundos';
      }
      
      addDiagnostic({
        name: 'API REST',
        status: 'error',
        message: errorMessage,
        details: errorDetails
      });
    }

    // 5. Teste via cliente Supabase
    try {
      const testResult = await supabaseClientWithRetry.testConnection();
      if (testResult) {
        addDiagnostic({
          name: 'Cliente Supabase',
          status: 'success',
          message: 'Cliente funcionando',
          details: 'Query executada com sucesso'
        });
      } else {
        addDiagnostic({
          name: 'Cliente Supabase',
          status: 'error',
          message: 'Falha no cliente',
          details: 'Não foi possível executar query de teste'
        });
      }
    } catch (error: any) {
      addDiagnostic({
        name: 'Cliente Supabase',
        status: 'error',
        message: 'Erro no cliente',
        details: error.message || String(error)
      });
    }

    // 6. Teste de acesso às tabelas principais
    try {
      const companies = await supabaseClientWithRetry.getCompanies();
      addDiagnostic({
        name: 'Acesso a Tabelas',
        status: 'success',
        message: 'Tabelas acessíveis',
        details: `${companies.length} empresas encontradas`
      });
    } catch (error: any) {
      addDiagnostic({
        name: 'Acesso a Tabelas',
        status: 'error',
        message: 'Erro no acesso',
        details: error.message || String(error)
      });
    }

    const endTime = new Date();
    const duration = endTime.getTime() - (startTime?.getTime() || endTime.getTime());
    
    addDiagnostic({
      name: 'Diagnóstico Completo',
      status: 'success',
      message: 'Finalizado',
      details: `Duração: ${(duration / 1000).toFixed(1)}s`
    });

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

  const errorCount = diagnostics.filter(d => d.status === 'error').length;
  const warningCount = diagnostics.filter(d => d.status === 'warning').length;
  const successCount = diagnostics.filter(d => d.status === 'success').length;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {overallStatus === 'success' && <Wifi className="w-5 h-5 text-green-600" />}
          {overallStatus === 'error' && <WifiOff className="w-5 h-5 text-red-600" />}
          {overallStatus === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
          {overallStatus === 'loading' && <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />}
          Diagnóstico de Conexão Avançado
        </CardTitle>
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Badge className={getStatusColor(overallStatus)}>
              {overallStatus === 'success' && 'Sistema Operacional'}
              {overallStatus === 'error' && 'Problemas Críticos'}
              {overallStatus === 'warning' && 'Funcionamento Parcial'}
              {overallStatus === 'loading' && 'Diagnosticando...'}
            </Badge>
            {diagnostics.length > 0 && (
              <div className="flex gap-1 text-xs">
                {successCount > 0 && <Badge variant="outline" className="bg-green-50 text-green-700">✓ {successCount}</Badge>}
                {warningCount > 0 && <Badge variant="outline" className="bg-yellow-50 text-yellow-700">⚠ {warningCount}</Badge>}
                {errorCount > 0 && <Badge variant="outline" className="bg-red-50 text-red-700">✕ {errorCount}</Badge>}
              </div>
            )}
          </div>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Diagnosticando...' : 'Executar Novamente'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resultados dos Testes */}
        <div className="space-y-4">
          {diagnostics.map((diagnostic, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnostic.status)}
                  <span className="font-medium">{diagnostic.name}</span>
                  {diagnostic.timestamp && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {diagnostic.timestamp}
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-600">
                  {diagnostic.message}
                </span>
              </div>
              {diagnostic.details && (
                <div className="ml-6 text-sm text-gray-500 bg-gray-50 p-3 rounded-md border font-mono">
                  {diagnostic.details}
                </div>
              )}
            </div>
          ))}

          {diagnostics.length === 0 && isRunning && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
              <p className="text-sm text-gray-600 mb-2">Executando diagnósticos completos...</p>
              <p className="text-xs text-gray-500">Isso pode levar alguns segundos</p>
            </div>
          )}
        </div>

        {/* Alertas */}
        {overallStatus === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Problemas críticos detectados:</strong> O sistema não consegue conectar ao banco de dados. 
              Verifique sua conexão com a internet e se as credenciais do Supabase estão corretas. 
              Se o problema persistir, entre em contato com o suporte técnico.
            </AlertDescription>
          </Alert>
        )}

        {overallStatus === 'warning' && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Funcionamento parcial:</strong> Alguns componentes apresentam problemas, mas o sistema básico está funcionando. 
              Monitore o desempenho e considere reportar os avisos ao suporte.
            </AlertDescription>
          </Alert>
        )}

        {overallStatus === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Sistema operacional:</strong> Todos os componentes estão funcionando corretamente. 
              O sistema está pronto para uso normal.
            </AlertDescription>
          </Alert>
        )}

        {/* Informações Técnicas */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Informações Técnicas
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Project ID:</span>
              <span className="font-mono text-gray-900 text-xs">{projectId}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Endpoint:</span>
              <span className="font-mono text-gray-900 text-xs">
                https://{projectId}.supabase.co
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">API Key:</span>
              <span className="font-mono text-gray-900 text-xs">
                {publicAnonKey.substring(0, 32)}...
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Timestamp:</span>
              <span className="font-mono text-gray-900 text-xs">
                {new Date().toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}