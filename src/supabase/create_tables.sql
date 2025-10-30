-- =====================================================
-- SISTEMA DE GESTÃO DE REFEIÇÕES - CRIAÇÃO DE TABELAS
-- =====================================================
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. TABELA DE ADMINISTRADORES
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE EMPRESAS
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    cnpj VARCHAR(18) UNIQUE,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE TURNOS
CREATE TABLE IF NOT EXISTS shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE TIPOS DE REFEIÇÃO
CREATE TABLE IF NOT EXISTS meal_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_special BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    price DECIMAL(10,2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE USUÁRIOS/FUNCIONÁRIOS
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    voucher_code VARCHAR(4) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    hire_date DATE,
    birth_date DATE,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE REGISTROS DE REFEIÇÕES
CREATE TABLE IF NOT EXISTS meal_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    meal_type_id UUID REFERENCES meal_types(id) ON DELETE SET NULL,
    voucher_code VARCHAR(4) NOT NULL,
    meal_date DATE NOT NULL,
    meal_time TIME NOT NULL,
    price DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'used' CHECK (status IN ('used', 'cancelled', 'pending')),
    validation_method VARCHAR(20) DEFAULT 'voucher' CHECK (validation_method IN ('voucher', 'manual', 'extra')),
    validated_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA DE GERENTES
CREATE TABLE IF NOT EXISTS managers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABELA DE REFEIÇÕES EXTRAS (RH)
CREATE TABLE IF NOT EXISTS extra_meals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    meal_type_id UUID REFERENCES meal_types(id) ON DELETE SET NULL,
    meal_date DATE NOT NULL,
    meal_time TIME,
    reason VARCHAR(500) NOT NULL,
    requested_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'used')),
    price DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INSERIR DADOS INICIAIS
-- =====================================================

-- Admin padrão (senha: admin123 - hash bcrypt)
INSERT INTO admins (username, password_hash, full_name, email, role) 
VALUES (
    'admin', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBfrMAar/RnWZe',
    'Administrador Master',
    'admin@sistema.com',
    'super_admin'
) ON CONFLICT (username) DO NOTHING;

-- Empresas de exemplo
INSERT INTO companies (name, trade_name, cnpj, is_active) VALUES
('LOPES TRANSPORTES E LOGÍSTICA LTDA', 'LOPES TRANSPORTES E LOGÍSTICA', '12345678000190', true),
('MELLO TRANSPORTE DISTRIBUIÇÃO LTDA', 'MELLO TRANSPORTE DISTRIBUIÇÃO', '98765432000110', true),
('TURBO SUPERMERCADOS LTDA', 'TURBO SUPERMERCADOS', '11222333000144', true)
ON CONFLICT DO NOTHING;

-- Turnos padrão
INSERT INTO shifts (name, start_time, end_time, description, is_active) VALUES
('1° Turno - Manhã', '06:00:00', '14:00:00', 'Turno da manhã', true),
('2° Turno - Tarde', '14:00:00', '22:00:00', 'Turno da tarde', true),
('3° Turno - Noite', '22:00:00', '06:00:00', 'Turno da noite', true),
('Administrativo', '08:00:00', '18:00:00', 'Turno administrativo', true)
ON CONFLICT DO NOTHING;

-- Tipos de refeição padrão
INSERT INTO meal_types (name, start_time, end_time, is_special, price, is_active) VALUES
('Café da Manhã', '06:00:00', '09:00:00', false, 8.50, true),
('Almoço', '11:00:00', '14:00:00', false, 18.50, true),
('Lanche da Tarde', '15:00:00', '17:00:00', false, 12.00, true),
('Jantar', '18:00:00', '21:00:00', false, 22.00, true),
('Ceia', '22:00:00', '02:00:00', false, 15.50, true),
-- Tipos especiais (apenas para RH Refeições Extras)
('Brunch Executivo', '09:30:00', '11:30:00', true, 25.00, true),
('Coffee Break', '10:00:00', '10:30:00', true, 10.00, true),
('Happy Hour Corporativo', '17:30:00', '19:30:00', true, 30.00, true),
('Almoço Executivo', '12:00:00', '13:30:00', true, 35.00, true),
('Jantar de Evento', '19:00:00', '23:00:00', true, 50.00, true)
ON CONFLICT DO NOTHING;

-- Usuários de exemplo
INSERT INTO users (voucher_code, full_name, cpf, company_id, department, position, shift_id, email, is_active) 
SELECT 
    '1234',
    'João Silva Santos',
    '12345678900',
    c.id,
    'Operacional',
    'Operador',
    s.id,
    'joao.silva@lopes.com.br',
    true
FROM companies c, shifts s 
WHERE c.name = 'LOPES TRANSPORTES E LOGÍSTICA LTDA' 
AND s.name = '1° Turno - Manhã'
ON CONFLICT (voucher_code) DO NOTHING;

INSERT INTO users (voucher_code, full_name, cpf, company_id, department, position, shift_id, email, is_active) 
SELECT 
    '2345',
    'Maria Oliveira Costa',
    '98765432100',
    c.id,
    'Administrativo',
    'Assistente',
    s.id,
    'maria.oliveira@mello.com.br',
    true
FROM companies c, shifts s 
WHERE c.name = 'MELLO TRANSPORTE DISTRIBUIÇÃO LTDA' 
AND s.name = 'Administrativo'
ON CONFLICT (voucher_code) DO NOTHING;

INSERT INTO users (voucher_code, full_name, cpf, company_id, department, position, shift_id, email, is_active) 
SELECT 
    '3456',
    'Pedro Alves Lima',
    '45678912300',
    c.id,
    'Logística',
    'Conferente',
    s.id,
    'pedro.alves@turbo.com.br',
    true
FROM companies c, shifts s 
WHERE c.name = 'TURBO SUPERMERCADOS LTDA' 
AND s.name = '2° Turno - Tarde'
ON CONFLICT (voucher_code) DO NOTHING;