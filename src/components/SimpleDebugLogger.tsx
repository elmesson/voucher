import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Eye, XCircle, Download, RefreshCw } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'error';
}

export function SimpleDebugLogger() {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsRef = useRef<LogEntry[]>([]);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced function to update logs state
  const debouncedUpdateLogs = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      setLogs([...logsRef.current]);
    }, 100); // 100ms debounce
  }, []);

  useEffect(() => {
    // Interceptar console.log para capturar logs dos filtros
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const captureLog = (type: 'info' | 'warning' | 'error', ...args: any[]) => {
      const message = args.join(' ');
      
      // Capturar apenas logs relacionados aos filtros
      if (
        message.includes('[REGULAR]') || 
        message.includes('[EXTRA]') ||
        message.includes('filtro') ||
        message.includes('dropdown') ||
        message.includes('🔄') ||
        message.includes('🔍') ||
        message.includes('🎯') ||
        message.includes('✅') ||
        message.includes('❌') ||
        message.includes('⚠️')
      ) {
        const logEntry: LogEntry = {
          timestamp: new Date().toLocaleTimeString(),
          message,
          type
        };
        
        // Update ref immediately, but debounce state update
        logsRef.current = [logEntry, ...logsRef.current.slice(0, 49)];
        debouncedUpdateLogs();
      }
    };

    console.log = (...args: any[]) => {
      originalLog.apply(console, args);
      // Use setTimeout to avoid setState during render
      setTimeout(() => captureLog('info', ...args), 0);
    };

    console.warn = (...args: any[]) => {
      originalWarn.apply(console, args);
      setTimeout(() => captureLog('warning', ...args), 0);
    };

    console.error = (...args: any[]) => {
      originalError.apply(console, args);
      setTimeout(() => captureLog('error', ...args), 0);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [debouncedUpdateLogs]);

  const exportLogs = useCallback(() => {
    const data = JSON.stringify(logsRef.current, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filter-logs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const clearLogs = useCallback(() => {
    logsRef.current = [];
    setLogs([]);
  }, []);

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible && (
        <Button
          onClick={() => setIsVisible(true)}
          className="rounded-full w-12 h-12 bg-red-600 hover:bg-red-700 text-white shadow-lg"
          title="Debug dos Filtros"
        >
          <Eye className="w-5 h-5" />
        </Button>
      )}

      {isVisible && (
        <Card className="w-96 max-h-96 shadow-xl border-2 border-red-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                🔍 Debug Filtros
                <Badge variant="secondary">{logs.length}</Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportLogs}>
                <Download className="w-3 h-3 mr-1" />
                Exportar
              </Button>
              <Button size="sm" variant="outline" onClick={clearLogs}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            </div>

            {/* Logs Display */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {logs.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-4">
                  Aguardando logs dos filtros...
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`p-2 rounded text-xs ${getLogColor(log.type)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono">{log.timestamp}</span>
                      <Badge variant="outline" className="text-xs">
                        {log.type}
                      </Badge>
                    </div>
                    <div className="break-words">
                      {log.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}