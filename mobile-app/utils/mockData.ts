import { Item, UserStats } from '../types';

// Mock User Stats - Enhanced for production
export const mockUserStats: UserStats = {
  totalXp: 4850,
  currentStreak: 12,
  level: 15,
};

// High-quality Unsplash image URLs by category
const IMAGES = {
  tech: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800',
  ],
  ai: [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    'https://images.unsplash.com/photo-1676299081847-c3c9b3e9d3a6?w=800',
    'https://images.unsplash.com/photo-1684369176170-463e84248b70?w=800',
    'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=800',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800',
  ],
  coding: [
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
    'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
    'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
  ],
  productivity: [
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800',
    'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
    'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800',
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
  ],
  business: [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
  ],
  design: [
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
    'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800',
    'https://images.unsplash.com/photo-1545235617-9465d2a55698?w=800',
    'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=800',
    'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=800',
  ],
  finance: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800',
    'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800',
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
    'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=800',
  ],
  health: [
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
  ],
  social: [
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800',
    'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800',
    'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=800',
    'https://images.unsplash.com/photo-1432888622747-4eb9a8f5c1ed?w=800',
    'https://images.unsplash.com/photo-1522543558187-768b6df7c25c?w=800',
  ],
  cloud: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
    'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800',
    'https://images.unsplash.com/photo-1560732488-6b0df240254a?w=800',
    'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800',
  ],
};

