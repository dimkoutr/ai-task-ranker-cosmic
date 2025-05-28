
import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon'; // New Icon
import { ClockIcon } from './icons/ClockIcon'; // New Icon
import { AlertCircleIcon } from './icons/AlertCircleIcon'; // New Icon

interface TaskItemProps {
  task: Task;
  index: number; // For drag and drop
  onRemove: (id: string) => void;
  // Drag and Drop handlers
  onDragStart: (event: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnterItem: (index: number) => void; 
  onDragLeaveItem: () => void; 
  isBeingDragged: boolean;
  isDragHoverTarget: boolean;
}

const getRankBadgeColors = (rank: number | null): string => {
  if (rank === null) return 'bg-slate-600/50 border-slate-500 text-slate-300';
  if (rank === 1) return 'bg-red-500/70 border-red-400 text-white shadow-red-500/50';
  if (rank === 2) return 'bg-orange-500/70 border-orange-400 text-white shadow-orange-500/50';
  if (rank === 3) return 'bg-yellow-500/70 border-yellow-400 text-slate-900 shadow-yellow-500/50';
  if (rank <= 5) return 'bg-lime-500/70 border-lime-400 text-slate-900 shadow-lime-500/50';
  if (rank <= 7) return 'bg-green-500/70 border-green-400 text-white shadow-green-500/50';
  return 'bg-sky-500/70 border-sky-400 text-white shadow-sky-500/50';
};

const DueDateDisplay: React.FC<{ dueDate: string | null }> = ({ dueDate }) => {
  if (!dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to start of day

  // Parse dueDate string (YYYY-MM-DD) correctly, ensuring it's local time
  const [year, month, day] = dueDate.split('-').map(Number);
  const date = new Date(year, month - 1, day); // Month is 0-indexed
  date.setHours(0,0,0,0); // Normalize due date to start of day

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let text = '';
  let IconComponent = CalendarDaysIcon;
  let textColorClass = 'text-sky-300'; // Default for future dates
  let iconColorClass = 'text-sky-400';

  const formattedDate = date.toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });

