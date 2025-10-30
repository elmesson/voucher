# 🔐 Resolver Problema de Login Admin

## 🚨 **Problema Atual:**
As credenciais padrão `admin` / `admin123` não estão funcionando na autenticação.

## 🔍 **Diagnóstico (Execute no Navegador):**

1. **Abra as Ferramentas do Desenvolvedor** (F12)
2. **Vá para a aba "Console"**
3. **Tente fazer login** com admin/admin123
4. **Veja os logs detalhados** que mostram:
   - Se o usuário foi encontrado
   - Qual senha está armazenada no banco
   - Como a comparação está sendo feita

## ⚡ **Soluções Rápidas:**

### **Opção 1: Script de Correção**
Execute o SQL do arquivo `CORRIGIR_ADMIN_LOGIN.sql` no Supabase:

```sql
-- Deletar admin problemático
DELETE FROM admins WHERE username = 'admin';

-- Criar admin novo
INSERT INTO admins (username, password_hash, full_name, email, role, is_active) VALUES
('admin', 'admin123', 'Administrador Master', 'admin@sistema.com', 'super_admin', true);
```

### **Opção 2: Credenciais Alternativas**
Após executar o script de correção, teste estas credenciais:

- ✅ **admin** / **admin123** (Super Admin)
- ✅ **teste** / **123** (Admin)
- ✅ **root** / **root** (Super Admin)  
- ✅ **gestor** / **gestor123** (Admin)

### **Opção 3: Verificação Manual**
Execute esta query no Supabase para ver os dados:

```sql
SELECT username, password_hash, full_name, role 
FROM admins 
WHERE is_active = true;
```

## 🛠️ **Sistema de Debug Implementado:**

O LoginModal agora inclui:

✅ **Logs detalhados** no console do navegador  
✅ **Comparações múltiplas** de senha (case-sensitive, case-insensitive)  
✅ **Detecção de hash BCrypt** (se aplicável)  
✅ **Informações de debug** na interface  
✅ **Tratamento de erros** específicos  

## 🎯 **Como Proceder:**

1. **Execute o script** `CORRIGIR_ADMIN_LOGIN.sql`
2. **Recarregue a aplicação**
3. **Abra o console** do navegador (F12)
4. **Tente login** com `admin` / `admin123`
5. **Verifique os logs** se ainda não funcionar

## 📋 **Logs Esperados (Sucesso):**

```
🔐 Tentando autenticar: {username: "admin"}
📊 Dados do admin encontrado: {username: "admin", password_hash: "admin123", ...}
🔑 Comparando senhas: {input: "admin123", stored: "admin123", ...}
✅ Senha válida: comparação direta
✅ Autenticação bem-sucedida!
```

## 📋 **Logs de Erro (Problema):**

```
❌ Senha incorreta: {tentativa: "admin123", esperado: "XXX", ...}
```

O campo `esperado` mostra exatamente o que está no banco para comparação.

## 🆘 **Se Ainda Não Funcionar:**

1. **Copie os logs** do console
2. **Execute a query** de verificação manual
3. **Compare os valores** exatos
4. **Use uma das credenciais alternativas**

O sistema agora é **100% transparente** sobre o que está acontecendo na autenticação! 🔍