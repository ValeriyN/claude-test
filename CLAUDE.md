# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (install deps + generate Prisma client + run migrations)
npm run setup

# Development server (Turbopack)
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Run all tests
npm test

# Run a single test file
npx vitest run src/lib/__tests__/file-system.test.ts

# Reset the database (destructive)
npm run db:reset

# Regenerate Prisma client after schema changes
npx prisma generate

# Run new migrations after schema changes
npx prisma migrate dev
```

All `next` commands require `NODE_OPTIONS='--require ./node-compat.cjs'` (already embedded in the npm scripts via the `node-compat.cjs` shim).

## Architecture Overview

UIGen is an AI-powered React component generator. Users describe components in a chat interface, and Claude generates/edits files in a virtual file system. Generated components are previewed live in a sandboxed iframe.

### Virtual File System

`src/lib/file-system.ts` — `VirtualFileSystem` is a pure in-memory tree. No generated files are ever written to disk. The VFS is serialized to JSON and stored in the `Project.data` column in SQLite.

`src/lib/contexts/file-system-context.tsx` — React context that wraps a `VirtualFileSystem` instance and exposes `handleToolCall`, which maps AI tool calls (`str_replace_editor`, `file_manager`) to VFS operations.

### AI Generation Pipeline

1. **Chat context** (`src/lib/contexts/chat-context.tsx`) uses Vercel AI SDK's `useChat` with `api: "/api/chat"`. On each message, the current VFS serialization and `projectId` are sent in the request body.
2. **Chat route** (`src/app/api/chat/route.ts`) reconstructs the VFS server-side, calls `streamText` with two tools (`str_replace_editor`, `file_manager`), and on finish saves updated messages + VFS data to the project in SQLite.
3. **Tools** (`src/lib/tools/str-replace.ts`, `src/lib/tools/file-manager.ts`) operate on the server-side VFS reconstruction and return results back to the model. The client also receives tool call events and applies the same operations to the client-side VFS (via `handleToolCall`).
4. **Model** (`src/lib/provider.ts`) uses `claude-haiku-4-5` when `ANTHROPIC_API_KEY` is set, or falls back to `MockLanguageModel` (which generates static counter/form/card components) when no key is present.

### Preview System

`src/lib/transform/jsx-transformer.ts` — Transforms JSX/TSX files using Babel standalone (client-side) and builds an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) using blob URLs. React/React DOM are loaded from `esm.sh`. Third-party npm packages are also resolved through `esm.sh`. The `@/` alias maps to the VFS root.

`src/components/preview/PreviewFrame.tsx` — Renders the iframe with `srcdoc` containing the generated HTML, import map, and a module script that dynamically imports the entry point (`/App.jsx` by default). The preview iframe includes Tailwind CDN so generated components can use Tailwind classes. Syntax errors from Babel transform are shown inline in the preview.

### Auth & Persistence

- JWT-based sessions via `jose`, stored in an httpOnly cookie (`auth-token`). See `src/lib/auth.ts`.
- Anonymous users can generate components but their work is tracked in `src/lib/anon-work-tracker.ts` (localStorage) so it can be saved on sign-up.
- Prisma + SQLite (`prisma/dev.db`). Schema has `User` and `Project` models. `Project.messages` and `Project.data` are JSON stored as strings.
- **The Prisma client is generated to `src/generated/prisma`** (not the default `node_modules/@prisma/client`), imported as `@/generated/prisma`.

### UI Layout

`src/app/main-content.tsx` — Split-pane layout: left panel is `ChatInterface`, right panel is tabbed between `PreviewFrame` and a resizable `FileTree` + `CodeEditor`. Both `FileSystemProvider` and `ChatProvider` wrap the layout.

Authenticated users are redirected from `/` to `/:projectId`. Each project URL loads its saved VFS data and message history from the DB.

### Tests

Tests use Vitest with jsdom. Test files live in `__tests__` subdirectories alongside the code they test.

## User Instructions

- Use comments sparingly. Only comment complex code.
- The database schema is defined in `prisma/schema.prisma`. Reference it anytime you need to understand the structure of data stored in the database.
