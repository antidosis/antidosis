// Re-export shim for backwards compatibility.
// All handlers have been moved to the terminal-handlers/ directory.

export { dispatchCommand } from "./terminal-handlers/index";
export type { HandlerContext, HandlerResult } from "./terminal-handlers/index";
