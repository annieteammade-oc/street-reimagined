# Street Reimagined 🌱

Transform your street with AI - Turn parking spots into green spaces, playgrounds, and community areas.

## Features

- 📸 **Photo Upload/Camera** - Take a photo of any street
- 🗣️ **Voice & Text Input** - Describe your transformation wishes  
- 🤖 **AI Transformation** - Powered by Google Nano Banana (Gemini 3 Pro)
- 📱 **Mobile First** - Works great on phones and tablets
- 💾 **Download Results** - Get your transformed street image
- 📊 **Community Analytics** - See what others want in their neighborhoods

## How It Works

1. **Take a photo** of a street, parking area, or neighborhood space
2. **Tell us what you want** - more trees, bike lanes, playgrounds, fewer cars
3. **AI transforms** your photo into a realistic alternative
4. **Download & share** your vision for a better neighborhood

## Tech Stack

- **Next.js 14** with App Router
- **Tailwind CSS** for styling  
- **Google Nano Banana AI** via Puter.js (free!)
- **Web Speech API** for voice input
- **Canvas API** for image processing
- **LocalStorage** for analytics

## Getting Started

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/annieteammade-oc/street-reimagined.git
cd street-reimagined
npm install
```

### 2. Setup Supabase Database

1. Create account at [supabase.com](https://supabase.com)
2. Create new project: `street-reimagined`
3. Copy Project URL and API keys
4. Run the SQL schema:
   - Go to Supabase Dashboard → SQL Editor
   - Copy/paste content from `supabase-schema.sql`
   - Run the query to create tables

### 3. Environment Configuration

```bash
# Copy example environment file
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.
Open [http://localhost:3000/admin](http://localhost:3000/admin) for analytics dashboard.

## Why This Matters

Streets take up 30% of urban space, but most of it is dedicated to car storage. This app helps visualize alternatives:

- **Environmental**: More trees = better air quality and biodiversity
- **Social**: Community spaces foster neighborhood connections  
- **Health**: Bike lanes and playgrounds encourage active lifestyles
- **Economic**: Shared mobility reduces individual transport costs

## Supported Transformations

- 🌳 **More green** - Trees, plants, parks, green strips
- 🚴 **Bike friendly** - Bike lanes, bike parking, cycling infrastructure
- 👨‍👩‍👧‍👦 **Family friendly** - Playgrounds, safe spaces for children
- ☕ **Social spaces** - Terraces, benches, community meeting areas
- 🚗 **Fewer cars** - Reduced parking, pedestrian zones

## Shared Mobility

Part of the broader movement toward shared transportation:
- **Car sharing** - Cambio, Zipcar  
- **Bike sharing** - City bikes, e-bikes
- **Scooter sharing** - Shared e-scooters
- **Public transport** - Buses, trams, metros

Learn more at [autodelen.net](https://autodelen.net)

## Contributing

This is an open source project. Feel free to:
- Report bugs or suggest features
- Submit pull requests  
- Share your street transformations on social media
- Use this as inspiration for your own community projects

## Privacy

- Photos are processed client-side and sent to Google AI
- No photos are permanently stored on our servers
- Location data is optional and only used for community insights
- Analytics are anonymized and stored locally

## License

Built with ❤️ by [Team Made](https://teammade.be)

---

**Transform your street. Inspire your community. Shape the future of urban spaces.**