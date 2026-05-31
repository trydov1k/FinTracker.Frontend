import { Link } from 'react-router-dom';
import { HeroIllustration } from './HeroIllustration';
import './HomePage.css';

const features = [
  'Связывайте транзакции',
  'Исключайте переводы из аналитики',
  'Создавайте категории',
];

export function HomePage() {
  return (
    <div className="home">
      <section className="home__hero">
        <div className="home__content">
          <h1 className="home__title">
            Хотите разобраться
            <br />
            с тратами?
          </h1>
          <p className="home__subtitle">
            It is a long established fact that a reader will be distracted by
          </p>
          <Link to="/upload" className="home__cta">
            Загрузить выписку
          </Link>
          <ul className="home__features">
            {features.map((feature) => (
              <li key={feature} className="home__feature">
                <span className="home__feature-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#22C55E" />
                    <path
                      d="M6 10.5L8.5 13L14 7.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="home__illustration">
          <HeroIllustration />
        </div>
      </section>
    </div>
  );
}
