
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Task, TaskInputItem, AIRankedTask, User } from '../types';
import { getTaskImportance } from '../services/geminiService';
import * as storageService from '../services/storageService';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import ApiKeyWarningBanner from '../components/ApiKeyWarningBanner';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { CogIcon } from '../components/icons/CogIcon';
import LoadingSpinner from '../components/LoadingSpinner';
import { FREE_TIER_MAX_TASKS_PER_LIST, getTierDetails } from '../constants';

interface TaskRankerPageProps {
  currentUser: User;
  taskListId: string;
  taskListName: string;
  onBackToDashboard: () => void;
  onNavigateToSettings: () => void;
  onLimitReached: (reason: string) => void; // New prop
}

const getSortPriority = (task: Task): number => {
  if (task.rank !== null) return task.rank; 
  if (task.isLoadingRank) return 1000; 
  if (task.error) return 1001; 
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate + "T00:00:00"); 
    const today = new Date();
    today.setHours(0,0,0,0);
    if (dueDate < today) return 2000; 
    if (dueDate.getTime() === today.getTime()) return 2001; 
    return 2002 + (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24); 
  }
  return 3000; 
};

const sortTasksIfNeeded = (tasksToSort: Task[]): Task[] => {
  return [...tasksToSort].sort((a, b) => getSortPriority(a) - getSortPriority(b));
};


