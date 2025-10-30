-- ========================================
-- SCRIPT PARA ADICIONAR LOGIN DE GERENTES
-- ========================================
-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- Projeto: dhgomondxqugynhggqji

-- 1. Adicionar campos username e password na tabela managers
ALTER TABLE managers 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password TEXT;

-- 2. Criar índice para melhorar performance nas consultas de login
CREATE INDEX IF NOT EXISTS idx_managers_username ON managers(username);

-- 3. Adicionar comentários explicativos
COMMENT ON COLUMN managers.username IS 'Nome de usuário para login no sistema';
COMMENT ON COLUMN managers.password IS 'Senha para autenticação (armazenada em texto plano para simplicidade)';

-- 4. Verificar se os campos foram adicionados corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'managers' 
AND column_name IN ('username', 'password')
ORDER BY column_name;

-- ========================================
-- RESULTADO ESPERADO:
-- column_name | data_type | is_nullable | column_default
-- password    | text      | YES         | 
-- username    | text      | YES         | 
-- ========================================

-- PRÓXIMOS PASSOS:
-- 1. Após executar este script, refresh a página do sistema
-- 2. Os campos de login aparecerão nos formulários de gerentes
-- 3. Configure username e password para gerentes existentes
-- 4. Teste o login no modal de gerentes

-- EXEMPLO: Configurar login para um gerente específico
-- UPDATE managers 
-- SET username = 'gerente.admin', password = '1234' 
-- WHERE email = 'gerente@empresa.com.br';