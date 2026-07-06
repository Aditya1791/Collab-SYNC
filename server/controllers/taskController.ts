import { Response } from 'express';
import { db, Task } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export const taskController = {
  createTask: (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, description, boardId, columnId, priority, dueDate, assignees } = req.body;
      if (!title || !boardId || !columnId) {
        return res.status(400).json({ error: 'Title, boardId, and columnId are required' });
      }

      const board = db.boards.findById(boardId);
      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      const task = db.tasks.create({
        title,
        description: description || '',
        boardId,
        columnId,
        priority: priority || 'medium',
        dueDate,
        assignees: assignees || [],
        checklist: []
      });

      // Update the column with the new task ID
      const updatedColumns = board.columns.map(col => {
        if (col.id === columnId) {
          return {
            ...col,
            taskIds: [...col.taskIds, task.id]
          };
        }
        return col;
      });

      db.boards.findByIdAndUpdate(boardId, { columns: updatedColumns });

      // Log activity
      db.activities.create({
        boardId,
        userId: req.user!.id,
        username: req.user!.username,
        text: `created task "${title}" in column "${board.columns.find(c => c.id === columnId)?.title || columnId}"`
      });

      res.status(201).json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server error' });
    }
  },

  updateTask: (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { title, description, priority, dueDate, assignees, checklist } = req.body;

      const task = db.tasks.findById(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const updated = db.tasks.findByIdAndUpdate(id, {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate }),
        ...(assignees !== undefined && { assignees }),
        ...(checklist !== undefined && { checklist })
      });

      // Log activity depending on what changed
      const changes: string[] = [];
      if (title !== undefined && title !== task.title) changes.push(`renamed task to "${title}"`);
      if (priority !== undefined && priority !== task.priority) changes.push(`changed priority to ${priority}`);
      if (dueDate !== undefined && dueDate !== task.dueDate) changes.push(`changed due date`);
      if (description !== undefined && description !== task.description) changes.push(`updated description`);
      if (assignees !== undefined) changes.push(`updated assignees`);
      if (checklist !== undefined && JSON.stringify(checklist) !== JSON.stringify(task.checklist)) changes.push(`updated checklist items`);

      if (changes.length > 0) {
        db.activities.create({
          boardId: task.boardId,
          userId: req.user!.id,
          username: req.user!.username,
          text: `${changes.join(', ')} on "${title || task.title}"`
        });
      }

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server error' });
    }
  },

  deleteTask: (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const task = db.tasks.findById(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const board = db.boards.findById(task.boardId);
      if (board) {
        // Remove task ID from column
        const updatedColumns = board.columns.map(col => {
          if (col.id === task.columnId) {
            return {
              ...col,
              taskIds: col.taskIds.filter(tid => tid !== id)
            };
          }
          return col;
        });
        db.boards.findByIdAndUpdate(task.boardId, { columns: updatedColumns });
      }

      db.tasks.findByIdAndDelete(id);

      db.activities.create({
        boardId: task.boardId,
        userId: req.user!.id,
        username: req.user!.username,
        text: `deleted task "${task.title}"`
      });

      res.json({ message: 'Task deleted successfully', taskId: id, boardId: task.boardId });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server error' });
    }
  }
};
