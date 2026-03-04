import { Loader2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolInvocation: {
    toolName: string;
    args: Record<string, any>;
    state: string;
    result?: any;
  };
}

function getLabel(toolName: string, args: Record<string, any>): string {
  const basename = args.path ? args.path.split("/").filter(Boolean).pop() ?? args.path : null;

  if (toolName === "str_replace_editor" && basename) {
    switch (args.command) {
      case "create": return `Creating ${basename}`;
      case "str_replace":
      case "insert": return `Editing ${basename}`;
      case "view": return `Reading ${basename}`;
      case "undo_edit": return `Undoing edit to ${basename}`;
    }
  }

  if (toolName === "file_manager" && basename) {
    switch (args.command) {
      case "rename": return `Renaming ${basename}`;
      case "delete": return `Deleting ${basename}`;
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const { toolName, args, state, result } = toolInvocation;
  const label = getLabel(toolName, args);
  const isDone = state === "result" && result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
