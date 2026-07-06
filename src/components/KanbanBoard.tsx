import React, { useState } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { useAppDispatch, useAppSelector } from '../store';
import { updateTaskOrder, rollbackBoard, addTaskInState, setCurrentBoard } from '../features/boards/boardSlice';
import { TaskCard } from './TaskCard';
import { socket } from '../hooks/useSocket';
import { Plus, X, Trash2, KanbanSquare, Sparkles, FolderArchive } from 'lucide-react';
import { Task } from '../types';

interface KanbanBoardProps {
  onSelectTask: (taskId: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onSelectTask }) => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const { currentBoard, tasks } = useAppSelector((state) => state.board);

  // New Column Form
  const [showColForm, setShowColForm] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');

  // New Task Inline Form (Index tracker for columnId)
  const [activeColTaskForm, setActiveColTaskForm] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  if (!currentBoard) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center glass-panel p-10 shadow-lg shadow-indigo-500/5 rounded-2xl m-6 select-none animate-fade-in">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-full mb-4">
          <FolderArchive className="h-10 w-10 text-indigo-500 dark:text-indigo-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-250 mb-1">No Board Selected</h3>
        <p className="text-slate-400 dark:text-slate-500 text-xs text-center mt-1 max-w-xs leading-relaxed">
          Create or select a board from the sidebar to start organizing tasks.
        </p>
      </div>
    );
  }

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    // Check if position didn't change
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // 1. Keep a backup copy of current state for rollback
    const previousBoardState = JSON.parse(JSON.stringify(currentBoard));

    // 2. Dispatch Optimistic Update to Redux Store (UI updates instantly)
    const payload = { source, destination, taskId: draggableId };
    dispatch(updateTaskOrder(payload));

    try {
      // 3. Fire WebSocket event so OTHER users see it move live
      socket.emit('task_moved', {
        boardId: currentBoard.id,
        ...payload
      });

      // 4. Fire HTTP API call to persist the switch in the database
      const response = await fetch(`/api/boards/${currentBoard.id}/move-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to save task position');
    } catch (error) {
      // 5. Rollback UI if database update fails
      console.error(error);
      dispatch(rollbackBoard(previousBoardState));
    }
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;

    try {
      const res = await fetch(`/api/boards/${currentBoard.id}/columns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newColTitle })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create column');

      dispatch(setCurrentBoard(data));
      setNewColTitle('');
      setShowColForm(false);

      // Notify other clients in room
      socket.emit('column_created', { boardId: currentBoard.id, board: data });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm('Are you sure you want to delete this column and all its tasks?')) return;

    try {
      const res = await fetch(`/api/boards/${currentBoard.id}/columns/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ columnId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete column');

      dispatch(setCurrentBoard(data));

      // Notify other clients in room
      socket.emit('column_deleted', { boardId: currentBoard.id, board: data });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (columnId: string) => {
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTaskTitle,
          boardId: currentBoard.id,
          columnId,
          priority: 'medium'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task');

      dispatch(addTaskInState(data));
      setNewTaskTitle('');
      setActiveColTaskForm(null);

      // Emit socket notification
      socket.emit('task_created', { boardId: currentBoard.id, task: data });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6 select-none">
      {/* Board Header Info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <KanbanSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-455" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {currentBoard.name}
          </h2>
        </div>
      </div>

      {/* Board Stage */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-5 overflow-x-auto pb-4 items-start select-none">
          {/* Loop over Column Order and render columns */}
          {currentBoard.columnOrder.map((colId) => {
            const column = currentBoard.columns.find((c) => c.id === colId);
            if (!column) return null;

            // Gather only tasks belonging to this column, preserving the order defined in taskIds
            const colTasks = column.taskIds
              .map((tid) => tasks.find((t) => t.id === tid))
              .filter((t): t is Task => !!t);

            return (
              <div
                key={column.id}
                className="w-72 glass-panel rounded-2xl flex flex-col max-h-full flex-shrink-0 shadow-sm transition-all duration-200"
              >
                {/* Column Header */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                      {column.title}
                    </span>
                    <span className="bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteColumn(column.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition cursor-pointer"
                    title="Delete Column"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Task Cards Droppable container */}
                <Droppable droppableId={column.id} type="task">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto px-3 pb-3 space-y-2.5 min-h-[150px] rounded-b-2xl transition-colors duration-150 ${
                        snapshot.isDraggingOver ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''
                      }`}
                    >
                      {colTasks.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          onClick={() => onSelectTask(task.id)}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Column Footer: Inline Task Form */}
                <div className="px-3 pb-3">
                  {activeColTaskForm === column.id ? (
                    <div className="glass-subcard p-3 rounded-xl space-y-2 animate-fade-in shadow-sm">
                      <input
                        type="text"
                        autoFocus
                        required
                        placeholder="What needs to be done?"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateTask(column.id);
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-slate-100 transition"
                      />
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => {
                            setActiveColTaskForm(null);
                            setNewTaskTitle('');
                          }}
                          className="px-2.5 py-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-655 dark:hover:text-slate-350 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleCreateTask(column.id)}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/5 transition cursor-pointer"
                        >
                          Add Task
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveColTaskForm(column.id);
                        setNewTaskTitle('');
                      }}
                      className="w-full py-2 glass-subcard hover:bg-white/40 dark:hover:bg-slate-900/40 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Task Card
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Column Button */}
          <div className="w-72 flex-shrink-0">
            {showColForm ? (
              <form
                onSubmit={handleAddColumn}
                className="glass-panel p-4 rounded-2xl space-y-3 animate-fade-in shadow-md"
              >
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    Column Title
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Backlog, Testing"
                    value={newColTitle}
                    onChange={(e) => setNewColTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 dark:text-slate-100 transition"
                  />
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowColForm(false);
                      setNewColTitle('');
                    }}
                    className="px-2.5 py-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/5 transition cursor-pointer"
                  >
                    Add Column
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowColForm(true)}
                className="w-full py-3 px-4 border border-dashed border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200 font-bold rounded-2xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Column Stage
              </button>
            )}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};
