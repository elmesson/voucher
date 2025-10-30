import { useState, useEffect, useCallback, useRef } from 'react';
import { testSupabaseConnection } from './connection-test';

export function useSupabaseConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const mountedRef = useRef(true);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const performConnectionCheck = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setIsChecking(true);
      console.log('🔄 Verificando conexão com Supabase...');
      
      const connected = await testSupabaseConnection();
      
      if (mountedRef.current) {
        setIsConnected(connected);
        setLastCheck(new Date());
        console.log(connected ? '✅ Conexão estabelecida' : '❌ Sem conexão');
      }
    } catch (error) {
      console.error('❌ Erro na verificação de conexão:', error);
      if (mountedRef.current) {
        setIsConnected(false);
        setLastCheck(new Date());
      }
    } finally {
      if (mountedRef.current) {
        setIsChecking(false);
      }
    }
  }, []);

  // Verificação inicial e configuração do intervalo
  useEffect(() => {
    mountedRef.current = true;
    
    // Verificação inicial
    performConnectionCheck();
    
    // Configurar verificação periódica (a cada 30 segundos)
    checkIntervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        performConnectionCheck();
      }
    }, 30000);
    
    return () => {
      mountedRef.current = false;
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [performConnectionCheck]);

  const manualCheck = useCallback(async () => {
    await performConnectionCheck();
  }, [performConnectionCheck]);

  return {
    isConnected,
    isChecking,
    lastCheck,
    checkConnection: manualCheck
  };
}