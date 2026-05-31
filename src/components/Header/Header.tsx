import { NavLink } from 'react-router-dom';
import { Logo } from '../Logo/Logo';
import './Header.css';

const navItems: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'Главная', end: true },
  { to: '/transactions', label: 'Транзакции' },
  { to: '/analytics', label: 'Аналитика' },
  { to: '/about', label: 'О нас' },
];

export function Header() {
  return (
    <header className="header">
      <div className="header__inner">
        <NavLink to="/" className="header__logo-link">
          <Logo />
        </NavLink>

        <nav className="header__nav" aria-label="Основная навигация">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `header__nav-link${isActive ? ' header__nav-link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <NavLink to="/upload" className="header__upload-btn">
          Загрузить
        </NavLink>
      </div>
    </header>
  );
}
