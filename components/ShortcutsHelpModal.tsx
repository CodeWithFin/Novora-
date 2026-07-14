'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUiStore } from '@/lib/store/uiStore';

export function ShortcutsHelpModal() {
  const open = useUiStore((s) => s.shortcutsOpen);
  const close = useUiStore((s) => s.closeShortcuts);

  const shortcuts = [
    { key: 'D', action: 'Open Quick Dispatch' },
    { key: 'I', action: 'Go to Stock In' },
    { key: 'S', action: 'Focus global search' },
    { key: 'Esc', action: 'Close modals' },
    { key: '?', action: 'Show shortcuts' },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="bg-surface border-border-default">
        <DialogHeader>
          <DialogTitle className="font-display">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
            >
              <span className="text-foreground-secondary">{s.action}</span>
              <kbd className="font-mono text-sm px-2 py-1 rounded bg-raised border border-border-default">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
