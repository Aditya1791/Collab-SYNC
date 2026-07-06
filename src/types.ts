export interface UserPrivacy {
  avatar: 'everyone' | 'friends' | 'none';
  email: 'everyone' | 'friends' | 'none';
  phoneNumber: 'everyone' | 'friends' | 'none';
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  color: string;
  usernameUpdatedAt?: string;
  twoFactorEnabled?: boolean;
  phoneNumber?: string;
  coverUrl?: string;
  privacy?: UserPrivacy;
}

export interface WorkspaceMember {
  userId: string;
  role: 'admin' | 'member' | 'viewer';
  username: string;
  email: string;
  color: string;
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
