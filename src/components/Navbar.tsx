import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../features/auth/authSlice';
import {
  setWorkspaces,
  addWorkspaceInState,
  setCurrentWorkspace,
  setBoards,
  addBoardInState,
  setCurrentBoard,
  setTasks
} from '../features/boards/boardSlice';
import { Workspace, User } from '../types';
import {
  LogOut,
  FolderPlus,
  UserPlus2,
  ChevronDown,
  Users,
  Plus,
  X,
  Sun,
  Moon
} from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings }) => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const { workspaces, currentWorkspace, activeUsers } = useAppSelector((state) => state.board);

  // Check if current user is admin/owner
  const isWorkspaceAdmin = currentWorkspace && (
    currentWorkspace.ownerId === user?.id || 
    currentWorkspace.members.find(m => m.userId === user?.id)?.role === 'admin'
  );

  // Modal Toggles
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [previewUser, setPreviewUser] = useState<User | null>(null);

  // Forms State
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDesc, setWorkspaceDesc] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [error, setError] = useState('');

  // Theme state
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
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

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!inviteEmail.trim() || !currentWorkspace) return;

    try {
      const res = await fetch('/api/workspaces/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          email: inviteEmail,
          role: inviteRole
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to invite member');

      // Update current workspace members in state
      const updatedWorkspaces = workspaces.map(w => 
        w.id === currentWorkspace.id ? data : w
      );
      dispatch(setWorkspaces(updatedWorkspaces));
      dispatch(setCurrentWorkspace(data));

      setInviteEmail('');
      setShowInviteModal(false);
    } catch (err: any) {
      setError(err.message || 'Error inviting member');
    }
  };

  const handleWorkspaceChange = async (workspace: Workspace) => {
    dispatch(setCurrentWorkspace(workspace));

    // Fetch boards for newly selected workspace
    try {
      const res = await fetch(`/api/boards?workspaceId=${workspace.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        dispatch(setBoards(data));
        if (data.length > 0) {
          const boardRes = await fetch(`/api/boards/${data[0].id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const boardData = await boardRes.json();
          if (boardRes.ok) {
            dispatch(setCurrentBoard(boardData.board));
            dispatch(setTasks(boardData.tasks));
          }
        } else {
          dispatch(setCurrentBoard(null));
          dispatch(setTasks([]));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to get user initials
  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  // Helper to check if a user is a workspace member (contacts / friends)
  const isContact = (pUserId: string) => {
    if (!currentWorkspace || !user) return false;
    const currentUserId = user.id;
    const hasCurrentUser = currentWorkspace.members.some(m => m.userId === currentUserId);
    const hasPreviewUser = currentWorkspace.members.some(m => m.userId === pUserId);
    return hasCurrentUser && hasPreviewUser;
  };

  const getVisibleEmail = (pUser: User) => {
    if (pUser.id === user?.id) return pUser.email;
    const rule = pUser.privacy?.email || 'everyone';
    if (rule === 'none') return 'NIL';
    if (rule === 'friends' && !isContact(pUser.id)) return 'NIL';
    return pUser.email;
  };

  const getVisiblePhone = (pUser: User) => {
    const rawPhone = pUser.phoneNumber;
    if (pUser.id === user?.id) return rawPhone || 'No phone linked';
    const rule = pUser.privacy?.phoneNumber || 'everyone';
    if (rule === 'none') return 'NIL';
    if (rule === 'friends' && !isContact(pUser.id)) return 'NIL';
    return rawPhone || 'NIL';
  };

  const getVisibleAvatar = (pUser: User) => {
    const rule = pUser.privacy?.avatar || 'everyone';
    if (pUser.id === user?.id) return pUser.avatarUrl;
    if (rule === 'none') return undefined;
    if (rule === 'friends' && !isContact(pUser.id)) return undefined;
    return pUser.avatarUrl;
  };

  const getVisibleCover = (pUser: User) => {
    return pUser.coverUrl;
  };
  return (
    <>
      <header className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/40 sticky top-0 z-30 px-6 py-3 flex items-center justify-between transition-colors duration-150">
      {/* Left: Branding & Workspace Selection */}
      <div className="flex items-center gap-6">
        <div className="flex items-center">
          <img
            src="/logo.png"
            alt="Collab-SYNC"
            className="h-10 w-auto object-contain"
          />
        </div>

        {/* Workspace Selector */}
        <div className="relative group">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer select-none">
            <span className="text-xs text-slate-400 font-mono mr-1">Workspace</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {currentWorkspace ? currentWorkspace.name : 'Select Workspace'}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </div>

          {/* Dropdown Options */}
          <div className="absolute left-0 mt-1.5 w-64 glass-panel rounded-xl shadow-xl py-2 hidden group-hover:block z-40 transition-all">
            <div className="px-3 py-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-50 dark:border-slate-800/60 pb-2">
              Switch Workspace
            </div>
            <div className="max-h-60 overflow-y-auto mt-1">
              {workspaces.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 text-center">
                  No workspaces found.
                </div>
              ) : (
                workspaces.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => handleWorkspaceChange(w)}
                    className={`w-full text-left px-4 py-2 text-sm flex flex-col hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                      currentWorkspace?.id === w.id ? 'bg-slate-50 dark:bg-slate-800/80 text-indigo-600 dark:text-indigo-400 font-medium border-l-2 border-indigo-600' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>{w.name}</span>
                    {w.description && <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{w.description}</span>}
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2 px-2">
              <button
                onClick={() => setShowWorkspaceModal(true)}
                className="w-full py-1.5 px-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <FolderPlus className="h-3.5 w-3.5" /> Create New Workspace
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Presence indicators, member invites, user profile */}
      <div className="flex items-center gap-4">
        {/* Presence Avatars */}
        {activeUsers.length > 0 && (
          <div className="flex items-center gap-1.5 mr-2">
            <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1 mr-1 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
            </span>
            <div className="flex -space-x-2 overflow-hidden">
              {activeUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setPreviewUser(u)}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 text-white font-semibold text-xs transition-transform duration-200 hover:-translate-y-1 hover:z-10 cursor-pointer"
                  style={{ backgroundColor: u.color }}
                  title={`View ${u.username}'s profile`}
                >
                  {getInitials(u.username)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Invite Colleagues */}
        {currentWorkspace && isWorkspaceAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-semibold transition cursor-pointer"
          >
            <UserPlus2 className="h-4 w-4" />
            <span className="hidden md:inline">Invite Member</span>
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition cursor-pointer"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="h-5 w-5 text-amber-500 animate-pulse" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* User Info & Logout */}
        {user && (
          <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer text-left focus:outline-none"
              title="Open Account Settings"
            >
              <div className="flex flex-col items-end text-right hidden sm:flex">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{user.username}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{user.email}</span>
              </div>
              {user.avatarUrl && user.avatarUrl.startsWith('data:') ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="h-8.5 w-8.5 rounded-full object-cover border border-slate-200 dark:border-slate-850"
                />
              ) : (
                <div
                  className="h-8.5 w-8.5 rounded-full text-white font-bold text-xs flex items-center justify-center select-none shadow-sm"
                  style={{ backgroundColor: (user.avatarUrl && user.avatarUrl.startsWith('#')) ? user.avatarUrl : user.color }}
                >
                  {getInitials(user.username)}
                </div>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </header>

      {/* --- Workspace Creation Modal --- */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-fade-in">
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

      {/* --- Invite Member Modal --- */}
      {showInviteModal && currentWorkspace && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-fade-in">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
              <UserPlus2 className="h-5 w-5 text-indigo-500" /> Invite Team Member
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              Add a team member to <strong className="text-slate-700 dark:text-slate-300">{currentWorkspace.name}</strong>.
            </p>

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  User Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Assign Team Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e: any) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 transition"
                >
                  <option value="member">Member (Can edit tasks/boards)</option>
                  <option value="admin">Admin (Can add members/boards)</option>
                  <option value="viewer">Viewer (Can only read)</option>
                </select>
              </div>

              {error && <p className="text-xs font-medium text-rose-500 text-center">{error}</p>}

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-md shadow-indigo-600/5 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Send Invite
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- Profile Preview Modal --- */}
      {previewUser && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative animate-fade-in">
            {/* Close Button */}
            <button
              onClick={() => setPreviewUser(null)}
              className="absolute top-3 right-3 p-1.5 bg-slate-950/30 text-white hover:bg-slate-950/50 rounded-full transition cursor-pointer z-10"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* LinkedIn Style Cover Photo */}
            <div 
              className="h-28 w-full relative flex items-end justify-between p-3 select-none bg-cover bg-center"
              style={{ backgroundImage: getVisibleCover(previewUser) ? `url(${getVisibleCover(previewUser)})` : 'none', backgroundColor: getVisibleCover(previewUser) ? 'transparent' : '#4f46e5' }}
            >
              {!getVisibleCover(previewUser) && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500" />
              )}
              {/* Decorative Mesh Circle */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_50%)]" />
              <span className="text-[10px] font-bold text-white/50 tracking-wider uppercase bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-xs select-none">
                Collab-SYNC
              </span>
            </div>

            {/* Profile Avatar Overlaying Cover Photo */}
            <div className="relative -mt-12 ml-6 flex items-end justify-between pr-6">
              <div className="h-24 w-24 rounded-full border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center overflow-hidden bg-slate-100 select-none">
                {getVisibleAvatar(previewUser) && !getVisibleAvatar(previewUser)!.startsWith('#') ? (
                  <img src={getVisibleAvatar(previewUser)} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="h-full w-full text-white font-bold text-2xl flex items-center justify-center"
                    style={{ backgroundColor: (getVisibleAvatar(previewUser) && getVisibleAvatar(previewUser)!.startsWith('#')) ? getVisibleAvatar(previewUser) : previewUser.color }}
                  >
                    {getInitials(previewUser.username)}
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <span className="mb-2 py-1 px-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 font-bold text-xs rounded-full flex items-center gap-1.5 shadow-sm border border-emerald-500/20 select-none animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
              </span>
            </div>

            {/* Profile Info Fields */}
            <div className="p-6 pt-4 text-left space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Username</span>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{previewUser.username}</span>
              </div>

              <div className="grid grid-cols-1 gap-3.5 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider block">Email Address</span>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 break-all">{getVisibleEmail(previewUser)}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider block">Phone Number</span>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 font-mono">
                    {getVisiblePhone(previewUser)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
