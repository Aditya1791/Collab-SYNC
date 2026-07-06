<div align="center">

<img src="public/logo.png" alt="Collab-SYNC Logo" width="120" />

# ⚡ Collab-SYNC

### *Where Teams Move at the Speed of Thought*

[![Made with React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Redux](https://img.shields.io/badge/Redux-Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white)](https://redux-toolkit.js.org)

<br/>

> **A next-generation real-time collaborative workspace.**
> Live boards. Smart presence. Glassmorphic UI. Built for modern teams.

</div>

---

## 🌌 Vision

Collab-SYNC is not just another Kanban board — it is a **living, breathing workspace** where every action is instant, every user is visible, and collaboration feels like sharing the same room, regardless of where your team is.

---

## 🚀 Feature Highlights

| | Feature | Description |
|--|---------|-------------|
| 🔴 | **Live Presence Engine** | See exactly who is online, on which board, updated in real-time via Socket.io with avatar indicators and active user count. |
| 🧩 | **Kanban Boards** | Drag-and-drop task cards across fully customizable columns. Priorities, due dates, checklists, assignees — all built in. |
| 🔐 | **OTP-Secured Auth** | Phone-number linked accounts with OTP-based password reset. JWT tokens. Secure sessions out of the box. |
| 👤 | **Rich Identity System** | Cover photo, avatar, bio, privacy controls. Users control exactly who sees their email, phone, and profile picture. |
| 🔒 | **Granular Privacy Controls** | Three-tier visibility per field — Everyone, Friends (Contacts), or None. Your data, your rules. |
| 👥 | **Role-Based Workspaces** | Invite collaborators as Admin, Member, or Viewer. Fine-grained permissions per workspace. |
| 🎨 | **Glassmorphic Dark UI** | Premium glassmorphism aesthetic with dark/light toggle, smooth micro-animations, and a fully responsive layout. |
| 📡 | **Real-Time Activity Feed** | A live log of every board action — task moves, edits, joins — streamed instantly to all connected users. |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| ⚛️ Frontend | React 18 + TypeScript | UI & component logic |
| 🎨 Styling | Tailwind CSS + Custom Utilities | Glassmorphism, animations |
| 🗃️ State | Redux Toolkit | Global app state management |
| 🌐 Realtime | Socket.io | Live sync & presence tracking |
| 🖥️ Backend | Node.js + Express | REST API & WebSocket server |
| 🔑 Auth | JWT + OTP | Secure authentication |
| 🔗 Routing | React Router v6 | Client-side navigation |

---

## 📦 Getting Started

### Prerequisites
- **Node.js** v18+
- **npm** v9+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Aditya1791/Collab-SYNC.git
cd Collab-SYNC

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. 🚀

---

## 🗂️ Project Structure

```
collabsync-pro/
├── public/               # Static assets (logo, icons)
├── src/
│   ├── components/       # Navbar, Modals, Board UI
│   ├── features/         # Redux slices (auth, boards)
│   ├── types/            # TypeScript interfaces
│   └── main.tsx          # App entry point
├── server/               # Express + Socket.io backend
├── index.html            # HTML shell
└── vite.config.ts        # Vite configuration
```

---

## 🔮 Roadmap

- [ ] 📱 Mobile-responsive board view
- [ ] 🤖 AI-powered task suggestions
- [ ] 📊 Analytics dashboard
- [ ] 🔔 Push notifications
- [ ] 🗂️ File attachments on tasks
- [ ] 🌍 Multi-language support

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome!
Feel free to open a [GitHub Issue](https://github.com/Aditya1791/Collab-SYNC/issues) or submit a pull request.

---

<div align="center">

Made with ❤️ by **Aditya**

⭐ If you find this useful, give it a star!

[![GitHub stars](https://img.shields.io/github/stars/Aditya1791/Collab-SYNC?style=social)](https://github.com/Aditya1791/Collab-SYNC/stargazers)

</div>
