# 🔍 INSTRUÇÕES SIMPLES PARA DEBUG DOS FILTROS

## ✅ Sistema de Debug Implementado

Implementei um sistema simples e eficaz para capturar todos os logs dos filtros de relatórios em tempo real.

## 🚀 Como Usar

### 1. **Acessar o Sistema de Debug**
1. Faça login como gerente no sistema
2. Navegue para a aba **"Relatórios"**
3. No canto inferior direito, você verá um **botão vermelho com ícone de olho** 👁️

### 2. **Abrir o Painel de Debug**
1. Clique no botão vermelho de debug
2. Um painel será aberto mostrando todos os logs em tempo real
3. Os logs são categorizados por cores:
   - **🔵 Azul**: Logs informativos (info)
   - **🟡 Amarelo**: Avisos (warning)  
   - **🔴 Vermelho**: Erros (error)

### 3. **Testar os Filtros**

#### **Para Refeições Regulares:**
1. Clique em **"Filtros"** na seção "Refeições Regulares"
2. Tente interagir com cada dropdown:
   - **Empresa** - Observe logs com `[REGULAR] EMPRESA`
   - **Tipo de Refeição** - Observe logs com `[REGULAR] TIPO REFEIÇÃO`
   - **Usuário** - Observe logs com `[REGULAR] USUÁRIO`
   - **Status** - Observe logs com `[REGULAR] STATUS`

#### **Para Refeições Extras:**
1. Clique em **"Filtros"** na seção "Refeições Extras"
2. Tente interagir com cada dropdown:
   - **Empresa** - Observe logs com `[EXTRA] EMPRESA`
   - **Status** - Observe logs com `[EXTRA] STATUS`
   - **Tipo de Usuário** - Observe logs com `[EXTRA] TIPO USUÁRIO`

### 4. **Logs Esperados**

#### **✅ Funcionamento Normal:**
```
🎯 [REGULAR] EMPRESA - Trigger clicado
🔄 [REGULAR] EMPRESA - Dropdown ABERTO
🔍 [REGULAR] EMPRESA - Opções disponíveis: [...]
🎯 [REGULAR] EMPRESA - Item CLICADO: {...}
🔄 [REGULAR] EMPRESA - Valor selecionado: "123"
```

#### **❌ Problemas Identificados:**
```
🎯 [REGULAR] EMPRESA - Trigger clicado
❌ PROBLEMA: Não aparece "Dropdown ABERTO"
```

### 5. **Exportar Logs**
1. No painel de debug, clique em **"Exportar"**
2. Isso salvará um arquivo JSON com todos os logs coletados
3. Também tire screenshot do painel para documentar

### 6. **Limpar Logs**
1. Clique em **"Limpar"** para remover todos os logs atuais
2. Útil para fazer testes isolados

## 🔍 O Que Observar

### **Comportamento Normal:**
- ✅ Trigger clicado → Dropdown aberto
- ✅ Opções carregadas → Itens renderizados  
- ✅ Item clicado → Valor selecionado
- ✅ Estado atualizado

### **Problemas Comuns:**
- ❌ **Dropdown não abre**: Só aparece "Trigger clicado"
- ❌ **Sem opções**: Array vazio `[]`
- ❌ **Clique não funciona**: "Item clicado" mas sem seleção
- ❌ **Estado não atualiza**: Seleção sem mudança de valor

## 📊 Cenários de Teste

### **Teste Básico:**
1. Abra o debug
2. Vá para "Refeições Regulares" → "Filtros"
3. Clique no dropdown "Empresa"
4. Tente selecionar uma empresa
5. Observe a sequência de logs

### **Teste Comparativo:**
1. Teste um dropdown que funciona
2. Teste um dropdown que não funciona
3. Compare as diferenças nos logs

### **Teste de Persistência:**
1. Selecione filtros
2. Feche/abra a seção de filtros
3. Verifique se os valores persistem

## 🎯 Objetivo

Com estes logs, conseguiremos identificar exatamente onde cada dropdown está falhando e aplicar correções precisas.

**Execute os testes e colete os logs para análise definitiva!**

---

**Status: Sistema de debug simples implementado ✅**