import { supabase } from './unified-client';
import { projectId, publicAnonKey } from './info';

export interface ConnectionDiagnostic {
  timestamp: string;
  test: string;
  success: boolean;
  duration: number;
  error?: any;
  details?: any;
}

export class ConnectionDiagnostics {
  private static diagnostics: ConnectionDiagnostic[] = [];
  private static maxDiagnostics = 10;

  static addDiagnostic(diagnostic: Omit<ConnectionDiagnostic, 'timestamp'>) {
    const fullDiagnostic: ConnectionDiagnostic = {
      ...diagnostic,
      timestamp: new Date().toISOString()
    };

    this.diagnostics.unshift(fullDiagnostic);
    
    // Keep only the latest diagnostics
    if (this.diagnostics.length > this.maxDiagnostics) {
      this.diagnostics = this.diagnostics.slice(0, this.maxDiagnostics);
    }

    // Log to console for debugging
    const status = diagnostic.success ? '✅' : '❌';
    console.log(`${status} [${diagnostic.test}] ${diagnostic.duration}ms`, diagnostic.error || '');
  }

  static getDiagnostics(): ConnectionDiagnostic[] {
    return [...this.diagnostics];
  }

  static async runBasicConnectivityTest(): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // Test 1: Basic network connectivity
      const networkTest = await this.testNetworkConnectivity();
      
      // Test 2: Supabase URL accessibility
      const urlTest = await this.testSupabaseUrl();
      
      // Test 3: Simple query test
      const queryTest = await this.testSimpleQuery();
      
      return networkTest && urlTest && queryTest;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addDiagnostic({
        test: 'Basic Connectivity Test',
        success: false,
        duration,
        error: error
      });
      return false;
    }
  }

  private static async testNetworkConnectivity(): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // Test if we can reach a reliable external service
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const duration = Date.now() - startTime;
      const success = response.ok;
      
      this.addDiagnostic({
        test: 'Network Connectivity',
        success,
        duration,
        details: {
          status: response.status,
          online: navigator.onLine
        }
      });
      
      return success;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addDiagnostic({
        test: 'Network Connectivity',
        success: false,
        duration,
        error,
        details: {
          online: navigator.onLine,
          connection: (navigator as any).connection?.effectiveType || 'unknown'
        }
      });
      
      return false;
    }
  }

  private static async testSupabaseUrl(): Promise<boolean> {
    const startTime = Date.now();
    const supabaseUrl = `https://${projectId}.supabase.co`;
    
    try {
      const response = await fetch(`${supabaseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      const duration = Date.now() - startTime;
      const success = response.status === 200;
      
      this.addDiagnostic({
        test: 'Supabase URL Access',
        success,
        duration,
        details: {
          url: supabaseUrl,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        }
      });
      
      return success;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addDiagnostic({
        test: 'Supabase URL Access',
        success: false,
        duration,
        error,
        details: {
          url: supabaseUrl,
          projectId: projectId || 'MISSING',
          keyPresent: !!publicAnonKey
        }
      });
      
      return false;
    }
  }

  private static async testSimpleQuery(): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id')
        .limit(1);
      
      const duration = Date.now() - startTime;
      const success = !error;
      
      this.addDiagnostic({
        test: 'Simple Query Test',
        success,
        duration,
        error: error || undefined,
        details: {
          table: 'companies',
          recordCount: data?.length || 0
        }
      });
      
      return success;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addDiagnostic({
        test: 'Simple Query Test',
        success: false,
        duration,
        error,
        details: {
          table: 'companies'
        }
      });
      
      return false;
    }
  }

  static async testExtraMealsTable(): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('extra_meals')
        .select('id, requested_by_name')
        .limit(1);
      
      const duration = Date.now() - startTime;
      const success = !error;
      
      this.addDiagnostic({
        test: 'Extra Meals Table Test',
        success,
        duration,
        error: error || undefined,
        details: {
          table: 'extra_meals',
          recordCount: data?.length || 0,
          errorCode: error?.code
        }
      });
      
      return success;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addDiagnostic({
        test: 'Extra Meals Table Test',
        success: false,
        duration,
        error,
        details: {
          table: 'extra_meals'
        }
      });
      
      return false;
    }
  }

  static getConnectionSummary() {
    const recent = this.diagnostics.slice(0, 5); // Last 5 tests
    const successRate = recent.length > 0 
      ? (recent.filter(d => d.success).length / recent.length) * 100 
      : 0;
    
    const avgDuration = recent.length > 0
      ? recent.reduce((sum, d) => sum + d.duration, 0) / recent.length
      : 0;

    return {
      successRate: Math.round(successRate),
      avgDuration: Math.round(avgDuration),
      lastTest: recent[0]?.timestamp || null,
      isHealthy: successRate >= 80 && avgDuration < 5000,
      recentTests: recent.length
    };
  }

  static clearDiagnostics() {
    this.diagnostics = [];
    console.log('🧹 Diagnósticos de conexão limpos');
  }
}

// Auto-run basic diagnostic on module load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    ConnectionDiagnostics.runBasicConnectivityTest();
  }, 2000); // Wait 2 seconds after load
}

export default ConnectionDiagnostics;