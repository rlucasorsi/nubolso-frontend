import { cn } from '@/lib/utils';

interface AddButtonProps {
  label: string;
  onClick: () => void;
  title?: string;
  className?: string;
}

export function AddButton({ label, onClick, title, className }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'px-3 sm:px-4 h-9 sm:h-10 bg-primary text-white text-xs font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 tracking-tight shrink-0',
        className,
      )}
    >
      <span className="text-white/80 text-xl font-light">+</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
