import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Eye, XCircle, Download, RefreshCw } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'error';
}

// Logger class to prevent state updates during render
class FilterLogger {
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private logs: LogEntry[] = [];
  private maxLogs = 50;

  addLog(type: 'info' | 'warning' | 'error', message: string) {
    const logEntry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    
    this.logs = [logEntry, ...this.logs.slice(0, this.maxLogs - 1)];
    
    // Notify listeners asynchronously to prevent render warnings
    setTimeout(() => {
      this.listeners.forEach(listener => listener([...this.logs]));
    }, 0);
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    // Immediately send current logs
    listener([...this.logs]);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }

  getLogs() {
    return [...this.logs];
  }
}

// Singleton logger instance
const filterLogger = new FilterLogger();

export function SafeDebugLogger() {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    // Only subscribe once
    if (isSubscribedRef.current) return;
    isSubscribedRef.current = true;

    // Subscribe to logger
    const unsubscribe = filterLogger.subscribe(setLogs);

    // Intercept console methods ONCE
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const shouldCapture = (message: string) => {
      return (
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
      );
    };

    console.log = (...args: any[]) => {
      originalLog.apply(console, args);
      const message = args.join(' ');
      if (shouldCapture(message)) {
        filterLogger.addLog('info', message);
      }
    };

    console.warn = (...args: any[]) => {
      originalWarn.apply(console, args);
      const message = args.join(' ');
      if (shouldCapture(message)) {
        filterLogger.addLog('warning', message);
      }
    };

    console.error = (...args: any[]) => {
      originalError.apply(console, args);
      const message = args.join(' ');
      if (shouldCapture(message)) {
        filterLogger.addLog('error', message);
      }
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      unsubscribe();
    };
  }, []);

  const exportLogs = useCallback(() => {
    const data = JSON.stringify(filterLogger.getLogs(), null, 2);
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
    filterLogger.clear();
  }, []);

  const getLogColor = useCallback((type: string) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  }, []);

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
                  <p className="text-xs mt-1">Teste os dropdowns para ver os logs</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className={`p-2 rounded text-xs border ${getLogColor(log.type)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono">{log.timestamp}</span>
                      <Badge variant="outline" className="text-xs">
                        {log.type}
                      </Badge>
                    </div>
                    <div className="break-words font-mono text-xs">
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