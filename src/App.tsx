import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './pages/HomePage/HomePage';
import { UploadPage } from './pages/UploadPage/UploadPage';
import { TransactionsPage } from './pages/TransactionsPage/TransactionsPage';
import { StubPage } from './pages/StubPage/StubPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route
          path="analytics"
          element={<StubPage title="Аналитика" />}
        />
        <Route
          path="about"
          element={<StubPage title="О нас" />}
        />
      </Route>
    </Routes>
  );
}
