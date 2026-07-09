<div align="center">

<br/>

<img src="https://raw.githubusercontent.com/Aditya1791/Collab-SYNC/main/public/logo.png" width="100" alt="Collab-SYNC" />

<br/>
<br/>

```
   ██████╗ ██████╗ ██╗     ██╗      █████╗ ██████╗       ███████╗██╗   ██╗███╗   ██╗ ██████╗
  ██╔════╝██╔═══██╗██║     ██║     ██╔══██╗██╔══██╗      ██╔════╝╚██╗ ██╔╝████╗  ██║██╔════╝
  ██║     ██║   ██║██║     ██║     ███████║██████╔╝█████╗███████╗ ╚████╔╝ ██╔██╗ ██║██║
  ██║     ██║   ██║██║     ██║     ██╔══██║██╔══██╗╚════╝╚════██║  ╚██╔╝  ██║╚██╗██║██║
  ╚██████╗╚██████╔╝███████╗███████╗██║  ██║██████╔╝      ███████║   ██║   ██║ ╚████║╚██████╗
   ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚═════╝       ╚══════╝   ╚═╝   ╚═╝  ╚═══╝ ╚═════╝
```

### **Where Teams Move at the Speed of Thought**

<br/>

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io)
[![Express](https://img.shields.io/badge/Express-404D59?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Redux](https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white)](https://redux-toolkit.js.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)

<br/>

> **A full-stack, real-time collaborative workspace.**
> Live boards. Smart presence. Glassmorphic UI. Built for teams who refuse to compromise.

<br/>

[**Features**](#-features) · [**Tech Stack**](#%EF%B8%8F-tech-stack) · [**Quick Start**](#-quick-start) · [**Architecture**](#-architecture) · [**Roadmap**](#-roadmap)

<br/>

---

</div>

## 🌌 Why Collab-SYNC?

Most project tools feel dead — you submit a change and pray it saved. **Collab-SYNC** is the opposite. It's a living, real-time workspace where every action — moving a card, editing a task, joining a board — is instantly reflected for every connected user, no refresh required.

```
  Before Collab-SYNC          With Collab-SYNC
  ──────────────────          ────────────────
  ❌ "Did my change save?"    ✅ Changes sync in <100ms
  ❌ Who is working on what?  ✅ Live presence avatars
  ❌ Forgot my password       ✅ OTP reset via phone
  ❌ Privacy = all or nothing ✅ Per-field privacy controls
  ❌ Flat, boring profiles    ✅ Cover photo + avatar + bio
  ❌ One workspace for all    ✅ Multi-workspace hierarchy
```

<br/>

---

## ✨ Features

<details open>
<summary><b>🔐 Authentication & Security</b></summary>
<br/>

- **Sign Up / Login** — Email + password with server-side JWT issuance
- **Two-Factor Authentication (2FA)** — Optional OTP verification via:
  - `📧` Email OTP — code sent to your registered email
  - `📱` SMS OTP — code sent to your linked phone number
- **OTP Password Reset** — Enter phone number → receive OTP → reset password. No old password needed
- **JWT Sessions** — Stateless Bearer tokens; enforced on every API call
- **Protected Routes** — Unauthenticated users are fully gated from all app pages

</details>

<details>
<summary><b>👤 Rich User Profiles</b></summary>
<br/>

- **Username** — Unique display name with cooldown-based edit protection
- **Email** — Primary identifier and OTP delivery channel
- **Phone Number** — Optional; enables SMS OTP and phone-based password recovery
- **Avatar / Profile Picture** — Upload custom JPG/PNG or choose a color preset
- **Cover Photo** — LinkedIn-style banner; uploadable image or solid color preset
- **Profile Color** — Accent fallback shown when no avatar image exists
- **Initials Avatar** — Auto-generated from username as a graceful fallback

</details>

<details>
<summary><b>🔒 Granular Privacy Controls</b></summary>
<br/>

Every sensitive field has **three independently configurable visibility levels**:

| Level | Symbol | Who Sees It |
|-------|--------|-------------|
| Everyone | 🌍 | Any user on the platform |
| Friends | 👥 | Only shared workspace members |
| None | 🚫 | Nobody — shows as **NIL** |

Privacy is set per-field, independently for:
- 🖼️ Profile Picture / Avatar
- 📧 Email Address  
- 📱 Phone Number

</details>

<details>
<summary><b>🏢 Workspaces & Role-Based Access</b></summary>
<br/>

- **Multi-Workspace Support** — Create unlimited workspaces for different teams or clients
- **Workspace Ownership** — Owners have full admin privileges
- **Role-Based Access Control** — Three tiers enforced server-side (not just hidden UI):

| Role | Create Boards | Edit Tasks | Manage Members |
|------|:---:|:---:|:---:|
| 👑 Admin | ✅ | ✅ | ✅ |
| 🧑‍💼 Member | ✅ | ✅ | ❌ |
| 👁️ Viewer | ❌ | ❌ | ❌ |

- **Email Invitations** — Invite users by email with role assignment at point of invite

</details>

<details>
<summary><b>📋 Kanban Boards & Tasks</b></summary>
<br/>

**Boards:**
- Create unlimited boards per workspace (e.g. Design, Dev, Marketing)
- Fully customizable columns — add, rename, reorder
- Column order persists per board and restores on reload

**Task Cards include:**
| Field | Description |
|-------|-------------|
| 📝 Title | Concise task name |
| 📄 Description | Rich notes and context |
| 🏷️ Priority | `Low` / `Medium` / `High` / `Urgent` — color coded |
| 📅 Due Date | Deadline with overdue flag |
| 👤 Assignees | One or multiple workspace members |
| ✅ Checklist | Sub-items with individual toggles + live progress bar |

</details>

<details>
<summary><b>📡 Real-Time Collaboration Engine</b></summary>
<br/>

Powered by **Socket.io** WebSockets — all events are instant, bidirectional, and room-scoped:

```
  User A drags a card  ──▶  Socket event emitted
                              │
                              ▼
                        Server broadcasts to
                        all users in that board room
                              │
                              ▼
  User B, C, D see  ◀──  Card moves on their screen
  the card move            in real-time
```

**Events handled:**
- `task_order_updated` — drag-and-drop card moves
- `task_added` — new task created by any user
- `task_changed` — task edits (title, desc, priority, checklist)
- `task_removed` — task deletions
- `board_refreshed` — column additions or deletions
- `board_presence` — live user join/leave tracking
- `join_board` / `leave_board` — room management

</details>

<details>
<summary><b>🔴 Live Presence System</b></summary>
<br/>

- **Active User Avatars** — Row of live user icons in the Navbar for the current board
- **Click-to-Preview Popover** — Click any avatar to open a centered profile card showing:
  - Cover photo background
  - Profile picture or initials
  - Username, Email, Phone (all subject to privacy rules)
- **Privacy-Aware** — Fields restricted to None/Friends show **NIL** to unauthorized viewers
- **Real-Time Updates** — Presence list updates as users join and leave

</details>

<details>
<summary><b>🎨 UI & Design System</b></summary>
<br/>

- **Glassmorphism** — Frosted glass panels, layered transparency, blurred backdrops
- **Dark / Light Mode** — Detected from system preference; persisted in `localStorage`
- **Micro-Animations** — Hover states, modal entrances, interactive feedback on every element
- **Responsive Layout** — Collapsible sidebar; Navbar adapts gracefully to screen width
- **Color-Coded Priorities** — Instantly recognizable visual hierarchy on task cards
- **Accessible Fallbacks** — Initials avatars and color placeholders prevent broken image states

</details>

<br/>

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                     COLLAB-SYNC                         │
├─────────────────┬───────────────────────────────────────┤
│   FRONTEND      │   React 19 + TypeScript                │
│                 │   Redux Toolkit (state management)     │
│                 │   Tailwind CSS v4 (glassmorphic UI)    │
│                 │   React Router v6 (routing)            │
│                 │   Socket.io-client (real-time)         │
│                 │   @hello-pangea/dnd (drag-and-drop)    │
├─────────────────┼───────────────────────────────────────┤
│   BACKEND       │   Node.js + Express                    │
│                 │   Socket.io (WebSocket server)         │
│                 │   JWT (authentication)                 │
│                 │   OTP (2FA + password reset)           │
├─────────────────┼───────────────────────────────────────┤
│   TOOLING       │   Vite (build + dev server)            │
│                 │   esbuild (server bundler)             │
│                 │   tsx (TypeScript runner)              │
│                 │   TypeScript 5.x (full type safety)    │
└─────────────────┴───────────────────────────────────────┘
```

<br/>

---

## 🚀 Quick Start

**Prerequisites:** Node.js v18+ · npm v9+

```bash
# Clone
git clone https://github.com/Aditya1791/Collab-SYNC.git
cd Collab-SYNC

# Install
npm install

# Configure
cp .env.example .env
# Fill in your values in .env

# Run
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** — frontend and backend both start together.

<br/>

---

## 🏗️ Architecture

```
collabsync-pro/
│
├── public/                      # Static assets (logo, favicon)
│
├── src/                         # Frontend (React + TypeScript)
│   ├── components/
│   │   ├── AuthModal.tsx        # Login · Register · 2FA flow
│   │   ├── KanbanBoard.tsx      # Columns + drag-and-drop
│   │   ├── Navbar.tsx           # Top bar · presence · profile preview
│   │   ├── SettingsModal.tsx    # Profile · privacy · security settings
│   │   ├── TaskCard.tsx         # Task card display component
│   │   ├── TaskDetailModal.tsx  # Full task editor (checklist, assignees)
│   │   └── WorkspaceSidebar.tsx # Workspace + board navigation
│   │
│   ├── features/
│   │   ├── auth/                # Auth Redux slice
│   │   └── boards/              # Board + workspace Redux slice
│   │
│   ├── hooks/
│   │   └── useSocket.ts         # Singleton Socket.io client + event handlers
│   │
│   ├── store/                   # Redux store config
│   ├── types.ts                 # All shared TypeScript interfaces
│   └── App.tsx                  # Root layout
│
├── server/                      # Backend (Node.js + Express)
│   ├── controllers/             # Auth · Workspace · Board · Task logic
│   ├── middleware/              # JWT auth middleware
│   └── sockets/                 # Socket.io board event handlers
│
├── server.ts                    # Entry point — Express + Socket.io bootstrap
├── index.html                   # HTML shell
└── vite.config.ts               # Vite configuration
```

<br/>

---

## 🔮 Roadmap

```
  ✅ Done                          🔜 Coming Soon
  ──────────────────────────       ──────────────────────────
  Real-time board sync             📱 Mobile responsive view
  Live presence avatars            🤖 AI task suggestions
  OTP 2FA auth                     📊 Analytics dashboard
  Privacy controls                 🔔 Push notifications
  Cover photo + avatar             🗂️ File attachments
  Role-based access                🏷️ Labels and tags
  Kanban drag-and-drop             🔍 Global search
  Activity feed                    📅 Calendar view
  Dark / light mode                🌍 Multi-language (i18n)
  Glassmorphic UI                  🔗 Public shareable boards
```

<br/>

---

## 🤝 Contributing

```bash
# Fork → Clone → Branch
git checkout -b feature/your-feature-name

# Make changes, then commit using conventional commits
git commit -m "feat: add your feature"

# Push and open a Pull Request
git push origin feature/your-feature-name
```

Please keep code style consistent and add comments where needed.

<br/>

---

## 📄 License

MIT © [Aditya](https://github.com/Aditya1791)

<br/>

---

<div align="center">

**Built with passion. Designed with purpose.**

If Collab-SYNC helps your team, consider giving it a ⭐ or supporting the project!

<br/>

<a href="public/Aditya%20Ranjan.jpeg" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="200" />
</a>

<br/>
<br/>

[![GitHub stars](https://img.shields.io/github/stars/Aditya1791/Collab-SYNC?style=social)](https://github.com/Aditya1791/Collab-SYNC/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Aditya1791/Collab-SYNC?style=social)](https://github.com/Aditya1791/Collab-SYNC/network/members)
[![GitHub issues](https://img.shields.io/github/issues/Aditya1791/Collab-SYNC?style=social)](https://github.com/Aditya1791/Collab-SYNC/issues)

<br/>

*Made by [Aditya](https://github.com/Aditya1791)*

</div>
