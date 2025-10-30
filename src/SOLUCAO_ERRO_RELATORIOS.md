# 🔧 Solução para Erro nos Relatórios

## ❌ Problema Identificado

```
Erro ao carregar refeições extras: {
  "code": "PGRST200",
  "details": "Searched for a foreign key relationship between 'extra_meal_records' and 'users' in the schema 'public', but no matches were found.",
  "hint": "Perhaps you meant 'meal_records' instead of 'extra_meal_records'.",
  "message": "Could not find a relationship between 'extra_meal_records' and 'users' in the schema cache"
}
```

## 🎯 Causa

A tabela `extra_meal_records` não possui foreign keys configuradas corretamente para as tabelas `users` e `meal_types`, impedindo que o Supabase faça joins automáticos.

## ✅ Solução Implementada

### 1. Correção no Código (Já Aplicada)

Modifiquei o componente `/components/ReportsManagement.tsx` para buscar os dados em etapas separadas ao invés de usar joins:

**Antes (com join - não funcionava):**
```typescript
const { data, error } = await supabase
  .from('extra_meal_records')
  .select(`
    *,
    user:users(id, full_name, company:companies(name), department, position),
    meal_type:meal_types(name, price)
  `)
```

**Depois (sem join - funciona):**
```typescript
// 1. Buscar registros de refeições extras
const { data: extraMealsData } = await supabase
  .from('extra_meal_records')
  .select('*')

// 2. Buscar usuários separadamente
const { data: usersData } = await supabase
  .from('users')
  .select('id, full_name, voucher_code, company_id, department, position, company:companies(id, name)')
  .in('id', userIds)

// 3. Buscar tipos de refeição separadamente
const { data: mealTypesData } = await supabase
  .from('meal_types')
  .select('id, name, price')
  .in('id', mealTypeIds)

// 4. Combinar os dados
const combinedData = extraMealsData.map(meal => ({
  ...meal,
  user: usersData?.find(u => u.id === meal.user_id),
  meal_type: mealTypesData?.find(mt => mt.id === meal.meal_type_id)
}))
```

### 2. Correção no Banco de Dados (Recomendada)

Execute o arquivo `/CORRIGIR_EXTRA_MEAL_RECORDS_FK.sql` no Supabase para adicionar as foreign keys:

**O que o SQL faz:**
1. Verifica se a tabela e colunas existem
2. Remove constraints antigas (se existirem)
3. Adiciona foreign key para `users(id)`
4. Adiciona foreign key para `meal_types(id)`
5. Cria índices para melhorar performance
6. Mostra as foreign keys criadas

**Benefícios:**
- ✅ Permite usar joins no futuro
- ✅ Melhora a integridade dos dados
- ✅ Melhora a performance das queries
- ✅ Permite usar `.select()` com relações do Supabase

## 🚀 Como Aplicar a Solução

### Opção 1: Apenas Correção no Código (Já Feita)

A correção já foi aplicada no componente. O sistema já deve estar funcionando.

**Teste:**
1. Faça login como gerente
2. Acesse a aba "Relatórios"
3. Clique em "Refeições Extras"
4. Verifique se os dados aparecem

### Opção 2: Correção Completa (Código + Banco)

Para uma solução definitiva, execute também o SQL:

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: `dhgomondxqugynhggqji`
3. Vá em **SQL Editor**
4. Cole o conteúdo de `/CORRIGIR_EXTRA_MEAL_RECORDS_FK.sql`
5. Clique em **Run**
6. Verifique se as foreign keys foram criadas

## 📊 Verificação

### Verificar se está funcionando:

1. **Console do navegador (F12):**
   - Não deve mais aparecer o erro PGRST200
   - Deve mostrar: "Carregando refeições extras..."
   - Deve mostrar os dados carregados

2. **Interface:**
   - Tabela de refeições extras deve aparecer
   - Dados do usuário devem aparecer
   - Tipo de refeição deve aparecer
   - Empresa deve aparecer

3. **Estatísticas:**
   - Total de refeições
   - Receita total
   - Preço médio
   - Usuários únicos

## 🐛 Troubleshooting

### Problema: Ainda aparece erro PGRST200

**Solução:**
1. Limpe o cache do navegador (Ctrl+Shift+R)
2. Faça logout e login novamente
3. Verifique se executou o SQL corretamente

### Problema: Dados não aparecem

**Verifique:**
1. Se existem registros na tabela `extra_meal_records`
2. Se o filtro de data está correto
3. Se o gerente tem permissão de "relatorios"

**Teste com SQL direto:**
```sql
-- Ver se existem registros
SELECT COUNT(*) FROM extra_meal_records;

-- Ver registros com detalhes
SELECT 
  emr.*,
  u.full_name,
  mt.name as meal_type_name
FROM extra_meal_records emr
LEFT JOIN users u ON u.id = emr.user_id
LEFT JOIN meal_types mt ON mt.id = emr.meal_type_id
ORDER BY emr.meal_date DESC
LIMIT 10;
```

### Problema: Performance lenta

**Solução:**
1. Execute o SQL de foreign keys (melhora performance)
2. Os índices criados pelo SQL vão acelerar as buscas
3. Ajuste o período de filtro (use menos dias)

## 📝 Resumo

| Item | Status | Ação |
|------|--------|------|
| **Código Corrigido** | ✅ Feito | Componente já atualizado |
| **SQL de FK** | ⚠️ Opcional | Recomendado executar |
| **Teste** | 🔄 Pendente | Teste os relatórios |

## 🎉 Resultado Esperado

Após a correção:
- ✅ Relatórios de Refeições Extras funcionando
- ✅ Dados de usuários aparecendo
- ✅ Dados de tipos de refeição aparecendo
- ✅ Filtros funcionando
- ✅ Exportação PDF funcionando
- ✅ Exportação Excel funcionando
- ✅ Estatísticas calculadas corretamente

---

**Status**: ✅ Solução implementada no código
**Recomendação**: Execute o SQL para melhorar performance
**Próximo passo**: Teste os relatórios
