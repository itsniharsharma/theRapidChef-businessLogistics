# Hunger – Restaurant Revenue OS

Full-stack SaaS restaurant revenue platform with:

- Owner dashboard (menu, tables, orders, offers, analytics, settings)
- Public customer ordering route via QR: `/r/:restaurantSlug/t/:tableNumber`
- Express + MongoDB backend with JWT auth and multi-tenant data model

## Tech Stack

- Frontend: React + Vite + Tailwind + React Router + Axios + Recharts
- Backend: Express + Mongoose + JWT + bcrypt

## Environment Setup

1. Copy `.env.example` to `.env`
2. Update values as needed:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hunger
MONGO_MAX_POOL_SIZE=25
MONGO_MIN_POOL_SIZE=5
MONGO_SERVER_SELECTION_TIMEOUT_MS=8000
MONGO_SOCKET_TIMEOUT_MS=45000
JWT_SECRET=change-this-secret
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-1.5-flash
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_MODEL=gpt-4o-mini
KEEP_ALIVE_TIMEOUT_MS=65000
HEADERS_TIMEOUT_MS=66000

VITE_API_BASE_URL=http://localhost:5000/api
VITE_FRONTEND_BASE_URL=http://localhost:5173
```

## Run Locally

Install dependencies:

```
npm install
```

Run backend (port 5000):

```
npm run server
```

Run frontend (port 5173) in a second terminal:

```
npm run dev
```

## ngrok Testing (QR Flow)

1. Start frontend on `5173`
2. Run:

```
ngrok http 5173
```

3. Copy generated https URL, then set:

```
VITE_FRONTEND_BASE_URL=<your-ngrok-url>
```

4. Restart frontend and regenerate table QR codes.

QR values will now point to your ngrok public URL.

## Required Flow

Owner flow:

1. Register account
2. Auto-create restaurant
3. Add categories and menu items
4. Add tables and generate QR
5. View incoming orders in dashboard

Customer flow:

1. Open scanned QR URL `/r/:restaurantSlug/t/:tableNumber`
2. Browse categories/menu
3. Add items to cart
4. Checkout and place order

Orders persist to MongoDB and appear in owner dashboard polling.

## AI Menu Import (Owner → Menu)

- Open Menu section in owner dashboard.
- Upload a menu file (`.txt`, `.csv`, `.md`, `.json`) or menu image.
- Click **Analyze with AI** to auto-generate categories + items + prices.
- Review and manually edit the generated draft.
- Click **Import to Menu** to save into MongoDB categories/items.

Provider priority:

- If `GEMINI_API_KEY` is set, backend uses Gemini first (recommended free-tier testing path).
- If Gemini is not set but OpenAI is set, backend uses OpenAI.
- If neither key is set, text input still works via local heuristic parser (image parsing requires Gemini/OpenAI).

Performance notes:

- Hot GET routes (`/api/menu/:restaurantSlug`, `/api/analytics/*`) use short-TTL in-memory response caching.
- Cache is invalidated automatically on menu/order writes.
