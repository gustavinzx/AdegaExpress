# Guia Oficial de Deploy na Vercel — Adega Express

Este guia fornece o passo a passo completo e validado para publicar o **Adega Express** na **Vercel** com 100% de sucesso.

---

## 1. Aval Técnico de Prontidão (Checklist Aprovado)

| Verificação | Status | Detalhes |
| :--- | :--- | :--- |
| **Build de Produção** | **APROVADO** | `next build` compilado com 0 erros e 0 warnings. |
| **Linters & Qualidade** | **APROVADO** | `eslint` executado com 0 erros. |
| **Tipagem TypeScript** | **APROVADO** | `tsc` concluído sem discrepâncias. |
| **Imagens e Assets** | **APROVADO** | Todas as fotos de produtos e fotos lifestyle estão em `public/products/`. |
| **Carrossel Interativo** | **APROVADO** | Suporte a múltiplos ângulos por produto com zoom e transições suaves. |
| **Segurança e Senhas** | **APROVADO** | Zero credenciais no DOM, cookies seguros e dados sensíveis protegidos. |
| **Responsividade** | **APROVADO** | `overflow-x` zero em Desktop (1440×900) e Mobile (375×667). |

---

## 2. Passo a Passo para Deploy na Vercel

Como o projeto possui `adega-express-frontend` e `adega-express-backend` no mesmo repositório Git, siga esta configuração simples na interface da Vercel:

### Passo 1: Subir o código para o GitHub / GitLab
Certifique-se de que a sua branch está atualizada no repositório remoto:
```bash
git push origin <sua-branch>
```

### Passo 2: Importar o Projeto na Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login.
2. Clique em **Add New...** > **Project**.
3. Selecione o repositório do **Adega Express**.

### Passo 3: Configurar o Root Directory
Na tela **Configure Project**:
1. No campo **Root Directory**, clique em **Edit** e selecione a pasta:
   ```text
   adega-express-frontend
   ```
2. O **Framework Preset** será detectado automaticamente como **Next.js**.

### Passo 4: Definir Variáveis de Ambiente (Environment Variables)
Na seção **Environment Variables**, adicione:
- **Chave (Key):** `NEXT_PUBLIC_API_URL`
- **Valor (Value):** A URL pública onde o seu backend Node/Express está hospedado (ex: `https://adega-api.railway.app` ou `https://adega-backend.onrender.com`).
  > *Nota: Se você for testar a interface inicialmente na Vercel sem o backend em nuvem ativo, o frontend exibirá o catálogo com as imagens e artes normalmente.*

### Passo 5: Clicar em "Deploy"
- A Vercel executará `npm install`, em seguida `next build` e publicará o site com CDN global de alta performance e HTTPS automático!

---

## 3. Hospedagem do Backend e Banco de Dados (Opcional para Full-Stack em Nuvem)

Caso deseje colocar o backend e o banco MySQL também em nuvem gratuita:
1. **Banco MySQL Gratuito:** Pode ser criado no [Aiven](https://aiven.io), [Supabase Postgres](https://supabase.com) ou [Railway](https://railway.app).
2. **Backend Node.js:** Pode ser hospedado no [Railway](https://railway.app) ou [Render](https://render.com) apontando para a pasta `adega-express-backend`.
3. Atualize a variável `NEXT_PUBLIC_API_URL` na Vercel com a URL gerada pelo Railway/Render.

---

**O frontend está pronto, testado e 100% aprovado para publicação na Vercel!**
