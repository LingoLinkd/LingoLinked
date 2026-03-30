# LingoLinked — Complete Codebase Inventory & Team Assignment

## Project Overview

LingoLinked is a language exchange social platform built as a monorepo with a React (Vite + TypeScript) frontend and a Node.js/Express + MongoDB backend. Users create profiles with known/learning languages, get matched with complementary partners via a scoring algorithm, exchange messages (text/image/audio), and join language events.

---

## Full File Inventory (Source Files Only)

### Root

| File | Purpose |
|------|---------|
| `package.json` | Monorepo root — workspaces: [client, server], scripts: dev, format, lint, test |
| `.gitignore` | Git ignore rules |
| `.prettierrc` / `.prettierignore` | Prettier formatting config |
| `.github/CONTRIBUTING.md` | Contributing guidelines |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR template |
| `.github/ISSUE_TEMPLATE/*.md` | Issue templates (bug, feature, chore, docs, security) |

### Server (`server/`)

| File | Purpose |
|------|---------|
| `package.json` | Server deps (express 5, mongoose 9, bcryptjs, jsonwebtoken, multer, express-validator) |
| `tsconfig.json` | TypeScript config |
| `eslint.config.mjs` | ESLint config |
| `jest.config.js` | Jest test config |
| `src/index.ts` | Entry point — loads env, connects DB, starts server on PORT |
| `src/app.ts` | Express app — CORS, JSON parsing, static files, route mounting, health check |
| `src/db.ts` | `connectDB(uri)` — MongoDB connection with strict query mode |
| `src/middleware/auth.ts` | `authenticate` middleware — JWT verification, sets `req.userId`. Exports `AuthRequest` interface |
| `src/middleware/upload.ts` | Multer configs: `uploadProfilePic` (5MB images), `uploadMessageImage` (5MB images), `uploadMessageAudio` (10MB audio) |
| `src/models/User.ts` | User schema — email, password (bcrypt hashed), firstName, lastName, bio, profilePicture, knownLanguages[], learningLanguages[], interests[], university, major, yearOfStudy, accountStatus, role. Methods: `comparePassword()`. Pre-save hook hashes password. |
| `src/models/Match.ts` | Match schema — users[] (2 user IDs), score, sharedLanguages[], status (pending/accepted/declined), initiator |
| `src/models/Conversation.ts` | Conversation schema — participants[], lastMessage, lastMessageAt |
| `src/models/Message.ts` | Message schema — conversation, sender, text, image, audio, read |
| `src/models/Event.ts` | Event schema — title, description, date, time, location, organizer, attendees[], language, maxAttendees |
| `src/routes/auth.ts` | Auth routes: `POST /register`, `POST /login`, `GET /me`. Helper: `signToken(userId)` |
| `src/routes/users.ts` | User routes: `GET /profile`, `PUT /profile`, `POST /profile/picture`, `GET /:id`, `GET /` (search/filter) |
| `src/routes/matches.ts` | Match routes: `GET /suggestions`, `POST /:userId/connect`, `PUT /:matchId/accept`, `PUT /:matchId/decline`, `GET /` |
| `src/routes/messages.ts` | Message routes: `GET /conversations`, `GET /:conversationId`, `POST /:conversationId` (text), `POST /:conversationId/image`, `POST /:conversationId/audio` |
| `src/routes/events.ts` | Event routes: `GET /`, `GET /:id`, `POST /`, `POST /:id/register`, `DELETE /:id/register` |
| `src/utils/matchScoring.ts` | `computeMatchScore(userA, userB)` — Scoring: complementary language pairs (+20 base + proficiency gap x10), mutual exchange bonus (+15), shared interests (+5 each). Returns `{score, sharedLanguages[]}` |

### Server Tests

| File | Purpose |
|------|---------|
| `src/middleware/__tests__/auth.test.ts` | Auth middleware tests |
| `src/routes/__tests__/auth.test.ts` | Auth routes tests |
| `src/routes/__tests__/auth.routes.test.ts` | Additional auth route tests |
| `src/routes/__tests__/events.routes.test.ts` | Events routes tests |
| `src/routes/__tests__/matches.routes.test.ts` | Matches routes tests |
| `src/routes/__tests__/messages.routes.test.ts` | Messages routes tests |
| `src/routes/__tests__/users.routes.test.ts` | Users routes tests |
| `src/utils/__tests__/matchScoring.test.ts` | Match scoring algorithm tests |

