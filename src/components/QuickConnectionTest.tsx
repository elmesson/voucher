import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, XCircle, RefreshCw, Wifi, AlertTriangle } from 'lucide-react';
import { testBasicConnection, debugConnection } from '../utils/supabase/connection-test-final';
import { useConnectionStatus } from '../utils/supabase/hooks-stable';

export function QuickConnectionTest() {
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testCount, setTestCount] = useState(0);
  const { isConnected, isChecking } = useConnectionStatus();

  const runTest = async () => {
    setIsRunning(true);
    try {
      console.log('🧪 Executando teste rápido de conectividade...');
      const result = await testBasicConnection();
      setTestResult(result);
      setTestCount(prev => prev + 1);
      console.log(result ? '✅ Teste passou!' : '❌ Teste falhou!');
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      setTestResult(false);
    } finally {
      setIsRunning(false);
    }
  };

  const runDebug = () => {
    debugConnection();
  };

  useEffect(() => {
    // Executar teste inicial
    runTest();
  }, []);

  const getStatusIcon = () => {
    if (isRunning || isChecking) {
      return <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />;
    }
    if (testResult === true && isConnected) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    if (testResult === false || !isConnected) {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
    return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
  };

  const getStatusText = () => {
    if (isRunning || isChecking) return 'Testando...';
    if (testResult === true && isConnected) return 'Sistema OK';
    if (testResult === false || !isConnected) return 'Problemas';
    return 'Indefinido';
  };

  const getStatusColor = () => {
    if (isRunning || isChecking) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (testResult === true && isConnected) return 'bg-green-50 text-green-700 border-green-200';
    if (testResult === false || !isConnected) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wifi className="w-4 h-4" />
          Status da Conexão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>
          <div className="text-xs text-gray-500">
            Testes: {testCount}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={runTest}
            disabled={isRunning}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isRunning ? 'animate-spin' : ''}`} />
            Testar
          </Button>
          <Button
            onClick={runDebug}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            Debug
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Hook:</span>
            <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'OK' : 'Falha'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Teste:</span>
            <span className={`font-medium ${testResult === true ? 'text-green-600' : testResult === false ? 'text-red-600' : 'text-yellow-600'}`}>
              {testResult === true ? 'OK' : testResult === false ? 'Falha' : 'N/A'}
            </span>
          </div>
        </div>

        {(testResult === false || !isConnected) && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
            <strong>Problema detectado:</strong> Verifique o console para mais detalhes
          </div>
        )}

        {testResult === true && isConnected && (
          <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
            <strong>Sistema operacional:</strong> Conexão estável estabelecida
          </div>
        )}
      </CardContent>
    </Card>
  );
}