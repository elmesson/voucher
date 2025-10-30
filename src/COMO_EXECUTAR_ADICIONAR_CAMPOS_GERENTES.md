# Como Adicionar Campos de Login para Gerentes

## ⚠️ IMPORTANTE
O sistema está configurado para funcionar com campos de login, mas eles precisam ser adicionados na tabela do banco de dados primeiro.

## Passos para Adicionar os Campos

### 1. Acesse o Supabase
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto: **dhgomondxqugynhggqji**

### 2. Abra o SQL Editor
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New query** para criar uma nova consulta

### 3. Execute o Script SQL
Copie e cole o seguinte código no editor SQL:

```sql
-- Script para adicionar campos de login nos gerentes
-- Execute no Supabase SQL Editor

-- Adicionar campos username e password na tabela managers
ALTER TABLE managers 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password TEXT;

-- Criar índice para melhorar performance nas consultas de login
CREATE INDEX IF NOT EXISTS idx_managers_username ON managers(username);

-- Comentários explicativos
COMMENT ON COLUMN managers.username IS 'Nome de usuário para login no sistema';
COMMENT ON COLUMN managers.password IS 'Senha para autenticação (armazenada em texto plano para simplicidade)';

-- Verificar se os campos foram adicionados
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'managers' 
AND column_name IN ('username', 'password');
```

### 4. Executar o Script
1. Clique no botão **Run** (ou pressione Ctrl+Enter)
2. Verifique se apareceu uma mensagem de sucesso
3. Na parte inferior, você deve ver o resultado da consulta mostrando os novos campos

### 5. Verificar se Funcionou
Após executar o script, você deve ver algo assim na seção de resultados:

```
column_name | data_type | is_nullable
username    | text      | YES
password    | text      | YES
```

## ✅ O que Acontece Depois

Após executar o script SQL:
1. **Os campos de login aparecerão nos formulários** de cadastro e edição de gerentes
2. **O sistema de login funcionará normalmente** no modal de acesso de gerentes
3. **Os alertas amarelos desaparecerão** dos formulários

## 🔧 Configuração de Gerentes Existentes

Se você já tem gerentes cadastrados, precisará definir username e password para eles:

1. Vá para a aba **Gerentes** no sistema administrativo
2. Clique em **Editar** para cada gerente
3. Defina um **Nome de Usuário** e **Senha**
4. Salve as alterações

## 🚨 Importante Sobre Segurança

- As senhas são armazenadas em **texto plano** para simplicidade
- Para produção, considere implementar **hash de senhas**
- Use senhas fortes para os gerentes

## ❓ Problemas?

Se encontrar algum erro:
1. Verifique se está no projeto correto
2. Certifique-se de ter permissões de administrador
3. Tente executar o script novamente
4. Entre em contato com o suporte se o problema persistir

---

**Após executar o SQL, refresh a página do sistema e teste o login de gerentes!**