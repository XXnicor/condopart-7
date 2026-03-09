import { Home, PlusCircle, User, LayoutDashboard } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const isSyndic = profile?.role === 'syndic' || profile?.role === 'admin';

  const items = [
    { icon: Home, label: 'Início', path: '/' },
    ...(isSyndic ? [{ icon: LayoutDashboard, label: 'Painel', path: '/syndic' }] : []),
    { icon: PlusCircle, label: 'Alerta', path: '/create-alert' },
    { icon: User, label: 'Perfil', path: '/profile' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 bg-white/80 dark:bg-card/80 backdrop-blur-md border-t border-stone-100 dark:border-stone-800"
      style={{
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      data-testid="nav-bottom"
    >
      <div className="flex items-center justify-around py-2">
        {items.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <motion.button
              key={path}
              onClick={() => navigate(path)}
              whileTap={{ scale: 0.88 }}
              transition={{ duration: 0.1 }}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              className={cn(
                'relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-4 py-1.5 transition-colors duration-200',
                active
                  ? 'text-amber-500'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
              )}
              data-testid={`nav-${label.toLowerCase()}`}
            >
              <Icon className={cn('h-5 w-5 transition-transform duration-200', active && 'stroke-[2.5] scale-110')} />
              <span className={cn('text-[10px] font-semibold transition-colors', active ? 'text-amber-500' : '')}>{label}</span>
              {active && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-amber-500" />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