### Client (`client/`)

| File | Purpose |
|------|---------|
| `package.json` | Client deps (react 19, react-router-dom 7, lucide-react) |
| `index.html` | HTML entry point |
| `vite.config.ts` | Vite config — React plugin, proxies `/api` and `/uploads` to localhost:5000 |
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | TypeScript configs |
| `eslint.config.js` | ESLint config |
| `src/main.tsx` | React entry — `createRoot`, renders `<App/>` in StrictMode |
| `src/App.tsx` | Root component — `BrowserRouter`, `AuthProvider`, route definitions. Helpers: `ProtectedRoute`, `GuestRoute` |
| `src/App.css` | Empty (styles in index.css + CSS modules) |
| `src/index.css` | Global CSS variables (colors, shadows, radii, transitions), `.container` class, `spin`/`shimmer` animations |
| `src/vite-env.d.ts` | Vite type declarations |
| `src/context/AuthContext.tsx` | Auth context — `AuthProvider` component, `useAuth()` hook. State: user, token, loading. Methods: `login()`, `register()`, `logout()`, `updateUser()`, `refreshUser()`. Interfaces: `User`, `AuthState` |
| `src/utils/api.ts` | API client — `get()`, `post()`, `put()`, `delete()`, `upload()`. Auto-attaches JWT from localStorage. Base URL: `/api` |
| `src/utils/languages.ts` | Constants: `LANGUAGES` (27 languages), `PROFICIENCY_LEVELS` (5 levels), `INTEREST_OPTIONS` (15 interests) |
| `src/components/Navbar.tsx` | Navbar component — logo, nav links (Home, Matches, Messages, Events, Profile), user avatar, logout button. Uses `useAuth()`, `useNavigate()` |
| `src/components/Navbar.module.css` | Navbar styles |
| `src/components/LanguageBadge.tsx` | LanguageBadge component — Props: `language`, `proficiency`, `variant?` ("known"/"learning") |
| `src/components/LanguageBadge.module.css` | Badge styles |
| `src/components/UserCard.tsx` | UserCard component — Props: firstName, lastName, bio, profilePicture?, knownLanguages[], learningLanguages[], score?, sharedLanguages?, actionLabel?, onAction?, actionDisabled?. Uses LanguageBadge |
| `src/components/UserCard.module.css` | Card styles |
| `src/pages/Login.tsx` | Login page — email/password form, floating greeting animations, hero section with stats |
| `src/pages/Login.module.css` | Login styles |
| `src/pages/Register.tsx` | Multi-step registration (3 steps). Step 1: account details. Step 2: languages. Step 3: bio/major/role/interests |
| `src/pages/Register.module.css` | Register styles |
| `src/pages/Dashboard.tsx` | Dashboard — welcome banner, profile completeness nudge, quick stats, suggested partners grid. `handleConnect(userId)` sends match requests |
| `src/pages/Dashboard.module.css` | Dashboard styles |
| `src/pages/Profile.tsx` | Profile page — view mode + edit mode. Editable: name, bio, languages, interests, major, yearOfStudy, role, profile picture |
| `src/pages/Profile.module.css` | Profile styles |
| `src/pages/Matches.tsx` | Matches page — tabs: "pending" / "accepted". Pending: accept/decline. Accepted: message link |
| `src/pages/Matches.module.css` | Matches styles |
| `src/pages/Messages.tsx` | Messaging page — conversation sidebar + chat area. Text, image upload, voice recording. Polls every 3s |
| `src/pages/Messages.module.css` | Messages styles |
| `src/pages/Events.tsx` | Events page — list events, create modal, register/unregister |
| `src/pages/Events.module.css` | Events styles |

### Client Tests

