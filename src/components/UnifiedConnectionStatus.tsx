import React from 'react';
import { Badge } from './ui/badge';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';
import { useConnectionStatus } from '../utils/supabase/unified-hooks';

export function UnifiedConnectionBadge() {
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
      Desconectado
    </Badge>
  );
}

export function UnifiedConnectionDot() {
  const { isConnected, isChecking } = useConnectionStatus();

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-white/90">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        <span className="text-xs">Verificando...</span>
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
      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
      <span className="text-xs">Offline</span>
    </div>
  );
}