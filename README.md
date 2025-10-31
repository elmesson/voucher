# Sistema de Gestão de Refeições - Mello Voucher

Sistema de gestão de vouchers e refeições desenvolvido com React, Vite, Capacitor e Supabase.

Figma: https://www.figma.com/design/BcudtqxvHCqL1VHNLpzkra/Sistema-de-Gest%C3%A3o-de-Refei%C3%A7%C3%B5es--Copy-

## 🚀 Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Radix UI, Tailwind CSS, Shadcn/ui
- **Mobile**: Capacitor 6
- **Backend**: Supabase
- **Build**: GitHub Actions

## 📱 Desenvolvimento

### Instalação

```bash
npm install
```

### Desenvolvimento Web

```bash
npm run dev
```

### Build Web

```bash
npm run build
```

## 📱 Android

### Build Local - Debug

```bash
npm run build:android:debug
```

### Build Local - Release

```bash
npm run build:android
```

### Abrir no Android Studio

```bash
npm run cap:open:android
```

## 🤖 GitHub Actions - Build Automático

O projeto está configurado para gerar APKs automaticamente via GitHub Actions.

### Builds Automáticos

O build é executado automaticamente quando:
- Você faz push na branch `main` ou `master`
- Você abre um Pull Request

### Build Manual

1. Acesse a aba **Actions** no GitHub
2. Selecione **Build Android APK** no menu lateral
3. Clique em **Run workflow**
4. (Opcional) Insira um número de versão personalizado
5. Clique em **Run workflow** novamente

### Download dos APKs

#### Método 1: Artifacts (Todas as builds)
1. Acesse a aba **Actions**
2. Clique na build desejada
3. Role até **Artifacts** no final da página
4. Faça download de:
   - `app-debug-apk` - APK de debug
   - `app-release-apk` - APK de release (não assinado)

#### Método 2: Releases (Apenas builds da branch main)
1. Acesse a aba **Releases**
2. Clique na release desejada
3. Faça download dos APKs em **Assets**

### Nomenclatura dos APKs

- `mello-voucher-v{VERSION}-debug.apk` - Para desenvolvimento e testes
- `mello-voucher-v{VERSION}-release-unsigned.apk` - Versão otimizada (precisa ser assinada)

### ⚡ Melhorias do Workflow

- ✅ Cache de dependências (npm e Gradle) para builds mais rápidos
- ✅ Versionamento automático ou manual
- ✅ Upload automático de APKs como artifacts
- ✅ Criação automática de releases
- ✅ Sumário detalhado do build
- ✅ Suporte para branches main e master
- ✅ Retenção de 30 dias para debug e 90 dias para release

## 🔐 Assinatura do APK (Produção)

Para distribuir o app na Google Play Store, você precisa assinar o APK.

### Gerar Keystore (Primeira vez)

```bash
keytool -genkey -v -keystore mello-voucher.keystore -alias mello-voucher -keyalg RSA -keysize 2048 -validity 10000
```

### Configurar no GitHub Actions

1. Converta o keystore para base64:
   ```bash
   base64 mello-voucher.keystore > keystore.txt
   ```

2. No GitHub, vá em **Settings** → **Secrets and variables** → **Actions**

3. Adicione os seguintes secrets:
   - `KEYSTORE_BASE64`: Conteúdo do arquivo keystore.txt
   - `KEYSTORE_PASSWORD`: Senha do keystore
   - `KEY_ALIAS`: Alias da chave (ex: mello-voucher)
   - `KEY_PASSWORD`: Senha da chave

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build da aplicação web
- `npm run cap:sync` - Sincroniza com Capacitor
- `npm run cap:open:android` - Abre no Android Studio
- `npm run build:android:debug` - Build APK debug
- `npm run build:android` - Build APK release

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
2. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
3. Push para a branch (`git push origin feature/AmazingFeature`)
4. Abra um Pull Request

## 📄 Licença

Este projeto é proprietário da Mello Transporte.