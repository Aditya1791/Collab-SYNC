<div align="center">

<img src="public/logo.png" alt="Collab-SYNC Logo" width="140" />

# ⚡ Collab-SYNC

### *Where Teams Move at the Speed of Thought*

[![Made with React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Redux Toolkit](https://img.shields.io/badge/Redux-Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white)](https://redux-toolkit.js.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

> **A next-generation real-time collaborative workspace.**
> Live boards. Smart presence. Glassmorphic UI. Built for modern teams who refuse to compromise.

<br/>

[🚀 Get Started](#-getting-started) • [✨ Features](#-features-in-depth) • [🛠 Tech Stack](#%EF%B8%8F-tech-stack) • [📦 Installation](#-getting-started) • [🔮 Roadmap](#-roadmap)

</div>

---

## 🌌 Why Collab-SYNC?

In a world where remote teams are the norm, most tools feel either too bloated or too bare. **Collab-SYNC** bridges that gap — giving you the power of enterprise-grade project management with the elegance of a modern, real-time experience.

| The Problem | The Collab-SYNC Solution |
|---|---|
| Tools feel slow — you never know if changes are saved | Every update syncs **instantly** across all connected users via WebSockets |
| You can't see who is working on what right now | **Live presence avatars** show exactly who is online and active |
| Privacy is all-or-nothing | **Granular per-field privacy** lets you control who sees each piece of your data |
| Clunky auth flows with no recovery option | **OTP-secured login** with phone number reset — fast, simple, and secure |
| Profiles are flat and boring | **Rich profiles** with cover photos, avatars, bios, and privacy controls |
| Tabs get lost in one flat workspace | **Multi-workspace + multi-board** hierarchy keeps everything organized |

---

## ✨ Features In-Depth

### 🔐 Authentication & Security

**Collab-SYNC treats security as a first-class citizen.**

- **Sign Up / Login** — Email + password registration with server-side JWT issuance
- **Two-Factor Authentication (2FA)** — On login, the server can require OTP verification via:
  - 📧 Email OTP — A one-time code sent to your registered email address
  - 📱 Phone OTP — A one-time code sent via SMS to your linked phone number
- **OTP-Based Password Reset** — Forgot your password? Enter your phone number and receive an OTP to reset it without needing to remember your old password
- **JWT Session Management** — Secure Bearer tokens stored in Redux state, passed with every API call
- **Protected Routes** — Unauthenticated users are gated from board, workspace, and settings pages

---

### 👤 User Profiles & Identity

**Every user has a full identity, not just a username.**

- **Username** — Choose a unique display name (editable once per defined period to prevent abuse)
- **Email** — Primary identifier, also used for OTP delivery
- **Phone Number** — Optional, but required for SMS OTP and password recovery via phone
- **Avatar / Profile Picture** — Upload a custom JPG/PNG, or choose from a curated color preset palette
- **Cover Photo** — A LinkedIn-style banner behind your profile picture, uploadable as a custom image or set via color presets
- **Profile Color** — A fallback accent color shown as your avatar background when no image is uploaded
- **Initials Avatar** — Auto-generated initials avatar as a graceful fallback

---

### 🔒 Granular Privacy Controls

**Your data. Your rules. No compromise.**

Every sensitive profile field has **three independent privacy levels**:

| Level | Who Can See It |
|-------|----------------|
| 🌍 **Everyone** | Any user on the platform |
| 👥 **Friends (Contacts)** | Only users who share a workspace with you |
| 🚫 **None** | Nobody — the field shows as **NIL** to others |

Privacy can be configured independently for:
- 🖼️ Profile Picture / Avatar
- 📧 Email Address
- 📱 Phone Number

This means you can share your email publicly while keeping your phone private — total control.

---

### 🏢 Workspaces

**A workspace is your team's home base.**

- **Create Unlimited Workspaces** — Organize teams, clients, or departments in separate, isolated workspaces
- **Workspace Name & Description** — Give each workspace a clear identity
- **Ownership** — Every workspace has an owner who has full admin control
- **Membership Management** — Workspace members can be listed, invited, or removed

---

### 👥 Role-Based Access Control

**Not everyone needs the same level of access.**

Each workspace member is assigned one of three roles:

| Role | Capabilities |
|------|-------------|
| 👑 **Admin** | Create boards, manage members, invite users, delete content |
| 🧑‍💼 **Member** | Create and edit tasks, move cards, participate in boards |
| 👁️ **Viewer** | Read-only access — see boards and tasks but cannot modify |

- Only **Admins and Owners** see the invite and management controls
- Roles are enforced server-side via middleware — not just hidden in the UI

---

### 📨 Workspace Invitations

**Grow your team with ease.**

- **Invite by Email** — Enter a registered user's email to add them to the workspace
- **Assign Role on Invite** — Choose Admin, Member, or Viewer at the point of invitation
- **Real-Time Member List** — See all current members, their roles, and their usernames

---

### 📋 Kanban Boards

**Visual, intuitive, and blazing fast.**

- **Create Multiple Boards** — Each workspace can contain unlimited boards (e.g., Marketing, Development, Design)
- **Custom Columns** — Add, rename, or reorder columns like *Backlog*, *In Progress*, *In Review*, *Done*
- **Drag-and-Drop** — Move cards between any column smoothly with full persistence
- **Real-Time Sync** — When you move a card, every other user on the board sees it move instantly — no refresh needed
- **Column Order Persistence** — Custom column orders are saved per board and restored on reload

---

### 🗂️ Task Cards

**Every task is a self-contained unit of work.**

Each task card supports:

- 📝 **Title** — A concise name for the task
- 📄 **Description** — Rich text field for detailed notes, context, or instructions
- 🏷️ **Priority** — Four levels: `Low` / `Medium` / `High` / `Urgent` (with color-coded badges)
- 📅 **Due Date** — Set a deadline; overdue tasks are clearly flagged
- 👤 **Assignees** — Assign one or multiple workspace members to a task
- ✅ **Checklist** — Add sub-items inside a task with individual completion toggles and a live progress bar
- 🗑️ **Delete Task** — Remove tasks when no longer needed with a confirmation guard

All changes to tasks are broadcast via Socket.io so **all users on that board see updates live**.

---

### 📡 Real-Time Collaboration Engine

**The beating heart of Collab-SYNC.**

Powered by **Socket.io** WebSockets, the platform enables:

- **Live Task Movement** — Drag a card, and all connected users see it move in real-time
- **Live Task Updates** — Edit a task's title, description, priority, or checklist — changes propagate instantly
- **Live Column Creation** — Add a new column and it appears on everyone's screen immediately
- **Live Board Join Events** — When a user opens a board, their avatar appears in others' presence lists
- **Board Activity Feed** — A chronological log of every action (task created, moved, updated, user joined) shown live on the board

---

### 🔴 Live Presence & Active Users

**See your team in motion.**

- **Active User Avatars** — A horizontal row of live user avatars displayed in the Navbar when others are on the same board
- **Click to Preview** — Click any active user's avatar to open a **Live Profile Preview Popover** in the center of the screen, showing:
  - Cover photo background
  - Profile picture or initials avatar
  - Username
  - Email (subject to their privacy settings)
  - Phone number (subject to their privacy settings)
- **Privacy-Aware Display** — If a user has set their field to *None* or *Friends-only*, viewers outside their contacts see **NIL** instead
- **Real-Time Updates** — Presence data updates as users join and leave boards

---

### ⚙️ Settings & Profile Management

**A full-featured settings panel for every user.**

- **Cover Photo Section** — Upload a custom cover photo or choose a solid color preset for your profile banner
- **Profile Picture Section** — Upload a custom image or select from color presets; displays as an overlapping circle above the cover photo (LinkedIn-style layout)
- **Username Update** — Change your display name (rate-limited by a cooldown period)
- **Phone Number Linking** — Add or update a linked phone number for OTP login and password recovery
- **Password Change** — Update password; if a phone number is linked, can be done via OTP verification
- **Privacy Configuration** — Independent toggles for avatar, email, and phone number visibility
- **2FA Toggle** — Enable or disable Two-Factor Authentication at any time

---

### 🎨 UI / UX Design

**Premium by default.**

- **Glassmorphism** — Frosted glass panels, blurred backdrops, and layered transparency throughout the UI
- **Dark / Light Mode** — System-preference aware, with a manual toggle in the Navbar; preference persisted to `localStorage`
- **Micro-Animations** — Smooth hover states, modal transitions, and interactive feedback on every element
- **Responsive Layout** — Collapsible sidebar for compact screens; Navbar adapts to available space
- **Color-Coded Priorities** — Task priority levels are instantly recognizable with distinct badge colors
- **Accessible Fallbacks** — Initials avatars and color-coded placeholders ensure the UI never shows a broken image

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| ⚛️ Frontend | React 18 + TypeScript | Component-driven UI with full type safety |
| 🎨 Styling | Tailwind CSS + Custom Utilities | Rapid glassmorphic UI development |
| 🗃️ State | Redux Toolkit | Predictable, centralized state for auth + boards |
| 🌐 Real-Time | Socket.io (client + server) | Bidirectional WebSocket events for live sync |
| 🖥️ Backend | Node.js + Express | Lightweight, fast REST API |
| 🔑 Authentication | JWT + OTP (Email & SMS) | Stateless, secure token auth with 2FA |
| 🔀 Routing | React Router v6 | Declarative client-side navigation |
| 📦 Build | Vite | Lightning-fast dev server and production builds |

---

## 📦 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Aditya1791/Collab-SYNC.git
cd Collab-SYNC

# 2. Install all dependencies
npm install

# 3. Set up your environment variables
cp .env.example .env
# Open .env and fill in your values (JWT secret, SMS API keys, etc.)

# 4. Start the development server (frontend + backend)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `SMS_API_KEY` | API key for your SMS provider (OTP delivery) |
| `PORT` | Backend server port (default: 3001) |

> See `.env.example` for the full list of required variables.

---

## 🗂️ Project Structure

```
collabsync-pro/
├── public/                  # Static assets served at root URL
│   └── logo.png             # Application logo
├── src/
│   ├── components/
│   │   ├── AuthModal.tsx        # Login / Register / 2FA flow
│   │   ├── KanbanBoard.tsx      # Board columns and drag-and-drop
│   │   ├── Navbar.tsx           # Top bar, presence, profile preview
│   │   ├── SettingsModal.tsx    # Full user settings & privacy panel
│   │   ├── TaskCard.tsx         # Individual task card component
│   │   ├── TaskDetailModal.tsx  # Task editor with checklist & assignees
│   │   └── WorkspaceSidebar.tsx # Workspace/board navigation sidebar
│   ├── features/
│   │   ├── auth/                # Auth Redux slice + state
│   │   └── boards/              # Board/workspace Redux slice + state
│   ├── hooks/
│   │   └── useSocket.ts         # Singleton Socket.io client hook
│   ├── store/                   # Redux store configuration
│   ├── types.ts                 # All shared TypeScript interfaces
│   ├── App.tsx                  # Root layout and routing
│   └── main.tsx                 # React entry point
├── server/                  # Express + Socket.io backend
├── index.html               # HTML shell with favicon + meta
├── vite.config.ts           # Vite build configuration
└── .env.example             # Environment variable template
```

---

## 🔮 Roadmap

- [ ] 📱 Fully responsive mobile board view
- [ ] 🤖 AI-powered task breakdown and suggestions
- [ ] 📊 Workspace analytics and productivity dashboard
- [ ] 🔔 In-app and push notification system
- [ ] 🗂️ File and image attachments on task cards
- [ ] 🏷️ Labels and tags for tasks
- [ ] 🔍 Global search across boards and tasks
- [ ] 📅 Calendar view for due dates
- [ ] 🌍 Multi-language / i18n support
- [ ] 🔗 Public shareable board links

---

## 🤝 Contributing

All contributions are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please follow the existing code style and add comments where appropriate.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

<div align="center">

Built with passion by **[Aditya](https://github.com/Aditya1791)**

⭐ **Star this repo** if Collab-SYNC makes your team more productive!

[![GitHub stars](https://img.shields.io/github/stars/Aditya1791/Collab-SYNC?style=social)](https://github.com/Aditya1791/Collab-SYNC/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Aditya1791/Collab-SYNC?style=social)](https://github.com/Aditya1791/Collab-SYNC/network/members)

</div>
