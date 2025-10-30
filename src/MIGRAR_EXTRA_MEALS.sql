-- ========================================
-- MIGRAÇÃO PARA CORRIGIR TABELA EXTRA_MEALS
-- Execute este SQL no Supabase SQL Editor
-- ========================================

-- 1. Verificar se a tabela existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'extra_meals') THEN
        RAISE NOTICE 'Tabela extra_meals encontrada. Iniciando migração...';
        
        -- 2. Adicionar nova coluna requested_by_name se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'extra_meals' AND column_name = 'requested_by_name') THEN
            ALTER TABLE extra_meals ADD COLUMN requested_by_name TEXT;
            RAISE NOTICE 'Coluna requested_by_name adicionada.';
        END IF;
        
        -- 3. Adicionar colunas para visitantes externos se não existirem
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'extra_meals' AND column_name = 'external_name') THEN
            ALTER TABLE extra_meals ADD COLUMN external_name TEXT;
            RAISE NOTICE 'Coluna external_name adicionada.';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'extra_meals' AND column_name = 'external_document') THEN
            ALTER TABLE extra_meals ADD COLUMN external_document TEXT;
            RAISE NOTICE 'Coluna external_document adicionada.';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'extra_meals' AND column_name = 'external_company') THEN
            ALTER TABLE extra_meals ADD COLUMN external_company TEXT;
            RAISE NOTICE 'Coluna external_company adicionada.';
        END IF;
        
        -- 4. Migrar dados existentes do campo requested_by (se for UUID) para requested_by_name
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'extra_meals' AND column_name = 'requested_by') THEN
            -- Verificar se requested_by é UUID ou text
            UPDATE extra_meals 
            SET requested_by_name = COALESCE(
                (SELECT full_name FROM admins WHERE id = extra_meals.requested_by::uuid),
                requested_by::text,
                'Solicitante não identificado'
            )
            WHERE requested_by_name IS NULL;
            
            RAISE NOTICE 'Dados migrados para requested_by_name.';
        END IF;
        
        -- 5. Tornar requested_by_name obrigatório para novos registros
        ALTER TABLE extra_meals ALTER COLUMN requested_by_name SET NOT NULL;
        
        -- 6. Atualizar registros vazios (se houver)
        UPDATE extra_meals 
        SET requested_by_name = 'Sistema Migração'
        WHERE requested_by_name IS NULL OR requested_by_name = '';
        
        RAISE NOTICE 'Migração da tabela extra_meals concluída com sucesso!';
        
    ELSE
        RAISE NOTICE 'Tabela extra_meals não encontrada. Criando tabela completa...';
        
        -- Criar tabela completa se não existir
        CREATE TABLE extra_meals (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id),
            meal_type_id UUID REFERENCES meal_types(id),
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
        
        RAISE NOTICE 'Tabela extra_meals criada com sucesso!';
    END IF;
END $$;

-- ========================================
-- VERIFICAR RESULTADO DA MIGRAÇÃO
-- ========================================

-- Mostrar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'extra_meals' 
ORDER BY ordinal_position;

-- Contar registros
SELECT COUNT(*) as total_registros FROM extra_meals;

-- Mostrar alguns registros de exemplo (se existirem)
SELECT 
    id,
    COALESCE(external_name, (SELECT full_name FROM users WHERE id = extra_meals.user_id)) as pessoa,
    meal_date,
    reason,
    requested_by_name,
    status,
    created_at
FROM extra_meals 
ORDER BY created_at DESC 
LIMIT 5;