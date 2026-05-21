import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { ProfilePage } from './pages/ProfilePage';
import { CollectiblesPage } from './pages/CollectiblesPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AgeVerificationPage } from './pages/AgeVerificationPage';
import { HomeLandingPage } from './pages/HomeLandingPage';

function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeLandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/age-verify" element={<AgeVerificationPage />} />
            <Route element={<ProtectedRoute requireAgeVerified />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/predictions" element={<PredictionsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/collectibles" element={<CollectiblesPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </Provider>
  );
}

export default App;
