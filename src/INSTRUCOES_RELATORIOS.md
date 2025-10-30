# 📊 Tela de Relatórios - Instruções

## ✅ O que foi criado

A tela de **Relatórios** foi recriada com todas as funcionalidades solicitadas:

### 🎯 Funcionalidades Principais

1. **Abas de Relatórios**
   - ✅ Refeições Regulares (voucher system)
   - ✅ Refeições Extras (RH)
   - Navegação fluida entre as abas

2. **Filtros Avançados**
   - 📅 Data início e fim
   - 🏢 Filtro por empresa
   - 🍽️ Filtro por tipo de refeição
   - 🔄 Status das refeições
   - 📆 Botão "Hoje" para filtro rápido
   - 🔍 Botão toggle para mostrar/ocultar filtros

3. **Estatísticas em Tempo Real**
   - 📊 Total de Refeições
   - 💰 Receita Total
   - 📈 Preço Médio
   - 👥 Usuários Únicos
   - Cards coloridos e informativos

4. **Exportação de Dados**
   - 📄 **Exportar PDF** - Relatório formatado com:
     - Cabeçalho com informações do período
     - Estatísticas resumidas
     - Tabela completa de dados
     - Layout profissional
   
   - 📊 **Exportar Excel** - Planilha completa com:
     - Resumo executivo no topo
     - Dados detalhados dos registros
     - Todas as informações dos usuários
     - Pronto para análise

5. **Tabela de Dados Detalhada**
   - 📅 Data e hora da refeição
   - 👤 Informações do usuário (nome, voucher)
   - 🍽️ Tipo de refeição
   - 💵 Valor da refeição
   - ✅ Status
   - 🏢 Empresa e setor
   - Avatar do usuário
   - Layout responsivo

## 🎨 Design Visual

- ✅ Interface minimalista e intuitiva
- ✅ Cores azuis e brancas (energia e bem-estar)
- ✅ Cards estatísticos coloridos (azul, verde, roxo, laranja)
- ✅ Ícones claros e intuitivos (Lucide React)
- ✅ Layout responsivo e profissional
- ✅ Transições suaves
- ✅ Feedback visual (loading, estados vazios)

## 🗂️ Arquivos Criados/Modificados

### Novos Arquivos
1. **`/components/ReportsManagement.tsx`**
   - Componente principal de relatórios
   - Sistema de abas
   - Filtros avançados
   - Estatísticas calculadas
   - Exportação PDF e Excel
   - Tabelas de dados

2. **`/ADICIONAR_PERMISSAO_RELATORIOS.sql`**
   - Script SQL para adicionar permissão aos gerentes
   - Atualiza gerentes existentes

3. **`/INSTRUCOES_RELATORIOS.md`**
   - Este arquivo de documentação

### Arquivos Modificados
1. **`/App.tsx`**
   - Import do ReportsManagement
   - Adição da aba "Relatórios" no menu
   - TabsContent para relatórios

## 🔧 Configuração Necessária

### 1. Adicionar Permissão aos Gerentes

Execute o SQL no Supabase para dar acesso aos relatórios:

```bash
# Arquivo: ADICIONAR_PERMISSAO_RELATORIOS.sql
```

**Passos:**
1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: `dhgomondxqugynhggqji`
3. Vá em **SQL Editor**
4. Cole o conteúdo de `ADICIONAR_PERMISSAO_RELATORIOS.sql`
5. Clique em **Run**
6. Verifique se os gerentes foram atualizados

### 2. Instalar Dependências (se necessário)

As bibliotecas já estão sendo importadas no código:
- ✅ `jspdf` - Geração de PDF
- ✅ `jspdf-autotable` - Tabelas em PDF
- ✅ `xlsx` - Geração de Excel

Se houver erro de importação, o sistema tentará instalar automaticamente.

## 📊 Como Usar

### Acessando a Tela
1. Faça login como gerente
2. Clique na aba **"Relatórios"** no menu principal
3. Escolha entre "Refeições Regulares" ou "Refeições Extras"

### Filtrando Dados
1. Clique em **"Filtros"** para expandir opções
2. Selecione:
   - Data início e fim
   - Empresa específica
   - Tipo de refeição
