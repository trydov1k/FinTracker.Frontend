import './StubPage.css';

interface StubPageProps {
  title: string;
}

export function StubPage({ title }: StubPageProps) {
  return (
    <div className="stub">
      <div className="stub__card">
        <span className="stub__emoji" aria-hidden="true">
          🚧
        </span>
        <h1 className="stub__title">{title}</h1>
        <p className="stub__message">Упс, пока здесь ничего нет</p>
      </div>
    </div>
  );
}
