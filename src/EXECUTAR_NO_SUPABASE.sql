-- ========================================
-- COPIE E EXECUTE ESTE SQL NO SUPABASE
-- ========================================

-- 1. TABELA DE ADMINISTRADORES
CREATE TABLE admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE EMPRESAS
CREATE TABLE companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    trade_name TEXT,
    cnpj TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE TURNOS
CREATE TABLE shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE TIPOS DE REFEIÇÃO
CREATE TABLE meal_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_special BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    price DECIMAL(10,2),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE USUÁRIOS
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    voucher_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    cpf TEXT,
    company_id UUID REFERENCES companies(id),
    department TEXT,
    position TEXT,
    shift_id UUID REFERENCES shifts(id),
    email TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    hire_date DATE,
    birth_date DATE,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE REGISTROS DE REFEIÇÕES
CREATE TABLE meal_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    meal_type_id UUID REFERENCES meal_types(id),
    voucher_code TEXT NOT NULL,
    meal_date DATE NOT NULL,
    meal_time TIME NOT NULL,
    price DECIMAL(10,2),
    status TEXT DEFAULT 'used',
    validation_method TEXT DEFAULT 'voucher',
    validated_by UUID REFERENCES admins(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE GERENTES
CREATE TABLE managers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    company_id UUID REFERENCES companies(id),
    department TEXT,
    position TEXT,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABELA DE REFEIÇÕES EXTRAS (CORRIGIDA)
CREATE TABLE extra_meals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    meal_type_id UUID REFERENCES meal_types(id),
    meal_date DATE NOT NULL,
    meal_time TIME,
    reason TEXT NOT NULL,
    requested_by_name TEXT NOT NULL, -- Nome do solicitante (texto livre)
    approved_by UUID REFERENCES admins(id), -- Admin que aprovou (UUID)
    status TEXT DEFAULT 'pending',
    price DECIMAL(10,2),
    notes TEXT,
    -- Campos para visitantes externos
    external_name TEXT, -- Nome do visitante
    external_document TEXT, -- CPF/RG do visitante
    external_company TEXT, -- Empresa do visitante
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ
);

-- ========================================
-- DADOS INICIAIS
-- ========================================

-- Admin padrão
INSERT INTO admins (username, password_hash, full_name, email, role) VALUES
('admin', 'admin123', 'Administrador Master', 'admin@sistema.com', 'super_admin');

-- Empresas
INSERT INTO companies (name, trade_name, cnpj, is_active) VALUES
('LOPES TRANSPORTES E LOGÍSTICA LTDA', 'LOPES TRANSPORTES', '12345678000190', true),
('MELLO TRANSPORTE DISTRIBUIÇÃO LTDA', 'MELLO TRANSPORTE', '98765432000110', true),
('TURBO SUPERMERCADOS LTDA', 'TURBO SUPERMERCADOS', '11222333000144', true);

-- Turnos
INSERT INTO shifts (name, start_time, end_time, description, is_active) VALUES
('1° Turno - Manhã', '06:00:00', '14:00:00', 'Turno da manhã', true),
('2° Turno - Tarde', '14:00:00', '22:00:00', 'Turno da tarde', true),
('3° Turno - Noite', '22:00:00', '06:00:00', 'Turno da noite', true),
('Administrativo', '08:00:00', '18:00:00', 'Turno administrativo', true);

-- Tipos de refeição
INSERT INTO meal_types (name, start_time, end_time, is_special, price, is_active) VALUES
('Café da Manhã', '06:00:00', '09:00:00', false, 8.50, true),
('Almoço', '11:00:00', '14:00:00', false, 18.50, true),
('Lanche da Tarde', '15:00:00', '17:00:00', false, 12.00, true),
('Jantar', '18:00:00', '21:00:00', false, 22.00, true),
('Ceia', '22:00:00', '02:00:00', false, 15.50, true),
('Brunch Executivo', '09:30:00', '11:30:00', true, 25.00, true),
('Coffee Break', '10:00:00', '10:30:00', true, 10.00, true),
('Happy Hour Corporativo', '17:30:00', '19:30:00', true, 30.00, true);

-- Usuários de exemplo
INSERT INTO users (voucher_code, full_name, cpf, company_id, department, position, shift_id, email, is_active)
SELECT 
    '1234', 'João Silva Santos', '12345678900', c.id, 'Operacional', 'Operador', s.id, 'joao.silva@lopes.com.br', true
FROM companies c, shifts s 
WHERE c.name = 'LOPES TRANSPORTES E LOGÍSTICA LTDA' AND s.name = '1° Turno - Manhã'
LIMIT 1;

INSERT INTO users (voucher_code, full_name, cpf, company_id, department, position, shift_id, email, is_active)
SELECT 
    '2345', 'Maria Oliveira Costa', '98765432100', c.id, 'Administrativo', 'Assistente', s.id, 'maria.oliveira@mello.com.br', true
FROM companies c, shifts s 
WHERE c.name = 'MELLO TRANSPORTE DISTRIBUIÇÃO LTDA' AND s.name = 'Administrativo'
LIMIT 1;

INSERT INTO users (voucher_code, full_name, cpf, company_id, department, position, shift_id, email, is_active)
SELECT 
    '3456', 'Pedro Alves Lima', '45678912300', c.id, 'Logística', 'Conferente', s.id, 'pedro.alves@turbo.com.br', true
FROM companies c, shifts s 
WHERE c.name = 'TURBO SUPERMERCADOS LTDA' AND s.name = '2° Turno - Tarde'
LIMIT 1;