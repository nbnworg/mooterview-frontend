# Frontend Developer Guide

This document provides a high level overview of the code base and common practices used in this project. It is intended as a starting point for new contributors.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run the development server**
   ```bash
   npm run dev
   ```
   This starts Vite with hot reloading.
3. **Lint the code**
   ```bash
   npm run lint
   ```
4. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

The main source code lives in the `src` directory:

```
src/
├── App.tsx            # root application component and route definitions
├── components/        # reusable UI components
├── contexts/          # React contexts (e.g. authentication)
├── hooks/             # custom React hooks
├── pages/             # top level pages for each route
├── utils/             # constants and shared utility types
└── index.css          # global styles and variables
```

### Components
- `navbar/` – header navigation bar with login/logout links.
- `auth/` – chat style authentication components including `ChatAuthForm` and `AuthLayout`.
- `codeEditor/` – wrapper around `react-simple-code-editor` used on the interview page.

### Pages
- `signup/` and `login/` provide the chat style onboarding forms.
- `homepage/` lists available problems fetched from the API.
- `problem/` contains the interview screen and code editor.
- `landingPage/` is shown when not logged in.

### Contexts and Hooks
- `AuthContext` manages login state and stores it in `localStorage`.
- `useChatAuth` handles the multi-step chat based forms and API calls.

### Utilities
- `constants.ts` contains API base URLs, level colour values and helper mappings for errors.
- `types/` defines reusable TypeScript interfaces used across the app.

## Routing

Routes are declared in `App.tsx` using React Router:

```
<Route path="/" element={<AuthRedirect />} />
<Route path="/sign-up" element={<Signup />} />
<Route path="/log-in" element={<Login />} />
<Route path="/landing" element={<LandingPage />} />
<Route path="/home" element={<Homepage />} />
<Route path="/problem/:title" element={<Problem />} />
```

`AuthRedirect` sends users to either `/home` or `/landing` based on login state.

## Styling

- Global CSS variables are defined in `src/index.css`.
- Each component/page has a dedicated `.css` file imported in the corresponding TypeScript/TSX file.
- Font families (`Monteserrat`, `Cascadia Code`, `Inter`) are loaded via Google Fonts in `index.css`.

## TypeScript & Linting

- The project is written entirely in TypeScript using strict compiler settings defined in `tsconfig.app.json`.
- ESLint is configured via `eslint.config.js` and should be run using `npm run lint` before committing.

## Authentication Flow

`Signup` and `Login` pages use the `ChatAuthForm` component, which displays a message sequence and prompts the user for each field (email, password, etc.). The `useChatAuth` hook manages form state, calls the API and handles success and error responses.

## Code Editor

The `CodeEditor` component provides a minimal editor for solving problems. Users can select a language (JavaScript, Python, Java, C++) and code is stored per language. A simple timer counts down from 15 minutes.

## Further Reading

- See `src/utils/constants.ts` for API endpoints and error mappings.
- Browse the individual components within `src/components` for more detailed examples.

