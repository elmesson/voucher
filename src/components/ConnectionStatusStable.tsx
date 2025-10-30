import React from 'react';
import { Badge } from './ui/badge';
import { Wifi, WifiOff, Loader2, AlertTriangle } from 'lucide-react';
import { useConnectionStatus } from '../utils/supabase/hooks-stable';

export function ConnectionStatusBadge() {
  const { isConnected, isChecking } = useConnectionStatus();

  if (isChecking) {
    return (
      <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 text-xs">
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Verificando...
      </Badge>
    );
  }

  if (isConnected) {
    return (
      <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 text-xs">
        <Wifi className="w-3 h-3 mr-1" />
        Online
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 text-xs">
      <WifiOff className="w-3 h-3 mr-1" />
      Offline
    </Badge>
  );
}

export function ConnectionStatusIndicator() {
  const { isConnected, isChecking, checkConnection } = useConnectionStatus();

  const getStatusColor = () => {
    if (isChecking) return 'bg-blue-500';
    if (isConnected) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (isChecking) return 'Verificando...';
    if (isConnected) return 'Sistema online';
    return 'Sistema offline - clique para tentar novamente';
  };

  const handleClick = () => {
    if (!isConnected && !isChecking) {
      checkConnection();
    }
  };

  return (
    <div 
      className={`flex items-center gap-2 ${!isConnected && !isChecking ? 'cursor-pointer hover:bg-gray-50 p-2 rounded' : 'p-2'}`}
      onClick={handleClick}
    >
      <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isChecking ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-gray-600">{getStatusText()}</span>
      {!isConnected && !isChecking && (
        <AlertTriangle className="w-3 h-3 text-yellow-600" />
      )}
    </div>
  );
}

export function ConnectionStatusFull() {
  const { isConnected, isChecking, checkConnection } = useConnectionStatus();

  const getStatusInfo = () => {
    if (isChecking) {
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        text: 'Verificando conexão...',
        bgClass: 'bg-blue-50 border-blue-200',
        textClass: 'text-blue-700'
      };
    }

    if (isConnected) {
      return {
        icon: <Wifi className="w-4 h-4" />,
        text: 'Sistema conectado e funcionando',
        bgClass: 'bg-green-50 border-green-200',
        textClass: 'text-green-700'
      };
    }

    return {
      icon: <WifiOff className="w-4 h-4" />,
      text: 'Sistema desconectado - problemas de rede',
      bgClass: 'bg-red-50 border-red-200',
      textClass: 'text-red-700'
    };
  };

  const status = getStatusInfo();

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${status.bgClass}`}>
      <div className={`flex items-center gap-2 ${status.textClass}`}>
        {status.icon}
        <span className="text-sm font-medium">{status.text}</span>
      </div>
      {!isConnected && !isChecking && (
        <button
          onClick={checkConnection}
          className={`text-xs px-2 py-1 rounded border ${status.textClass} hover:bg-white/50 transition-colors`}
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}