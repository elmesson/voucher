import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/middleware";
import { createClient } from "npm:@supabase/supabase-js@2.45.1";
import * as kv from './kv_store.tsx';
import { compare } from "npm:bcrypt@5.1.0";

const app = new Hono();

// CORS configuration
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Logger
app.use('*', logger(console.log));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Generate simple JWT-like token (for demo purposes)
function generateToken(adminData: any): string {
  const payload = {
    id: adminData.id,
    username: adminData.username,
    role: adminData.role,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  return btoa(JSON.stringify(payload));
}

// Verify token
function verifyToken(token: string): any {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

// Middleware for admin authentication
async function requireAuth(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Token de autorização necessário' }, 401);
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  
  if (!payload) {
    return c.json({ success: false, message: 'Token inválido ou expirado' }, 401);
  }

  c.set('admin', payload);
  await next();
}

// =====================================================
// AUTHENTICATION ROUTES
// =====================================================

// Admin Login
app.post('/make-server-18b3cf29/admin/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({
        success: false,
        message: 'Usuário e senha são obrigatórios'
      }, 400);
    }

    console.log('Tentativa de login para usuário:', username);

    // Query admin from database
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username.trim().toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      console.log('Usuário não encontrado:', username);
      return c.json({
        success: false,
        message: 'Credenciais inválidas'
      }, 401);
    }

    // Verify password
    const passwordMatch = await compare(password, admin.password_hash);
    
    if (!passwordMatch) {
      console.log('Senha incorreta para usuário:', username);
      return c.json({
        success: false,
        message: 'Credenciais inválidas'
      }, 401);
    }

    // Update last login
    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    // Generate token
    const token = generateToken(admin);

    console.log('Login bem-sucedido para usuário:', username);

    return c.json({
      success: true,
      message: 'Login realizado com sucesso',
      admin: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role
      },
      token
    });

  } catch (error) {
    console.error('Erro no login admin:', error);
    return c.json({
      success: false,
      message: 'Erro interno do servidor'
    }, 500);
  }
});

// Verify Admin Token
app.get('/make-server-18b3cf29/admin/verify', requireAuth, async (c) => {
  const admin = c.get('admin');
  
  // Get fresh admin data from database
  const { data: adminData, error } = await supabase
    .from('admins')
    .select('id, username, full_name, email, role, is_active')
    .eq('id', admin.id)
    .eq('is_active', true)
    .single();

  if (error || !adminData) {
    return c.json({
      success: false,
      message: 'Admin não encontrado ou inativo'
    }, 404);
  }

  return c.json({
    success: true,
    admin: adminData
  });
});

// =====================================================
// VOUCHER VALIDATION ROUTES
// =====================================================

// Validate Voucher
app.post('/make-server-18b3cf29/voucher/validate', async (c) => {
  try {
    const { voucher_code, current_time, current_date } = await c.req.json();

    if (!voucher_code || voucher_code.length !== 4) {
      return c.json({
        success: false,
        message: 'Código de voucher deve ter 4 dígitos'
      }, 400);
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        company:companies(*),
        shift:shifts(*)
      `)
      .eq('voucher_code', voucher_code)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      return c.json({
        success: false,
        message: 'Voucher não encontrado ou usuário inativo'
      }, 404);
    }

    // Check if user is within shift time
    if (user.shift) {
      const currentTime = current_time || new Date().toTimeString().slice(0, 5);
      // Add shift validation logic here
    }

    // Get available meal types for current time (non-special only)
    const { data: mealTypes, error: mealError } = await supabase
      .from('meal_types')
      .select('*')
      .eq('is_active', true)
      .eq('is_special', false);

    if (mealError) {
      console.error('Erro ao buscar tipos de refeição:', mealError);
    }

    // Check daily meal limit (2 meals per day)
    const today = current_date || new Date().toISOString().split('T')[0];
    const { data: todayMeals, error: mealsError } = await supabase
      .from('meal_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('meal_date', today)
      .eq('status', 'used');

    if (mealsError) {
      console.error('Erro ao verificar refeições do dia:', mealsError);
    }

    const mealCount = todayMeals?.length || 0;

    return c.json({
      success: true,
      user: {
        id: user.id,
        voucher_code: user.voucher_code,
        full_name: user.full_name,
        company: user.company?.name || 'N/A',
        department: user.department,
        position: user.position,
        shift: user.shift?.name || 'N/A'
      },
      meal_count: mealCount,
      available_meal_types: mealTypes || []
    });

  } catch (error) {
    console.error('Erro na validação do voucher:', error);
    return c.json({
      success: false,
      message: 'Erro interno do servidor'
    }, 500);
  }
});

// Register Meal
app.post('/make-server-18b3cf29/voucher/register', async (c) => {
  try {
    const { voucher_code, meal_type_id } = await c.req.json();

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('voucher_code', voucher_code)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      return c.json({
        success: false,
        message: 'Usuário não encontrado'
      }, 404);
    }

    // Get meal type
    const { data: mealType, error: mealError } = await supabase
      .from('meal_types')
      .select('*')
      .eq('id', meal_type_id)
      .eq('is_active', true)
      .single();

    if (mealError || !mealType) {
      return c.json({
        success: false,
        message: 'Tipo de refeição não encontrado'
      }, 404);
    }

    // Register meal
    const now = new Date();
    const { data: mealRecord, error: recordError } = await supabase
      .from('meal_records')
      .insert({
        user_id: user.id,
        meal_type_id: mealType.id,
        voucher_code: voucher_code,
        meal_date: now.toISOString().split('T')[0],
        meal_time: now.toTimeString().slice(0, 8),
        price: mealType.price || 0,
        status: 'used',
        validation_method: 'voucher'
      })
      .select()
      .single();

    if (recordError) {
      console.error('Erro ao registrar refeição:', recordError);
      return c.json({
        success: false,
        message: 'Erro ao registrar refeição'
      }, 500);
    }

    return c.json({
      success: true,
      message: 'Refeição registrada com sucesso',
      meal_record: mealRecord
    });

  } catch (error) {
    console.error('Erro ao registrar refeição:', error);
    return c.json({
      success: false,
      message: 'Erro interno do servidor'
    }, 500);
  }
});

// =====================================================
// ADMIN CRUD ROUTES (Protected)
// =====================================================

// Users Management
app.get('/make-server-18b3cf29/admin/users', requireAuth, async (c) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        *,
        company:companies(name),
        shift:shifts(name)
      `)
      .order('full_name');

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return c.json({
        success: false,
        message: 'Erro ao buscar usuários'
      }, 500);
    }

    return c.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return c.json({
      success: false,
      message: 'Erro interno do servidor'
    }, 500);
  }
});

// Companies Management
app.get('/make-server-18b3cf29/admin/companies', requireAuth, async (c) => {
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar empresas:', error);
      return c.json({
        success: false,
        message: 'Erro ao buscar empresas'
      }, 500);
    }

    return c.json({
      success: true,
      companies
    });
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    return c.json({
      success: false,
      message: 'Erro interno do servidor'
    }, 500);
  }
});

// Health check
app.get('/make-server-18b3cf29/health', (c) => {
  return c.json({
    success: true,
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString()
  });
});

// Default route
app.get('/make-server-18b3cf29/', (c) => {
  return c.json({
    success: true,
    message: 'API do Sistema de Gestão de Refeições',
    version: '1.0.0',
    endpoints: [
      'POST /admin/login',
      'GET /admin/verify',
      'POST /voucher/validate',
      'POST /voucher/register',
      'GET /admin/users',
      'GET /admin/companies',
      'GET /health'
    ]
  });
});

// Start server
Deno.serve(app.fetch);