/**
 * Terminal Undo Stack
 * ===================
 * Persistent undo for destructive commands.
 * Tracks actions with enough data to reverse them.
 */

export type UndoActionType =
  | "clear_messages"
  | "delete_need"
  | "archive_need"
  | "cancel_contract"
  | "remove_friend"
  | "block_user"
  | "delete_credential"
  | "set_env"
  | "unset_env"
  | "set_alias"
  | "remove_alias"
  | "delete_lab_item"
  | "send_message";

export interface UndoAction {
  id: string;
  type: UndoActionType;
  description: string;
  timestamp: number;
  payload: Record<string, any>;
}

const MAX_UNDO_STACK = 50;
const UNDO_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

let memoryStack: UndoAction[] = [];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function pushUndo(action: Omit<UndoAction, "id" | "timestamp">): void {
  const full: UndoAction = {
    ...action,
    id: generateId(),
    timestamp: Date.now(),
  };
  memoryStack.unshift(full);
  if (memoryStack.length > MAX_UNDO_STACK) {
    memoryStack = memoryStack.slice(0, MAX_UNDO_STACK);
  }
}

export function popUndo(): UndoAction | null {
  const action = memoryStack.shift();
  if (!action) return null;
  // Expire old actions
  if (Date.now() - action.timestamp > UNDO_WINDOW_MS) {
    return null;
  }
  return action;
}

export function peekUndo(): UndoAction | null {
  const action = memoryStack[0];
  if (!action) return null;
  if (Date.now() - action.timestamp > UNDO_WINDOW_MS) {
    memoryStack = memoryStack.filter((a) => Date.now() - a.timestamp <= UNDO_WINDOW_MS);
    return memoryStack[0] || null;
  }
  return action;
}

export function getUndoStack(): UndoAction[] {
  const cutoff = Date.now() - UNDO_WINDOW_MS;
  memoryStack = memoryStack.filter((a) => a.timestamp > cutoff);
  return [...memoryStack];
}

export function clearUndoStack(): void {
  memoryStack = [];
}

export function formatUndoDescription(action: UndoAction): string {
  const timeAgo = Math.round((Date.now() - action.timestamp) / 1000);
  const timeStr = timeAgo < 60 ? `${timeAgo}s ago` : `${Math.round(timeAgo / 60)}m ago`;
  return `${action.description} (${timeStr})`;
}
