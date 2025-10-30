# 📝 Como Executar o SQL no Supabase

## 🚀 Passos Rápidos:

### 1. Acesse o Supabase
- Vá para: https://supabase.com/dashboard
- Entre no seu projeto

### 2. Abra o SQL Editor
- Clique em **"SQL Editor"** no menu lateral
- Clique em **"New Query"** 

### 3. Execute o Script
- Copie TODO o conteúdo do arquivo `/EXECUTAR_NO_SUPABASE.sql`
- Cole no editor
- Clique em **"Run"** (botão ▶️)

### 4. Verifique as Tabelas
- Vá em **"Table Editor"**
- Deve mostrar 8 tabelas criadas:
  - `admins`
  - `companies` 
  - `shifts`
  - `meal_types`
  - `users`
  - `meal_records`
  - `managers`
  - `extra_meals`

## ✅ Dados Criados:

**Login Admin:**
- Usuário: `admin`
- Senha: `admin123`

**Vouchers para Teste:**
- `1234` - João Silva Santos
- `2345` - Maria Oliveira Costa
- `3456` - Pedro Alves Lima

## 📊 Status do Sistema:

**Antes de executar o SQL:**
- ⚠️ **Modo Demo** - Dados de exemplo
- Funciona normalmente mas não salva no banco

**Depois de executar o SQL:**
- ✅ **Dados Reais** - Conectado ao Supabase
- Todas as operações salvam no banco de dados

## 🆘 Se der Erro:

**"relation already exists"**
- É normal, significa que algumas tabelas já existem
- Continue normalmente

**"permission denied"**
- Verifique se você é proprietário do projeto
- Use o owner/admin do projeto Supabase

**Não vejo as tabelas**
- Recarregue a página do Supabase
- Verifique se o SQL foi executado completamente

## 🧪 Testar se Funcionou:

1. Recarregue a aplicação
2. O status deve mudar de "Modo Demo" para "Dados Reais"
3. Faça login como admin (`admin`/`admin123`)
4. Teste criar um usuário na aba "Usuários"
5. Use um voucher de teste (`1234`, `2345`, `3456`)

## ⚡ O Sistema Funciona Mesmo Sem SQL!

- **Com SQL**: Dados reais, operações salvam no banco
- **Sem SQL**: Modo demonstração, tudo funciona mas não salva

Ambos os modos são totalmente funcionais para demonstrar o sistema!