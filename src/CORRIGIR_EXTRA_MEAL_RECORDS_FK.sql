-- ===================================================================
-- SQL PARA CORRIGIR FOREIGN KEYS DA TABELA EXTRA_MEAL_RECORDS
-- ===================================================================
-- Execute este SQL no Supabase SQL Editor para adicionar as foreign
-- keys que faltam na tabela extra_meal_records
-- ===================================================================

-- Verificar se a tabela existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'extra_meal_records') THEN
    RAISE EXCEPTION 'Tabela extra_meal_records não existe!';
  END IF;
END $$;

-- Verificar se as colunas existem
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'extra_meal_records' 
    AND column_name = 'user_id'
  ) THEN
    RAISE EXCEPTION 'Coluna user_id não existe na tabela extra_meal_records!';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'extra_meal_records' 
    AND column_name = 'meal_type_id'
  ) THEN
    RAISE EXCEPTION 'Coluna meal_type_id não existe na tabela extra_meal_records!';
  END IF;
END $$;

-- Remover constraints antigas se existirem
ALTER TABLE extra_meal_records 
  DROP CONSTRAINT IF EXISTS extra_meal_records_user_id_fkey;

ALTER TABLE extra_meal_records 
  DROP CONSTRAINT IF EXISTS extra_meal_records_meal_type_id_fkey;

-- Adicionar foreign key para users
ALTER TABLE extra_meal_records
  ADD CONSTRAINT extra_meal_records_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Adicionar foreign key para meal_types
ALTER TABLE extra_meal_records
  ADD CONSTRAINT extra_meal_records_meal_type_id_fkey
  FOREIGN KEY (meal_type_id)
  REFERENCES meal_types(id)
  ON DELETE RESTRICT;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_extra_meal_records_user_id 
  ON extra_meal_records(user_id);

CREATE INDEX IF NOT EXISTS idx_extra_meal_records_meal_type_id 
  ON extra_meal_records(meal_type_id);

CREATE INDEX IF NOT EXISTS idx_extra_meal_records_meal_date 
  ON extra_meal_records(meal_date);

CREATE INDEX IF NOT EXISTS idx_extra_meal_records_status 
  ON extra_meal_records(status);

-- Verificar o resultado
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'extra_meal_records'
ORDER BY tc.constraint_name;

-- Mostrar índices criados
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'extra_meal_records'
  AND schemaname = 'public'
ORDER BY indexname;

-- ===================================================================
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Selecione seu projeto (dhgomondxqugynhggqji)
-- 3. Vá em "SQL Editor" no menu lateral
-- 4. Cole este código SQL completo
-- 5. Clique em "Run" ou pressione Ctrl+Enter
-- 6. Verifique se as foreign keys foram criadas corretamente
-- 7. Teste os relatórios novamente
-- ===================================================================
