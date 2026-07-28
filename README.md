# NdoloStitch

> "Where Cameroonian Fashion Connects"

AI-Powered platform connecting customers with verified Cameroonian fashion designers, vendors, and marketers.

---

## Team

| Name        | Role               | Branch               | Owns                          |
|-------------|--------------------|----------------------|-------------------------------|
| Jeason Angel | Frontend Developer | `feature/frontend`  | `app/` `components/`          |
| Faith Angel  | Backend Developer  | `feature/backend`   | `lib/` `api/` `prisma/`       |
| Gabe         | MLOps Engineer     | `feature/ml`        | `ml-service/`                 |
| Deyo         | DevOps Engineer    | `feature/devops`    | `.github/` `vercel.json`      |

---

## Project Structure

```
ndolostitch/
├── app/                  # Next.js 15 App Router pages (Jeason)
├── components/           # Shared UI components (Jeason)
├── lib/                  # DB, auth, and utility helpers (Faith)
├── api/                  # API route handlers (Faith)
├── prisma/               # Prisma schema and migrations (Faith)
├── ml-service/           # FastAPI ML service — Python (Gabe)
└── .github/workflows/    # CI/CD pipelines (Deyo)
```

---

## Tech Stack

**Frontend**
- Next.js 15 (App Router) + TypeScript
- TailwindCSS + shadcn/ui
- Zustand + React Query
- Framer Motion

**Backend**
- Supabase (Auth, Database, Storage, Realtime)
- Prisma ORM + PostgreSQL
- Redis (Upstash) for caching
- Inngest for background jobs

**ML Service**
- FastAPI (Python 3.12)
- CLIP ViT-B/32 for visual search
- GPT-4o for style assistant
- Pinecone vector database

**DevOps**
- Vercel (hosting)
- GitHub Actions (CI/CD)
- Sentry (error monitoring)

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-org/ndolostitch.git
cd ndolostitch
```

### 2. Switch to your branch

```bash
git checkout feature/your-branch-name
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
# Fill in your values in .env.local
```

### 4. Install dependencies (Frontend/Backend)

```bash
npm install
```

### 5. Run the development server

```bash
npm run dev
```

### 6. Run the ML service (Gabe)

```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## Branch Rules

- **Never push directly to `main` or `develop`**
- Work only on your assigned branch
- Only edit files inside your assigned folder
- Open a PR into `develop` when your work is ready
- Pull from `develop` every morning before starting

```
main       ← production (Gloria merges here at end of day)
develop    ← integration (Gloria merges PRs here)
feature/*  ← individual work branches
```

---

## Daily Workflow

```bash
# Every morning — sync with latest
git checkout develop
git pull origin develop
git checkout feature/your-branch
git merge develop

# During the day — commit often
git add .
git commit -m "feat: description of what you did"
git push origin feature/your-branch

# End of day — open a PR into develop on GitHub
```

---

## Environment Variables

See `.env.example` for all required variables.  
Each section is labeled with the responsible teammate.  
**Never commit `.env.local` or any file with real secrets.**
