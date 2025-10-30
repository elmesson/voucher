import React from 'react';
import { Badge } from './ui/badge';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2 
} from 'lucide-react';
import { useConnectionStatus } from '../utils/supabase/connection-manager-final';

export function ConnectionStatusFinalFixed() {
  const { isConnected, consecutiveFailures, lastError } = useConnectionStatus();

  if (consecutiveFailures > 0 && !isConnected) {
    return (
      <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 text-xs">
        <WifiOff className="w-3 h-3 mr-1" />
        Desconectado
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
    <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 text-xs">
      <AlertTriangle className="w-3 h-3 mr-1" />
      Verificando...
    </Badge>
  );
}

export function ConnectionDotFixed() {
  const { isConnected, consecutiveFailures } = useConnectionStatus();

  if (consecutiveFailures > 0 && !isConnected) {
    return (
      <div className="flex items-center gap-2 text-white/90">
        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
        <span className="text-xs">Offline</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-white/90">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <span className="text-xs">Online</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-white/90">
      <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
      <span className="text-xs">Conectando...</span>
    </div>
  );
}