const TaskRankerPage: React.FC<TaskRankerPageProps> = ({
  currentUser,
  taskListId,
  taskListName,
  onBackToDashboard,
  onNavigateToSettings,
  onLimitReached,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);
  const [isRanking, setIsRanking] = useState<boolean>(false);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const draggedItem = useRef<Task | null>(null);
  const draggedItemIndex = useRef<number | null>(null);
  const [draggedTaskIndexVisual, setDraggedTaskIndexVisual] = useState<number | null>(null);
  const [dragHoverTargetIndex, setDragHoverTargetIndex] = useState<number | null>(null);

  const currentUserTierDetails = getTierDetails(currentUser.subscriptionTier);
  const aiRankingType = currentUserTierDetails?.aiRankingType || 'Basic';


  useEffect(() => {
    const key = process.env.API_KEY;
    if (typeof key !== 'string' || !key) {
      setApiKeyMissing(true);
      console.warn("API_KEY is not configured for Gemini. AI features will be affected.");
    }
  }, []);

  const loadTasks = useCallback(async () => {
    setIsLoadingList(true);
    setGlobalError(null);
    try {
      const listDetail = await storageService.getTaskListDetail(currentUser.id, taskListId);
      setTasks(sortTasksIfNeeded(listDetail.tasks.map(t => ({...t, dueDate: t.dueDate || null}))));
    } catch (err) {
      console.error("Failed to load task list:", err);
      setGlobalError("Failed to load tasks for this list. " + (err as Error).message);
      setTasks([]);
    } finally {
      setIsLoadingList(false);
    }
  }, [currentUser.id, taskListId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const saveCurrentTasks = useCallback(async (tasksToSave: Task[]) => {
    try {
      const currentListDetails = await storageService.getTaskListDetail(currentUser.id, taskListId);
      await storageService.saveTaskList(currentUser.id, {
        id: taskListId,
        name: taskListName,
        tasks: tasksToSave, 
        lastModified: new Date().toISOString(),
        icon: currentListDetails.icon, 
        color: currentListDetails.color,
      });
    } catch (err) {
      console.error("Failed to save tasks:", err);
      setGlobalError("Failed to save changes to your task list. " + (err as Error).message);
    }
  }, [currentUser.id, taskListId, taskListName]);

  const processTaskRanking = useCallback(async (
    tasksCurrentlyInUI: Task[],
    idsToRankInThisBatch: Set<string>
  ) => {
    if (apiKeyMissing) {
      const updatedTasks = tasksCurrentlyInUI.map(t =>
        idsToRankInThisBatch.has(t.id) && t.isLoadingRank
          ? { ...t, isLoadingRank: false, error: "API Key not configured. Cannot rank task." }
          : t
      );
      const sorted = sortTasksIfNeeded(updatedTasks);
      setTasks(sorted);
      await saveCurrentTasks(sorted);
      setIsRanking(false);
      return;
    }

    const taskInputsForAI: TaskInputItem[] = tasksCurrentlyInUI
      .filter(t => idsToRankInThisBatch.has(t.id))
      .map(t => ({ id: t.id, text: t.text, dueDate: t.dueDate }));

    if (taskInputsForAI.length === 0) {
      setIsRanking(false);
      const finalTasksNoRanking = tasksCurrentlyInUI.map(t =>
        idsToRankInThisBatch.has(t.id) && t.isLoadingRank
          ? { ...t, isLoadingRank: false, error: t.error || "Task not sent for ranking." }
          : t
      );
      setTasks(sortTasksIfNeeded(finalTasksNoRanking));
      await saveCurrentTasks(finalTasksNoRanking);
      return;
    }
    
    setIsRanking(true);
    setGlobalError(null);

    try {
      const aiRankedTasks: AIRankedTask[] = await getTaskImportance(taskInputsForAI);
      
      setTasks(currentFullTaskState => {
        const rankedTasksMap = new Map(aiRankedTasks.map(rt => [rt.id, rt]));
        const updatedTasks = currentFullTaskState.map(task => {
          if (idsToRankInThisBatch.has(task.id)) {
            const rankedInfo = rankedTasksMap.get(task.id);
            if (rankedInfo) {
              return {
                ...task,
                rank: rankedInfo.rank,
                justification: rankedInfo.justification,
                isLoadingRank: false,
                error: null,
              };
            } else {
              return { ...task, isLoadingRank: false, error: "AI did not return a rank for this task." };
            }
          }
          return task;
        });
        const finalTasks = sortTasksIfNeeded(updatedTasks);
        saveCurrentTasks(finalTasks);
        return finalTasks;
      });
    } catch (error) {
      console.error("Failed to get task importance for batch:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to rank tasks.";
      setGlobalError(`${aiRankingType} AI Ranking Error: ${errorMessage}`);
      setTasks(currentFullTaskState => {
        const updatedOnError = currentFullTaskState.map(t => {
          if (idsToRankInThisBatch.has(t.id)) {
            return { ...t, isLoadingRank: false, error: errorMessage };
          }
          return t;
        });
        const finalTasks = sortTasksIfNeeded(updatedOnError);
        saveCurrentTasks(finalTasks);
        return finalTasks;
      });
    } finally {
      setIsRanking(false);
    }
  }, [apiKeyMissing, saveCurrentTasks, aiRankingType]);

  const addTask = useCallback(async (text: string, dueDate: string | null) => {
    if (!text.trim()) return;

    if (currentUserTierDetails && tasks.length >= currentUserTierDetails.maxTasksPerList) {
        onLimitReached(`You've reached the maximum of ${currentUserTierDetails.maxTasksPerList} tasks per list for the ${currentUserTierDetails.name} plan. Please upgrade to add more tasks to this list.`);
        return;
    }

    setGlobalError(null);

    const newTask: Task = {
      id: crypto.randomUUID(),
      text,
      dueDate,
      rank: null,
      justification: null,
      isLoadingRank: false,
      error: null,
    };
    
    const tasksIncludingNew = [newTask, ...tasks];
    const tasksPreparedForRanking = tasksIncludingNew.map(t => ({
        ...t, 
        rank: null, 
        justification: null,
        isLoadingRank: !t.error,
        error: t.error 
    }));
    
    setTasks(sortTasksIfNeeded(tasksPreparedForRanking));

    const idsToRank = new Set(tasksPreparedForRanking.filter(t => t.isLoadingRank).map(t => t.id));
    if (idsToRank.size > 0) {
      await processTaskRanking(tasksPreparedForRanking, idsToRank);
    } else {
      await saveCurrentTasks(tasksPreparedForRanking);
    }
  }, [tasks, processTaskRanking, saveCurrentTasks, currentUserTierDetails, onLimitReached]);

  const removeTask = useCallback(async (id: string) => {
    setGlobalError(null);
    const tasksAfterRemoval = tasks.filter(task => task.id !== id);
    
    if (tasksAfterRemoval.filter(t => !t.error).length > 0) {
      const tasksPreparedForRanking = tasksAfterRemoval.map(t => ({ 
          ...t, 
          isLoadingRank: !t.error, 
          rank: null, 
          justification: null, 
          error: t.error 
      }));
      setTasks(sortTasksIfNeeded(tasksPreparedForRanking));

      const idsToRank = new Set(tasksPreparedForRanking.filter(t => t.isLoadingRank).map(t => t.id));
      if (idsToRank.size > 0) {
        await processTaskRanking(tasksPreparedForRanking, idsToRank);
      } else {
        await saveCurrentTasks(tasksPreparedForRanking);
      }
    } else {
      setTasks(tasksAfterRemoval); 
      await saveCurrentTasks(tasksAfterRemoval);
    }
  }, [tasks, processTaskRanking, saveCurrentTasks]);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    draggedItem.current = tasks[index];
    draggedItemIndex.current = index;
    setDraggedTaskIndexVisual(index); 
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', tasks[index].id); 
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault(); 
    if (draggedItemIndex.current === null || draggedItemIndex.current === index) {
      if (dragHoverTargetIndex !== null && dragHoverTargetIndex !== index) {
          setDragHoverTargetIndex(null);
      }
      return;
    }
    if (dragHoverTargetIndex !== index) {
        setDragHoverTargetIndex(index);
    }
  };
  
  const handleDragEnterItem = (index: number) => {
    if (draggedItemIndex.current !== null && draggedItemIndex.current !== index) {
      setDragHoverTargetIndex(index);
    }
  };

  const handleDragLeaveItem = () => {
    // Managed by onDragOver
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    event.preventDefault();
    if (draggedItemIndex.current === null || draggedItem.current === null || draggedItemIndex.current === dropIndex) {
      setDraggedTaskIndexVisual(null);
      setDragHoverTargetIndex(null);
      draggedItem.current = null;
      draggedItemIndex.current = null;
      return;
    }

    let reorderedTasks = [...tasks];
    const itemToMove = reorderedTasks.splice(draggedItemIndex.current, 1)[0];
    reorderedTasks.splice(dropIndex, 0, itemToMove);

    const tasksPreparedForRanking = reorderedTasks.map(t => ({
      ...t,
      rank: null, 
      justification: null, 
      isLoadingRank: !t.error,
      error: t.error
    }));
    
    setTasks(sortTasksIfNeeded(tasksPreparedForRanking));

    setDraggedTaskIndexVisual(null);
    setDragHoverTargetIndex(null);
    draggedItem.current = null;
    draggedItemIndex.current = null;

    const idsToRank = new Set(tasksPreparedForRanking.filter(t => t.isLoadingRank).map(t => t.id));
    if (idsToRank.size > 0) {
      await processTaskRanking(tasksPreparedForRanking, idsToRank);
    } else {
      await saveCurrentTasks(tasksPreparedForRanking);
    }
  };

  const handleDragEnd = () => {
    if (draggedItem.current) { 
      setDraggedTaskIndexVisual(null);
      setDragHoverTargetIndex(null);
      draggedItem.current = null;
      draggedItemIndex.current = null;
    }
  };


  if (isLoadingList) {
    return (
      <div className="page-container-flex">
        <main className="page-content-scrollable flex flex-col items-center justify-center">
          <LoadingSpinner className="w-12 h-12 mb-4 text-purple-400" />
          <p className="text-xl text-text-secondary">Loading your cosmic task list: <span className="font-semibold text-text-accent">{taskListName}</span>...</p>
        </main>
      </div>
    );
  }
  
  const anyTaskIsLoadingRank = tasks.some(t => t.isLoadingRank);
  const canAddTask = currentUserTierDetails ? tasks.length < currentUserTierDetails.maxTasksPerList : true;

  return (
    <div className="page-container-flex">
      <header className="page-header-area p-4 md:p-8 md:pb-6">
        {apiKeyMissing && <div className="mb-4"><ApiKeyWarningBanner /></div>}
        <div className="flex justify-between items-center mb-2">
            <button
                onClick={onBackToDashboard}
                className="text-text-accent hover:text-text-accent-hover transition-colors duration-200 text-sm hover:underline inline-flex items-center gap-1 group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
            </button>
             <button
                onClick={onNavigateToSettings}
                className="header-icon-button button-active-pop"
                aria-label="Open application settings"
                title="Settings"
            >
                <CogIcon />
            </button>
        </div>
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-sky-rose-lime flex items-center justify-center gap-x-2 md:gap-x-4 text-center">
            <SparklesIcon className="w-9 h-9 md:w-11 md:h-11 text-yellow-300 opacity-80 animate-sparkles-pulse" />
            {taskListName}
            <SparklesIcon className="w-9 h-9 md:w-11 md:h-11 text-pink-400 opacity-80 animate-sparkles-pulse [animation-delay:-1s]" />
          </h1>
          <p className="text-text-secondary mt-3 text-lg text-center">
            AI Ranking: <span className="font-semibold text-text-accent">{aiRankingType}</span>. Add tasks with due dates. Drag to reorder. AI will re-rank upon changes.
          </p>
          {currentUserTierDetails && currentUserTierDetails.maxTasksPerList !== Infinity && (
            <p className="text-text-muted text-sm text-center mt-1">
                Tasks: {tasks.length} / {currentUserTierDetails.maxTasksPerList}.
            </p>
          )}
        </div>
      </header>

      <main className="page-content-scrollable p-4 md:p-8 md:pt-0">
        <div className={`container mx-auto max-w-3xl bg-surface-primary backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-10 border border-border-secondary transition-all duration-300 ${isRanking && anyTaskIsLoadingRank ? 'animate-pulse-slow border-purple-500/70 shadow-purple-500/50' : ''}`}>
          <TaskForm onAddTask={addTask} disabled={(isRanking && anyTaskIsLoadingRank) || apiKeyMissing || !canAddTask} />
          
          {!canAddTask && currentUserTierDetails && (
            <div className="bg-yellow-500/20 border border-yellow-700 text-yellow-200 p-4 rounded-lg mb-6 text-sm shadow-lg flex items-center gap-3" role="alert">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>You've reached the task limit of {currentUserTierDetails.maxTasksPerList} for this list on the {currentUserTierDetails.name} plan. <button onClick={() => onLimitReached(`Upgrade to add more tasks to the list "${taskListName}".`)} className="font-semibold underline hover:text-yellow-100">Upgrade Plan</button> to add more.</span>
            </div>
          )}

          {globalError && (
            <div className="bg-red-500/20 border border-red-700 text-red-300 p-4 rounded-lg mb-6 text-sm shadow-lg flex items-center gap-3" role="alert">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{globalError}</span>
            </div>
          )}
          
          {isRanking && anyTaskIsLoadingRank && (
            <div className="my-8 p-6 md:p-10 bg-surface-interactive/40 backdrop-blur-sm rounded-xl border border-border-secondary shadow-xl relative overflow-hidden">
              <div className="flex flex-col items-center text-center">
                <LoadingSpinner className="w-14 h-14 text-text-accent mb-6" />
                <p className="text-xl md:text-2xl font-semibold text-text-primary mb-2 animate-text-pulse-enhanced">
                  AI is Recalibrating Cosmic Priorities...
                </p>
                <p className="text-sm md:text-base text-text-secondary">
                  Analyzing task constellations and due dates, please wait.
                </p>
                <SparklesIcon className="w-6 h-6 text-yellow-400/70 absolute top-4 left-4 animate-sparkles-pulse [animation-delay:-0.2s]" />
                <SparklesIcon className="w-5 h-5 text-pink-400/60 absolute top-8 right-6 animate-sparkles-pulse [animation-delay:-0.8s]" />
                <SparklesIcon className="w-7 h-7 text-sky-400/50 absolute bottom-5 left-10 animate-sparkles-pulse [animation-delay:-1.5s]" />
                <SparklesIcon className="w-4 h-4 text-purple-400/70 absolute bottom-8 right-12 animate-sparkles-pulse [animation-delay:-0.5s]" />
              </div>
            </div>
          )}

          {!isRanking && tasks.length === 0 && !globalError && !isLoadingList && (
            <p className="text-center text-text-muted mt-10 text-xl">✨ This task list is empty. Add a task to begin! ✨</p>
          )}

          <TaskList 
            tasks={tasks} 
            onRemoveTask={removeTask} 
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onDragEnterItem={handleDragEnterItem}
            onDragLeaveItem={handleDragLeaveItem}
            draggedTaskIndex={draggedTaskIndexVisual} 
            dragHoverTargetIndex={dragHoverTargetIndex}
          />
        </div>
      </main>

      <footer className="page-footer-area text-center py-6 text-text-muted text-sm">
        <p>Viewing: {taskListName} ✨ Powered by {aiRankingType} Gemini AI</p>
      </footer>
    </div>
  );
};

export default TaskRankerPage;
