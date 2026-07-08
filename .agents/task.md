# Implementation Tasks

## Backend Setup
- [x] Root .gitignore (add backend/.env, node_modules, etc.)
- [x] backend/package.json
- [x] backend/.env
- [x] backend/authenticationmiddleware.js
- [x] backend/authentucationroutes.js
- [x] backend/server.js

## Frontend API Layer
- [x] src/lib/api.ts (axios instance)
- [x] src/lib/queryClient.ts
- [x] src/main.tsx update (QueryClientProvider)
- [x] vite.config.ts update (proxy + env)
- [x] .env.local (VITE_API_URL)

## Zustand Stores
- [x] src/store/tableStore.ts
- [x] src/store/menuStore.ts
- [x] src/store/orderStore.ts
- [x] src/store/settingsStore.ts

## Wire Pages
- [x] TablesPage.tsx
- [x] TableOrderPage.tsx (menu items from API)
- [x] MenuPage.tsx
- [x] OrdersPage.tsx
- [x] PaymentPage.tsx
- [x] ReportsPage.tsx
- [x] admin/CategoryPage.tsx
- [x] admin/SettingsPage.tsx
- [x] admin/TablesManagementPage.tsx