| File | Purpose |
|------|---------|
| `src/test/setup.ts` | Test setup |
| `src/components/__tests__/LanguageBadge.test.tsx` | LanguageBadge tests |
| `src/components/__tests__/Navbar.test.tsx` | Navbar tests |
| `src/components/__tests__/UserCard.test.tsx` | UserCard tests |
| `src/context/__tests__/AuthContext.test.tsx` | AuthContext tests |
| `src/pages/__tests__/Dashboard.test.tsx` | Dashboard tests |
| `src/pages/__tests__/Events.test.tsx` | Events tests |
| `src/pages/__tests__/Login.test.tsx` | Login tests |
| `src/pages/__tests__/Matches.test.tsx` | Matches tests |
| `src/pages/__tests__/Register.test.tsx` | Register tests |
| `src/utils/__tests__/api.test.ts` | API utility tests |
| `src/utils/__tests__/languages.test.ts` | Languages constants tests |

---

## Team Assignments

### Pratheet — Sign In, Accounts, Homepage (Dashboard)

**Scope:** Authentication flow (login, register, JWT), user account management, and the main dashboard/homepage.

**Files to own:**

| File | What to do |
|------|-----------|
| `server/src/routes/auth.ts` | Auth routes: `POST /register`, `POST /login`, `GET /me`, `signToken()` |
| `server/src/middleware/auth.ts` | `authenticate` middleware, `AuthRequest` interface |
| `server/src/models/User.ts` | User model: schema, `comparePassword()`, pre-save bcrypt hook, toJSON transform |
| `server/src/routes/users.ts` | User profile routes: `GET /profile`, `PUT /profile`, `POST /profile/picture`, `GET /:id`, `GET /` (search) |
| `server/src/middleware/upload.ts` | `uploadProfilePic` multer config (shared — coordinate with Jacob for message uploads) |
| `server/src/db.ts` | MongoDB connection utility |
| `server/src/index.ts` | Server entry point |
| `server/src/app.ts` | Express app setup and route mounting |
| `client/src/context/AuthContext.tsx` | `AuthProvider`, `useAuth()` hook, `User` interface, `AuthState` interface, `login()`, `register()`, `logout()`, `updateUser()`, `refreshUser()` |
| `client/src/pages/Login.tsx` | Login page component and all its logic |
| `client/src/pages/Login.module.css` | Login page styles |
| `client/src/pages/Register.tsx` | Multi-step registration component (3-step form, validation, `LangEntry` interface) |
| `client/src/pages/Register.module.css` | Register page styles |
| `client/src/pages/Dashboard.tsx` | Dashboard: welcome banner, stats, suggestions grid, `handleConnect()`, `Suggestion` interface |
| `client/src/pages/Dashboard.module.css` | Dashboard styles |
| `client/src/pages/Profile.tsx` | Profile page: view/edit modes, picture upload, language/interest management |
| `client/src/pages/Profile.module.css` | Profile styles |
| `client/src/App.tsx` | Root component: `ProtectedRoute`, `GuestRoute`, route definitions |
| `client/src/main.tsx` | React entry point |
| `client/src/utils/api.ts` | API client utility (shared — everyone depends on this) |
| `client/src/utils/languages.ts` | Constants: `LANGUAGES`, `PROFICIENCY_LEVELS`, `INTEREST_OPTIONS` (shared) |
| **Tests:** | `auth.test.ts`, `auth.routes.test.ts`, `users.routes.test.ts`, `AuthContext.test.tsx`, `Login.test.tsx`, `Register.test.tsx`, `Dashboard.test.tsx`, `api.test.ts`, `languages.test.ts` |

---

### Corinne — Frontend Styles/Design

**Scope:** All CSS, visual design, global styles, component styling, and design system (colors, typography, spacing). Shared reusable UI components.

**Files to own:**

