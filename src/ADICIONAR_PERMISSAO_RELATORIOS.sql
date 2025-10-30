-- ===================================================================
-- SQL PARA ADICIONAR PERMISSÃO DE RELATÓRIOS AOS GERENTES
-- ===================================================================
-- Execute este SQL no Supabase SQL Editor para adicionar a permissão
-- de "relatorios" aos gerentes existentes
-- ===================================================================

-- Atualizar todos os gerentes ativos para incluir permissão de relatórios
UPDATE managers
SET permissions = CASE
  -- Se já tem permissões, adicionar 'relatorios' se não existir
  WHEN permissions IS NOT NULL AND jsonb_typeof(permissions) = 'array' THEN
    CASE
      WHEN permissions @> '"relatorios"'::jsonb THEN permissions
      ELSE permissions || '"relatorios"'::jsonb
    END
  -- Se permissions é null ou inválido, criar array com todas as permissões
  ELSE '["usuarios", "empresas", "tipos-refeicao", "relatorios", "configuracoes", "gerentes", "turnos", "rh-extras"]'::jsonb
END
WHERE is_active = true;

-- Verificar o resultado
SELECT 
  id,
  full_name,
  email,
  permissions,
  is_active
FROM managers
WHERE is_active = true
ORDER BY full_name;

-- ===================================================================
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Selecione seu projeto (dhgomondxqugynhggqji)
-- 3. Vá em "SQL Editor" no menu lateral
-- 4. Cole este código SQL completo
-- 5. Clique em "Run" ou pressione Ctrl+Enter
-- 6. Verifique se os gerentes foram atualizados corretamente
-- ===================================================================
