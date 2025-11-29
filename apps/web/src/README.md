# Project Structure

This document describes the folder structure of the E-Commerce web application.

## Directory Structure

```
src/
├── assets/              # Static assets (images, fonts, etc.)
│   ├── images/         # Image files
│   └── fonts/          # Font files
│
├── components/         # React components
│   ├── ui/            # Reusable UI components (shadcn/ui)
│   ├── layout/         # Layout components (Header, Footer, Layout)
│   ├── auth/          # Authentication components
│   └── admin/         # Admin-specific components
│
├── pages/              # Page components (route-level components)
│   └── admin/         # Admin pages
│
├── hooks/              # Custom React hooks
│
├── store/              # State management (Zustand stores)
│
├── services/           # API services and external integrations
│   └── api.ts         # Axios instance and API configuration
│
├── types/              # TypeScript type definitions
│   └── index.ts       # All type exports
│
├── lib/                # Utility functions and helpers
│   └── utils.ts       # Common utility functions
│
├── constants/          # Application constants
│   └── index.ts       # API endpoints, routes, validation rules, etc.
│
├── config/             # Application configuration
│   └── index.ts       # App config, environment variables
│
├── App.tsx            # Main app component with routing
├── main.tsx           # Application entry point
└── index.css          # Global styles
```

## Best Practices

### Components
- **UI Components** (`components/ui/`): Reusable, generic components (buttons, inputs, cards, etc.)
- **Layout Components** (`components/layout/`): App-wide layout components
- **Feature Components**: Place feature-specific components in their respective feature folders

### Pages
- Each route should have a corresponding page component in `pages/`
- Admin pages are grouped in `pages/admin/`

### Services
- All API calls should go through the `services/api.ts` instance
- Create separate service files for complex API logic if needed

### Types
- All TypeScript types and interfaces are centralized in `types/`
- Export all types from `types/index.ts` for easy importing

### Constants
- API endpoints, routes, validation rules, and other constants are in `constants/`
- Use constants instead of hardcoded strings

### Utils
- Pure utility functions go in `lib/utils.ts`
- Keep functions small, focused, and testable

### State Management
- Use Zustand stores in `store/` for global state
- Each store should handle a specific domain (auth, cart, etc.)

## Import Paths

The project uses path aliases configured in `tsconfig.json`:
- `@/components` → `src/components`
- `@/pages` → `src/pages`
- `@/hooks` → `src/hooks`
- `@/store` → `src/store`
- `@/services` → `src/services`
- `@/types` → `src/types`
- `@/lib` → `src/lib`
- `@/constants` → `src/constants`
- `@/config` → `src/config`

## Adding New Features

1. **New Page**: Add to `pages/` and update routes in `App.tsx`
2. **New Component**: Add to appropriate folder in `components/`
3. **New Type**: Add to `types/index.ts`
4. **New API Endpoint**: Add to `constants/index.ts` under `API_ENDPOINTS`
5. **New Store**: Create in `store/` following existing patterns

