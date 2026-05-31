import type { ReactNode } from 'react';
import './HeroIllustration.css';

interface FloatingCardProps {
  className: string;
  icon: ReactNode;
  title: string;
  amount: string;
  amountType?: 'expense' | 'income';
  tag: string;
  tagVariant?: 'blue' | 'warning';
}

function FloatingCard({
  className,
  icon,
  title,
  amount,
  amountType = 'expense',
  tag,
  tagVariant = 'blue',
}: FloatingCardProps) {
  return (
    <div className={`hero-card ${className}`}>
      <div className="hero-card__icon">{icon}</div>
      <div className="hero-card__body">
        <div className="hero-card__row">
          <span className="hero-card__title">{title}</span>
          <span className={`hero-card__amount hero-card__amount--${amountType}`}>
            {amount}
          </span>
        </div>
        <span className={`hero-card__tag hero-card__tag--${tagVariant}`}>
          {tag}
        </span>
      </div>
    </div>
  );
}

export function HeroIllustration() {
  return (
    <div className="hero-illustration">
      <svg
        className="hero-illustration__lines"
        viewBox="0 0 500 500"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M250 250 C180 180, 120 140, 80 100"
          stroke="#BFDBFE"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <path
          d="M250 250 C320 160, 380 120, 420 80"
          stroke="#BFDBFE"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <path
          d="M250 250 C380 250, 420 280, 440 340"
          stroke="#BFDBFE"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <path
          d="M250 250 C320 340, 380 380, 420 420"
          stroke="#BFDBFE"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <path
          d="M250 250 C160 320, 100 380, 60 420"
          stroke="#BFDBFE"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <circle cx="250" cy="250" r="80" stroke="#BFDBFE" strokeWidth="1.5" strokeDasharray="6 6" />
        <circle cx="250" cy="250" r="110" stroke="#DBEAFE" strokeWidth="1" strokeDasharray="4 8" />
      </svg>

      <div className="hero-illustration__center">
        <svg viewBox="0 0 40 40" fill="none" width="48" height="48" aria-hidden="true">
          <circle cx="17" cy="20" r="12" fill="#7DD3FC" />
          <circle cx="25" cy="20" r="12" fill="#5EEAD4" fillOpacity="0.85" />
        </svg>
        <span className="hero-illustration__center-text">
          <span>Fin</span>
          <span className="hero-illustration__center-tracker">Tracker</span>
        </span>
      </div>

      <FloatingCard
        className="hero-card--pos-1"
        icon={<span>🌸</span>}
        title="Цветы"
        amount="- 3000 ₽"
        tag="#праздник"
      />
      <FloatingCard
        className="hero-card--pos-2"
        icon={<span>🏠</span>}
        title="Коммуналка"
        amount="- 600 ₽"
        tag="⚠ Дубликат"
        tagVariant="warning"
      />
      <FloatingCard
        className="hero-card--pos-3"
        icon={<span>🖥</span>}
        title="Монитор"
        amount="- 20 000 ₽"
        tag="#цель #техника"
      />
      <FloatingCard
        className="hero-card--pos-4"
        icon={<span>↔</span>}
        title="Перевод"
        amount="+ 1000 ₽"
        amountType="income"
        tag="Перевод"
      />
      <FloatingCard
        className="hero-card--pos-5"
        icon={<span>💰</span>}
        title="Долг"
        amount="- 1000 ₽"
        tag="Компенсация"
      />
    </div>
  );
}
