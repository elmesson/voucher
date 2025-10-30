# ⚡ Solução Rápida - 30 Segundos

## ❌ Erro
`Tabela extra_meal_records não existe`

## ✅ Solução (30 segundos)

### Execute este SQL no Supabase:

```sql
CREATE TABLE IF NOT EXISTS extra_meal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_type_id UUID NOT NULL REFERENCES meal_types(id) ON DELETE RESTRICT,
  meal_date DATE NOT NULL,
  meal_time TIME NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'used',
  approved_by UUID REFERENCES managers(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_extra_meal_user ON extra_meal_records(user_id);
CREATE INDEX idx_extra_meal_date ON extra_meal_records(meal_date);
```

### Onde executar:
1. https://supabase.com/dashboard
2. Projeto: `dhgomondxqugynhggqji`
3. SQL Editor → Cole → Run

### Depois:
- Ctrl+Shift+R (recarregar)
- Pronto! ✅

---

**Não quer criar a tabela?** Sistema funciona sem ela, apenas não terá "Refeições Extras".
