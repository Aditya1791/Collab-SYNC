import React, { useState, useEffect } from 'react';
import { Task, ChecklistItem, User } from '../types';
import { useAppDispatch, useAppSelector } from '../store';
import { updateTaskInState, deleteTaskInState } from '../features/boards/boardSlice';
import {
  X,
  AlignLeft,
  CheckSquare,
  Users,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  ListTodo,
  Check,
  UserCheck
} from 'lucide-react';

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, onClose }) => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const tasks = useAppSelector((state) => state.board.tasks);
  const currentWorkspace = useAppSelector((state) => state.board.currentWorkspace);
  const currentBoard = useAppSelector((state) => state.board.currentBoard);

  const task = tasks.find(t => t.id === taskId);

  // Edit fields state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Load initial task values
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setDueDate(task.dueDate ? task.dueDate.substring(0, 10) : '');
      setAssignees(task.assignees || []);
      setChecklist(task.checklist || []);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async (updatedFields: Partial<Task>) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update task');

      dispatch(updateTaskInState(data));

      // Emit Socket.io event so other users see changes live
      const { socket } = await import('../hooks/useSocket');
      socket.emit('task_updated', { boardId: task.boardId, task: data });
    } catch (e) {
      console.error(e);
    }
  };

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      handleSave({ title });
    }
  };

  const handleDescBlur = () => {
    if (description !== task.description) {
      handleSave({ description });
    }
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as Task['priority'];
    setPriority(val);
    handleSave({ priority: val });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDueDate(val);
    handleSave({ dueDate: val ? new Date(val).toISOString() : undefined });
  };

  // Toggle checklist item status
  const handleToggleChecklistItem = (id: string) => {
    const updated = checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
    handleSave({ checklist: updated });
  };

  // Delete checklist item
  const handleDeleteChecklistItem = (id: string) => {
    const updated = checklist.filter(item => item.id !== id);
    setChecklist(updated);
    handleSave({ checklist: updated });
  };

  // Add checklist item
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;

    const newItem: ChecklistItem = {
      id: `item-${Math.random().toString(36).substring(2, 9)}`,
      text: newChecklistItem.trim(),
      completed: false
    };

    const updated = [...checklist, newItem];
    setChecklist(updated);
    setNewChecklistItem('');
    handleSave({ checklist: updated });
  };

  // Toggle Assignee
  const handleToggleAssignee = (userId: string) => {
    const updated = assignees.includes(userId)
      ? assignees.filter(id => id !== userId)
      : [...assignees, userId];
    setAssignees(updated);
    handleSave({ assignees: updated });
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (!confirm('Are you sure you want to permanently delete this task?')) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete task');
      }

      dispatch(deleteTaskInState(task.id));

      // Emit Socket.io event so other users remove this task
      const { socket } = await import('../hooks/useSocket');
      socket.emit('task_deleted', { boardId: task.boardId, taskId: task.id });

      onClose();
    } catch (err: any) {
      alert(err.message || 'Error deleting task');
    }
  };

  // Checklist Completion Stats
  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
      <div className="glass-panel rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="text-lg font-bold text-slate-800 dark:text-slate-100 bg-transparent border-0 focus:ring-0 px-0 focus:bg-white dark:focus:bg-slate-950 focus:px-2 focus:py-1 rounded-md transition w-4/5 focus:outline-none"
            placeholder="Task Title"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column (Span 2): Description & Checklist */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-sm">
                <AlignLeft className="h-4 w-4 text-slate-400" />
                <span>Description</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescBlur}
                placeholder="Add a detailed description for this task..."
                className="w-full px-3 py-2 text-sm bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 rounded-xl min-h-[100px] resize-none transition leading-relaxed text-slate-700 dark:text-slate-300"
              />
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-sm">
                  <ListTodo className="h-4 w-4 text-slate-400" />
                  <span>Checklist</span>
                </div>
                {totalCount > 0 && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold font-mono">
                    {progressPercent}% Complete
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {totalCount > 0 && (
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              {/* Checklist Items List */}
              <div className="space-y-1">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-1.5 px-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg group transition"
                  >
                    <label className="flex items-center gap-3 select-none cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklistItem(item.id)}
                        className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20"
                      />
                      <span className={`text-sm ${item.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                        {item.text}
                      </span>
                    </label>
                    <button
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Checklist Item Form */}
              <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add checklist task..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-slate-100 transition"
                />
                <button
                  type="submit"
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Column (Span 1): Settings & Assignees */}
          <div className="space-y-5 bg-slate-50/40 dark:bg-slate-950 border-l border-slate-100 dark:border-slate-850 p-4 rounded-xl">
            {/* Priority Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Priority
              </label>
              <select
                value={priority}
                onChange={handlePriorityChange}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-slate-100 transition font-medium"
              >
                <option value="low">💚 Low</option>
                <option value="medium">💛 Medium</option>
                <option value="high">🧡 High</option>
                <option value="urgent">🚨 Urgent</option>
              </select>
            </div>

            {/* Due Date Picker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={handleDateChange}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-slate-100 transition"
              />
            </div>

            {/* Assignees */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                <Users className="h-3.5 w-3.5" /> Assignees
              </label>

              {currentWorkspace && (
                <div className="max-h-40 overflow-y-auto space-y-1 glass-subcard p-2 rounded-lg">
                  {currentWorkspace.members.map((member) => {
                    const isAssigned = assignees.includes(member.userId);
                    return (
                      <button
                        key={member.userId}
                        type="button"
                        onClick={() => handleToggleAssignee(member.userId)}
                        className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between transition ${
                          isAssigned ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <div
                            className="h-5 w-5 rounded-full text-white font-bold text-[8px] flex items-center justify-center select-none"
                            style={{ backgroundColor: member.color }}
                          >
                            {member.username.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="truncate">{member.username}</span>
                        </div>
                        {isAssigned && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Delete button */}
            <button
              onClick={handleDeleteTask}
              className="w-full mt-4 py-2 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg border border-rose-100 dark:border-rose-900/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