// Production-quality mock items - 60+ items
export const mockItems: Item[] = [
  // ==================== TWITTER/X POSTS ====================
  {
    id: 'tw-1',
    url: 'https://x.com/elonmusk/status/ai-future-2025',
    title: 'The Future of AI: Why 2025 Will Be the Year Everything Changes',
    summary: 'Elon Musk shares his predictions for AI in 2025, including breakthroughs in autonomous systems, AGI progress, and the impact on jobs. He emphasizes the need for AI safety measures while highlighting the incredible potential for solving global challenges.',
    note: 'Key predictions to track',
    tags: ['ai', 'future', 'technology', 'predictions', 'elon musk'],
    imageUrl: IMAGES.ai[0],
    type: 'learn',
    status: 'pinned',
    xpEarned: 25,
    source: 'x.com',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tw-2',
    url: 'https://x.com/naval/status/wealth-creation-thread',
    title: 'How to Get Rich Without Getting Lucky - A Thread',
    summary: 'Naval Ravikant breaks down the principles of wealth creation: seek wealth not money, play long-term games with long-term people, learn to sell and learn to build. Arm yourself with specific knowledge, accountability, and leverage.',
    tags: ['wealth', 'entrepreneurship', 'mindset', 'career'],
    imageUrl: IMAGES.business[0],
    type: 'reference',
    status: 'pinned',
    xpEarned: 20,
    source: 'x.com',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tw-3',
    url: 'https://x.com/dan_abramov/status/react-19-deep-dive',
    title: 'React 19 Deep Dive: Server Components Explained Simply',
    summary: 'Dan Abramov explains React Server Components in plain English. Learn how RSC reduces client-side JavaScript, improves performance, and changes how we think about data fetching. Includes practical migration tips.',
    tags: ['react', 'javascript', 'webdev', 'frontend'],
    imageUrl: IMAGES.coding[0],
    type: 'learn',
    status: 'new',
    xpEarned: 15,
    source: 'x.com',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tw-4',
    url: 'https://x.com/levelsio/status/12-startups-12-months',
    title: 'I Made $2.7M Last Year Building Indie Projects - Here\'s How',
    summary: 'Pieter Levels shares his approach to building profitable startups as a solo founder. Key insights: ship fast, validate quickly, focus on SEO, automate everything, and build in public. Revenue breakdown included.',
    note: 'Study this business model',
    tags: ['startup', 'indie hacker', 'entrepreneurship', 'revenue'],
    imageUrl: IMAGES.business[1],
    type: 'reference',
    status: 'new',
    xpEarned: 15,
    source: 'x.com',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tw-5',
    url: 'https://x.com/karpathy/status/llm-training-guide',
    title: 'A Complete Guide to Training Your Own LLM from Scratch',
    summary: 'Andrej Karpathy shares a comprehensive guide on training language models. Covers data preparation, tokenization, architecture choices, training infrastructure, and evaluation. Perfect for ML engineers wanting to understand LLMs deeply.',
    tags: ['llm', 'machine learning', 'ai', 'deep learning'],
    imageUrl: IMAGES.ai[1],
    type: 'learn',
    status: 'new',
    xpEarned: 15,
    source: 'x.com',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tw-6',
    url: 'https://x.com/csallen/status/bootstrapping-saas',
    title: 'From $0 to $30K MRR: The Indie Hackers Playbook',
    summary: 'Courtland Allen breaks down the strategies that work for bootstrapped founders in 2025. Focus on solving painful problems, charge more than you think, and build an audience before you build a product.',
    tags: ['saas', 'startup', 'bootstrapping', 'marketing'],
    imageUrl: IMAGES.business[2],
    type: 'do',
    status: 'reviewed',
    xpEarned: 20,
    source: 'x.com',
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tw-7',
    url: 'https://x.com/svpino/status/python-tips-2025',
    title: '10 Python Features Most Developers Don\'t Know About',
    summary: 'Santiago shares lesser-known Python features: structural pattern matching, walrus operator tricks, dataclasses with slots, type guards, and async context managers. Code examples included for each.',
    tags: ['python', 'programming', 'tips', 'coding'],
    imageUrl: IMAGES.coding[1],
    type: 'learn',
    status: 'new',
    xpEarned: 10,
    source: 'x.com',
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tw-8',
    url: 'https://x.com/gregisenberg/status/ai-startup-ideas',
    title: '15 AI Startup Ideas That Will Make Millions in 2025',
    summary: 'Greg Isenberg shares untapped AI business opportunities: AI-powered legal document review, automated video editing, personalized education, healthcare diagnostics, and more. Each idea includes market size and competition analysis.',
    tags: ['ai', 'startup ideas', 'business', 'opportunities'],
    imageUrl: IMAGES.ai[2],
    type: 'reference',
    status: 'new',
    xpEarned: 10,
    source: 'x.com',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },

  // ==================== LINKEDIN POSTS ====================
  {
    id: 'li-1',
    url: 'https://linkedin.com/posts/satyanadella/ai-transformation',
    title: 'How Microsoft is Transforming Every Product with AI',
    summary: 'Satya Nadella outlines Microsoft\'s AI strategy across Office, Azure, GitHub Copilot, and Windows. Discusses the responsibility of AI development and the importance of building trust through transparency.',
    tags: ['microsoft', 'ai', 'enterprise', 'strategy'],
    imageUrl: IMAGES.tech[0],
    type: 'learn',
    status: 'new',
    xpEarned: 15,
    source: 'linkedin.com',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'li-2',
    url: 'https://linkedin.com/posts/raborenstein/system-design-patterns',
    title: '16 System Design Concepts Every Senior Engineer Must Know',
    summary: 'A comprehensive breakdown of essential system design patterns: CAP theorem, database sharding, message queues, load balancing, caching strategies, circuit breakers, and event sourcing. Interview-ready explanations.',
    note: 'Perfect for interview prep',
    tags: ['system design', 'architecture', 'engineering', 'interviews'],
    imageUrl: IMAGES.tech[1],
    type: 'learn',
    status: 'pinned',
    xpEarned: 25,
    source: 'linkedin.com',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'li-3',
    url: 'https://linkedin.com/posts/sarahahlawat/career-growth',
    title: 'I Went from Junior to Staff Engineer in 4 Years - Here\'s My Framework',
    summary: 'Sarah shares her accelerated career growth framework: take ownership of ambiguous problems, document everything, build relationships across teams, and always understand the business impact of your work.',
    tags: ['career', 'engineering', 'growth', 'leadership'],
    imageUrl: IMAGES.business[3],
    type: 'reference',
    status: 'reviewed',
    xpEarned: 20,
    source: 'linkedin.com',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'li-4',
    url: 'https://linkedin.com/posts/jennyjiang/negotiation-secrets',
    title: 'How I Negotiated a $80K Higher Offer: A Step-by-Step Guide',
    summary: 'Jenny reveals her negotiation strategy that led to an $80K increase in her offer. Key tactics: always negotiate, get competing offers, focus on total compensation, and practice your delivery.',
    tags: ['negotiation', 'salary', 'career', 'job search'],
    imageUrl: IMAGES.business[4],
    type: 'do',
    status: 'new',
    xpEarned: 15,
    source: 'linkedin.com',
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'li-5',
    url: 'https://linkedin.com/posts/alexhormozi/business-lessons',
    title: 'The $100M Business Lessons I Wish I Knew at 20',
    summary: 'Alex Hormozi shares the business principles that helped him build multiple 8-figure companies: focus on one thing, charge premium prices, invest in marketing, and build systems not just products.',
    note: 'Gold advice for entrepreneurs',
    tags: ['business', 'entrepreneurship', 'lessons', 'growth'],
    imageUrl: IMAGES.business[0],
    type: 'reference',
    status: 'pinned',
    xpEarned: 20,
    source: 'linkedin.com',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'li-6',
    url: 'https://linkedin.com/posts/cassiekozyak/product-management',
    title: 'The Product Manager\'s Guide to Saying No (Without Burning Bridges)',
    summary: 'Cassie shares frameworks for declining feature requests diplomatically. Learn to use data to support decisions, propose alternatives, and maintain relationships while protecting your roadmap.',
    tags: ['product management', 'communication', 'leadership', 'strategy'],
    imageUrl: IMAGES.productivity[0],
    type: 'do',
    status: 'new',
    xpEarned: 10,
    source: 'linkedin.com',
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'li-7',
    url: 'https://linkedin.com/posts/drjohnsullivan/hiring-trends',
    title: 'The Hiring Landscape Has Changed Forever - Here\'s What Matters Now',
    summary: 'Dr. Sullivan analyzes post-pandemic hiring trends: skills-based hiring over degrees, async interviews, AI screening tools, and the rise of contract-to-hire. Data from 500+ companies included.',
    tags: ['hiring', 'hr', 'trends', 'workplace'],
    imageUrl: IMAGES.business[2],
    type: 'learn',
    status: 'new',
    xpEarned: 10,
    source: 'linkedin.com',
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
  },

  // ==================== YOUTUBE VIDEOS ====================
  {
    id: 'yt-1',
    url: 'https://youtube.com/watch?v=microservices-patterns',
    title: 'Microservices Architecture Patterns - Complete 3 Hour Course',
    summary: 'A comprehensive course covering microservices patterns: API Gateway, Service Discovery, Circuit Breaker, Event Sourcing, CQRS, and Saga patterns. Includes hands-on examples with Node.js and Docker.',
    note: 'Watch during weekend',
    tags: ['microservices', 'architecture', 'tutorial', 'backend'],
    imageUrl: IMAGES.cloud[0],
    type: 'learn',
    status: 'new',
    xpEarned: 15,
    source: 'youtube.com',
    createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'yt-2',
    url: 'https://youtube.com/watch?v=typescript-advanced',
    title: 'TypeScript Advanced Patterns: Generics, Mapped Types & More',
    summary: 'Master TypeScript\'s advanced type system: conditional types, infer keyword, template literal types, and building type-safe APIs. Perfect for developers ready to level up their TS skills.',
    tags: ['typescript', 'javascript', 'programming', 'advanced'],
    imageUrl: IMAGES.coding[2],
    type: 'learn',
    status: 'reviewed',
    xpEarned: 20,
    source: 'youtube.com',
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'yt-3',
    url: 'https://youtube.com/watch?v=kubernetes-production',
    title: 'Kubernetes in Production: Lessons from Running 1000+ Clusters',
    summary: 'Real-world Kubernetes lessons from a platform team managing thousands of clusters. Covers resource optimization, security best practices, monitoring strategies, and disaster recovery.',
    tags: ['kubernetes', 'devops', 'production', 'cloud'],
    imageUrl: IMAGES.cloud[1],
    type: 'learn',
    status: 'new',
    xpEarned: 15,
    source: 'youtube.com',
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'yt-4',
    url: 'https://youtube.com/watch?v=figma-ui-design',
    title: 'Figma UI Design: From Wireframe to High-Fidelity in 2 Hours',
    summary: 'Complete UI design workflow in Figma: wireframing, component creation, auto-layout, variants, prototyping, and handoff to developers. Design a complete mobile app from scratch.',
    tags: ['figma', 'ui design', 'design', 'tutorial'],
    imageUrl: IMAGES.design[0],
    type: 'do',
    status: 'new',
    xpEarned: 10,
    source: 'youtube.com',
    createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'yt-5',
    url: 'https://youtube.com/watch?v=startup-pitch',
    title: 'How to Pitch Your Startup: YC Partner Shares the Formula',
    summary: 'A Y Combinator partner breaks down the perfect pitch: problem, solution, traction, team, and ask. Includes analysis of successful YC pitches and common mistakes to avoid.',
    tags: ['startup', 'pitch', 'vc', 'fundraising'],
    imageUrl: IMAGES.business[3],
    type: 'reference',
    status: 'pinned',
    xpEarned: 20,
    source: 'youtube.com',
    createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'yt-6',
    url: 'https://youtube.com/watch?v=nextjs-fullstack',
    title: 'Build a Full-Stack App with Next.js 15, Prisma & PostgreSQL',
    summary: 'Complete full-stack tutorial: Next.js App Router, Server Actions, Prisma ORM, PostgreSQL, authentication with NextAuth, and deployment to Vercel. Build a production-ready SaaS app.',
    note: 'Follow along project',
    tags: ['nextjs', 'fullstack', 'tutorial', 'prisma'],
    imageUrl: IMAGES.coding[3],
    type: 'do',
    status: 'new',
    xpEarned: 15,
    source: 'youtube.com',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'yt-7',
    url: 'https://youtube.com/watch?v=personal-finance',
    title: 'The Complete Guide to Personal Finance for Tech Workers',
    summary: 'Financial planning specifically for tech professionals: RSU strategies, tax optimization, FIRE planning, investment allocation, and navigating layoffs. Includes spreadsheet templates.',
    tags: ['finance', 'investing', 'career', 'money'],
    imageUrl: IMAGES.finance[0],
    type: 'learn',
    status: 'reviewed',
    xpEarned: 15,
    source: 'youtube.com',
    createdAt: new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'yt-8',
    url: 'https://youtube.com/watch?v=ai-agents-langchain',
    title: 'Building AI Agents with LangChain: A Practical Guide',
    summary: 'Learn to build autonomous AI agents using LangChain: tool creation, memory management, chain composition, and deployment. Build a research agent that can browse the web and synthesize information.',
    tags: ['ai', 'langchain', 'agents', 'llm'],
    imageUrl: IMAGES.ai[3],
    type: 'learn',
    status: 'new',
    xpEarned: 15,
    source: 'youtube.com',
    createdAt: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
  },

  // ==================== INSTAGRAM POSTS ====================
  {
    id: 'ig-1',
    url: 'https://instagram.com/p/morning-routine-tech',
    title: 'My 5AM Morning Routine That 10x\'d My Productivity',
    summary: 'A tech founder shares their optimized morning routine: cold shower, meditation, workout, deep work session, then emails. Includes the apps and tools used to track habits and stay consistent.',
    tags: ['productivity', 'morning routine', 'habits', 'lifestyle'],
    imageUrl: IMAGES.health[1],
    type: 'do',
    status: 'new',
    xpEarned: 10,
    source: 'instagram.com',
    createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ig-2',
    url: 'https://instagram.com/p/desk-setup-tour',
    title: 'Ultimate Developer Desk Setup 2025 - Full Tour',
    summary: 'Complete desk setup tour: 49" ultrawide monitor, ergonomic chair, standing desk, custom mechanical keyboard, stream deck, and ambient lighting. All products linked with prices.',
    note: 'Upgrade inspiration',
    tags: ['desk setup', 'productivity', 'gear', 'workspace'],
    imageUrl: IMAGES.productivity[3],
    type: 'reference',
    status: 'reviewed',
    xpEarned: 15,
    source: 'instagram.com',
    createdAt: new Date(Date.now() - 54 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ig-3',
    url: 'https://instagram.com/p/minimalist-productivity',
    title: 'The Minimalist Approach to Digital Productivity',
    summary: 'How to achieve more by doing less: reduce app clutter, implement a single capture system, batch similar tasks, and protect your calendar. Visual guide to a cleaner digital life.',
    tags: ['minimalism', 'productivity', 'digital', 'lifestyle'],
    imageUrl: IMAGES.productivity[1],
    type: 'do',
    status: 'new',
    xpEarned: 10,
    source: 'instagram.com',
    createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ig-4',
    url: 'https://instagram.com/p/healthy-programmer',
    title: 'How I Stay Healthy Working 12-Hour Days as a Developer',
    summary: 'Fitness and nutrition tips for desk workers: standing desk intervals, eye exercises, meal prep strategies, quick workouts between meetings, and ergonomic equipment recommendations.',
    tags: ['health', 'fitness', 'programmer', 'wellness'],
    imageUrl: IMAGES.health[0],
    type: 'do',
    status: 'new',
    xpEarned: 10,
    source: 'instagram.com',
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ig-5',
    url: 'https://instagram.com/p/notion-system',
    title: 'My Complete Notion System for Life Organization',
    summary: 'A complete second brain system in Notion: task management, project tracking, habit tracking, knowledge management, and goal setting. Free template download included.',
    tags: ['notion', 'productivity', 'organization', 'template'],
    imageUrl: IMAGES.productivity[2],
    type: 'reference',
    status: 'pinned',
    xpEarned: 15,
    source: 'instagram.com',
    createdAt: new Date(Date.now() - 84 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ig-6',
    url: 'https://instagram.com/p/travel-remote-work',
    title: 'Working Remotely from Bali: The Complete Setup Guide',
    summary: 'Everything you need for remote work in Bali: best coworking spaces, reliable internet solutions, visa requirements, cost breakdown, and must-have apps for digital nomads.',
    tags: ['remote work', 'digital nomad', 'travel', 'lifestyle'],
    imageUrl: IMAGES.social[4],
    type: 'reference',
    status: 'new',
    xpEarned: 10,
    source: 'instagram.com',
    createdAt: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
  },

  // ==================== TIKTOK POSTS ====================
  {
    id: 'tt-1',
    url: 'https://tiktok.com/@techgirljennie/video/chatgpt-hacks',
    title: '5 ChatGPT Hacks That Will Blow Your Mind',
    summary: 'Discover hidden ChatGPT capabilities: custom instructions for consistent outputs, chain prompting for complex tasks, role-playing for better results, and the PREP framework for any question.',
    tags: ['chatgpt', 'ai', 'productivity', 'hacks'],
    imageUrl: IMAGES.ai[4],
    type: 'learn',
    status: 'new',
    xpEarned: 10,
    source: 'tiktok.com',
    createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tt-2',
    url: 'https://tiktok.com/@codewithjohn/video/git-tricks',
    title: 'Git Commands Every Developer Should Know',
    summary: 'Essential Git commands beyond the basics: interactive rebase, cherry-pick, stash with message, bisect for debugging, and reflog for recovering lost commits. Visual demonstrations.',
    tags: ['git', 'programming', 'tips', 'developer'],
    imageUrl: IMAGES.coding[4],
    type: 'learn',
    status: 'reviewed',
    xpEarned: 15,
    source: 'tiktok.com',
    createdAt: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tt-3',
    url: 'https://tiktok.com/@sidehustleguru/video/passive-income',
    title: 'How I Make $5K/Month in Passive Income as a Developer',
    summary: 'Real passive income strategies for developers: selling digital products, course creation, affiliate marketing, SaaS products, and open source sponsorships. Income breakdown and time investment.',
    tags: ['passive income', 'side hustle', 'money', 'developer'],
    imageUrl: IMAGES.finance[1],
    type: 'reference',
    status: 'new',
    xpEarned: 10,
    source: 'tiktok.com',
    createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tt-4',
    url: 'https://tiktok.com/@uxdesignpro/video/ux-principles',
    title: '7 UX Principles That Make Apps Addictive',
    summary: 'Psychology-based UX principles: variable rewards, progress indicators, social proof, loss aversion, personalization, micro-interactions, and the peak-end rule. With app examples.',
    tags: ['ux', 'design', 'psychology', 'apps'],
    imageUrl: IMAGES.design[1],
    type: 'learn',
    status: 'new',
    xpEarned: 10,
    source: 'tiktok.com',
    createdAt: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tt-5',
    url: 'https://tiktok.com/@investingwithmike/video/crypto-2025',
    title: 'Top 5 Crypto Trends to Watch in 2025',
    summary: 'Expert analysis of emerging crypto trends: DeFi 2.0, real-world asset tokenization, layer 2 scaling solutions, AI + blockchain integration, and regulatory developments. Research backed.',
    tags: ['crypto', 'investing', 'trends', 'blockchain'],
    imageUrl: IMAGES.finance[2],
    type: 'learn',
    status: 'new',
    xpEarned: 10,
    source: 'tiktok.com',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tt-6',
    url: 'https://tiktok.com/@aikidhacks/video/midjourney-prompts',
    title: 'Midjourney Prompts That Create Stunning Art',
    summary: 'Advanced Midjourney prompting techniques: style mixing, aspect ratio optimization, lighting keywords, camera angles, and artistic styles. 50+ example prompts with results shown.',
    tags: ['midjourney', 'ai art', 'prompts', 'creative'],
    imageUrl: IMAGES.design[2],
    type: 'do',
    status: 'new',
    xpEarned: 10,
    source: 'tiktok.com',
    createdAt: new Date(Date.now() - 34 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tt-7',
    url: 'https://tiktok.com/@studywithalex/video/focus-techniques',
    title: 'How I Study for 8 Hours Without Getting Distracted',
    summary: 'Deep focus techniques for extended study sessions: the Pomodoro variation, environment design, website blockers, music selection, and nutrition for sustained concentration.',
    tags: ['study', 'focus', 'productivity', 'learning'],
    imageUrl: IMAGES.productivity[4],
    type: 'do',
    status: 'reviewed',
    xpEarned: 15,
    source: 'tiktok.com',
    createdAt: new Date(Date.now() - 78 * 60 * 60 * 1000).toISOString(),
  },

  // ==================== REDDIT POSTS ====================
  {
    id: 'rd-1',
    url: 'https://reddit.com/r/programming/comments/best-practices-2025',
    title: '[AMA] I\'ve Been a Senior Engineer at Google for 10 Years - Ask Me Anything',
    summary: 'A Google engineer shares insights on career growth, interview tips, work-life balance at big tech, and the future of software engineering. Top questions answered with detailed responses.',
    tags: ['career', 'google', 'ama', 'engineering'],
    imageUrl: IMAGES.tech[2],
    type: 'reference',
    status: 'new',
    xpEarned: 10,
    source: 'reddit.com',
    createdAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rd-2',
    url: 'https://reddit.com/r/cscareerquestions/salary-thread',
    title: '[Salary Thread] Share Your 2025 Compensation - Tech Edition',
    summary: 'Community salary sharing thread with 500+ responses. Includes company, role, location, years of experience, and total compensation. Sorted by role and experience level.',
    note: 'Bookmark for negotiations',
    tags: ['salary', 'compensation', 'career', 'data'],
    imageUrl: IMAGES.finance[3],
    type: 'reference',
    status: 'pinned',
    xpEarned: 15,
    source: 'reddit.com',
    createdAt: new Date(Date.now() - 200 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rd-3',
    url: 'https://reddit.com/r/webdev/comments/framework-comparison',
    title: 'I Tried Every Major JS Framework in 2025 - Here\'s My Honest Review',
    summary: 'Comprehensive comparison of React, Vue, Angular, Svelte, and Solid. Covers developer experience, performance, ecosystem, learning curve, and job market. With code examples and benchmarks.',
    tags: ['javascript', 'frameworks', 'comparison', 'webdev'],
    imageUrl: IMAGES.coding[0],
    type: 'learn',
    status: 'new',
    xpEarned: 10,
    source: 'reddit.com',
    createdAt: new Date(Date.now() - 38 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rd-4',
    url: 'https://reddit.com/r/startups/comments/failed-startup',
    title: 'Post-Mortem: Why My $2M Funded Startup Failed',
    summary: 'Founder shares the painful lessons from a startup failure: premature scaling, wrong market timing, co-founder conflicts, and running out of runway. Raw and honest advice for founders.',
    tags: ['startup', 'failure', 'lessons', 'entrepreneurship'],
    imageUrl: IMAGES.business[1],
    type: 'learn',
    status: 'reviewed',
    xpEarned: 20,
    source: 'reddit.com',
    createdAt: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rd-5',
    url: 'https://reddit.com/r/ExperiencedDevs/comments/managing-up',
    title: 'The Art of Managing Up: How to Influence Without Authority',
    summary: 'Senior developer shares strategies for influencing decisions, getting buy-in for technical initiatives, and navigating organizational politics. Practical scripts and frameworks included.',
    tags: ['career', 'leadership', 'management', 'influence'],
    imageUrl: IMAGES.business[4],
    type: 'do',
    status: 'new',
    xpEarned: 10,
    source: 'reddit.com',
    createdAt: new Date(Date.now() - 42 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rd-6',
    url: 'https://reddit.com/r/learnprogramming/comments/roadmap-2025',
    title: 'Complete Self-Taught Developer Roadmap for 2025',
    summary: 'A comprehensive guide to becoming a software developer without a CS degree. Covers resources, project ideas, portfolio building, and job search strategies. Updated for 2025 market.',
    tags: ['learning', 'roadmap', 'self-taught', 'career'],
    imageUrl: IMAGES.coding[1],
    type: 'reference',
    status: 'new',
    xpEarned: 10,
    source: 'reddit.com',
    createdAt: new Date(Date.now() - 56 * 60 * 60 * 1000).toISOString(),
  },

  // ==================== NEWSLETTER/BLOG POSTS ====================
  {
    id: 'nl-1',
    url: 'https://newsletter.pragmaticengineer.com/scaling-teams',
    title: 'Scaling Engineering Teams: What Actually Works',
    summary: 'Gergely Orosz analyzes scaling patterns at Uber, Stripe, and Shopify. Covers team topology evolution, communication patterns, technical leadership structures, and common pitfalls.',
    note: 'Share with team leads',
    tags: ['engineering', 'scaling', 'teams', 'management'],
    imageUrl: IMAGES.tech[3],
    type: 'learn',
    status: 'pinned',
    xpEarned: 20,
    source: 'newsletter.pragmaticengineer.com',
    createdAt: new Date(Date.now() - 70 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'nl-2',
    url: 'https://blog.bytebytego.com/system-design-interview',
    title: 'System Design Interview: A Step-by-Step Guide',
    summary: 'Alex Xu\'s comprehensive guide to acing system design interviews. Includes the RESHADED framework, common patterns, and walk-throughs of designing Twitter, YouTube, and Uber.',
    tags: ['system design', 'interviews', 'preparation', 'career'],
    imageUrl: IMAGES.tech[4],
    type: 'learn',
    status: 'reviewed',
    xpEarned: 20,
    source: 'bytebytego.com',
    createdAt: new Date(Date.now() - 180 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'nl-3',
    url: 'https://www.lennysnewsletter.com/product-market-fit',
    title: 'How to Find Product-Market Fit: Lessons from 100 Startups',
    summary: 'Lenny Rachitsky interviews founders about their PMF journey. Patterns include: talking to users obsessively, measuring the right metrics, and knowing when to pivot vs. persist.',
    tags: ['product', 'startup', 'pmf', 'strategy'],
    imageUrl: IMAGES.business[2],
    type: 'learn',
    status: 'new',
    xpEarned: 15,
    source: 'lennysnewsletter.com',
    createdAt: new Date(Date.now() - 90 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'nl-4',
    url: 'https://bytes.dev/archives/react-server-actions',
    title: 'React Server Actions: Everything You Need to Know',
    summary: 'Deep dive into React\'s Server Actions: how they work under the hood, best practices, security considerations, and real-world use cases. Code examples and performance comparisons.',
    tags: ['react', 'server actions', 'webdev', 'frontend'],
    imageUrl: IMAGES.coding[2],
    type: 'learn',
    status: 'new',
    xpEarned: 10,
    source: 'bytes.dev',
    createdAt: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'nl-5',
    url: 'https://medium.com/@adevnotes/database-scaling',
    title: 'Database Scaling Strategies: From 1K to 1M Users',
    summary: 'Practical guide to scaling databases: read replicas, sharding strategies, caching layers, connection pooling, and when to consider distributed databases. Real metrics included.',
    tags: ['database', 'scaling', 'backend', 'architecture'],
    imageUrl: IMAGES.cloud[2],
    type: 'learn',
    status: 'new',
    xpEarned: 15,
    source: 'medium.com',
    createdAt: new Date(Date.now() - 52 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'nl-6',
    url: 'https://dev.to/vscode-extensions-2025',
    title: '25 VS Code Extensions That Will Transform Your Workflow',
    summary: 'Curated list of must-have VS Code extensions: AI code completion, Git visualization, debugging tools, theming, and productivity boosters. With settings recommendations.',
    note: 'Install on new setup',
    tags: ['vscode', 'tools', 'productivity', 'extensions'],
    imageUrl: IMAGES.coding[3],
    type: 'do',
    status: 'reviewed',
    xpEarned: 15,
    source: 'dev.to',
    createdAt: new Date(Date.now() - 110 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'nl-7',
    url: 'https://substack.com/@growthdesign/onboarding-teardown',
    title: 'User Onboarding Teardown: How Top Apps Convert Users',
    summary: 'Analysis of onboarding flows from Notion, Figma, Linear, and Slack. Key patterns: progressive disclosure, personalization, quick wins, and reducing time-to-value.',
    tags: ['onboarding', 'ux', 'product', 'growth'],
    imageUrl: IMAGES.design[3],
    type: 'reference',
    status: 'new',
    xpEarned: 10,
    source: 'substack.com',
    createdAt: new Date(Date.now() - 66 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'nl-8',
    url: 'https://kentcdodds.com/testing-javascript',
    title: 'The Testing Trophy: How to Test JavaScript Applications',
    summary: 'Kent C. Dodds explains his testing philosophy: focus on integration tests, write tests that resemble how users interact with your app, and avoid implementation details.',
    tags: ['testing', 'javascript', 'best practices', 'quality'],
    imageUrl: IMAGES.coding[4],
    type: 'learn',
    status: 'new',
    xpEarned: 15,
    source: 'kentcdodds.com',
    createdAt: new Date(Date.now() - 80 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper functions
export const getAllTags = (): string[] => {
  const tagSet = new Set<string>();
  mockItems.forEach(item => {
    item.tags.forEach(tag => tagSet.add(tag.toLowerCase()));
  });
  return Array.from(tagSet).sort();
};

export const getAllSources = (): string[] => {
  const sourceSet = new Set<string>();
  mockItems.forEach(item => {
    sourceSet.add(item.source);
  });
  return Array.from(sourceSet).sort();
};

export const getTrendingTags = (): string[] => {
  const tagCount: Record<string, number> = {};
  mockItems.forEach(item => {
    item.tags.forEach(tag => {
      const lowerTag = tag.toLowerCase();
      tagCount[lowerTag] = (tagCount[lowerTag] || 0) + 1;
    });
  });
  return Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tag]) => tag);
};

export const getMockItemsResponse = (
  page: number = 1, 
  limit: number = 20,
  options?: {
    status?: string;
    source?: string;
    type?: string;
    search?: string;
    tags?: string[];
  }
) => {
  let filtered = [...mockItems];
  
  if (options?.status && options.status !== 'all') {
    filtered = filtered.filter(item => item.status === options.status);
  }
  
  if (options?.source && options.source !== 'all') {
    const sourceMap: Record<string, string[]> = {
      twitter: ['x.com', 'twitter.com'],
      linkedin: ['linkedin.com'],
      instagram: ['instagram.com'],
      tiktok: ['tiktok.com'],
      youtube: ['youtube.com'],
      reddit: ['reddit.com'],
      newsletter: ['newsletter.', 'bytes.dev', 'substack.', 'lennysnewsletter.', 'kentcdodds.', 'bytebytego.'],
      other: ['medium.com', 'dev.to'],
    };
    const sources = sourceMap[options.source] || [options.source];
    filtered = filtered.filter(item => 
      sources.some(s => item.source.includes(s))
    );
  }
  
  if (options?.type && options.type !== 'all') {
    filtered = filtered.filter(item => item.type === options.type);
  }
  
  if (options?.search) {
    const query = options.search.toLowerCase();
    filtered = filtered.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.summary.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query)) ||
      item.source.toLowerCase().includes(query)
    );
  }
  
  if (options?.tags && options.tags.length > 0) {
    filtered = filtered.filter(item =>
      options.tags!.some(tag => 
        item.tags.some(itemTag => itemTag.toLowerCase() === tag.toLowerCase())
      )
    );
  }
  
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedItems = filtered.slice(start, end);
  
  return {
    data: paginatedItems,
    meta: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
    },
  };
};

export const getSourceCounts = () => {
  const counts: Record<string, number> = {
    all: mockItems.length,
    twitter: 0,
    linkedin: 0,
    instagram: 0,
    tiktok: 0,
    youtube: 0,
    reddit: 0,
    newsletter: 0,
    other: 0,
  };
  
  mockItems.forEach(item => {
    if (item.source.includes('x.com') || item.source.includes('twitter.com')) {
      counts.twitter++;
    } else if (item.source.includes('linkedin.com')) {
      counts.linkedin++;
    } else if (item.source.includes('instagram.com')) {
      counts.instagram++;
    } else if (item.source.includes('tiktok.com')) {
      counts.tiktok++;
    } else if (item.source.includes('youtube.com')) {
      counts.youtube++;
    } else if (item.source.includes('reddit.com')) {
      counts.reddit++;
    } else if (
      item.source.includes('newsletter') || 
      item.source.includes('bytes.dev') || 
      item.source.includes('substack') ||
      item.source.includes('lennysnewsletter') ||
      item.source.includes('kentcdodds') ||
      item.source.includes('bytebytego')
    ) {
      counts.newsletter++;
    } else {
      counts.other++;
    }
  });
  
  return counts;
};

export const mockSourceCounts = getSourceCounts();

export const getTypeCounts = () => ({
  all: mockItems.length,
  learn: mockItems.filter(i => i.type === 'learn').length,
  do: mockItems.filter(i => i.type === 'do').length,
  reference: mockItems.filter(i => i.type === 'reference').length,
});

export const getStatusCounts = () => ({
  all: mockItems.length,
  new: mockItems.filter(i => i.status === 'new').length,
  reviewed: mockItems.filter(i => i.status === 'reviewed').length,
  pinned: mockItems.filter(i => i.status === 'pinned').length,
});
