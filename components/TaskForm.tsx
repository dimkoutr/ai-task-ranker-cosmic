
import React, { useState, useRef, useEffect } from 'react';
import { AddIcon } from './icons/AddIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { CalendarPlusIcon } from './icons/CalendarPlusIcon'; // New Icon
import { XMarkIcon } from './icons/XMarkIcon'; // New Icon

interface TaskFormProps {
  onAddTask: (text: string, dueDate: string | null) => void;
  disabled?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ onAddTask, disabled = false }) => {
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState(''); // Store as string "YYYY-MM-DD"
  const [showDueDateInput, setShowDueDateInput] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onAddTask(text, dueDate || null);
    setText('');
    setDueDate('');
    setShowDueDateInput(false); // Reset due date visibility
  };
  
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (showDueDateInput && dateInputRef.current) {
      dateInputRef.current.focus();
    }
  }, [showDueDateInput]);

  const handleAddDueDateClick = () => {
    setShowDueDateInput(true);
  };

  const handleRemoveDueDate = () => {
    setDueDate('');
    setShowDueDateInput(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-10">
      {/* Task Text Input */}
      <div>
        <label htmlFor="task-text-input" className="sr-only">New task description</label>
        <input
          id="task-text-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={disabled ? "AI is analyzing..." : "Summon a new task..."}
          className="w-full p-4 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-border-focus outline-none transition-all duration-300 shadow-md placeholder-input-placeholder text-input-text disabled:opacity-60 disabled:cursor-not-allowed input-focus-glow"
          disabled={disabled}
          aria-label="New task input"
          required
        />
      </div>

      {/* Wrapper for Due Date and Add Task Button */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-x-4 space-y-4 sm:space-y-0">
        {/* Due Date Button OR Date Input Field */}
        {!showDueDateInput ? (
          <button
            type="button"
            onClick={handleAddDueDateClick}
            disabled={disabled}
            className="w-full sm:w-auto button-secondary py-4 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 disabled:opacity-60 disabled:cursor-not-allowed button-active-pop button-hover-glow flex items-center justify-center gap-2"
            aria-label="Add a due date to the task"
          >
            <CalendarPlusIcon className="w-5 h-5" />
            Add Due Date
          </button>
        ) : (
          <div className="relative w-full sm:w-64"> {/* Container for date input */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarDaysIcon className="w-5 h-5 text-input-placeholder group-focus-within:text-text-accent transition-colors" />
            </div>
            <label htmlFor="task-due-date-input" className="sr-only">Due date</label>
            <input
              id="task-due-date-input"
              ref={dateInputRef}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={today}
              className="w-full p-4 pl-10 pr-10 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-border-focus outline-none transition-all duration-300 shadow-md placeholder-input-placeholder text-input-text disabled:opacity-60 disabled:cursor-not-allowed input-focus-glow appearance-none"
              disabled={disabled}
              title="Set an optional due date"
            />
            <button
              type="button"
              onClick={handleRemoveDueDate}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-input-placeholder hover:text-text-accent transition-colors duration-150 disabled:opacity-50"
              aria-label="Remove due date"
              title="Remove due date"
              disabled={disabled}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            {/* Custom styling for date input text color when a date is selected */}
            <style>{`
              input[type="date"]::-webkit-calendar-picker-indicator {
                opacity: 0.6;
                cursor: pointer;
                filter: invert(0.8) brightness(1.5) sepia(0.5) hue-rotate(200deg); /* Themed picker icon */
              }
              input[type="date"]:hover::-webkit-calendar-picker-indicator {
                opacity: 0.8;
              }
              input[type="date"]:disabled::-webkit-calendar-picker-indicator {
                opacity: 0.3;
              }
              input[type="date"] {
                color: ${dueDate ? 'var(--color-input-text)' : 'var(--color-input-placeholder)'};
              }
              input[type="date"]:focus {
                color: var(--color-input-text);
              }
            `}</style>
          </div>
        )}
      
        {/* Submit Button */}
        <button
          type="submit"
          className="w-full sm:w-auto button-primary text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg button-active-pop button-hover-glow flex items-center justify-center gap-2"
          disabled={disabled || !text.trim()}
        >
          <AddIcon className="w-5 h-5" />
          {disabled ? 'Processing...' : 'Add Task'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
