import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/i18n/LanguageContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout.jsx';
import Home from '@/screens/Home';
import WrittenReviews from '@/screens/WrittenReviews';
import Podcasts from '@/screens/Podcasts';
import PodcastSpace from '@/screens/PodcastSpace';
import AlbumDetail from '@/screens/AlbumDetail';
import GenreSpace from '@/screens/GenreSpace';
import Profile from '@/screens/Profile';
import About from '@/screens/About';
import ModerationQueue from '@/screens/ModerationQueue';
import Stats from '@/screens/Stats';
import Discover from '@/screens/Discover';
import DirectChat from '@/screens/DirectChat';
import SoulmateBoard from '@/screens/SoulmateBoard';
import UserProfile from '@/screens/UserProfile';
import ProfileSetup from '@/screens/ProfileSetup';
import Manage from '@/screens/Manage';
import Privacy from '@/screens/Privacy';
import Terms from '@/screens/Terms';
// Access tiers: guests can browse reviews / podcasts / genres / albums / about.
// Everything personal or social needs login; moderation needs admin.
import RequireAuth from '@/components/RequireAuth';
import RequireAdmin from '@/components/RequireAdmin';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    // Login no longer required — render the whole site even if the platform
    // reports auth_required. (auth_required redirect commented out per request.)
    // else if (authError.type === 'auth_required') {
    //   navigateToLogin();
    //   return null;
    // }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/reviews" element={<WrittenReviews />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/podcasts" element={<Podcasts />} />
        <Route path="/podcasts/:categoryId" element={<PodcastSpace />} />
        <Route path="/genre/:genreId" element={<GenreSpace />} />
        <Route path="/album/:id" element={<AlbumDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/profile/setup" element={<RequireAuth><ProfileSetup /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/u/:email" element={<RequireAuth><UserProfile /></RequireAuth>} />
        <Route path="/moderation" element={<RequireAdmin><ModerationQueue /></RequireAdmin>} />
        <Route path="/moderation/stats" element={<RequireAdmin><Stats /></RequireAdmin>} />
        <Route path="/band-dashboard" element={<Navigate to="/soulmate" replace />} />
        <Route path="/bands" element={<Navigate to="/soulmate" replace />} />
        <Route path="/band/:id" element={<Navigate to="/soulmate" replace />} />
        <Route path="/chat" element={<RequireAuth><DirectChat /></RequireAuth>} />
        <Route path="/soulmate" element={<RequireAuth><SoulmateBoard /></RequireAuth>} />
        <Route path="/manage" element={<RequireAdmin><Manage /></RequireAdmin>} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}

export default App