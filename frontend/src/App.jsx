import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ShowcasePage from './pages/ShowcasePage';
import ProfilePage from './pages/ProfilePage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import JournalPage from './pages/JournalPage';
import PostDetailPage from './pages/PostDetailPage';
import GuestbookPage from './pages/GuestbookPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProjectsPage from './pages/admin/AdminProjectsPage';
import AdminResumePage from './pages/admin/AdminResumePage';
import AdminPostsPage from './pages/admin/AdminPostsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import PageLayout from './components/PageLayout';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/showcase" element={<PageLayout title="Showcase"><ShowcasePage /></PageLayout>} />
          <Route path="/showcase/:slug" element={<PageLayout><ProjectDetailPage /></PageLayout>} />
          <Route path="/profile" element={<PageLayout title="Profile"><ProfilePage /></PageLayout>} />
          <Route path="/journal" element={<PageLayout title="Journal"><JournalPage /></PageLayout>} />
          <Route path="/journal/:slug" element={<PageLayout><PostDetailPage /></PageLayout>} />
          <Route path="/guestbook" element={<PageLayout title="Guestbook"><GuestbookPage /></PageLayout>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute><PageLayout><AdminDashboard /></PageLayout></ProtectedRoute>} />
          <Route path="/admin/projects" element={<ProtectedRoute><PageLayout><AdminProjectsPage /></PageLayout></ProtectedRoute>} />
          <Route path="/admin/resume" element={<ProtectedRoute><PageLayout><AdminResumePage /></PageLayout></ProtectedRoute>} />
          <Route path="/admin/posts" element={<ProtectedRoute><PageLayout><AdminPostsPage /></PageLayout></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><PageLayout><AdminSettingsPage /></PageLayout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
