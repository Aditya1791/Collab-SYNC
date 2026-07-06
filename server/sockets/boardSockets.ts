import { Server, Socket } from 'socket.io';

// Track users in each board room
// Key: boardId, Value: Map of socketId -> User profile
const activeRoomUsers = new Map<string, Map<string, any>>();

export const handleBoardSockets = (io: Server, socket: Socket) => {
  // User enters a specific board page
  socket.on('join_board', (data: { boardId: string; user: { id: string; username: string; color: string } }) => {
    const { boardId, user } = data;
    if (!boardId || !user) return;

    socket.join(`board:${boardId}`);
    
    // Track active user in room
    if (!activeRoomUsers.has(boardId)) {
      activeRoomUsers.set(boardId, new Map());
    }
    activeRoomUsers.get(boardId)!.set(socket.id, user);

    // Broadcast updated user list to everyone in the room
    const currentUsers = Array.from(activeRoomUsers.get(boardId)!.values());
    io.to(`board:${boardId}`).emit('board_presence', {
      boardId,
      users: currentUsers
    });

    console.log(`User ${user.username} joined room board:${boardId}`);
  });

  // Listen for drag-and-drop event from a client
  socket.on('task_moved', (data) => {
    const { boardId, source, destination, taskId } = data;
    
    // Broadcast to everyone in the board room EXCEPT the sender
    socket.to(`board:${boardId}`).emit('task_order_updated', {
      source,
      destination,
      taskId
    });
  });

  // Listen for task modifications/updates
  socket.on('task_updated', (data) => {
    const { boardId, task } = data;
    socket.to(`board:${boardId}`).emit('task_changed', { task });
  });

  // Listen for task creation
  socket.on('task_created', (data) => {
    const { boardId, task } = data;
    socket.to(`board:${boardId}`).emit('task_added', { task });
  });

  // Listen for task deletion
  socket.on('task_deleted', (data) => {
    const { boardId, taskId } = data;
    socket.to(`board:${boardId}`).emit('task_removed', { taskId });
  });

  // Listen for column addition
  socket.on('column_created', (data) => {
    const { boardId, board } = data;
    socket.to(`board:${boardId}`).emit('board_refreshed', { board });
  });

  // Listen for column deletion
  socket.on('column_deleted', (data) => {
    const { boardId, board } = data;
    socket.to(`board:${boardId}`).emit('board_refreshed', { board });
  });

  // User leaves a board room
  socket.on('leave_board', (boardId: string) => {
    socket.leave(`board:${boardId}`);
    
    if (activeRoomUsers.has(boardId)) {
      activeRoomUsers.get(boardId)!.delete(socket.id);
      
      const currentUsers = Array.from(activeRoomUsers.get(boardId)!.values());
      io.to(`board:${boardId}`).emit('board_presence', {
        boardId,
        users: currentUsers
      });
    }
    console.log(`Socket ${socket.id} left room board:${boardId}`);
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    // Search all rooms to clean up the disconnected socket
    activeRoomUsers.forEach((usersMap, boardId) => {
      if (usersMap.has(socket.id)) {
        usersMap.delete(socket.id);
        const currentUsers = Array.from(usersMap.values());
        io.to(`board:${boardId}`).emit('board_presence', {
          boardId,
          users: currentUsers
        });
        console.log(`Cleaned up socket ${socket.id} from board:${boardId} presence`);
      }
    });
  });
};
