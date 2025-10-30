import { supabaseClientWithRetry } from './client-stable';
import { runQuickDiagnostic } from './simple-diagnostic';
import { notifications } from '../../components/NotificationSystem';

class ConnectionMonitor {
  private static instance: ConnectionMonitor;
  private isMonitoring = false;
  private consecutiveFailures = 0;
  private lastSuccessTime: Date | null = null;
  private monitorInterval: NodeJS.Timeout | null = null;

  static getInstance(): ConnectionMonitor {
    if (!ConnectionMonitor.instance) {
      ConnectionMonitor.instance = new ConnectionMonitor();
    }
    return ConnectionMonitor.instance;
  }

  startMonitoring() {
    if (this.isMonitoring) {
      console.log('🔍 Monitor de conexão já está ativo');
      return;
    }

    console.log('🔍 Iniciando monitoramento de conexão...');
    this.isMonitoring = true;
    this.consecutiveFailures = 0;

    // Teste inicial
    this.checkConnection();

    // Verificar a cada 30 segundos
    this.monitorInterval = setInterval(() => {
      this.checkConnection();
    }, 30000);
  }

  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
    console.log('🔍 Monitor de conexão pausado');
  }

  private async checkConnection() {
    try {
      // Usar diagnóstico simplificado ao invés do método complexo
      const isConnected = await runQuickDiagnostic();
      
      if (isConnected) {
        // Reset contador de falhas em caso de sucesso
        if (this.consecutiveFailures > 0) {
          console.log(`✅ Conexão restaurada após ${this.consecutiveFailures} falhas`);
          notifications.success('Conexão restaurada', 'Sistema voltou ao normal');
          this.consecutiveFailures = 0;
        }
        
        this.lastSuccessTime = new Date();
        console.log('🔍 Monitor: Conexão OK');
      } else {
        this.consecutiveFailures++;
        console.warn(`⚠️ Monitor: Falha de conexão ${this.consecutiveFailures}/3`);
        
        // Notificar após 3 falhas consecutivas
        if (this.consecutiveFailures === 3) {
          notifications.warning(
            'Problemas de conexão', 
            'Sistema com instabilidade. Tentativas de reconexão em andamento.'
          );
        }
        
        // Notificar falha crítica após 5 tentativas
        if (this.consecutiveFailures >= 5) {
          notifications.error(
            'Conexão perdida', 
            'Sistema offline. Verifique sua conexão com a internet.'
          );
        }
      }
    } catch (error) {
      this.consecutiveFailures++;
      console.error('❌ Erro no monitor de conexão:', error);
    }
  }

  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      consecutiveFailures: this.consecutiveFailures,
      lastSuccessTime: this.lastSuccessTime,
      isHealthy: this.consecutiveFailures < 3
    };
  }

  // Método para forçar uma verificação
  async forceCheck(): Promise<boolean> {
    try {
      return await runQuickDiagnostic();
    } catch (error) {
      console.error('❌ Erro na verificação forçada:', error);
      return false;
    }
  }
}

// Singleton instance
export const connectionMonitor = ConnectionMonitor.getInstance();

// Auto-iniciar o monitoramento
if (typeof window !== 'undefined') {
  // Aguardar um pouco para o sistema estabilizar antes de iniciar
  setTimeout(() => {
    connectionMonitor.startMonitoring();
  }, 2000);

  // Parar monitor ao fechar a página
  window.addEventListener('beforeunload', () => {
    connectionMonitor.stopMonitoring();
  });

  // Tornar disponível para debug
  (window as any).connectionMonitor = connectionMonitor;
}