| File | What to do |
|------|-----------|
| `client/src/index.css` | Global CSS: all CSS variables (colors, shadows, radii, transitions), `.container`, keyframe animations (`spin`, `shimmer`) |
| `client/src/App.css` | Currently empty — available for global layout styles |
| `client/src/components/LanguageBadge.module.css` | `.badge`, `.known`, `.learning`, `.lang`, `.level` |
| `client/src/components/Navbar.module.css` | `.navbar`, `.inner`, `.logo`, `.logoIcon`, `.logoText`, `.links`, `.link`, `.active`, `.right`, `.avatar`, `.logoutBtn` |
| `client/src/components/UserCard.module.css` | `.card`, `.header`, `.avatar`, `.info`, `.name`, `.score`, `.bio`, `.shared`, `.languages`, `.actionBtn` |
| `client/src/pages/Login.module.css` | `.page`, `.left`, `.right`, `.floatingGreetings`, `.hero`, `.form`, `.submitBtn` |
| `client/src/pages/Register.module.css` | `.progress`, `.progressStep`, `.form`, `.langSection`, `.roleOptions`, `.interestGrid`, `.actions` |
| `client/src/pages/Dashboard.module.css` | `.welcome`, `.nudge`, `.statsRow`, `.statCard`, `.grid`, `.skeleton`, `.empty` |
| `client/src/pages/Profile.module.css` | `.viewMode`, `.profileHeader`, `.form`, `.langRow`, `.pictureUpload`, `.interestGrid` |
| `client/src/pages/Matches.module.css` | `.tabs`, `.tab`, `.tabActive`, `.matchCard`, `.matchActions`, `.acceptBtn`, `.declineBtn` |
| `client/src/pages/Messages.module.css` | `.layout`, `.sidebar`, `.convList`, `.chatArea`, `.messageList`, `.messageBubble`, `.inputArea`, `.recordBtn` |
| `client/src/pages/Events.module.css` | `.grid`, `.card`, `.cardHeader`, `.modalOverlay`, `.modal`, `.form` |
| `client/src/components/LanguageBadge.tsx` | Component markup |
| `client/src/components/Navbar.tsx` | Navbar markup and layout structure |
| `client/src/components/UserCard.tsx` | UserCard markup and layout structure |
| `client/index.html` | HTML shell (meta tags, fonts, title) |
| `.prettierrc` / `.prettierignore` | Code formatting config |
| **Tests:** | `LanguageBadge.test.tsx`, `Navbar.test.tsx`, `UserCard.test.tsx` |

**Note:** Corinne should coordinate with each page owner when making CSS changes, since the `.module.css` files are tightly coupled to the component TSX.

---

### Demetri — Matching Algorithm & Matches Page

**Scope:** The matching/scoring algorithm, match suggestion generation, match request flow (connect/accept/decline), and the Matches page frontend.

**Files to own:**

| File | What to do |
|------|-----------|
| `server/src/utils/matchScoring.ts` | `computeMatchScore(userA, userB)` — complementary language pairs (+20 base + proficiency gap x10), mutual exchange bonus (+15), shared interests (+5). Returns `{score, sharedLanguages[]}` |
| `server/src/routes/matches.ts` | Match routes: `GET /suggestions` (score + rank, top 20), `POST /:userId/connect`, `PUT /:matchId/accept` (creates conversation), `PUT /:matchId/decline`, `GET /` |
| `server/src/models/Match.ts` | Match schema: users[], score, sharedLanguages[], status, initiator |
| `client/src/pages/Matches.tsx` | Matches page: tabs (pending/accepted), `fetchMatches()`, `handleAccept()`, `handleDecline()`, `getOtherUser()`, `isIncoming()`. `Match` interface |
| `client/src/pages/Matches.module.css` | Matches page styles (coordinate with Corinne) |
| **Tests:** | `matchScoring.test.ts`, `matches.routes.test.ts`, `Matches.test.tsx` |

**Cross-team note:** Dashboard's suggestions grid calls `GET /suggestions` and `POST /:userId/connect`. Demetri owns the backend; Pratheet owns the Dashboard frontend.

---

### Jacob — All Chat Frontend & Backend

**Scope:** The entire messaging system — conversations, messages (text/image/audio), voice recording, real-time polling, and all backend message/conversation logic.

**Files to own:**

