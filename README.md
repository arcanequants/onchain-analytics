# Vectorial Data

**Live at:** https://vectorialdata.com

Real-time blockchain analytics, gas price tracking, and on-chain metrics for humans and AI agents.

## Features

- **Gas Tracker**: Real-time gas prices for Ethereum, Polygon, Arbitrum, Optimism, and Base
- **Fear & Greed Index**: Market sentiment analysis
- **Event Calendar**: Upcoming crypto events and deadlines
- **DEX Analytics**: Trading volume and liquidity metrics
- **API Access**: RESTful API for developers and AI agents

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Styling**: Cyberpunk/Futuristic theme

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL`: Supabase PostgreSQL connection string
- `NEXT_PUBLIC_ALCHEMY_API_KEY`: Alchemy API key for RPC access
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Google Analytics tracking ID

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy
vercel
```

## Project Structure

```
app/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── page.tsx      # Homepage
│   │   ├── layout.tsx    # Root layout
│   │   ├── globals.css   # Global styles
│   │   ├── privacy/      # Privacy policy page
│   │   ├── terms/        # Terms of service page
│   │   ├── about/        # About page
│   │   └── contact/      # Contact page
│   ├── components/       # React components
│   └── lib/              # Utilities and helpers
├── public/               # Static files
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Roadmap

### Week 0 (Infrastructure) ✅ COMPLETE
- [x] Database schema (11 tables + 2 materialized views)
- [x] Supabase integration with RLS
- [x] Sentry error tracking
- [x] CRON job infrastructure
- [x] GitHub repository
- [x] Vercel deployment

### Week 1 ✅ COMPLETE
- [x] Project setup
- [x] Legal pages
- [x] Google Analytics
- [x] Gas Tracker MVP (5 chains)
- [x] Deploy to production

### Week 2 ✅ COMPLETE
- [x] Gas Tracker (live data with CRON jobs)
- [x] Price tracking integration
- [x] Token price history (7-day charts)
- [x] Multi-chain support (5 chains)

### Week 3 (Current) - Wallet Analytics 🎯
- [x] **Wallet Tracker** - Multi-chain portfolio tracker
  - [x] Token balance aggregation (Ethereum, Base, Arbitrum, Optimism, Polygon)
  - [x] Real-time USD valuations
  - [x] Chain distribution analytics
  - [x] Top holdings visualization
  - [x] Token icons with jsDelivr CDN
  - [x] Chain selection with auto-refresh
  - [x] Responsive minimalist UI
- [x] **NFT Gallery** - NFT portfolio viewer
  - [x] Alchemy API integration
  - [x] Multi-chain NFT fetching (5 chains)
  - [x] NFT metadata display (title, collection, description)
  - [x] Image galleries with lazy loading
  - [x] Spam filtering (client-side toggle)
  - [x] Floor price tracking (Ethereum)
  - [x] ERC-721 and ERC-1155 support
  - [x] NFT detail modal
- [x] **Database** - Wallet & NFT caching
  - [x] `wallet_balances` table migration
  - [x] `wallet_nfts` table migration
  - [x] Automatic cache refresh logic
  - [x] Performance optimization

### Week 4 - In Progress
- [ ] Fear & Greed Index integration
- [ ] Event Calendar
- [ ] SEO optimization
- [ ] Wallet History tracking (transaction history)
- [ ] Token price charts (detailed view)

### Month 2 - Advanced Features
- [ ] **Portfolio Analytics**
  - [ ] Multi-wallet comparison
  - [ ] Historical performance tracking
  - [ ] Profit/loss calculations
  - [ ] Portfolio diversity metrics
- [ ] **NFT Features**
  - [ ] NFT price history charts
  - [ ] Collection analytics
  - [ ] Rarity rankings
  - [ ] NFT marketplace links
- [ ] **Wallet Insights**
  - [ ] DeFi position tracking
  - [ ] Staking rewards
  - [ ] Liquidity pool positions
  - [ ] Smart contract interactions

### Month 3 - API & Monetization
- [ ] Public API endpoints
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Rate limiting & API keys
- [ ] User authentication
- [ ] Premium features (advanced analytics)
- [ ] Ad network integration (Coinzilla)
- [ ] Affiliate partnerships

## License

© 2024 OnChain Analytics. All rights reserved.

## Contact

- Website: [vectorialdata.com](https://vectorialdata.com)
- Email: support@vectorialdata.com
- GitHub: [github.com/arcanequants/onchain-analytics](https://github.com/arcanequants/onchain-analytics)
