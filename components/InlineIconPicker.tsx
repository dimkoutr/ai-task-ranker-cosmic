
import React from 'react';
import { AVAILABLE_LIST_ICONS } from './icons/list/ListIconDefaults';

interface InlineIconPickerProps {
  currentSelectedIconId: string;
  onSelectIcon: (iconId: string) => void;
  selectedColorValue: string; // For live preview of icon color
}

const InlineIconPicker: React.FC<InlineIconPickerProps> = ({
  currentSelectedIconId,
  onSelectIcon,
  selectedColorValue,
}) => {
  return (
    // Removed: className="bg-surface-subtle p-4 border border-border-secondary rounded-lg"
    // The root div is now simpler.
    <div>
      <label 
        id="list-icon-picker-label" 
        className="block text-sm font-medium text-text-accent mb-2"
      >
        List Icon
      </label>
      <div 
        className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 p-3 rounded-lg bg-input-bg border border-input-border"
        role="radiogroup" 
        aria-labelledby="list-icon-picker-label"
      >
        {AVAILABLE_LIST_ICONS.map(({ id, name, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelectIcon(id)}
            className={`
              flex flex-col items-center justify-center p-2 aspect-square rounded-md 
              transition-all duration-150 ease-in-out group 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-input-bg focus:ring-border-focus
              ${currentSelectedIconId === id 
                ? 'bg-surface-interactive ring-2 ring-border-focus shadow-md' 
                : 'bg-transparent hover:bg-surface-interactive/70 border border-transparent hover:border-border-secondary'
              }
            `}
            title={name}
            aria-label={`Select ${name} icon`}
            aria-pressed={currentSelectedIconId === id}
            role="radio" 
            aria-checked={currentSelectedIconId === id}
          >
            <Icon
              className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:scale-110"
              style={{ color: selectedColorValue }} // Apply selected list color to icon
            />
            <span 
                className={`
                    text-xs mt-1.5 text-center truncate w-full transition-colors
                    ${currentSelectedIconId === id ? 'text-text-accent font-medium' : 'text-text-muted group-hover:text-text-secondary'}
                `}
            >
                {name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default InlineIconPicker;
