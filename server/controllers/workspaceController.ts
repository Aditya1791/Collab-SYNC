import { Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export const workspaceController = {
  getWorkspaces: (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      // Find workspaces where ownerId matches OR user is in the members array
      const workspaces = db.workspaces.find().filter(w => 
        w.ownerId === userId || w.members.some(m => m.userId === userId)
      );

      // Populate member user profiles
      const populated = workspaces.map(w => {
        const membersWithDetails = w.members.map(m => {
          const user = db.users.findById(m.userId);
          return {
            userId: m.userId,
            role: m.role,
            username: user?.username || 'Unknown',
            email: user?.email || '',
            color: user?.color || '#cbd5e1'
          };
        }).filter(Boolean);

        return {
          ...w,
          members: membersWithDetails
        };
      });

      res.json(populated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server error' });
    }
  },

  createWorkspace: (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Workspace name is required' });
      }

      const userId = req.user!.id;
      const workspace = db.workspaces.create({
        name,
        description: description || '',
        ownerId: userId,
        members: [{ userId, role: 'admin' }]
      });

      // Populate member user details
      const user = db.users.findById(userId);
      const populatedWorkspace = {
        ...workspace,
        members: [{
          userId,
          role: 'admin',
          username: user?.username || 'Unknown',
          email: user?.email || '',
          color: user?.color || '#cbd5e1'
        }]
      };

      // Auto-create a default board inside the workspace
      const defaultBoard = db.boards.create({
        name: 'Kanban Board',
        workspaceId: workspace.id,
        columns: [
          { id: 'todo', title: 'To Do', taskIds: [] },
          { id: 'in_progress', title: 'In Progress', taskIds: [] },
          { id: 'done', title: 'Done', taskIds: [] }
        ],
        columnOrder: ['todo', 'in_progress', 'done']
      });

      // Log activity
      db.activities.create({
        boardId: defaultBoard.id,
        userId,
        username: user?.username || 'System',
        text: `created workspace "${name}" and initialized board "${defaultBoard.name}"`
      });

      res.status(201).json({
        workspace: populatedWorkspace,
        defaultBoard
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server error' });
    }
  },

  addMember: (req: AuthenticatedRequest, res: Response) => {
    try {
      const { workspaceId, email, role } = req.body;
      if (!workspaceId || !email) {
        return res.status(400).json({ error: 'Workspace ID and email are required' });
      }

      const workspace = db.workspaces.findById(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      // Check permissions: only admins or owner can add members
      const userId = req.user!.id;
      const userMemberInfo = workspace.members.find(m => m.userId === userId);
      const isOwner = workspace.ownerId === userId;
      const isAdmin = userMemberInfo?.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only admins can add members' });
      }

      const targetUser = db.users.findOne({ email });
      if (!targetUser) {
        return res.status(404).json({ error: 'No user found with this email' });
      }

      // Check if already a member
      if (workspace.members.some(m => m.userId === targetUser.id)) {
        return res.status(400).json({ error: 'User is already a member of this workspace' });
      }

      const updatedMembers = [...workspace.members, { userId: targetUser.id, role: role || 'member' }];
      const updatedWorkspace = db.workspaces.findByIdAndUpdate(workspaceId, { members: updatedMembers });

      // Populate members with details
      const membersWithDetails = updatedWorkspace!.members.map(m => {
        const user = db.users.findById(m.userId);
        return {
          userId: m.userId,
          role: m.role,
          username: user?.username || 'Unknown',
          email: user?.email || '',
          color: user?.color || '#cbd5e1'
        };
      });

      res.json({
        ...updatedWorkspace,
        members: membersWithDetails
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server error' });
    }
  }
};
