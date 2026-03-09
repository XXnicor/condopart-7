interface MoradorInfoProps {
  full_name: string;
  avatar_url: string | null;
  role?: string;
}

const roleLabels: Record<string, string> = {
  syndic: 'Síndico',
  admin: 'Administrador',
  resident: 'Morador',
};

const MoradorInfo = ({ full_name, avatar_url, role }: MoradorInfoProps) => {
  const initial = full_name ? full_name[0].toUpperCase() : '?';
  const displayRole = role ? (roleLabels[role] ?? 'Morador') : 'Morador';

  return (
    <div className="flex items-center gap-2.5" data-testid="morador-info">
      {avatar_url ? (
        <img
          src={avatar_url}
          alt={full_name}
          className="h-9 w-9 rounded-full object-cover"
          data-testid="morador-avatar"
        />
      ) : (
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30"
          data-testid="morador-avatar-placeholder"
        >
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
            {initial}
          </span>
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-200" data-testid="morador-name">
          {full_name || 'Morador'}
        </p>
        <p className="text-xs text-stone-400" data-testid="morador-role">
          {displayRole}
        </p>
      </div>
    </div>
  );
};

export default MoradorInfo;
