# GrantShield

Fraud detection for green rebate, grant, and tax credit applications — keeping government funding out of the wrong hands.

GrantShield is a full-stack application that screens government grant applications in real time using identity verification, fraud detection, credit reports, criminal background checks, and eviction records. It combines results from five screening services into a weighted risk score with an automated approve/review/deny recommendation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| State | Zustand |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT + bcrypt |
| APIs | CRS Credit API (LexisNexis FlexID, AtData FraudFinder, Experian, CIC Criminal, CIC Eviction) |
| PDF | PDFKit |
| Charts | Recharts |

## Architecture

```
grant-shield/
├── client/              # React SPA (Vite)
│   └── src/
│       ├── pages/       # Login, Dashboard, Applications, Analytics, Settings
│       ├── components/  # Screening cards, layout, shared UI
│       ├── store/       # Zustand state management
│       └── api/         # Axios HTTP client
├── server/              # Express API
│   └── src/
│       ├── routes/      # Auth, Applications, Screening, Analytics
│       ├── services/    # CRS integrations, fraud engine
│       └── middleware/  # JWT auth, error handling
└── prisma/
    └── schema.prisma    # Database models
```

## Screening Pipeline

When an application is submitted, GrantShield runs five checks through the CRS Credit API:

| Check | Provider | What It Does | Weight |
|-------|----------|-------------|--------|
| Identity Verification | LexisNexis FlexID | Verifies name, SSN, DOB, address, phone, email. Returns a CVI score (0-50) | 35% |
| Fraud Analysis | AtData FraudFinder | Validates email, checks phone ownership, detects VPN/proxy, verifies address deliverability | 35% |
| Credit Report | Experian Prequal | Pulls credit scores, tradelines, inquiries, public records | 15% |
| Criminal Background | CIC | Searches criminal records for offenses and dispositions | 7.5% |
| Eviction Records | CIC | Searches court records for eviction filings | 7.5% |

Results are combined by the fraud engine into a weighted overall risk score:

- **0-25** Low risk &rarr; APPROVE
- **25-55** Medium risk &rarr; REVIEW
- **55-80** High risk &rarr; DENY
- **80+** Critical risk &rarr; DENY

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- CRS API credentials (provided for hackathon)

### Setup

```bash
# Clone and install
git clone <repo-url>
cd grant-shield
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and CRS credentials
```

### Environment Variables

```env
DATABASE_URL=postgresql://user@localhost:5432/grantshield
CRS_USERNAME=your_crs_username
CRS_PASSWORD=your_crs_password
JWT_SECRET=your_jwt_secret
PORT=3001
NODE_ENV=development
VITE_API_URL=http://localhost:3001/api
```

### Database

```bash
# Push schema to database
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed with test data
npm run seed
```

### Run

```bash
# Start both client and server
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Demo Login

```
Email:    admin@grantshield.gov
Password: demo1234
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate and receive JWT |
| GET | `/api/applications` | List applications (filterable by status, program, search) |
| POST | `/api/applications` | Create new application |
| GET | `/api/applications/:id` | Get application with screening results |
| PATCH | `/api/applications/:id` | Update status, notes, or override decision |
| POST | `/api/screening/:id/run` | Run full screening pipeline |
| GET | `/api/analytics/overview` | Dashboard statistics |

## Sandbox Test Data

The CRS sandbox APIs only accept specific test personas. The seed data and new application form are pre-populated with these personas:

**FlexID (Identity Verification):**

| Name | SSN | DOB | State |
|------|-----|-----|-------|
| MIRANDA JJUNIPER | 540325127 | 1955-11-13 | GA |
| PEGGY GRAVES | — | 1958-09-09 | SC |
| CRYSTAL GOODLEY | — | 1949-03-23 | NC |
| HASAN GIDI | — | 1963-10-02 | PA |
| JOHN COPE | 574709961 | 1973-08-01 | CA |

**FraudFinder (Fraud Detection):**

| Email | Phone | IP | Address |
|-------|-------|----|---------|
| test@example.com | 5551234567 | 1.2.3.4 | 123 Main Street, Anytown, CA 90210 |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client + server in development mode |
| `npm run build` | Build both client and server for production |
| `npm run seed` | Seed database with test applications |
| `npm run db:push` | Sync Prisma schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run test` | Run test suites |

## Built With

Built at SF Hacks 2026 using the [CRS Credit API](https://crscreditapi.com/).
