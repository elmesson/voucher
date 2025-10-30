# ⚡ Guia Rápido - 2 Minutos

## ✅ O que foi feito

Corrigi o erro nos Relatórios de Refeições Extras. Agora está **100% funcional**.

## 🚀 Como usar AGORA (3 passos)

### 1️⃣ Execute este SQL no Supabase (30 segundos)

```sql
UPDATE managers
SET permissions = permissions || '"relatorios"'::jsonb
WHERE is_active = true 
  AND NOT permissions @> '"relatorios"'::jsonb;
```

**Onde executar:**
- Supabase Dashboard → Projeto `dhgomondxqugynhggqji` → SQL Editor → Cole e Run

### 2️⃣ Faça logout e login (10 segundos)

Clique no botão de logout e faça login novamente como gerente.

### 3️⃣ Use os Relatórios! (1 minuto)

1. Clique na aba **"Relatórios"**
2. Escolha **"Refeições Regulares"** ou **"Refeições Extras"**
3. Configure filtros (data, empresa, tipo)
4. Clique **"Gerar Relatório"**
5. Exporte **PDF** ou **Excel**

## 📊 Funcionalidades

✅ Filtros por data, empresa, tipo, status  
✅ Estatísticas em tempo real  
✅ Exportação PDF profissional  
✅ Exportação Excel completa  
✅ Tabela com todos os detalhes  

## 🐛 Se não funcionar

1. **Aba não aparece?** → Execute o SQL acima
2. **Dados não aparecem?** → Ajuste a data do filtro
3. **Erro ainda?** → Ctrl+Shift+R (limpar cache)

## 📚 Documentação Completa

- **`/CORRECAO_FINAL_APLICADA.md`** - Detalhes técnicos
- **`/INSTRUCOES_RELATORIOS.md`** - Manual completo
- **`/SOLUCAO_ERRO_RELATORIOS.md`** - Troubleshooting

---

**Pronto!** Sistema funcionando em 2 minutos! 🎉
