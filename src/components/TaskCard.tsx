import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task, User } from '../types';
import { useAppSelector } from '../store';
import { Calendar, CheckSquare, ListTodo, AlertCircle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick }) => {
  const currentWorkspace = useAppSelector((state) => state.board.currentWorkspace);

  // Get details of users assigned to this task
  const assignedUsers = (currentWorkspace?.members || [])
    .filter(m => task.assignees.includes(m.userId))
    .map(m => ({
      id: m.userId,
      username: m.username,
      color: m.color
    }));

  // Checklist Calculations
  const checklist = task.checklist || [];
  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;

  // Priority color styling
  const getPriorityBadge = (p: Task['priority']) => {
    switch (p) {
      case 'low':
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border-emerald-100/60 dark:border-emerald-900/30';
      case 'medium':
        return 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 border-amber-100/60 dark:border-amber-900/30';
      case 'high':
        return 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-450 border-orange-100/60 dark:border-orange-900/30';
      case 'urgent':
        return 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border-rose-100 dark:border-rose-900/30 animate-pulse';
      default:
        return 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800';
    }
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  // Due Date status
  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now() && task.columnId !== 'done';
  const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  }) : '';

  const getPriorityBorder = (p: Task['priority']) => {
    switch (p) {
      case 'low': return 'border-l-[3.5px] border-l-emerald-500';
      case 'medium': return 'border-l-[3.5px] border-l-amber-500';
      case 'high': return 'border-l-[3.5px] border-l-orange-500';
      case 'urgent': return 'border-l-[3.5px] border-l-rose-500';
      default: return '';
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`p-4 pl-3.5 glass-card rounded-xl hover:border-indigo-500/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing select-none ${getPriorityBorder(task.priority)} ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500/20 border-indigo-500 rotate-1' : ''
          }`}
          style={{
            ...provided.draggableProps.style,
          }}
        >
          {/* Header Priority & Icons */}
          <div className="flex items-center justify-between mb-2.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityBadge(task.priority)}`}>
              {task.priority}
            </span>
            {isOverdue && (
              <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-0.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 px-1.5 py-0.5 rounded-md">
                <AlertCircle className="h-3 w-3" /> Overdue
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1.5 leading-snug line-clamp-2">
            {task.title}
          </h4>

          {/* Description Snippet */}
          {task.description && (
            <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 mb-3.5 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Footer Metadata */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60 text-slate-400 dark:text-slate-500 text-[11px]">
            {/* Left: Due Date & Checklists */}
            <div className="flex items-center gap-3">
              {task.dueDate && (
                <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-rose-500' : 'text-slate-450 dark:text-slate-500'}`}>
                  <Calendar className="h-3 w-3" />
                  {formattedDate}
                </span>
              )}
              {totalCount > 0 && (
                <span className={`flex items-center gap-1 font-medium ${completedCount === totalCount ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-450 dark:text-slate-500'}`}>
                  <CheckSquare className="h-3 w-3" />
                  {completedCount}/{totalCount}
                </span>
              )}
            </div>

            {/* Right: Assigned User Avatars */}
            {assignedUsers.length > 0 && (
              <div className="flex -space-x-1.5 overflow-hidden">
                {assignedUsers.slice(0, 3).map(u => (
                  <div
                    key={u.id}
                    className="h-5.5 w-5.5 rounded-full ring-2 ring-white dark:ring-slate-900 text-white font-bold text-[8px] flex items-center justify-center select-none"
                    style={{ backgroundColor: u.color }}
                    title={u.username}
                  >
                    {getInitials(u.username)}
                  </div>
                ))}
                {assignedUsers.length > 3 && (
                  <div className="h-5.5 w-5.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[8px] flex items-center justify-center">
                    +{assignedUsers.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
