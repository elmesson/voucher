-- =====================================================
-- SISTEMA DE GESTÃO DE REFEIÇÕES - ESQUEMA INICIAL
-- =====================================================
-- ATENÇÃO: NÃO criar RLS - será gerenciado pelo frontend

-- 1. TABELA DE ADMINISTRADORES
-- =====================================================
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
-- =====================================================
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
-- =====================================================
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
-- =====================================================
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
-- =====================================================
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
-- =====================================================
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
-- =====================================================
CREATE TABLE IF NOT EXISTS managers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE, -- Login do gerente
    password VARCHAR(255), -- Senha do gerente (deve ser hash em produção)
    phone VARCHAR(20),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}', -- Para armazenar permissões específicas
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABELA DE REFEIÇÕES EXTRAS (RH)
-- =====================================================
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
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_users_voucher_code ON users(voucher_code);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_meal_records_user_id ON meal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_records_meal_date ON meal_records(meal_date);
CREATE INDEX IF NOT EXISTS idx_meal_records_voucher_code ON meal_records(voucher_code);
CREATE INDEX IF NOT EXISTS idx_meal_records_status ON meal_records(status);

CREATE INDEX IF NOT EXISTS idx_extra_meals_user_id ON extra_meals(user_id);
CREATE INDEX IF NOT EXISTS idx_extra_meals_meal_date ON extra_meals(meal_date);
CREATE INDEX IF NOT EXISTS idx_extra_meals_status ON extra_meals(status);

CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_shifts_is_active ON shifts(is_active);
CREATE INDEX IF NOT EXISTS idx_meal_types_is_active ON meal_types(is_active);
CREATE INDEX IF NOT EXISTS idx_meal_types_is_special ON meal_types(is_special);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers em todas as tabelas
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meal_types_updated_at BEFORE UPDATE ON meal_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meal_records_updated_at BEFORE UPDATE ON meal_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_managers_updated_at BEFORE UPDATE ON managers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_extra_meals_updated_at BEFORE UPDATE ON extra_meals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir admin padrão (senha: admin123)
INSERT INTO admins (username, password_hash, full_name, email, role) 
VALUES (
    'admin', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBfrMAar/RnWZe', -- hash para 'admin123'
    'Administrador Master',
    'admin@sistema.com',
    'super_admin'
) ON CONFLICT (username) DO NOTHING;

-- Inserir empresas de exemplo
INSERT INTO companies (name, trade_name, cnpj, is_active) VALUES
('LOPES TRANSPORTES E LOGÍSTICA LTDA', 'LOPES TRANSPORTES E LOGÍSTICA', '12.345.678/0001-90', true),
('MELLO TRANSPORTE DISTRIBUIÇÃO LTDA', 'MELLO TRANSPORTE DISTRIBUIÇÃO', '98.765.432/0001-10', true),
('TURBO SUPERMERCADOS LTDA', 'TURBO SUPERMERCADOS', '11.222.333/0001-44', true)
ON CONFLICT DO NOTHING;

-- Inserir turnos padrão
INSERT INTO shifts (name, start_time, end_time, description, is_active) VALUES
('Manhã', '06:00:00', '14:00:00', '1° Turno - Manhã', true),
('Tarde', '14:00:00', '22:00:00', '2° Turno - Tarde', true),
('Noite', '22:00:00', '06:00:00', '3° Turno - Noite', true),
('Administrativo', '08:00:00', '18:00:00', 'Turno Administrativo', true)
ON CONFLICT DO NOTHING;

-- Inserir tipos de refeição padrão
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

-- =====================================================
-- COMENTÁRIOS SOBRE AS TABELAS
-- =====================================================

COMMENT ON TABLE admins IS 'Administradores do sistema com acesso ao painel admin';
COMMENT ON TABLE companies IS 'Empresas cadastradas no sistema';
COMMENT ON TABLE shifts IS 'Turnos de trabalho dos funcionários';
COMMENT ON TABLE meal_types IS 'Tipos de refeição disponíveis (normais e especiais)';
COMMENT ON TABLE users IS 'Funcionários com vouchers para refeições';
COMMENT ON TABLE meal_records IS 'Registros de uso de vouchers para refeições';
COMMENT ON TABLE managers IS 'Gerentes com permissões especiais no sistema';
COMMENT ON TABLE extra_meals IS 'Refeições extras solicitadas pelo RH';

COMMENT ON COLUMN meal_types.is_special IS 'true = apenas para RH Refeições Extras, false = disponível para vouchers normais';
COMMENT ON COLUMN meal_records.validation_method IS 'voucher = validado por voucher, manual = inserido manualmente, extra = refeição extra do RH';
COMMENT ON COLUMN extra_meals.status IS 'pending = aguardando aprovação, approved = aprovado, rejected = rejeitado, used = utilizado';