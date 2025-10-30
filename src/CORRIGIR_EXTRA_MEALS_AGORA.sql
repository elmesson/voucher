-- ========================================
-- EXECUTAR ESTE SQL IMEDIATAMENTE NO SUPABASE
-- ========================================

-- 1. VERIFICAR SE A TABELA EXISTE E CRIAR SE NECESSÁRIO
CREATE TABLE IF NOT EXISTS extra_meals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    meal_type_id UUID REFERENCES meal_types(id) NOT NULL,
    meal_date DATE NOT NULL,
    meal_time TIME,
    reason TEXT NOT NULL,
    requested_by_name TEXT NOT NULL,
    approved_by UUID REFERENCES admins(id),
    status TEXT DEFAULT 'pending',
    price DECIMAL(10,2),
    notes TEXT,
    external_name TEXT,
    external_document TEXT,
    external_company TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ
);

-- 2. ADICIONAR COLUNAS SE NÃO EXISTIREM
DO $$
BEGIN
    -- Adicionar requested_by_name se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'extra_meals' AND column_name = 'requested_by_name'
    ) THEN
        ALTER TABLE extra_meals ADD COLUMN requested_by_name TEXT;
        RAISE NOTICE 'Coluna requested_by_name adicionada';
    END IF;

    -- Adicionar external_name se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'extra_meals' AND column_name = 'external_name'
    ) THEN
        ALTER TABLE extra_meals ADD COLUMN external_name TEXT;
        RAISE NOTICE 'Coluna external_name adicionada';
    END IF;

    -- Adicionar external_document se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'extra_meals' AND column_name = 'external_document'
    ) THEN
        ALTER TABLE extra_meals ADD COLUMN external_document TEXT;
        RAISE NOTICE 'Coluna external_document adicionada';
    END IF;

    -- Adicionar external_company se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'extra_meals' AND column_name = 'external_company'
    ) THEN
        ALTER TABLE extra_meals ADD COLUMN external_company TEXT;
        RAISE NOTICE 'Coluna external_company adicionada';
    END IF;
END $$;

-- 3. MIGRAR DADOS EXISTENTES SE NECESSÁRIO
UPDATE extra_meals 
SET requested_by_name = COALESCE(requested_by_name, 'Sistema de Migração')
WHERE requested_by_name IS NULL OR requested_by_name = '';

-- 4. TORNAR requested_by_name NÃO NULO
ALTER TABLE extra_meals ALTER COLUMN requested_by_name SET NOT NULL;

-- 5. VERIFICAR RESULTADO
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'extra_meals' 
ORDER BY ordinal_position;

-- Mensagem de sucesso
SELECT 'Migração da tabela extra_meals concluída com sucesso!' as status;