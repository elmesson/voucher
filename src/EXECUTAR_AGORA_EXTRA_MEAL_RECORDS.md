# 🚀 EXECUTAR AGORA - Criar Tabela extra_meal_records

## ⚠️ ERRO ATUAL
```
⚠️ Tabela extra_meal_records não existe. Sistema de refeições extras não configurado.
```

## ✅ SOLUÇÃO (2 minutos)

### Passo 1: Abrir Supabase
1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: **dhgomondxqugynhggqji**

### Passo 2: Abrir SQL Editor
1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique em **+ New Query** (ou pressione Ctrl+N)

### Passo 3: Colar o SQL
Cole o código SQL completo abaixo:

```sql
-- ===================================================================
-- CRIAR TABELA EXTRA_MEAL_RECORDS
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

-- ===================================================================
-- VERIFICAR SE FOI CRIADO COM SUCESSO
-- ===================================================================

SELECT 'Tabela extra_meal_records criada com sucesso!' as resultado;
```

### Passo 4: Executar
1. Clique em **Run** (ou pressione Ctrl+Enter)
2. Aguarde alguns segundos
3. Você deve ver a mensagem: **"Tabela extra_meal_records criada com sucesso!"**

### Passo 5: Verificar
Execute este SQL para confirmar:

```sql
-- Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'extra_meal_records'
ORDER BY ordinal_position;
```

Você deve ver todas as colunas listadas:
- id
- user_id
- meal_type_id
- meal_date
- meal_time
- price
- status
- approved_by
- notes
- created_at
- updated_at

### Passo 6: Recarregar o Sistema
1. Volte ao sistema de Gestão de Refeições
2. Pressione **F5** para recarregar a página
3. O erro deve desaparecer! ✅

## 📊 O QUE ESSA TABELA FAZ?

A tabela `extra_meal_records` armazena registros de **refeições extras** que são:
- Aprovadas manualmente pelo RH
- Fora do sistema normal de vouchers
- Para funcionários ou visitantes
- Com controle de aprovação e auditoria

## 🔍 RELACIONAMENTOS

Esta tabela se relaciona com:
- **users**: Funcionário que recebeu a refeição
- **meal_types**: Tipo de refeição (café, almoço, jantar, etc)
- **managers**: Gerente que aprovou a refeição extra

## ✅ PRONTO!

Após executar o SQL:
- ✅ Tabela `extra_meal_records` criada
- ✅ Índices configurados para performance
- ✅ Triggers automáticos funcionando
- ✅ Sistema de Refeições Extras funcionando
- ✅ Relatórios de Refeições Extras funcionando

## ❓ PROBLEMAS?

Se algo der errado:
1. Verifique se você está no projeto correto: **dhgomondxqugynhggqji**
2. Verifique se as tabelas `users`, `meal_types` e `managers` existem
3. Entre em contato e informe o erro exato que apareceu