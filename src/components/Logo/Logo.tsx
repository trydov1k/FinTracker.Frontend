import './Logo.css';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={`logo logo--${size}`}>
      <svg
        className="logo__icon"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="17" cy="20" r="12" fill="#7DD3FC" />
        <circle cx="25" cy="20" r="12" fill="#5EEAD4" fillOpacity="0.85" />
      </svg>
      <span className="logo__text">
        <span className="logo__text-fin">Fin</span>
        <span className="logo__text-tracker">Tracker</span>
      </span>
    </div>
  );
}
