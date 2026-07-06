import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setBoards,
  addBoardInState,
  setCurrentBoard,
  setTasks,
  setWorkspaces,
  addWorkspaceInState
} from '../features/boards/boardSlice';
import { Board } from '../types';
import {
  KanbanSquare,
  Plus,
  Users,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  User,
  X,
  FolderPlus
} from 'lucide-react';

interface WorkspaceSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const { currentWorkspace, boards, currentBoard } = useAppSelector((state) => state.board);

  const [showBoardModal, setShowBoardModal] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [error, setError] = useState('');
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDesc, setWorkspaceDesc] = useState('');

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!boardName.trim() || !currentWorkspace) return;

    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: boardName, workspaceId: currentWorkspace.id })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create board');

      dispatch(addBoardInState(data));
      setBoardName('');
      setShowBoardModal(false);

      // Trigger socket notification so other users see the newly created board
      const { socket } = await import('../hooks/useSocket');
      socket.emit('column_created', { boardId: data.id, board: data });

    } catch (err: any) {
      setError(err.message || 'Error creating board');
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!workspaceName.trim()) return;

    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: workspaceName, description: workspaceDesc })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create workspace');

      dispatch(addWorkspaceInState(data.workspace));
      dispatch(addBoardInState(data.defaultBoard));
      setWorkspaceName('');
      setWorkspaceDesc('');
      setShowWorkspaceModal(false);

      // Reload workspaces list to ensure everything matches
      const wsRes = await fetch('/api/workspaces', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const wsData = await wsRes.json();
      if (wsRes.ok) dispatch(setWorkspaces(wsData));

    } catch (err: any) {
      setError(err.message || 'Error creating workspace');
    }
  };

  const handleDeleteBoard = async (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop board selection triggering
    if (!confirm('Are you sure you want to delete this board and all its tasks?')) return;

    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete board');
      }

      // Update state
      const updatedBoards = boards.filter(b => b.id !== boardId);
      dispatch(setBoards(updatedBoards));

      if (currentBoard?.id === boardId) {
        if (updatedBoards.length > 0) {
          handleSelectBoard(updatedBoards[0]);
        } else {
          dispatch(setCurrentBoard(null));
          dispatch(setTasks([]));
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting board');
    }
  };

  const handleSelectBoard = async (board: Board) => {
    try {
      const res = await fetch(`/api/boards/${board.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        dispatch(setCurrentBoard(data.board));
        dispatch(setTasks(data.tasks));
      }
    } catch (e) {
      console.error('Error fetching board details:', e);
    }
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  if (!currentWorkspace) {
    return (
      <>
        <aside className={`${isCollapsed ? 'w-16 px-2 py-6' : 'w-72 p-6'} glass-panel border-y-0 border-l-0 rounded-none flex flex-col items-center justify-center text-center h-[calc(100vh-62px)] select-none transition-all duration-300`}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-5">
              <button
                onClick={onToggleCollapse}
                className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="Expand Sidebar"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <Layers className="h-8 w-8 text-indigo-400 animate-pulse" title="No Active Workspace" />
              <button
                onClick={() => setShowWorkspaceModal(true)}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition cursor-pointer"
                title="Create Workspace"
              >
                <FolderPlus className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="w-full flex justify-end mb-4">
                <button
                  onClick={onToggleCollapse}
                  className="p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                  title="Collapse Sidebar"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
              </div>
              <Layers className="h-10 w-10 text-indigo-400 mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">No Active Workspace</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs mb-5 max-w-[200px] leading-relaxed">
                Create a workspace or switch workspaces to get started on your projects.
              </p>
              <button
                onClick={() => setShowWorkspaceModal(true)}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/5 transition flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
              >
                <FolderPlus className="h-4 w-4" /> Create Workspace
              </button>
            </>
          )}
        </aside>

        {/* --- Workspace Creation Modal --- */}
        {showWorkspaceModal && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-panel rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-fade-in text-left">
              <button
                onClick={() => setShowWorkspaceModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                <FolderPlus className="h-5 w-5 text-indigo-500" /> Create Workspace
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Set up a workspace for your boards, teams, and projects.</p>

              <form onSubmit={handleCreateWorkspace} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Design Team, Product Launch"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Description <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    placeholder="Describe your workspace team..."
                    value={workspaceDesc}
                    onChange={(e) => setWorkspaceDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 transition"
                  />
                </div>

                {error && <p className="text-xs font-medium text-rose-500 text-center">{error}</p>}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-md shadow-indigo-600/5 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Create Workspace
                </button>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  // Check if current user is admin/owner
  const isWorkspaceAdmin = currentWorkspace.ownerId === user?.id || 
    currentWorkspace.members.find(m => m.userId === user?.id)?.role === 'admin';

  if (isCollapsed) {
    return (
      <>
        <aside className="w-16 glass-panel border-y-0 border-l-0 rounded-none py-5 px-2 flex flex-col items-center h-[calc(100vh-62px)] select-none transition-all duration-300">
          {/* Toggle Expand */}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 mb-6 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Expand Sidebar"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Workspace Initials Avatar / Mini Logo */}
          <div
            className="h-10 w-10 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center mb-6 shadow-md shadow-indigo-600/10 cursor-pointer hover:scale-105 transition"
            onClick={onToggleCollapse}
            title={currentWorkspace.name}
          >
            {getInitials(currentWorkspace.name)}
          </div>

          {/* Boards List (Mini) */}
          <div className="flex-1 w-full flex flex-col items-center gap-2 overflow-y-auto mb-6">
            {isWorkspaceAdmin && (
              <button
                onClick={() => setShowBoardModal(true)}
                className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition cursor-pointer"
                title="Create Board"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
            
            <div className="w-full border-t border-slate-200/50 dark:border-slate-800 my-1" />

            {boards.map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelectBoard(b)}
                className={`p-2 rounded-xl flex items-center justify-center transition ${
                  currentBoard?.id === b.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400'
                    : 'text-slate-500 hover:bg-slate-100/65 dark:hover:bg-slate-800/40'
                }`}
                title={b.name}
              >
                <KanbanSquare className="h-5 w-5" />
              </button>
            ))}
          </div>

          {/* Team / Members Section (Mini) */}
          <div className="border-t border-slate-200/80 dark:border-slate-800/80 pt-4 w-full flex flex-col items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" title="Workspace Members" />
            <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto w-full items-center">
              {currentWorkspace.members.slice(0, 4).map((m) => (
                <div
                  key={m.userId}
                  className="h-7 w-7 rounded-full text-white font-bold text-[9px] flex items-center justify-center select-none flex-shrink-0"
                  style={{ backgroundColor: m.color }}
                  title={`${m.username} (${m.role})`}
                >
                  {getInitials(m.username)}
                </div>
              ))}
              {currentWorkspace.members.length > 4 && (
                <div
                  className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[8px] flex items-center justify-center"
                  title={`${currentWorkspace.members.length - 4} more members`}
                >
                  +{currentWorkspace.members.length - 4}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* --- Board Creation Modal --- */}
        {showBoardModal && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-panel rounded-2xl shadow-xl max-w-sm w-full p-6 relative animate-fade-in">
              <button
                onClick={() => setShowBoardModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                <KanbanSquare className="h-5 w-5 text-indigo-500" /> Create Project Board
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">Add a new board with default columns: To Do, In Progress, and Done.</p>

              <form onSubmit={handleCreateBoard} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    Board Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q3 Sprint Planning"
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 transition"
                  />
                </div>

                {error && <p className="text-xs font-medium text-rose-500 text-center">{error}</p>}

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-md shadow-indigo-600/5 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  Create Board
                </button>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <aside className="w-72 glass-panel border-y-0 border-l-0 rounded-none p-5 flex flex-col h-[calc(100vh-62px)] select-none transition-all duration-300">
      {/* Workspace Header Info */}
      <div className="mb-6 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-1">
            Active Workspace
          </h2>
          <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 truncate">{currentWorkspace.name}</h1>
          {currentWorkspace.description && (
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed line-clamp-2">
              {currentWorkspace.description}
            </p>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer flex-shrink-0 animate-fade-in"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Boards Section */}
      <div className="flex-1 overflow-y-auto mb-6 pr-1 space-y-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-550 uppercase tracking-widest">
            Boards ({boards.length})
          </span>
          {isWorkspaceAdmin && (
            <button
              onClick={() => setShowBoardModal(true)}
              className="p-1 text-slate-500 hover:text-indigo-600 dark:text-slate-450 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition cursor-pointer"
              title="Create Board"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl">
            <KanbanSquare className="h-6 w-6 text-slate-300 dark:text-slate-700 mx-auto mb-1" />
            <p className="text-xs text-slate-400 dark:text-slate-500">No boards yet.</p>
          </div>
        ) : (
          boards.map((b) => (
            <button
              key={b.id}
              onClick={() => handleSelectBoard(b)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between group transition ${
                currentBoard?.id === b.id
                  ? 'bg-indigo-55 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/65 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <KanbanSquare className={`h-4 w-4 flex-shrink-0 ${currentBoard?.id === b.id ? 'text-indigo-600 dark:text-indigo-455' : 'text-slate-400 dark:text-slate-600'}`} />
                <span className="text-sm truncate">{b.name}</span>
              </div>
              
              {isWorkspaceAdmin && boards.length > 1 && (
                <button
                  onClick={(e) => handleDeleteBoard(b.id, e)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg opacity-0 group-hover:opacity-100 transition duration-150 cursor-pointer"
                  title="Delete Board"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </button>
          ))
        )}
      </div>

      {/* Team / Members Section */}
      <div className="border-t border-slate-200/80 dark:border-slate-800/80 pt-4 mt-auto">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-slate-400 dark:text-slate-600" />
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-555 uppercase tracking-widest">
            Workspace Members ({currentWorkspace.members.length})
          </span>
        </div>

        <div className="max-h-40 overflow-y-auto space-y-2.5 pr-1">
          {currentWorkspace.members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="h-7 w-7 rounded-full text-white font-bold text-[10px] flex items-center justify-center select-none flex-shrink-0"
                  style={{ backgroundColor: m.color }}
                >
                  {getInitials(m.username)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{m.username}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{m.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {m.role === 'admin' ? (
                  <span className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border border-amber-100/50 dark:border-amber-900/30">
                    <ShieldCheck className="h-2.5 w-2.5" /> admin
                  </span>
                ) : m.role === 'viewer' ? (
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-semibold px-1.5 py-0.5 rounded-md">
                    viewer
                  </span>
                ) : (
                  <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[9px] font-semibold px-1.5 py-0.5 rounded-md">
                    member
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Board Creation Modal --- */}
      {showBoardModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full border border-slate-100 dark:border-slate-800 p-6 relative animate-fade-in">
            <button
              onClick={() => setShowBoardModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
              <KanbanSquare className="h-5 w-5 text-indigo-500" /> Create Project Board
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">Add a new board with default columns: To Do, In Progress, and Done.</p>

            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Board Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Sprint Planning"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 transition"
                />
              </div>

              {error && <p className="text-xs font-medium text-rose-500 text-center">{error}</p>}

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-md shadow-indigo-600/5 transition flex items-center justify-center gap-1 cursor-pointer"
              >
                Create Board
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
