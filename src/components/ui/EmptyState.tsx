/**
 * Estado vacío genérico — se usa cuando no hay resultados.
 */
interface Props {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '🌸', title, description, action }: Props) {
  return (
    <div className="vh-empty-state">
      <span style={{ fontSize: '3rem' }}>{icon}</span>
      <div>
        <p style={{
          fontFamily: 'var(--font-playfair, Georgia, serif)',
          fontSize: '1.1rem',
          fontWeight: 700,
          color: 'var(--vh-text-primary)',
          marginBottom: '0.5rem',
        }}>
          {title}
        </p>
        {description && (
          <p className="vh-empty-state__text">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}