3. Clique em **"Gerar Relatório"** para atualizar
4. Ou use **"Hoje"** para ver dados do dia atual

### Exportando Dados

#### PDF
1. Configure os filtros desejados
2. Clique em **"Exportar PDF"**
3. O arquivo será baixado automaticamente
4. Nome: `relatorio-regular-2025-10-08.pdf`

#### Excel
1. Configure os filtros desejados
2. Clique em **"Exportar Excel"**
3. O arquivo será baixado automaticamente
4. Nome: `relatorio-regular-2025-10-08.xlsx`

## 📋 Estrutura de Dados

### Refeições Regulares
```typescript
{
  meal_date: string;      // Data da refeição
  meal_time: string;      // Horário
  user: {
    full_name: string;    // Nome completo
    voucher_code: string; // Código do voucher
    company: {
      name: string;       // Nome da empresa
    };
    department: string;   // Setor
    position: string;     // Cargo
  };
  meal_type: {
    name: string;         // Tipo (Almoço, Jantar...)
    price: number;        // Preço
  };
  price: number;          // Valor total
  status: string;         // Status (used, pending...)
}
```

### Refeições Extras
Mesma estrutura das refeições regulares, mas da tabela `extra_meal_records`.

## 🎯 Estatísticas Calculadas

1. **Total de Refeições**: Contagem de todos os registros filtrados
2. **Receita Total**: Soma de todos os valores (price)
3. **Preço Médio**: Receita total ÷ Total de refeições
4. **Usuários Únicos**: Quantidade de usuários distintos

## 🔍 Detalhes Técnicos

### Performance
- ✅ Carregamento otimizado com filtros no banco
- ✅ Filtros adicionais no client-side
- ✅ Cálculos memoizados (useMemo)
- ✅ Loading states para feedback visual

### Segurança
- ✅ Validação de permissões (role: 'manager')
- ✅ Permissão específica: 'relatorios'
- ✅ RLS não aplicado (conforme especificação)
- ✅ Validação de dados antes de exportar

### Responsividade
- ✅ Layout adaptável para mobile/tablet/desktop
- ✅ Tabelas com scroll horizontal em telas pequenas
- ✅ Cards estatísticos em grid responsivo
- ✅ Filtros empilhados em mobile

## 🐛 Resolução de Problemas

### Relatórios não aparecem
1. Verifique se executou o SQL de permissões
2. Faça logout e login novamente
3. Confirme que o gerente tem `"relatorios"` nas permissions

### Filtros não funcionam
1. Verifique a conexão com Supabase
2. Confirme que as tabelas existem:
   - `meal_records`
   - `extra_meal_records`
   - `users`
   - `companies`
   - `meal_types`

### Exportação não funciona
1. **PDF**: Verifique se jspdf e jspdf-autotable estão instalados
2. **Excel**: Verifique se xlsx está instalado
3. Desabilite bloqueadores de pop-up
4. Teste com poucos registros primeiro

### Dados não aparecem
1. Ajuste o período de filtro (data início/fim)
2. Remova filtros específicos (empresa, tipo)
3. Verifique se há registros no banco
4. Use o botão "Hoje" para filtro rápido

## ✨ Melhorias Futuras (Sugestões)

1. **Gráficos Visuais**
   - Gráfico de linha (refeições por dia)
   - Gráfico de pizza (distribuição por tipo)
   - Gráfico de barras (empresas)

2. **Filtros Adicionados**
   - Filtro por usuário específico
   - Filtro por setor
   - Filtro por turno

3. **Exportação Avançada**
   - Agendar relatórios automáticos
   - Enviar por email
   - Salvar templates de filtros

4. **Análises**
   - Comparação entre períodos
   - Tendências e previsões
   - Alertas e notificações

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador (F12)
2. Confirme a conexão com Supabase
3. Teste com dados de exemplo
4. Revise as permissões do gerente

---

**Status**: ✅ **Concluído e Funcional**
**Versão**: 1.0
**Data**: 08/10/2025
**Compatível com**: Supabase + React + TypeScript
