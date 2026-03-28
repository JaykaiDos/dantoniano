/**
 * Badge de estado personal de un anime (viendo, completado, etc.)
 */
import { STATUS_CONFIG } from '@/lib/utils';
import type { PersonalStatus } from '@/types';

interface Props {
  status: PersonalStatus;
}

export function StatusBadge({ status }: Props) {
  if (!status) return null;
  const config = STATUS_CONFIG[status];

  return (
    <span className={`vh-badge vh-badge--${
      status === 'pendiente'  ? 'pending'  :
      status === 'viendo'     ? 'playing'  :
      status === 'completado' ? 'finished' : 'dropped'
    }`}>
      <span aria-hidden="true">{config.emoji}</span>
      {config.label}
    </span>
  );
}