| File | What to do |
|------|-----------|
| `server/src/routes/messages.ts` | Message routes: `GET /conversations`, `GET /:conversationId`, `POST /:conversationId` (text), `POST /:conversationId/image`, `POST /:conversationId/audio` |
| `server/src/models/Conversation.ts` | Conversation schema: participants[], lastMessage, lastMessageAt |
| `server/src/models/Message.ts` | Message schema: conversation, sender, text, image, audio, read |
| `server/src/middleware/upload.ts` | `uploadMessageImage` and `uploadMessageAudio` multer configs (shared file — coordinate with Pratheet) |
| `client/src/pages/Messages.tsx` | Messages page: conversation sidebar, chat area, text/image/audio sending, 3s polling, voice recording, auto-scroll. Interfaces: `Participant`, `Conversation`, `Message` |
| `client/src/pages/Messages.module.css` | Messages page styles (coordinate with Corinne) |
| `server/uploads/messages/.gitkeep` | Message image upload directory |
| `server/uploads/audio/.gitkeep` | Audio upload directory |
| **Tests:** | `messages.routes.test.ts` |

**Cross-team note:** When Demetri's `PUT /matches/:matchId/accept` runs, it creates a Conversation and a welcome Message using Jacob's models. Coordinate on schema changes.

---

### CJ — Events Page & Miscellaneous

**Scope:** Events system (create, list, register/unregister) plus all config, CI, and GitHub templates.

**Files to own:**

| File | What to do |
|------|-----------|
| `server/src/routes/events.ts` | Event routes: `GET /`, `GET /:id`, `POST /`, `POST /:id/register`, `DELETE /:id/register` |
| `server/src/models/Event.ts` | Event schema: title, description, date, time, location, organizer, attendees[], language, maxAttendees |
| `client/src/pages/Events.tsx` | Events page: event list, create modal, register/unregister. Functions: `fetchEvents()`, `handleCreate()`, `handleRegister()`, `handleUnregister()`, `isRegistered()`, `isOrganizer()`, `formatDate()`. Interfaces: `EventOrganizer`, `EventData` |
| `client/src/pages/Events.module.css` | Events page styles (coordinate with Corinne) |
| **Tests:** | `events.routes.test.ts`, `Events.test.tsx` |
| **Miscellaneous config/infra:** | |
| `package.json` (root) | Monorepo config, workspace definitions, root scripts |
| `server/package.json` | Server dependencies |
| `client/package.json` | Client dependencies |
| `.gitignore` | Git ignore rules |
| `.github/CONTRIBUTING.md` | Contributing guidelines |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR template |
| `.github/ISSUE_TEMPLATE/*` | All issue templates |
| `server/eslint.config.mjs` | Server ESLint config |
| `client/eslint.config.js` | Client ESLint config |
| `server/jest.config.js` | Server Jest config |
| `server/tsconfig.json` | Server TypeScript config |
| `client/tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | Client TypeScript configs |
| `client/vite.config.ts` | Vite dev server config |
| `client/src/test/setup.ts` | Client test setup |
| `server/uploads/profiles/.gitkeep` | Profile uploads directory |

---

## Shared / Cross-Cutting Dependencies

These files are used by multiple team members. The primary owner is listed, but changes should be coordinated:

| File | Primary Owner | Also Used By |
|------|--------------|-------------|
| `client/src/utils/api.ts` | Pratheet | Everyone (all API calls go through this) |
| `client/src/utils/languages.ts` | Pratheet | Demetri (matching), Corinne (badges) |
| `client/src/context/AuthContext.tsx` | Pratheet | Everyone (all pages use `useAuth()`) |
| `client/src/components/UserCard.tsx` | Corinne | Pratheet (Dashboard), Demetri (Matches) |
| `client/src/components/LanguageBadge.tsx` | Corinne | Pratheet (Profile), Demetri (Matches) |
| `client/src/components/Navbar.tsx` | Corinne | Everyone (rendered on every page) |
| `client/src/App.tsx` | Pratheet | Everyone (route definitions) |
| `server/src/middleware/upload.ts` | Pratheet + Jacob | Split: Pratheet owns `uploadProfilePic`, Jacob owns `uploadMessageImage` + `uploadMessageAudio` |
| `server/src/app.ts` | Pratheet | Everyone (route mounting) |
| `server/src/models/Conversation.ts` | Jacob | Demetri (created on match accept) |
| `server/src/models/Message.ts` | Jacob | Demetri (welcome message on match accept) |