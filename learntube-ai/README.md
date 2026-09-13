# LearnTube AI

LearnTube AI transforms educational YouTube videos and playlists into interactive learning experiences.

## Learning Flow

**Video -> AI Tutor -> Learn -> Quiz -> Learning Gaps -> Personalized Review**

The current frontend is the existing Figma Make design with interactive local screen flows for landing, authentication, processing, workspace learning, quizzes, results, and My Learning.

## Stack

- React 19
- TypeScript 5.7
- Vite 8
- Tailwind CSS v4
- lucide-react
- pnpm

## Project Structure

```text
src/
├── components/       Shared UI components
├── screens/          Existing product screens
├── services/         Backend API request boundary
├── types/            Shared frontend/backend contract types
├── App.tsx           Screen-state application shell
├── index.css         Global styles and Tailwind entrypoint
└── main.tsx          React entrypoint
.figma/               Figma Make tooling and site configuration
```

The frontend remains at the repository root because the Vite configuration and Figma Make tooling use root-relative paths. A FastAPI backend can be added later under `/backend` without moving or changing the frontend.

## Installation and Development

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev
```

The development server uses the port configured by `PORT`, or `8443` by default in the existing Vite configuration.

## Production Build

```bash
pnpm build
pnpm preview
```

## Environment Variables

Copy `.env.example` to `.env.local` and adjust the API URL when the FastAPI service is available:

```bash
VITE_API_URL=http://localhost:8000
```

Vite exposes only variables prefixed with `VITE_` to browser code. Do not put secrets in frontend environment files.

## Backend Integration

`src/services/api.ts` provides a small typed request boundary using `VITE_API_URL`. Shared domain contracts for the planned integration live in `src/types/learning.ts`. The current UI still uses its existing local/static data and does not require the backend to run.

The FastAPI team can add `/backend` and then expose endpoints for video ingestion, transcripts, tutor messages, quizzes, quiz results, learning gaps, review recommendations, and progress. Components should call service functions rather than hardcoding backend URLs.

## Current Status

- Existing frontend UI and interactions preserved.
- Build verified successfully with Vite.
- API base URL and shared learning types prepared for backend integration.
- Backend not included yet.
