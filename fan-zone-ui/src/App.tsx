import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
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
import { SponsorZonePage } from './pages/SponsorZonePage';
import { LiveDropsPage } from './pages/LiveDropsPage';
import { HomeLandingPage } from './pages/HomeLandingPage';

function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeLandingPage />} />
            <Route path="/fan-zone-ui" element={<Navigate to="/" replace />} />
            <Route path="/fan-zone-ui/*" element={<Navigate to="/" replace />} />

            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute requireAgeUnverified />}>
              <Route path="/age-verify" element={<AgeVerificationPage />} />
            </Route>

            <Route element={<ProtectedRoute requireAgeVerified />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/predictions" element={<PredictionsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/collectibles" element={<CollectiblesPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/sponsor-zone" element={<SponsorZonePage />} />
              <Route path="/live-drops" element={<LiveDropsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </Provider>
  );
}

export default App;
