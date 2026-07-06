import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from './store';
import { authSuccess, logout } from './features/auth/authSlice';
import {
  setWorkspaces,
  setCurrentWorkspace,
  setBoards,
  setCurrentBoard,
  setTasks,
  setActivities,
  addActivityInState
} from './features/boards/boardSlice';
import { useSocket } from './hooks/useSocket';
import { Navbar } from './components/Navbar';
import { WorkspaceSidebar } from './components/WorkspaceSidebar';
import { KanbanBoard } from './components/KanbanBoard';
import { AuthModal } from './components/AuthModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { Layers, Activity, Calendar, FileCheck2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function App() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const { currentWorkspace, currentBoard, activities } = useAppSelector((state) => state.board);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Collapsible view states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [feedCollapsed, setFeedCollapsed] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Initialize socket listener
  useSocket();

  // 1. Session Recovery on Mount
  useEffect(() => {
    const recoverSession = async () => {
      if (!token) {
        setSessionLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          dispatch(logout());
          setSessionLoading(false);
          return;
        }

        const userData = await res.json();
        dispatch(authSuccess({ user: userData, token }));
      } catch (e) {
        console.error('Session recovery failed', e);
        dispatch(logout());
      } finally {
        setSessionLoading(false);
      }
    };

    recoverSession();
  }, [token, dispatch]);

  // 2. Fetch Workspaces & Initial Board once authenticated
  useEffect(() => {
    if (!user || !token) return;

    const bootstrapData = async () => {
      try {
        const res = await fetch('/api/workspaces', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const workspacesData = await res.json();

        if (res.ok && workspacesData.length > 0) {
          dispatch(setWorkspaces(workspacesData));
          const firstWorkspace = workspacesData[0];
          dispatch(setCurrentWorkspace(firstWorkspace));

          // Fetch boards for first workspace
          const boardsRes = await fetch(`/api/boards?workspaceId=${firstWorkspace.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const boardsData = await boardsRes.json();

          if (boardsRes.ok && boardsData.length > 0) {
            dispatch(setBoards(boardsData));
            const firstBoard = boardsData[0];

            // Fetch tasks and board details
            const boardDetailsRes = await fetch(`/api/boards/${firstBoard.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const detailsData = await boardDetailsRes.json();

            if (boardDetailsRes.ok) {
              dispatch(setCurrentBoard(detailsData.board));
              dispatch(setTasks(detailsData.tasks));
              dispatch(setActivities(detailsData.activities));
            }
          }
        }
      } catch (e) {
        console.error('Data bootstrap failed', e);
      }
    };

    bootstrapData();
  }, [user, token, dispatch]);

  // Helper to format timestamps
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) + 
           ' • ' + 
           d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (sessionLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white select-none">
        <div className="p-4 bg-white/5 rounded-2xl mb-4">
          <Layers className="h-10 w-10 text-indigo-400 animate-pulse" />
        </div>
        <span className="h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-400 text-sm font-mono tracking-wider">SECURE_WORKSPACE_BOOTING...</p>
      </div>
    );
  }

  // Not authenticated? Show Auth Form
  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="h-screen flex flex-col bg-wallpaper text-slate-800 dark:text-slate-100 overflow-hidden font-sans relative">
      {/* Glowing Mesh Ambient Background Spots */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl pointer-events-none select-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/3 blur-3xl pointer-events-none select-none" />

      <div className="relative z-10 flex-1 flex flex-col overflow-hidden bg-grid">
        <Navbar onOpenSettings={() => setShowSettingsModal(true)} />

        <div className="flex-1 flex overflow-hidden">
          <WorkspaceSidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

          <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Middle: Kanban Stage */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <KanbanBoard onSelectTask={setSelectedTaskId} />
            </div>

            {/* Right Panel: Shared Workspace Feed / Activity Log */}
            {currentBoard && (
              <section className={`w-full ${feedCollapsed ? 'md:w-16' : 'md:w-80'} glass-panel border-y-0 border-r-0 rounded-none flex flex-col overflow-hidden h-48 md:h-auto transition-all duration-300`}>
                {feedCollapsed ? (
                  /* Collapsed View (Only Icons) */
                  <div className="flex flex-col items-center py-4 h-full select-none animate-fade-in">
                    {/* Expand Toggle Button */}
                    <button
                      onClick={() => setFeedCollapsed(false)}
                      className="p-1.5 mb-5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Expand Activity Feed"
                    >
                      <ChevronLeft className="h-4.5 w-4.5" />
                    </button>

                    <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mb-5 animate-pulse" title="Board Activity Feed" />

                    {/* Vertical Activity Avatars */}
                    <div className="flex-1 w-full overflow-y-auto flex flex-col items-center gap-3.5 px-2">
                      {activities.slice(0, 8).map((act) => {
                        const member = currentWorkspace?.members.find(m => m.userId === act.userId);
                        const userColor = member?.color || '#6366f1';
                        return (
                          <div
                            key={act.id}
                            className="h-7 w-7 rounded-full text-white font-bold text-[9px] flex items-center justify-center select-none flex-shrink-0 cursor-help"
                            style={{ backgroundColor: userColor }}
                            title={`${act.username}: ${act.text}`}
                          >
                            {act.username.slice(0, 2).toUpperCase()}
                          </div>
                        );
                      })}
                      {activities.length === 0 && (
                        <Clock className="h-4 w-4 text-slate-300 dark:text-slate-700" title="No activity" />
                      )}
                    </div>
                  </div>
                ) : (
                  /* Expanded View (Full Details) */
                  <>
                    <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between select-none">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          Board Activity Feed
                        </h3>
                      </div>
                      {/* Collapse Toggle Button */}
                      <button
                        onClick={() => setFeedCollapsed(true)}
                        className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Collapse Activity Feed"
                      >
                        <ChevronRight className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                      {activities.length === 0 ? (
                        <div className="text-center py-10">
                          <Clock className="h-6 w-6 text-slate-300 dark:text-slate-700 mx-auto mb-1.5" />
                          <p className="text-xs text-slate-400 dark:text-slate-500">No activity yet on this board.</p>
                        </div>
                      ) : (
                        activities.map((act) => (
                          <div key={act.id} className="text-xs space-y-1 animate-fade-in">
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                              <strong className="text-slate-800 dark:text-slate-100 font-bold">{act.username}</strong>{' '}
                              {act.text}
                            </p>
                            <time className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium font-mono">
                              {formatTime(act.createdAt)}
                            </time>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </section>
            )}
          </main>
        </div>
      </div>

      {/* Detail Modal Overlay */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {/* Settings Modal Overlay */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}
