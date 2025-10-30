-- ========================================
-- SCRIPT PARA CORRIGIR LOGIN DO ADMIN
-- ========================================
-- Execute este SQL se o login admin/admin123 não funcionar

-- 1. Primeiro, vamos ver o que temos no banco
SELECT username, password_hash, full_name, role, is_active 
FROM admins 
WHERE username = 'admin';

-- 2. Deletar admin existente (se houver problemas)
DELETE FROM admins WHERE username = 'admin';

-- 3. Criar novo admin com senha simples
INSERT INTO admins (username, password_hash, full_name, email, role, is_active) VALUES
('admin', 'admin123', 'Administrador Master', 'admin@sistema.com', 'super_admin', true);

-- 4. Criar admins alternativos para teste
INSERT INTO admins (username, password_hash, full_name, email, role, is_active) VALUES
('teste', '123', 'Admin Teste', 'teste@sistema.com', 'admin', true),
('root', 'root', 'Admin Root', 'root@sistema.com', 'super_admin', true),
('gestor', 'gestor123', 'Gestor Sistema', 'gestor@sistema.com', 'admin', true);

-- 5. Verificar se foram criados corretamente
SELECT username, password_hash, full_name, role, is_active, created_at 
FROM admins 
ORDER BY created_at DESC;

-- ========================================
-- CREDENCIAIS DISPONÍVEIS APÓS EXECUTAR:
-- ========================================
-- admin / admin123 (Super Admin)
-- teste / 123 (Admin)  
-- root / root (Super Admin)
-- gestor / gestor123 (Admin)