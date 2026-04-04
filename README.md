# AuraFit — AI-Powered Personal Styling Platform

A premium styling intelligence platform that delivers personalized recommendations for Indian, Western, and Fusion dressing based on body shape, proportions, coloring, facial features, age, and transformation goals.

## Architecture

**Rule Engine First, AI Assist Second** — Expert styling knowledge lives in 19 YAML rule files (116 rules). Claude vision handles photo analysis only.

```
backend/app/
  main.py              # FastAPI app with lifespan
  config.py            # Settings (pydantic-settings)
  database.py          # PostgreSQL async connection
  models/
    schemas.py         # Pydantic request/response models
    db.py              # SQLAlchemy ORM (5 tables)
  services/
    analyzer.py        # Claude vision photo analysis
    rule_engine.py     # YAML rule loader + matcher
    recommender.py     # Combines rules + AI
    report_generator.py # PDF report generation
  api/
    routes.py          # All API endpoints
  rules/               # 19 YAML rule files
    body/              # Body shape rules (men + women + proportions)
    color/             # Undertone palettes, color seasons, makeup
    face/              # Face shape accessories, neckline-jewellery
    indian/            # Saree, lehenga, kurta, sherwani rules
    western/           # Western wear by body shape
    fusion/            # Indo-western combinations
    accessories/       # Footwear, bags, belts, watches
    occasions/         # Casual to bridal occasion modifiers
    goals/             # Look taller, slimmer, broader, etc.
    age/               # Age-based style adjustments

frontend/
  app/
    page.tsx           # Landing page
    upload/page.tsx    # Photo upload + preferences
    results/[jobId]/   # Tabbed results with PDF download
  components/
    Navbar.tsx         # Shared navigation
    Footer.tsx         # Shared footer
  lib/api.ts           # API client + TypeScript interfaces
```

## Quick Start

### Docker (Recommended)

```bash
cp backend/.env.example backend/.env
docker-compose up
```

Opens at [http://localhost:3000](http://localhost:3000). PostgreSQL, backend, and frontend start automatically.

### Local Development

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Update DATABASE_URL to point to local Postgres
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## With Real AI Analysis

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Edit `backend/.env`:
   ```
   MOCK_MODE=false
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Restart the backend

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/health` | Health check + loaded rule categories |
| `POST` | `/analyze` | Upload photos + preferences, get analysis |
| `GET` | `/profile/{job_id}` | Fetch analysis results + recommendations |
| `GET` | `/report/{job_id}` | Download PDF style report |
| `GET` | `/rules/categories` | List loaded rule categories |

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Backend:** FastAPI, Python 3.12, Anthropic SDK
- **Database:** PostgreSQL 16 (async via SQLAlchemy + asyncpg)
- **Rule Engine:** YAML-based with indexed matching
- **AI:** Claude Sonnet (vision analysis)
- **Reports:** ReportLab PDF generation
- **Infrastructure:** Docker Compose
