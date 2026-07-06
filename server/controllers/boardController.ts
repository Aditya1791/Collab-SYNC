import { Response } from 'express';
import { db, Board, Task } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export const boardController = {
  getBoards: (req: AuthenticatedRequest, res: Response) => {
    try {
      const { workspaceId } = req.query;
      if (!workspaceId) {
        return res.status(400).json({ error: 'Workspace ID is required' });
      }

      const boards = db.boards.find({ workspaceId: workspaceId as string });
      res.json(boards);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server error' });
    }
  },

  getBoardDetails: (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const board = db.boards.findById(id);
      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      // Check if user belongs to this board's workspace
      const workspace = db.workspaces.findById(board.workspaceId);
      const userId = req.user!.id;
      if (!workspace || (workspace.ownerId !== userId && !workspace.members.some(m => m.userId === userId))) {
        return res.status(403).json({ error: 'Forbidden: Access to this workspace is denied' });
      }

      // Fetch all tasks for this board
      const tasks = db.tasks.find({ boardId: id });
      
      // Fetch board activities
      const activities = db.activities.find({ boardId: id });

      res.json({
        board,
        tasks,
        activities
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server error' });
    }
  },

  createBoard: (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, workspaceId } = req.body;
      if (!name || !workspaceId) {
        return res.status(400).json({ error: 'Board name and workspaceId are required' });
      }

      const workspace = db.workspaces.findById(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const board = db.boards.create({
        name,
        workspaceId,
        columns: [
          { id: 'todo', title: 'To Do', taskIds: [] },
          { id: 'in_progress', title: 'In Progress', taskIds: [] },
          { id: 'done', title: 'Done', taskIds: [] }
        ],
        columnOrder: ['todo', 'in_progress', 'done']
      });

      // Log activity
      db.activities.create({
        boardId: board.id,
        userId: req.user!.id,
        username: req.user!.username,
        text: `created board "${name}"`
      });

      res.status(201).json(board);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server error' });
    }
  },

  updateBoard: (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, columns, columnOrder } = req.body;
      const board = db.boards.findById(id);
      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      const updated = db.boards.findByIdAndUpdate(id, {
        ...(name && { name }),
        ...(columns && { columns }),
        ...(columnOrder && { columnOrder })
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server error' });
    }
  },

  deleteBoard: (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const board = db.boards.findById(id);
      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      db.boards.findByIdAndDelete(id);
      // Clean up tasks in that board
      const tasks = db.tasks.find({ boardId: id });
      tasks.forEach(t => db.tasks.findByIdAndDelete(t.id));

      res.json({ message: 'Board and its tasks deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server error' });
    }
  },

  moveTask: (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: boardId } = req.params;
      const { source, destination, taskId } = req.body;

      const board = db.boards.findById(boardId);
      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      // Handle Column Reordering
      if (source.droppableId === 'all-columns') {
        const newColumnOrder = [...board.columnOrder];
        const [removed] = newColumnOrder.splice(source.index, 1);
        newColumnOrder.splice(destination.index, 0, removed);

        const updatedBoard = db.boards.findByIdAndUpdate(boardId, {
          columnOrder: newColumnOrder
        });

        return res.json({ success: true, board: updatedBoard });
      }

      // Handle Card Reordering/Moving
      const sourceColId = source.droppableId;
      const destColId = destination.droppableId;

      const sourceCol = board.columns.find(c => c.id === sourceColId);
      const destCol = board.columns.find(c => c.id === destColId);

      if (!sourceCol || !destCol) {
        return res.status(404).json({ error: 'Source or destination column not found' });
      }

      // 1. Remove taskId from source column
      const sourceTaskIds = sourceCol.taskIds.filter(id => id !== taskId);

      // 2. Add taskId to destination column
      let destTaskIds = [...destCol.taskIds];
      if (sourceColId === destColId) {
        // Moving inside same column
        destTaskIds = destTaskIds.filter(id => id !== taskId);
        destTaskIds.splice(destination.index, 0, taskId);
      } else {
        // Moving to another column
        destTaskIds.splice(destination.index, 0, taskId);
      }

      // 3. Update columns array of the Board
      const updatedColumns = board.columns.map(col => {
        if (col.id === sourceColId) {
          return { ...col, taskIds: sourceTaskIds };
        }
        if (col.id === destColId) {
          return { ...col, taskIds: destTaskIds };
        }
        return col;
      });

      const updatedBoard = db.boards.findByIdAndUpdate(boardId, {
        columns: updatedColumns
      });

      // 4. Update the Task's columnId
      const task = db.tasks.findById(taskId);
      if (task) {
        db.tasks.findByIdAndUpdate(taskId, { columnId: destColId });

        // Log Activity
        if (sourceColId !== destColId) {
          db.activities.create({
            boardId,
            userId: req.user!.id,
            username: req.user!.username,
            text: `moved task "${task.title}" from "${sourceCol.title}" to "${destCol.title}"`
          });
        } else {
          db.activities.create({
            boardId,
            userId: req.user!.id,
            username: req.user!.username,
            text: `reordered task "${task.title}" in "${sourceCol.title}"`
          });
        }
      }

      res.json({ success: true, board: updatedBoard });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server error' });
    }
  },

  createColumn: (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: boardId } = req.params;
      const { title } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Column title is required' });
      }

      const board = db.boards.findById(boardId);
      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      const colId = `col-${Math.random().toString(36).substring(2, 9)}`;
      const newColumns = [...board.columns, { id: colId, title, taskIds: [] }];
      const newColumnOrder = [...board.columnOrder, colId];

      const updated = db.boards.findByIdAndUpdate(boardId, {
        columns: newColumns,
        columnOrder: newColumnOrder
      });

      db.activities.create({
        boardId,
        userId: req.user!.id,
        username: req.user!.username,
        text: `added column "${title}"`
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server error' });
    }
  },

  deleteColumn: (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: boardId } = req.params;
      const { columnId } = req.body;

      const board = db.boards.findById(boardId);
      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      const column = board.columns.find(c => c.id === columnId);
      if (!column) {
        return res.status(404).json({ error: 'Column not found' });
      }

      // Delete all tasks in this column
      column.taskIds.forEach(tid => db.tasks.findByIdAndDelete(tid));

      const newColumns = board.columns.filter(c => c.id !== columnId);
      const newColumnOrder = board.columnOrder.filter(id => id !== columnId);

      const updated = db.boards.findByIdAndUpdate(boardId, {
        columns: newColumns,
        columnOrder: newColumnOrder
      });

      db.activities.create({
        boardId,
        userId: req.user!.id,
        username: req.user!.username,
        text: `deleted column "${column.title}"`
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server error' });
    }
  }
};
