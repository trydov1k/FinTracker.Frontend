import type { ReactNode } from 'react';
import './Tag.css';

export type TagVariant = 'blue' | 'green' | 'purple' | 'orange' | 'teal';

interface TagProps {
  children: ReactNode;
  variant?: TagVariant;
}

export function Tag({ children, variant = 'blue' }: TagProps) {
  return (
    <span className={`tag tag--${variant}`}>
      {children}
    </span>
  );
}
