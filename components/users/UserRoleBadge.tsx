import { Badge } from '@/components/ui/badge';
import type { Role } from '@/shared/types/api';

const config: Record<
  Role,
  { label: string; variant: 'default' | 'success' | 'warning' }
> = {
  admin: { label: 'Admin', variant: 'default' },
  staff: { label: 'Staff', variant: 'success' },
  viewer: { label: 'Viewer', variant: 'warning' },
};

export function UserRoleBadge({ role }: { role: Role | string }) {
  const { label, variant } =
    config[role as Role] ?? { label: role, variant: 'default' as const };
  return <Badge variant={variant}>{label}</Badge>;
}