  if (diffDays < 0) {
    text = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`;
    IconComponent = AlertCircleIcon;
    textColorClass = 'text-red-400 font-medium';
    iconColorClass = 'text-red-400';
  } else if (diffDays === 0) {
    text = 'Due Today';
    IconComponent = ClockIcon;
    textColorClass = 'text-orange-400 font-medium';
    iconColorClass = 'text-orange-400';
  } else if (diffDays === 1) {
    text = 'Due Tomorrow';
    IconComponent = CalendarDaysIcon;
    textColorClass = 'text-yellow-400 font-medium';
    iconColorClass = 'text-yellow-400';
  } else if (diffDays <= 7) {
    text = `Due in ${diffDays} days (${formattedDate.split(',')[0]})`;
    IconComponent = CalendarDaysIcon;
    textColorClass = 'text-teal-300';
    iconColorClass = 'text-teal-400';
  } else {
    text = `Due: ${formattedDate}`;
  }
  
  return (
    <div className={`mt-2.5 text-sm flex items-center gap-2 ${textColorClass} animate-fadeInUp`} style={{animationDelay: '0.1s'}}>
      <IconComponent className={`w-4 h-4 flex-shrink-0 ${iconColorClass}`} />
      <span>{text}</span>
    </div>
  );
};


const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  index, 
  onRemove, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  onDragEnd,
  onDragEnterItem,
  onDragLeaveItem,
  isBeingDragged,
  isDragHoverTarget
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(task.id);
    }, 400); 
  };
  
  const isLoading = task.isLoadingRank && !isExiting && !task.error;

  const baseClasses = `bg-surface-secondary backdrop-blur-sm p-5 rounded-xl shadow-xl flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-300 ease-out hover:shadow-purple-500/40 hover:scale-[1.02] border border-border-secondary cursor-grab`;
  
  let dynamicStyles = '';
  if (isBeingDragged) {
    dynamicStyles = 'opacity-80 scale-105 rotate-1 shadow-2xl shadow-[0_0_30px_3px_var(--color-border-focus)] ring-2 ring-offset-2 ring-offset-surface-primary ring-border-focus z-50';
  } else if (isDragHoverTarget) {
    dynamicStyles = 'scale-[1.01] border-2 border-dashed border-sky-400 bg-surface-interactive/30 rounded-xl';
  }

  const itemPulseAnimationClass = isLoading ? 'animate-pulse-task-item-bg' : '';
  const entryExitAnimationClass = isExiting ? 'animate-task-exit' : (isMounted ? 'animate-task-enter' : 'opacity-0');

  return (
    <div 
      className={`${baseClasses} ${entryExitAnimationClass} ${dynamicStyles} ${itemPulseAnimationClass}`}
      draggable={!isExiting && !isLoading}
      onDragStart={(e) => !isLoading && onDragStart(e, index)}
      onDragOver={(e) => !isLoading && onDragOver(e, index)}
      onDrop={(e) => !isLoading && onDrop(e, index)}
      onDragEnd={onDragEnd}
      onDragEnter={() => !isLoading && onDragEnterItem(index)}
      onDragLeave={onDragLeaveItem}
      aria-grabbed={isBeingDragged ? 'true' : 'false'}
      role="listitem"
      aria-labelledby={`task-text-${task.id}`}
      aria-describedby={task.justification ? `task-justification-${task.id}` : (task.dueDate ? `task-duedate-${task.id}` : undefined)}
    >
      <div className="flex-grow min-w-0">
        <p id={`task-text-${task.id}`} className="text-lg text-text-primary break-words font-medium">{task.text}</p>
        
        {!isLoading && !task.error && !isExiting && task.dueDate && (
           <div id={`task-duedate-${task.id}`}>
            <DueDateDisplay dueDate={task.dueDate} />
           </div>
        )}

        {isLoading && (
          <>
            <div className="flex items-center mt-2.5 text-sm text-text-accent">
              <LoadingSpinner className="w-4 h-4 mr-2 text-current" />
              <span>AI is weaving its magic...</span>
            </div>
            <div className="mt-2.5 space-y-1.5">
              <div className="h-3 w-11/12 skeleton-placeholder"></div>
              <div className="h-3 w-4/5 skeleton-placeholder"></div>
            </div>
          </>
        )}

        {task.error && !isExiting && !isLoading && (
          <p className="mt-2 text-sm text-red-300 bg-red-500/20 p-2 rounded-md break-words border border-red-400/50">Error: {task.error}</p>
        )}

        {task.rank !== null && task.justification && !isLoading && !task.error && !isExiting && (
          <div id={`task-justification-${task.id}`} className="mt-2 text-sm text-sky-200 flex items-start gap-2 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
            <SparklesIcon className="w-4 h-4 text-sky-300 flex-shrink-0 mt-0.5 opacity-80" />
            <span className="break-words italic">{task.justification}</span>
          </div>
        )}
      </div>

      <div className="flex sm:flex-col items-center gap-3 sm:gap-3 flex-shrink-0 pt-2 sm:pt-0">
        {isLoading ? (
          <div 
            className="w-12 h-12 rounded-full skeleton-placeholder" 
            title="AI is ranking..."
            aria-label="AI is ranking this task"
          ></div>
        ) : task.rank !== null && !task.error && !isExiting ? (
          <div 
            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 shadow-lg transition-all ${getRankBadgeColors(task.rank)}`}
            title={`AI Rank: ${task.rank}. Lower is more important.`}
          >
            {task.rank}
          </div>
        ) : task.error && !isExiting ? ( 
             <div 
               className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold border-2 shadow-md bg-red-700/60 border-red-500 text-red-200`}
               title={`Ranking Error: ${task.error}`}
             >
                !
            </div>
        ) : !isExiting && ( 
            <div 
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 shadow-md bg-slate-700/50 border-slate-600 text-text-muted`}
              title="Manually Ordered / Awaiting AI Rank"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
        )}
        <button
          onClick={handleRemove}
          disabled={isExiting || isLoading}
          className="text-text-muted hover:text-red-400 transition-colors duration-200 p-2 rounded-full hover:bg-surface-interactive disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-alt"
          aria-label="Remove task"
          title="Remove task"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TaskItem;
