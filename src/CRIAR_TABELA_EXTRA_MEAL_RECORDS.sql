-- ===================================================================
-- SQL PARA CRIAR A TABELA EXTRA_MEAL_RECORDS
-- ===================================================================
-- Execute este SQL no Supabase SQL Editor para criar a tabela de
-- refeições extras (RH Refeições Extras)
-- ===================================================================

-- Criar a tabela extra_meal_records se não existir
CREATE TABLE IF NOT EXISTS extra_meal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  meal_type_id UUID NOT NULL,
  meal_date DATE NOT NULL,
  meal_time TIME NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'used',
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT extra_meal_records_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE,
  
  CONSTRAINT extra_meal_records_meal_type_id_fkey 
    FOREIGN KEY (meal_type_id) 
    REFERENCES meal_types(id) 
    ON DELETE RESTRICT,
  
  CONSTRAINT extra_meal_records_approved_by_fkey 
    FOREIGN KEY (approved_by) 
    REFERENCES managers(id) 
    ON DELETE SET NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_extra_meal_records_user_id 
  ON extra_meal_records(user_id);

CREATE INDEX IF NOT EXISTS idx_extra_meal_records_meal_type_id 
  ON extra_meal_records(meal_type_id);

CREATE INDEX IF NOT EXISTS idx_extra_meal_records_meal_date 
  ON extra_meal_records(meal_date);

CREATE INDEX IF NOT EXISTS idx_extra_meal_records_status 
  ON extra_meal_records(status);

CREATE INDEX IF NOT EXISTS idx_extra_meal_records_approved_by 
  ON extra_meal_records(approved_by);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_extra_meal_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_extra_meal_records_updated_at ON extra_meal_records;

CREATE TRIGGER trigger_extra_meal_records_updated_at
  BEFORE UPDATE ON extra_meal_records
  FOR EACH ROW
  EXECUTE FUNCTION update_extra_meal_records_updated_at();

-- Adicionar comentários na tabela
COMMENT ON TABLE extra_meal_records IS 'Registros de refeições extras aprovadas pelo RH';
COMMENT ON COLUMN extra_meal_records.user_id IS 'ID do usuário que recebeu a refeição extra';
COMMENT ON COLUMN extra_meal_records.meal_type_id IS 'ID do tipo de refeição';
COMMENT ON COLUMN extra_meal_records.meal_date IS 'Data da refeição extra';
COMMENT ON COLUMN extra_meal_records.meal_time IS 'Horário da refeição extra';
COMMENT ON COLUMN extra_meal_records.price IS 'Preço da refeição extra';
COMMENT ON COLUMN extra_meal_records.status IS 'Status do registro (used, pending, cancelled)';
COMMENT ON COLUMN extra_meal_records.approved_by IS 'ID do gerente que aprovou a refeição extra';
COMMENT ON COLUMN extra_meal_records.notes IS 'Observações sobre a refeição extra';

-- Verificar se a tabela foi criada
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'extra_meal_records'
ORDER BY ordinal_position;

-- Verificar foreign keys
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

-- Verificar índices
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
-- 6. Verifique se a tabela foi criada corretamente
-- 7. Teste os relatórios novamente
-- ===================================================================

-- ===================================================================
-- NOTA IMPORTANTE:
-- Esta tabela é usada pelo módulo "RH Refeições Extras" para registrar
-- refeições extras aprovadas pelo RH fora do sistema normal de vouchers.
-- Sem esta tabela, o módulo de RH Refeições Extras e os relatórios de
-- refeições extras não funcionarão.
-- ===================================================================
