import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-16 vessel p-8", className)}>
      {icon && (
        <div className="flex justify-center mb-4 text-[#7a6b5a]">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-[#b8a078]">{title}</p>
      {description && (
        <p className="text-xs text-[#7a6b5a] mt-2 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
