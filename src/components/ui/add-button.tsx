import { cn } from '@/lib/utils';

interface AddButtonProps {
  label: string;
  onClick: () => void;
  title?: string;
  className?: string;
  // Renders as a square icon-only button on mobile, full labeled button from `sm:` up.
  iconOnly?: boolean;
}

export function AddButton({ label, onClick, title, className, iconOnly }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      title={iconOnly ? label : title}
      aria-label={iconOnly ? label : undefined}
      className={cn(
        'h-9 sm:h-10 bg-primary text-white text-xs font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 tracking-tight shrink-0',
        iconOnly ? 'w-9 px-0 sm:w-auto sm:px-4' : 'px-3 sm:px-4',
        className,
      )}
    >
      <span className="text-white/80 text-xl font-light">+</span>
      <span className={iconOnly ? 'hidden sm:inline' : undefined}>{label}</span>
    </button>
  );
}
