# Tavlo

Your personal "second brain" for social media content. Capture links from Twitter, Instagram, and LinkedIn, automatically distill them with AI, and review them later.

## Features

- **Capture** - Save URLs from any social platform or webpage
- **AI Distillation** - Automatic summarization, tagging, and classification
- **Daily Review** - Focused "Today" view with triage actions (Pin/Archive/Delete)
- **Search & Browse** - Find saved content with search and filters
- **Mobile Quick-Add** - iOS Shortcuts / Android HTTP share integration

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: Clerk (Google OAuth)
- **Database**: Supabase Postgres + Prisma
- **AI**: OpenAI GPT-4.1-mini
- **UI**: Tailwind CSS + shadcn/ui

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd contenthub
npm install
```

### 2. Set Up Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase Postgres connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `OPENAI_API_KEY` | OpenAI API key |
| `QUICK_ADD_SECRET` | Random secret for mobile shortcuts |

### 3. Set Up Clerk

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Enable Google OAuth in Clerk Dashboard
3. Copy the keys to your `.env` file
4. (Optional) Set up the webhook endpoint for user sync:
   - URL: `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`

### 4. Set Up Database

Push the schema to your Supabase database:

```bash
npm run db:push
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using Tavlo.

## iOS Shortcut Setup

To save content from your iPhone:

1. Create a new Shortcut
2. Add "Get URLs from Input"
3. Add "Get Contents of URL":
   - URL: `https://your-domain.com/api/quick-add`
   - Method: POST
   - Headers: `Authorization: Bearer YOUR_QUICK_ADD_SECRET`
   - Request Body: JSON with `{"url": "<URLs>"}`
4. Add the shortcut to your Share Sheet

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/     # Protected pages
│   │   ├── today/       # Daily review
│   │   ├── items/       # Browse & search
│   │   └── add/         # Manual capture
│   ├── api/
│   │   ├── items/       # Items CRUD
│   │   ├── quick-add/   # Mobile shortcut
│   │   └── webhooks/    # Clerk webhook
│   └── sign-in/         # Auth pages
├── components/
│   ├── ui/              # shadcn components
│   └── items/           # Item components
└── lib/
    ├── db.ts            # Prisma client
    ├── extractor.ts     # URL content extraction
    ├── openai.ts        # AI summarization
    ├── pipeline.ts      # Processing orchestration
    └── schemas.ts       # Zod validation
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio |

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

Make sure to set `NEXT_PUBLIC_APP_URL` to your production domain.

## License

MIT
