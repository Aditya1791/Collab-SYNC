import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '../store';
import {
  updateTaskOrder,
  updateTaskInState,
  addTaskInState,
  deleteTaskInState,
  setActiveUsers,
  setCurrentBoard
} from '../features/boards/boardSlice';
import { Board, Task } from '../types';

// Connect to the same origin where the page is served (port 3000)
export const socket: Socket = io(window.location.origin, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

export const useSocket = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const currentBoard = useAppSelector((state) => state.board.currentBoard);

  // Manage connection on user login state
  useEffect(() => {
    if (user) {
      socket.connect();
    } else {
      socket.disconnect();
    }

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Manage room joining and event handling for current board
  useEffect(() => {
    if (!user || !currentBoard) return;

    const boardId = currentBoard.id;

    // Join room with user metadata for presence tracking
    socket.emit('join_board', {
      boardId,
      user: {
        id: user.id,
        username: user.username,
        color: user.color,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        coverUrl: user.coverUrl,
        privacy: user.privacy
      }
    });

    // Listen for drag-and-drop events from other users
    const handleTaskOrderUpdated = (payload: {
      source: { droppableId: string; index: number };
      destination: { droppableId: string; index: number };
      taskId: string;
    }) => {
      dispatch(updateTaskOrder(payload));
    };

    // Listen for remote task creations
    const handleTaskAdded = (payload: { task: Task }) => {
      dispatch(addTaskInState(payload.task));
    };

    // Listen for remote task edits
    const handleTaskChanged = (payload: { task: Task }) => {
      dispatch(updateTaskInState(payload.task));
    };

    // Listen for remote task deletions
    const handleTaskRemoved = (payload: { taskId: string }) => {
      dispatch(deleteTaskInState(payload.taskId));
    };

    // Listen for board columns refresh (e.g., column created or deleted)
    const handleBoardRefreshed = (payload: { board: Board }) => {
      dispatch(setCurrentBoard(payload.board));
    };

    // Listen for active board members (presence)
    const handleBoardPresence = (payload: { boardId: string; users: any[] }) => {
      if (payload.boardId === boardId) {
        // Deduplicate users by ID to prevent key collision warnings in React
        const uniqueUsers = payload.users.filter((user, index, self) =>
          self.findIndex((u) => u.id === user.id) === index
        );
        dispatch(setActiveUsers(uniqueUsers));
      }
    };

    socket.on('task_order_updated', handleTaskOrderUpdated);
    socket.on('task_added', handleTaskAdded);
    socket.on('task_changed', handleTaskChanged);
    socket.on('task_removed', handleTaskRemoved);
    socket.on('board_refreshed', handleBoardRefreshed);
    socket.on('board_presence', handleBoardPresence);

    // Clean up room and listeners on board change
    return () => {
      socket.emit('leave_board', boardId);
      socket.off('task_order_updated', handleTaskOrderUpdated);
      socket.off('task_added', handleTaskAdded);
      socket.off('task_changed', handleTaskChanged);
      socket.off('task_removed', handleTaskRemoved);
      socket.off('board_refreshed', handleBoardRefreshed);
      socket.off('board_presence', handleBoardPresence);
    };
  }, [user, currentBoard, dispatch]);
};
