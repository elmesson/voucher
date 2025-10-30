import React from 'react';
import { toast } from 'sonner@2.0.3';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export const notifications = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      icon: <CheckCircle className="w-4 h-4" />,
      duration: 4000,
    });
  },
  
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      icon: <XCircle className="w-4 h-4" />,
      duration: 5000,
    });
  },
  
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      icon: <AlertCircle className="w-4 h-4" />,
      duration: 4000,
    });
  },
  
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      icon: <Info className="w-4 h-4" />,
      duration: 3000,
    });
  }
};

// Exemplos de uso:
// notifications.success('Usuário cadastrado com sucesso!', 'O usuário foi adicionado ao sistema.');
// notifications.error('Erro ao salvar dados', 'Verifique os campos obrigatórios.');
// notifications.warning('Atenção', 'Esta ação não pode ser desfeita.');
// notifications.info('Dica', 'Você pode usar filtros para encontrar informações mais rapidamente.');