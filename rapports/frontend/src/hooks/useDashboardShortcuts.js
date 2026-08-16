import { useEffect } from 'react';

/**
 * Custom hook to handle global keyboard shortcuts for the Dashboard.
 * 
 * - Ctrl + F : Focus search input
 * - Ctrl + Z : Undo last attendance action
 * - Ctrl + Y / Ctrl + Shift + Z : Redo last undone action
 */
export default function useDashboardShortcuts({
  handleUndo,
  handleRedo,
  isArchiveMode = false,
  isVerificationMode = false,
  period
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorer si l'utilisateur saisit du texte dans un champ
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      // Ctrl + F : Focus sur le champ de recherche
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input-premium');
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      if (isArchiveMode || isVerificationMode) return;

      // Ctrl + Z : Undo
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (typeof handleUndo === 'function') handleUndo();
      } 
      // Ctrl + Y ou Ctrl + Shift + Z : Redo
      else if (e.ctrlKey && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        if (typeof handleRedo === 'function') handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, isArchiveMode, isVerificationMode, period]);
}
