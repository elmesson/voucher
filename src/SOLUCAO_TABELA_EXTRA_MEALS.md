# 🔧 Solução: Tabela extra_meal_records não existe

## ❌ Erro Identificado

```
Erro ao carregar refeições extras: {
  "code": "42P01",
  "message": "relation \"public.extra_meal_records\" does not exist"
}
```

## 🎯 Causa

A tabela `extra_meal_records` não foi criada no banco de dados Supabase. Esta tabela é essencial para:
- Módulo "RH Refeições Extras"
- Relatórios de Refeições Extras
- Sistema de aprovação de refeições pelo RH

## ✅ Solução Aplicada

### 1. Correção no Código (✅ Já Aplicada)

O componente `ReportsManagement.tsx` foi atualizado para:
- Detectar quando a tabela não existe (código de erro 42P01)
- Mostrar mensagem informativa ao invés de erro
- Orientar o usuário sobre como resolver

**Resultado**: Sistema não quebra mais, mostra mensagem clara.

### 2. Criar a Tabela no Banco de Dados (⚠️ Você precisa fazer)

Execute o SQL abaixo no Supabase para criar a tabela.

## 🚀 Como Resolver (2 minutos)

### Passo 1: Copie o SQL

Arquivo criado: **`CRIAR_TABELA_EXTRA_MEAL_RECORDS.sql`**

Ou use este SQL direto:

```sql
-- Criar a tabela extra_meal_records
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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_extra_meal_records_user_id 
  ON extra_meal_records(user_id);

CREATE INDEX IF NOT EXISTS idx_extra_meal_records_meal_type_id 
  ON extra_meal_records(meal_type_id);

CREATE INDEX IF NOT EXISTS idx_extra_meal_records_meal_date 
  ON extra_meal_records(meal_date);

CREATE INDEX IF NOT EXISTS idx_extra_meal_records_status 
  ON extra_meal_records(status);

-- Trigger para updated_at
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
```

### Passo 2: Execute no Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: `dhgomondxqugynhggqji`
3. Vá em **SQL Editor** (menu lateral)
4. Cole o SQL acima
5. Clique em **Run** ou pressione `Ctrl+Enter`
6. Aguarde a confirmação de sucesso

### Passo 3: Recarregue o Sistema

1. Volte para o sistema de refeições
2. Pressione **Ctrl+Shift+R** (recarregar hard)
3. Acesse a aba **Relatórios**
4. Clique em **Refeições Extras**

## 🎉 Resultado Esperado

Após executar o SQL:

✅ Aba "Refeições Extras" funcionando  
✅ Sem erro 42P01  
✅ Tabela de dados aparecendo  
✅ Estatísticas calculando  
✅ Exportação PDF/Excel funcionando  
✅ Módulo "RH Refeições Extras" funcionando  

## 📊 Estrutura da Tabela

A tabela `extra_meal_records` armazena:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único do registro |
| `user_id` | UUID | ID do usuário |
| `meal_type_id` | UUID | ID do tipo de refeição |
| `meal_date` | DATE | Data da refeição |
| `meal_time` | TIME | Horário da refeição |
| `price` | DECIMAL | Valor da refeição |
| `status` | VARCHAR | Status (used, pending, cancelled) |
| `approved_by` | UUID | ID do gerente aprovador |
| `notes` | TEXT | Observações |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Última atualização |

## 🔍 Verificar se Funcionou

### No Supabase:
```sql
-- Verificar se a tabela existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'extra_meal_records';

-- Ver estrutura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'extra_meal_records' 
ORDER BY ordinal_position;
```

### No Sistema:
1. Console do navegador não deve mostrar erro 42P01
2. Mensagem de aviso deve sumir
3. Tabela deve aparecer (vazia se não houver dados)

## 🐛 Se Ainda Houver Problemas

### Problema: SQL dá erro ao executar

**Verificar:**
- Tabelas `users`, `meal_types` e `managers` existem?
- Você tem permissões de administrador no Supabase?

**Solução:**
```sql
-- Verificar tabelas existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'meal_types', 'managers');
```

### Problema: Mensagem ainda aparece

1. Limpe o cache: `Ctrl+Shift+R`
2. Faça logout e login
3. Verifique console (F12) para outros erros

### Problema: Não tenho acesso ao Supabase

- Entre em contato com o administrador do projeto
- Solicite permissões de SQL Editor
- Ou peça para alguém com acesso executar o SQL

## 📚 Próximos Passos

Após criar a tabela:

1. ✅ Execute SQL de permissões: `ADICIONAR_PERMISSAO_RELATORIOS.sql`
2. ✅ Teste o módulo "RH Refeições Extras"
3. ✅ Teste os relatórios de refeições extras
4. ✅ Exporte PDF/Excel

## 💡 Dica Importante

Esta tabela é **opcional** se você não usar o módulo de RH Refeições Extras. Se seu sistema usa apenas vouchers normais, você pode:

- Ignorar a aba "Refeições Extras" nos relatórios
- Usar apenas "Refeições Regulares"
- Não precisa criar a tabela

Porém, se você quer o sistema completo, **crie a tabela**.

---

**Status**: ✅ Solução documentada e código corrigido  
**Ação Necessária**: Execute o SQL no Supabase  
**Tempo Estimado**: 2 minutos  
**Dificuldade**: Fácil  
