import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { authMiddleware } from './server/middleware/auth';
import { authController } from './server/controllers/authController';
import { workspaceController } from './server/controllers/workspaceController';
import { boardController } from './server/controllers/boardController';
import { taskController } from './server/controllers/taskController';
import { handleBoardSockets } from './server/sockets/boardSockets';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);

  // Set up socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Attach socket.io handlers
  io.on('connection', (socket) => {
    handleBoardSockets(io, socket);
  });

  // Parse JSON bodies
  app.use(express.json());

  // --- API Routes ---

  // Auth Endpoints
  app.post('/api/auth/signup', authController.signup);
  app.post('/api/auth/login', authController.login);
  app.post('/api/auth/verify-2fa', authController.verify2FA);
  app.get('/api/auth/me', authMiddleware as any, authController.me as any);
  app.get('/api/auth/users', authMiddleware as any, authController.getAllUsers as any);
  app.put('/api/auth/profile', authMiddleware as any, authController.updateProfile as any);
  app.put('/api/auth/username', authMiddleware as any, authController.updateUsername as any);
  app.post('/api/auth/request-otp', authMiddleware as any, authController.requestPasswordOtp as any);
  app.post('/api/auth/change-password', authMiddleware as any, authController.verifyOtpAndChangePassword as any);
  app.post('/api/auth/request-2fa-setup', authMiddleware as any, authController.request2FASetup as any);
  app.post('/api/auth/verify-2fa-setup', authMiddleware as any, authController.verify2FASetup as any);
  app.post('/api/auth/disable-2fa', authMiddleware as any, authController.disable2FA as any);

  // Workspace Endpoints
  app.get('/api/workspaces', authMiddleware as any, workspaceController.getWorkspaces as any);
  app.post('/api/workspaces', authMiddleware as any, workspaceController.createWorkspace as any);
  app.post('/api/workspaces/members', authMiddleware as any, workspaceController.addMember as any);

  // Board Endpoints
  app.get('/api/boards', authMiddleware as any, boardController.getBoards as any);
  app.post('/api/boards', authMiddleware as any, boardController.createBoard as any);
  app.get('/api/boards/:id', authMiddleware as any, boardController.getBoardDetails as any);
  app.put('/api/boards/:id', authMiddleware as any, boardController.updateBoard as any);
  app.delete('/api/boards/:id', authMiddleware as any, boardController.deleteBoard as any);
  app.post('/api/boards/:id/move-task', authMiddleware as any, boardController.moveTask as any);
  app.post('/api/boards/:id/columns', authMiddleware as any, boardController.createColumn as any);
  app.post('/api/boards/:id/columns/delete', authMiddleware as any, boardController.deleteColumn as any);

  // Task Endpoints
  app.post('/api/tasks', authMiddleware as any, taskController.createTask as any);
  app.put('/api/tasks/:id', authMiddleware as any, taskController.updateTask as any);
  app.delete('/api/tasks/:id', authMiddleware as any, taskController.deleteTask as any);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // --- Vite Middleware or Static Assets serving ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA routing fallback: send index.html for all unrecognized routes in production
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
