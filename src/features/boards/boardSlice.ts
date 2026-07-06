import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Workspace, Board, Task, Activity, User } from '../../types';

interface BoardState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  boards: Board[];
  currentBoard: Board | null;
  tasks: Task[];
  activities: Activity[];
  activeUsers: User[];
  loading: boolean;
  error: string | null;
}

const initialState: BoardState = {
  workspaces: [],
  currentWorkspace: null,
  boards: [],
  currentBoard: null,
  tasks: [],
  activities: [],
  activeUsers: [],
  loading: false,
  error: null
};

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setWorkspaces: (state, action: PayloadAction<Workspace[]>) => {
      state.workspaces = action.payload;
      if (action.payload.length > 0 && !state.currentWorkspace) {
        state.currentWorkspace = action.payload[0];
      }
    },
    addWorkspaceInState: (state, action: PayloadAction<Workspace>) => {
      state.workspaces.push(action.payload);
      state.currentWorkspace = action.payload;
    },
    setCurrentWorkspace: (state, action: PayloadAction<Workspace | null>) => {
      state.currentWorkspace = action.payload;
      state.currentBoard = null;
      state.boards = [];
      state.tasks = [];
    },
    setBoards: (state, action: PayloadAction<Board[]>) => {
      state.boards = action.payload;
      if (action.payload.length > 0 && !state.currentBoard) {
        state.currentBoard = action.payload[0];
      }
    },
    addBoardInState: (state, action: PayloadAction<Board>) => {
      state.boards.push(action.payload);
      state.currentBoard = action.payload;
    },
    setCurrentBoard: (state, action: PayloadAction<Board | null>) => {
      state.currentBoard = action.payload;
    },
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
    },
    addTaskInState: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
      // Append to the appropriate column taskIds array in currentBoard
      if (state.currentBoard) {
        const col = state.currentBoard.columns.find(c => c.id === action.payload.columnId);
        if (col && !col.taskIds.includes(action.payload.id)) {
          col.taskIds.push(action.payload.id);
        }
      }
    },
    updateTaskInState: (state, action: PayloadAction<Task>) => {
      const idx = state.tasks.findIndex(t => t.id === action.payload.id);
      if (idx !== -1) {
        state.tasks[idx] = action.payload;
      }
    },
    deleteTaskInState: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
      if (state.currentBoard) {
        state.currentBoard.columns.forEach(col => {
          col.taskIds = col.taskIds.filter(id => id !== action.payload);
        });
      }
    },
    setActivities: (state, action: PayloadAction<Activity[]>) => {
      state.activities = action.payload;
    },
    addActivityInState: (state, action: PayloadAction<Activity>) => {
      state.activities.unshift(action.payload);
    },
    setActiveUsers: (state, action: PayloadAction<User[]>) => {
      state.activeUsers = action.payload;
    },
    rollbackBoard: (state, action: PayloadAction<Board>) => {
      state.currentBoard = action.payload;
    },
    updateTaskOrder: (
      state,
      action: PayloadAction<{
        source: { droppableId: string; index: number };
        destination: { droppableId: string; index: number };
        taskId: string;
      }>
    ) => {
      const { source, destination, taskId } = action.payload;
      if (!state.currentBoard) return;

      // Handle Column Reordering
      if (source.droppableId === 'all-columns') {
        const newColumnOrder = [...state.currentBoard.columnOrder];
        const [removed] = newColumnOrder.splice(source.index, 1);
        newColumnOrder.splice(destination.index, 0, removed);
        state.currentBoard.columnOrder = newColumnOrder;
        return;
      }

      // Handle Card Reordering
      const sourceCol = state.currentBoard.columns.find(c => c.id === source.droppableId);
      const destCol = state.currentBoard.columns.find(c => c.id === destination.droppableId);

      if (!sourceCol || !destCol) return;

      // Remove from source list
      sourceCol.taskIds = sourceCol.taskIds.filter(id => id !== taskId);

      // Add to destination list
      const destTaskIds = [...destCol.taskIds];
      if (source.droppableId === destination.droppableId) {
        // Same column reordering
        const filtered = destTaskIds.filter(id => id !== taskId);
        filtered.splice(destination.index, 0, taskId);
        sourceCol.taskIds = filtered;
      } else {
        // Different column moving
        destTaskIds.splice(destination.index, 0, taskId);
        destCol.taskIds = destTaskIds;

        // Update the task itself in state
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
          task.columnId = destination.droppableId;
        }
      }
    }
  }
});

export const {
  setLoading,
  setError,
  setWorkspaces,
  addWorkspaceInState,
  setCurrentWorkspace,
  setBoards,
  addBoardInState,
  setCurrentBoard,
  setTasks,
  addTaskInState,
  updateTaskInState,
  deleteTaskInState,
  setActivities,
  addActivityInState,
  setActiveUsers,
  rollbackBoard,
  updateTaskOrder
} = boardSlice.actions;

export default boardSlice.reducer;
