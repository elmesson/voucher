import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import {
  Settings,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  RefreshCw
} from 'lucide-react';
import ConnectionDiagnostics, { type ConnectionDiagnostic } from '../utils/supabase/connection-diagnostics';
import { notifications } from './NotificationSystem';

interface ConnectionDiagnosticsProps {
  size?: 'sm' | 'default' | 'lg';
  variant?: 'outline' | 'default' | 'destructive' | 'secondary' | 'ghost' | 'link';
  showIcon?: boolean;
  showText?: boolean;
}

export function ConnectionDiagnosticsButton({ 
  size = 'sm', 
  variant = 'outline', 
  showIcon = true, 
  showText = true 
}: ConnectionDiagnosticsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState<ConnectionDiagnostic[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    notifications.info('Diagnóstico', 'Executando testes de conectividade...');
    
    try {
      // Run comprehensive tests
      await ConnectionDiagnostics.runBasicConnectivityTest();
      await ConnectionDiagnostics.testExtraMealsTable();
      
      const results = ConnectionDiagnostics.getDiagnostics();
      const summary = ConnectionDiagnostics.getConnectionSummary();
      
      setDiagnostics(results);
      
      if (summary.isHealthy) {
        notifications.success(
          'Conectividade OK', 
          `Taxa de sucesso: ${summary.successRate}% | Ping médio: ${summary.avgDuration}ms`
        );
      } else {
        notifications.warning(
          'Problemas detectados', 
          `Taxa de sucesso: ${summary.successRate}% | Verificar detalhes`
        );
      }
    } catch (error) {
      notifications.error('Erro no diagnóstico', 'Falha ao executar testes de conectividade');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const formatDuration = (ms: number) => {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  const getConnectionBadge = () => {
    const summary = ConnectionDiagnostics.getConnectionSummary();
    
    if (summary.recentTests === 0) {
      return <Badge variant="outline">Não testado</Badge>;
    }
    
    if (summary.isHealthy) {
      return <Badge className="bg-green-100 text-green-800">Saudável</Badge>;
    }
    
    if (summary.successRate >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-800">Instável</Badge>;
    }
    
    return <Badge className="bg-red-100 text-red-800">Problemático</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={() => setIsOpen(true)}
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          {showIcon && <Settings className="w-4 h-4 mr-2" />}
          {showText && 'Diagnóstico'}
          {getConnectionBadge()}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Diagnóstico de Conectividade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                Resumo da Conectividade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {ConnectionDiagnostics.getConnectionSummary().successRate}%
                  </div>
                  <div className="text-sm text-gray-600">Taxa de Sucesso</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {ConnectionDiagnostics.getConnectionSummary().avgDuration}ms
                  </div>
                  <div className="text-sm text-gray-600">Ping Médio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {ConnectionDiagnostics.getConnectionSummary().recentTests}
                  </div>
                  <div className="text-sm text-gray-600">Testes Recentes</div>
                </div>
                <div className="text-center">
                  <div className="text-lg">
                    {ConnectionDiagnostics.getConnectionSummary().isHealthy ? (
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={runDiagnostic}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 mr-2" />
                  Executar Diagnóstico
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setDiagnostics(ConnectionDiagnostics.getDiagnostics());
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                ConnectionDiagnostics.clearDiagnostics();
                setDiagnostics([]);
                notifications.info('Limpeza', 'Histórico de diagnósticos limpo');
              }}
            >
              Limpar Histórico
            </Button>
          </div>

          {/* Network Status */}
          <Alert>
            <Wifi className="h-4 w-4" />
            <AlertDescription>
              Status da Rede: {navigator.onLine ? (
                <Badge className="bg-green-100 text-green-800 ml-2">Online</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 ml-2">Offline</Badge>
              )}
              {(navigator as any).connection?.effectiveType && (
                <span className="ml-2">
                  Tipo de conexão: {(navigator as any).connection.effectiveType}
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Diagnostic Results */}
          {diagnostics.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Histórico de Testes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {diagnostics.map((diagnostic, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(diagnostic.success)}
                        <div>
                          <div className="font-medium">{diagnostic.test}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(diagnostic.timestamp).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm">
                          {formatDuration(diagnostic.duration)}
                        </div>
                        {diagnostic.error && (
                          <div className="text-xs text-red-600 max-w-48 truncate">
                            {diagnostic.error.message || 'Erro desconhecido'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {diagnostics.length === 0 && !isRunning && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nenhum teste executado ainda. Clique em "Executar Diagnóstico" para começar.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConnectionDiagnosticsButton;