# Fruit Store Financial Application

A full-stack application for managing fruit inventory, sales, and financial reports.

## Features

- **Inventory Management**: Track fruit stock with FIFO (First-In-First-Out) cost calculation.
- **Sales & Purchases**: Record transactions and automatically update inventory and journals.
- **Financial Reports**: Generate Profit & Loss and Balance Sheet reports.
- **Performance Tracking**: View sales performance by day, week, month, and year.
- **Account Management**: Manage chart of accounts.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide React, Motion.
- **Backend**: Node.js, Express, PostgreSQL (Neon).
- **Deployment**: Vercel.

## Setup Instructions

### 1. Database Setup (Neon)

1. Create a project on [Neon.tech](https://neon.tech).
2. Create a PostgreSQL database.
3. Get your connection string (e.g., `postgresql://user:password@host/dbname?sslmode=require`).

### 2. Environment Variables

Create a `.env` file in the root directory (or set these in Vercel):

```env
DATABASE_URL=your_neon_connection_string
GEMINI_API_KEY=your_gemini_api_key (optional, if using AI features)
```

### 3. Local Development

```bash
npm install
npm run dev
```

### 4. Deployment to Vercel

1. Push this repository to GitHub.
2. Connect your GitHub repository to [Vercel](https://vercel.com).
3. Add the environment variables (`DATABASE_URL`) in the Vercel project settings.
4. Deploy!

## License

MIT
