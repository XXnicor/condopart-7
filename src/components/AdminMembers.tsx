import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getCondoMembers, updateMemberRole, removeMember, type Member } from '@/lib/syndic';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'bg-amber-200 text-amber-800 border-amber-400' },
  syndic: { label: 'Síndico', className: 'bg-orange-100 text-orange-700 border-orange-300' },
  morador: { label: 'Morador', className: 'bg-muted text-muted-foreground border-border' },
};

type Props = {
  condoId: string;
  currentUserId: string;
};

export default function AdminMembers({ condoId, currentUserId }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async () => {
    try {
      setMembers(await getCondoMembers(condoId));
    } catch {
      toast.error('Erro ao carregar membros.');
    } finally {
      setLoading(false);
    }
  }, [condoId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return members;
    const q = debouncedSearch.toLowerCase();
    return members.filter((m) => (m.full_name ?? '').toLowerCase().includes(q));
  }, [members, debouncedSearch]);

  const handleRoleChange = async (member: Member, newRole: 'morador' | 'syndic') => {
    try {
      await updateMemberRole(member.id, newRole, currentUserId);
      toast.success(`${member.full_name ?? 'Membro'} agora é ${newRole === 'syndic' ? 'síndico' : 'morador'}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRemove = async (member: Member) => {
    try {
      await removeMember(member.id, currentUserId);
      toast.success(`${member.full_name ?? 'Membro'} foi removido do condomínio`);
      setConfirmRemoveId(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Buscar por nome..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="text-base min-h-[44px]"
        autoComplete="off"
        autoCorrect="off"
      />

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum membro encontrado.
        </p>
      ) : (
        <div className="space-y-0">
          {filtered.map((member) => {
            const badge = ROLE_BADGE[member.role] ?? ROLE_BADGE.morador;
            const isMe = member.id === currentUserId;
            const initials = (member.full_name ?? '?').charAt(0).toUpperCase();

            return (
              <div key={member.id}>
                <div className="flex items-center gap-3 py-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-amber-100 text-amber-700 font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {member.full_name ?? 'Sem nome'}
                      {isMe && (
                        <span className="ml-1.5 text-xs text-muted-foreground">(Você)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Desde {format(new Date(member.created_at), 'MMM yyyy', { locale: ptBR })}
                    </p>
                  </div>

                  <Badge variant="outline" className={badge.className}>
                    {badge.label}
                  </Badge>

                  {!isMe && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.role === 'morador' && (
                          <DropdownMenuItem onClick={() => handleRoleChange(member, 'syndic')}>
                            Promover a Síndico
                          </DropdownMenuItem>
                        )}
                        {member.role === 'syndic' && (
                          <DropdownMenuItem onClick={() => handleRoleChange(member, 'morador')}>
                            Rebaixar a Morador
                          </DropdownMenuItem>
                        )}
                        {member.role === 'admin' && (
                          <DropdownMenuItem disabled>
                            Admin — não editável
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setConfirmRemoveId(member.id)}
                        >
                          Remover do condomínio
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <AnimatePresence>
                  {confirmRemoveId === member.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-between rounded-lg bg-destructive/10 px-3 py-2 mb-1">
                        <p className="text-sm text-destructive">
                          Remover {member.full_name ?? 'membro'}?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmRemoveId(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemove(member)}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Separator />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
