# 🚀 Configuração do Supabase

## ⚡ Execução Rápida

### 1. Acesse o Supabase Dashboard
- Vá para: https://supabase.com/dashboard
- Entre no projeto: **dhgomondxqugynhggqji**

### 2. Execute o SQL
- Clique em **"SQL Editor"** no menu lateral
- Clique em **"New Query"**
- Copie TODO o conteúdo do arquivo `EXECUTAR_NO_SUPABASE.sql`
- Cole no editor
- Clique em **"Run"** (botão ▶️)

### 3. Verifique se funcionou
- Vá em **"Table Editor"**
- Você deve ver 8 tabelas criadas
- Recarregue a aplicação
- Sistema está pronto para uso!

## 🔐 Dados de Acesso Criados

**Admin do Sistema:**
- Usuário: `admin`
- Senha: `admin123`

**Vouchers para Teste:**
- `1234` - João Silva Santos (Lopes Transportes)
- `2345` - Maria Oliveira Costa (Mello Transporte)  
- `3456` - Pedro Alves Lima (Turbo Supermercados)

## 📊 Estrutura do Banco

**Tabelas Criadas:**
- `admins` - Administradores do sistema
- `companies` - Empresas cadastradas
- `shifts` - Turnos de trabalho
- `meal_types` - Tipos de refeição
- `users` - Usuários do sistema
- `meal_records` - Registros de refeições
- `managers` - Gerentes das empresas
- `extra_meals` - Refeições extras (RH)

## ✅ Sistema 100% Funcional

Após executar o SQL, o sistema opera exclusivamente com dados reais do Supabase:

- ✅ **Validação de vouchers real**
- ✅ **Limite diário de 2 refeições**
- ✅ **Tipos de refeição por horário**
- ✅ **CRUD completo para todas entidades**
- ✅ **Relatórios com dados reais**
- ✅ **Autenticação administrativa**

## 🆘 Problemas Comuns

**"relation does not exist"**
- Execute o SQL completamente
- Recarregue a aplicação

**Login não funciona**
- Verifique se a tabela `admins` foi criada
- Use: `admin` / `admin123`

**Voucher não aceito**
- Verifique se a tabela `users` tem dados
- Use os vouchers: 1234, 2345, 3456

O sistema agora é **100% real** - sem modo demo ou fallbacks!