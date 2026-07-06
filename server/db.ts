import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'db.json');

// Interface definitions
export interface UserPrivacy {
  avatar: 'everyone' | 'friends' | 'none';
  email: 'everyone' | 'friends' | 'none';
  phoneNumber: 'everyone' | 'friends' | 'none';
}

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  color: string;
  usernameUpdatedAt?: string;
  twoFactorEnabled?: boolean;
  phoneNumber?: string;
  otpCode?: string;
  emailOtpCode?: string;
  phoneOtpCode?: string;
  otpExpiresAt?: string;
  coverUrl?: string;
  privacy?: UserPrivacy;
}

export interface WorkspaceMember {
  userId: string;
  role: 'admin' | 'member' | 'viewer';
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface Board {
  id: string;
  name: string;
  workspaceId: string;
  columns: Column[];
  columnOrder: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  boardId: string;
  columnId: string;
  assignees: string[]; // User IDs
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  checklist?: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  boardId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  workspaces: Workspace[];
  boards: Board[];
  tasks: Task[];
  activities: Activity[];
}

const initialData: DatabaseSchema = {
  users: [],
  workspaces: [],
  boards: [],
  tasks: [],
  activities: []
};

class LocalDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = { ...initialData };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure all collections exist
        this.data.users = this.data.users || [];
        this.data.workspaces = this.data.workspaces || [];
        this.data.boards = this.data.boards || [];
        this.data.tasks = this.data.tasks || [];
        this.data.activities = this.data.activities || [];
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Error loading database, resetting...', e);
      this.data = { ...initialData };
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save database file', e);
    }
  }

  // Helper to generate IDs
  private genId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // --- Users Collection ---
  get users() {
    return {
      find: (filter?: Partial<User>) => {
        if (!filter) return this.data.users;
        return this.data.users.filter(u => 
          Object.entries(filter).every(([key, val]) => (u as any)[key] === val)
        );
      },
      findOne: (filter: Partial<User>) => {
        return this.data.users.find(u => 
          Object.entries(filter).every(([key, val]) => (u as any)[key] === val)
        ) || null;
      },
      findById: (id: string) => {
        return this.data.users.find(u => u.id === id) || null;
      },
      findByIdAndUpdate: (id: string, update: Partial<User>) => {
        const idx = this.data.users.findIndex(u => u.id === id);
        if (idx === -1) return null;
        this.data.users[idx] = {
          ...this.data.users[idx],
          ...update
        };
        this.save();
        return this.data.users[idx];
      },
      create: (item: Omit<User, 'id'>) => {
        const newUser: User = { ...item, id: this.genId() };
        this.data.users.push(newUser);
        this.save();
        return newUser;
      }
    };
  }

  // --- Workspaces Collection ---
  get workspaces() {
    return {
      find: (filter?: Partial<Workspace>) => {
        if (!filter) return this.data.workspaces;
        return this.data.workspaces.filter(w => 
          Object.entries(filter).every(([key, val]) => (w as any)[key] === val)
        );
      },
      findById: (id: string) => {
        return this.data.workspaces.find(w => w.id === id) || null;
      },
      create: (item: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date().toISOString();
        const newWorkspace: Workspace = {
          ...item,
          id: this.genId(),
          createdAt: now,
          updatedAt: now
        };
        this.data.workspaces.push(newWorkspace);
        this.save();
        return newWorkspace;
      },
      findByIdAndUpdate: (id: string, update: Partial<Workspace>) => {
        const idx = this.data.workspaces.findIndex(w => w.id === id);
        if (idx === -1) return null;
        this.data.workspaces[idx] = {
          ...this.data.workspaces[idx],
          ...update,
          updatedAt: new Date().toISOString()
        };
        this.save();
        return this.data.workspaces[idx];
      },
      findByIdAndDelete: (id: string) => {
        const idx = this.data.workspaces.findIndex(w => w.id === id);
        if (idx === -1) return false;
        this.data.workspaces.splice(idx, 1);
        this.save();
        return true;
      }
    };
  }

  // --- Boards Collection ---
  get boards() {
    return {
      find: (filter?: Partial<Board>) => {
        if (!filter) return this.data.boards;
        return this.data.boards.filter(b => 
          Object.entries(filter).every(([key, val]) => (b as any)[key] === val)
        );
      },
      findById: (id: string) => {
        return this.data.boards.find(b => b.id === id) || null;
      },
      create: (item: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date().toISOString();
        const newBoard: Board = {
          ...item,
          id: this.genId(),
          createdAt: now,
          updatedAt: now
        };
        this.data.boards.push(newBoard);
        this.save();
        return newBoard;
      },
      findByIdAndUpdate: (id: string, update: Partial<Board>) => {
        const idx = this.data.boards.findIndex(b => b.id === id);
        if (idx === -1) return null;
        this.data.boards[idx] = {
          ...this.data.boards[idx],
          ...update,
          updatedAt: new Date().toISOString()
        };
        this.save();
        return this.data.boards[idx];
      },
      findByIdAndDelete: (id: string) => {
        const idx = this.data.boards.findIndex(b => b.id === id);
        if (idx === -1) return false;
        this.data.boards.splice(idx, 1);
        this.save();
        return true;
      }
    };
  }

  // --- Tasks Collection ---
  get tasks() {
    return {
      find: (filter?: Partial<Task>) => {
        if (!filter) return this.data.tasks;
        return this.data.tasks.filter(t => 
          Object.entries(filter).every(([key, val]) => (t as any)[key] === val)
        );
      },
      findById: (id: string) => {
        return this.data.tasks.find(t => t.id === id) || null;
      },
      create: (item: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date().toISOString();
        const newTask: Task = {
          ...item,
          id: this.genId(),
          checklist: item.checklist || [],
          createdAt: now,
          updatedAt: now
        };
        this.data.tasks.push(newTask);
        this.save();
        return newTask;
      },
      findByIdAndUpdate: (id: string, update: Partial<Task>) => {
        const idx = this.data.tasks.findIndex(t => t.id === id);
        if (idx === -1) return null;
        this.data.tasks[idx] = {
          ...this.data.tasks[idx],
          ...update,
          updatedAt: new Date().toISOString()
        };
        this.save();
        return this.data.tasks[idx];
      },
      findByIdAndDelete: (id: string) => {
        const idx = this.data.tasks.findIndex(t => t.id === id);
        if (idx === -1) return false;
        this.data.tasks.splice(idx, 1);
        this.save();
        return true;
      }
    };
  }

  // --- Activities Collection ---
  get activities() {
    return {
      find: (filter?: Partial<Activity>) => {
        const sorted = [...this.data.activities].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        if (!filter) return sorted;
        return sorted.filter(act => 
          Object.entries(filter).every(([key, val]) => (act as any)[key] === val)
        );
      },
      create: (item: Omit<Activity, 'id' | 'createdAt'>) => {
        const now = new Date().toISOString();
        const newAct: Activity = {
          ...item,
          id: this.genId(),
          createdAt: now
        };
        this.data.activities.push(newAct);
        // Keep activity logs bounded to prevent database file bloating
        if (this.data.activities.length > 500) {
          this.data.activities.shift();
        }
        this.save();
        return newAct;
      }
    };
  }
}

export const db = new LocalDatabase();
