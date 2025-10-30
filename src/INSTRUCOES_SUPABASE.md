# 📋 Como Criar as Tabelas no Supabase

## 🔗 Passo a Passo

### 1. Acessar o Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione seu projeto

### 2. Abrir o SQL Editor
1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"New Query"** ou use o botão **"+"**

### 3. Executar o Script SQL
1. Copie todo o conteúdo do arquivo `/supabase/create_tables.sql`
2. Cole no editor SQL do Supabase
3. Clique em **"Run"** (botão ▶️ no canto inferior direito)

### 4. Verificar se as Tabelas foram Criadas
1. Vá para **"Table Editor"** no menu lateral
2. Você deve ver as seguintes tabelas:
   - `admins`
   - `companies` 
   - `shifts`
   - `meal_types`
   - `users`
   - `meal_records`
   - `managers`
   - `extra_meals`

### 5. Verificar os Dados Iniciais
Clique em cada tabela para ver se os dados de exemplo foram inseridos:

**companies** - 3 empresas:
- LOPES TRANSPORTES E LOGÍSTICA
- MELLO TRANSPORTE DISTRIBUIÇÃO  
- TURBO SUPERMERCADOS

**shifts** - 4 turnos:
- 1° Turno - Manhã
- 2° Turno - Tarde
- 3° Turno - Noite
- Administrativo

**meal_types** - 10 tipos:
- 5 tipos normais (Café, Almoço, Lanche, Jantar, Ceia)
- 5 tipos especiais (Brunch, Coffee Break, etc.)

**users** - 3 usuários de exemplo:
- João Silva Santos (voucher: 1234)
- Maria Oliveira Costa (voucher: 2345)  
- Pedro Alves Lima (voucher: 3456)

**admins** - 1 administrador:
- Username: `admin`
- Password: `admin123`

## 🔧 Se Houver Erros

### Erro: "relation already exists"
- Isso é normal se as tabelas já existem
- O script usa `IF NOT EXISTS` para evitar duplicação

### Erro de permissão
1. Vá em **Settings** > **Database**
2. Verifique se você tem permissões de administrador

### Erro de foreign key
- Execute o script novamente
- As tabelas são criadas em ordem de dependência

## 🧪 Testar a Conexão

Após criar as tabelas, teste no sistema:

1. Faça login como admin (`admin` / `admin123`)
2. Vá para a aba **"Usuários"**
3. Você deve ver os 3 usuários de exemplo
4. Tente criar um novo usuário
5. Vá para **"Empresas"** e veja as 3 empresas

## 📞 Vouchers para Teste

Use estes vouchers na tela principal:
- `1234` - João Silva Santos
- `2345` - Maria Oliveira Costa  
- `3456` - Pedro Alves Lima

## 🔍 Verificar Estrutura

Para ver a estrutura das tabelas no SQL Editor:

```sql
-- Ver todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Ver estrutura de uma tabela específica
\d users;
```

## ❓ Problemas Comuns

**1. Não vejo as tabelas:**
- Recarregue a página do Supabase
- Verifique se não há erros no SQL Editor

**2. Dados não aparecem no sistema:**
- Verifique se as variáveis em `/utils/supabase/info.tsx` estão corretas
- Teste a conexão no navegador (F12 > Console)

**3. Erro ao criar usuário:**
- Verifique se as empresas e turnos foram criados
- Veja se não há conflito de voucher_code

## 🎯 Próximos Passos

Após criar as tabelas:
1. Sistema de login funcionará com `admin`/`admin123`
2. CRUD de usuários estará funcional
3. CRUD de empresas estará operacional  
4. Validação de vouchers funcionará
5. Relatórios usarão dados reais

## 📊 RLS (Row Level Security)

**IMPORTANTE:** 
- NÃO habilite RLS nas tabelas
- O controle de acesso é feito pelo frontend
- Se RLS estiver habilitado, desabilite:

```sql
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE managers DISABLE ROW LEVEL SECURITY;
ALTER TABLE extra_meals DISABLE ROW LEVEL SECURITY;
```