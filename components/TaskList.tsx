
import React from 'react';
import { Task } from '../types';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onRemoveTask: (id: string) => void;
  // Drag and Drop handlers from TaskRankerPage
  onDragStart: (event: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnterItem: (index: number) => void;
  onDragLeaveItem: () => void;
  draggedTaskIndex: number | null;
  dragHoverTargetIndex: number | null;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onRemoveTask, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  onDragEnd,
  onDragEnterItem,
  onDragLeaveItem,
  draggedTaskIndex,
  dragHoverTargetIndex
}) => {
  if (tasks.length === 0) {
    return null; // Message handled in TaskRankerPage.tsx
  }

  return (
    <div className="space-y-4" role="list">
      {tasks.map((task, index) => (
        <TaskItem 
          key={task.id} 
          task={task} 
          index={index}
          onRemove={onRemoveTask} 
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
          onDragEnterItem={onDragEnterItem}
          onDragLeaveItem={onDragLeaveItem}
          isBeingDragged={draggedTaskIndex === index}
          isDragHoverTarget={dragHoverTargetIndex === index && draggedTaskIndex !== index}
        />
      ))}
    </div>
  );
};

export default TaskList;