# Coding Standards — LingoLinked

This document describes the coding conventions adopted by the LingoLinked team. All contributed code is expected to follow these standards. Consistency is enforced automatically via ESLint and Prettier; the rules below describe both the tooling configuration and the human conventions layered on top.

---

## Language and Runtime

- **TypeScript** is used for all source files in both the client and server. Plain JavaScript files are not permitted.
- Target: **ES2022** (server), **ESNext** (client via Vite).
- Module system: **CommonJS** on the server (`"module": "commonjs"` in tsconfig), **ESModules** on the client.
- `strict` mode is disabled in the server tsconfig but TypeScript's recommended rules are enforced via `typescript-eslint`.

---

## Formatting (enforced by Prettier)

Configuration lives in `.prettierrc`.

| Rule | Value |
|------|-------|
| Semicolons | Required (`semi: true`) |
| Quotes | Double quotes (`singleQuote: false`) |
| Trailing commas | ES5-compatible targets only (`trailingComma: "es5"`) |
| Tab width | 2 spaces |
| Max line length | 100 characters |
| Bracket spacing | `{ key: value }` (spaces inside braces) |
| Arrow function parens | Always — `(x) => x`, never `x => x` |
| Line endings | LF (`endOfLine: "lf"`) |

Run `npm run format` from the project root to auto-format all files.

---

## Linting (enforced by ESLint)

### Client (`client/eslint.config.js`)
- `@eslint/js` recommended rules
- `typescript-eslint` recommended rules
- `eslint-plugin-react-hooks` — enforces Rules of Hooks
- `eslint-plugin-react-refresh` — prevents non-component exports from breaking HMR
- `eslint-config-prettier` — disables formatting rules that conflict with Prettier

### Server (`server/eslint.config.mjs`)
- `@eslint/js` recommended rules
- `typescript-eslint` recommended rules
- `eslint-config-prettier`

Run `npm run lint` from the project root to check both workspaces.

---

## Naming Conventions

### TypeScript Interfaces and Types
- **PascalCase**, prefixed with `I` for Mongoose document interfaces.
- Examples: `IUser`, `IMatch`, `ILanguage`, `AuthState`, `AuthRequest`

### Classes and React Components
- **PascalCase**
- Examples: `AuthProvider`, `UserCard`, `LanguageBadge`, `Navbar`

### Functions and Variables
- **camelCase** for all functions, variables, and object properties.
- Examples: `computeMatchScore`, `comparePassword`, `matchResolvedValue`, `teachAB`

### Constants
- **camelCase** for module-level constants (JavaScript convention for non-class code).
- Examples: `profLevels`, `aKnownSet`

### Files
- **PascalCase** for React component files: `UserCard.tsx`, `AuthContext.tsx`
- **camelCase** for utility and non-component files: `matchScoring.ts`, `api.ts`
- **camelCase** for CSS module files, mirroring their component: `UserCard.module.css`
- Test files mirror the file they test with a `.test.ts` / `.test.tsx` suffix, placed in a `__tests__/` subdirectory

### Routes
- Express route files use **camelCase** pluralized nouns: `auth.ts`, `users.ts`, `matches.ts`, `messages.ts`, `events.ts`
- Route test files use the format `<name>.routes.test.ts`

### CSS Classes
- **camelCase** for CSS Module class names (automatically scoped by Vite/CSS Modules)
- Example: `.navbarContainer`, `.profileCard`

---

## TypeScript Conventions

### Interface vs Type
- Use `interface` for object shapes that describe entities (e.g., `IUser`, `AuthState`)
- Use `type` for unions, intersections, or aliases

### Explicit Return Types
- Exported functions should have explicit return types where the type is not immediately obvious from a one-liner
- Middleware functions always annotate `void` return: `function authenticate(...): void`

### `any` Type
- Avoid `any`
- Use `unknown` with a type guard, or a proper generic instead

### Optional Chaining
- Prefer `header?.startsWith(...)` over `header && header.startsWith(...)`

### Enums
- Use TypeScript string union types instead of `enum` for domain values
- Example: `"pending" | "accepted" | "declined"` instead of `enum Status { Pending, Accepted, Declined }`

---

## React Conventions

### Component Structure
- Each component file exports exactly one default component
- The file is named after the component

### Hooks
- Custom hooks are prefixed with `use`: `useAuth()`
- All hooks follow the Rules of Hooks (enforced by ESLint plugin)

### Context
- Contexts are created with `createContext` and exported from a dedicated file under `src/context/`
- The provider component and the consumer hook are co-located in the same file

### State Management
- Local UI state uses `useState`
- Shared application state (auth) uses React Context
- No global state library (Redux, Zustand, etc.) is used

### Props
- Props are typed via inline `interface` declarations directly above the component, not passed as generics to `React.FC`

---

## Backend Conventions

### Express Routes
- Each resource has its own router file under `server/src/routes/`
- Protected routes apply the `authenticate` middleware as the first argument after the path
- Input validation uses `express-validator` chains defined inline on the route

### Mongoose Models
- Each model lives in its own file under `server/src/models/`
- The exported interface (`IUser`, `IMatch`, etc.) is defined above the schema
- Sub-schemas are defined as named constants before the parent schema
- Password and other sensitive fields are stripped from serialized output via `toJSON` transform

### Error Responses
- All error responses use the shape `{ error: "Human-readable message" }`
- HTTP status codes follow REST conventions:
  - `200` / `201` — Success
  - `400` — Bad Request
  - `401` — Unauthorized
  - `404` — Not Found
  - `409` — Conflict
  - `500` — Server Error

### Environment Variables
- All secrets and environment-specific configuration are read from `process.env` using the `dotenv` package
- No secrets are hardcoded — fallback defaults (e.g., `"dev-secret-change-me"`) are only for local development

---

## Comments

Comments are written only when the **why** is not obvious from the code itself. Implementation details that can be read directly from well-named identifiers are not commented.

### Acceptable Comments
- JSDoc on exported utility functions with non-obvious parameters (e.g., `matchScoring.ts`)
- Single-line inline comments explaining a non-obvious constraint or formula

### Not Used
- Multi-line block comments on straightforward getters or CRUD routes
- Comments describing what a line does when the code is self-explanatory

---

## Git and Branch Conventions

Documented in `.github/CONTRIBUTING.md`.

### Branch Naming Format
- `feature/<short-description>`
- `fix/<short-description>`
- `chore/<short-description>`
- `docs/<short-description>`
- `misc/<short-description>`

### Commit Messages
- Written in the imperative mood describing the change
- Example: `Add match scoring cap at 100`