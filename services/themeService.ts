import { ThemeName } from '../types';
import * as storageService from './storageService';

const THEME_BODY_CLASS_PREFIX = 'theme-';

export const applyTheme = (themeName: ThemeName): void => {
  // Remove any existing theme classes
  document.body.className = document.body.className
    .split(' ')
    .filter(c => !c.startsWith(THEME_BODY_CLASS_PREFIX))
    .join(' ');

  // Add the new theme class
  document.body.classList.add(`${THEME_BODY_CLASS_PREFIX}${themeName}`);
  storageService.saveTheme(themeName);
};

export const loadInitialTheme = (): ThemeName => {
  const savedTheme = storageService.getSavedTheme();
  applyTheme(savedTheme);
  return savedTheme;
};
