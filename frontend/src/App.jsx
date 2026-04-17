import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import AboutPage from './pages/AboutPage';
import GuestbookPage from './pages/GuestbookPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProjectsPage from './pages/admin/AdminProjectsPage';
import AdminResumePage from './pages/admin/AdminResumePage';
import AdminPostsPage from './pages/admin/AdminPostsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import PageLayout from './components/PageLayout';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/guestbook" element={<PageLayout title="Guestbook"><GuestbookPage /></PageLayout>} />

          {/* Legacy routes redirect */}
          <Route path="/showcase" element={<ProjectsPage />} />
          <Route path="/showcase/:slug" element={<ProjectDetailPage />} />
          <Route path="/profile" element={<AboutPage />} />
          <Route path="/journal" element={<BlogPage />} />
          <Route path="/journal/:slug" element={<BlogPostPage />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute><PageLayout><AdminDashboard /></PageLayout></ProtectedRoute>} />
          <Route path="/admin/projects" element={<ProtectedRoute><PageLayout><AdminProjectsPage /></PageLayout></ProtectedRoute>} />
          <Route path="/admin/resume" element={<ProtectedRoute><PageLayout><AdminResumePage /></PageLayout></ProtectedRoute>} />
          <Route path="/admin/posts" element={<ProtectedRoute><PageLayout><AdminPostsPage /></PageLayout></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><PageLayout><AdminSettingsPage /></PageLayout></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
