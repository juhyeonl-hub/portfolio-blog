import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import PortfolioPage from './pages/PortfolioPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ResumePage from './pages/ResumePage';
import JournalPage from './pages/JournalPage';
import PostDetailPage from './pages/PostDetailPage';
import GuestbookPage from './pages/GuestbookPage';
import AdminProjectsPage from './pages/admin/AdminProjectsPage';
import AdminResumePage from './pages/admin/AdminResumePage';
import AdminPostsPage from './pages/admin/AdminPostsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/portfolio" element={<Layout><PortfolioPage /></Layout>} />
          <Route path="/portfolio/:slug" element={<Layout><ProjectDetailPage /></Layout>} />
          <Route path="/resume" element={<Layout><ResumePage /></Layout>} />
          <Route path="/journal" element={<Layout><JournalPage /></Layout>} />
          <Route path="/journal/:slug" element={<Layout><PostDetailPage /></Layout>} />
          <Route path="/guestbook" element={<Layout><GuestbookPage /></Layout>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/projects" element={<ProtectedRoute><Layout><AdminProjectsPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/resume" element={<ProtectedRoute><Layout><AdminResumePage /></Layout></ProtectedRoute>} />
          <Route path="/admin/posts" element={<ProtectedRoute><Layout><AdminPostsPage /></Layout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
