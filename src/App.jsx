import { Routes, Route, Navigate } from 'react-router-dom';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../src/context/AuthContext.jsx';
import Header from './components/header.jsx';
import Services from './components/services.jsx';
import About from './components/about.jsx';
import Workers from './components/workers.jsx';
import Footer from './components/footer.jsx';
import Join from './components/join.jsx';
import SignIn from './components/signin.jsx';
import SignUp from './components/signup.jsx';
import Profile from './components/profile.jsx';
import ArtisanProfile from './components/artisanprofile.jsx';
import MatchingArtisansPage from './components/matching-artisans.jsx';
import PublicArtisanProfile from './components/PublicArtisanProfile.jsx';
import Chat from './components/chat.jsx';
import Conversations from './components/conversations.jsx';
import EditProfile from './components/editprofile.jsx';
import PurchaseCoins from './components/PurchaseCoins.jsx';
import Review from "./components/reviews.jsx";
import AdminDashboard from './components/AdminDashboard.jsx';
import Process from './components/process.jsx';
import Testimonials from './components/testimonials.jsx';
import Hero from './components/hero.jsx';
import Gallery from './components/gallery.jsx';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/signin" />;
  if (requireAdmin && user.role !== "admin") return <Navigate to="/" />;
  return children;
}

function App() {
  const { loading } = useAuth();
  const location = useLocation();
    const isHome = location.pathname === "/";


   if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
      <div className="w-10 h-10 border-2 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <>
    {isHome && (
      <Header />
      
    )}
      <Routes>
        <Route
          path="/"
          element={
            <>
              <div >
                <Hero/>
                <Services />
                <Process/>
                <About />
                <Testimonials/>
              </div>
              <Footer />
            </>
          }
        />
        <Route path="/workers" element={<Workers />} />
        <Route path="/join" element={<Join />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/artisan-profile/:id"
          element={
            <ProtectedRoute>
              <PublicArtisanProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/artisan-profile"
          element={
            <ProtectedRoute>
              <ArtisanProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matching-artisans"
          element={
            <ProtectedRoute>
              <MatchingArtisansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:id"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conversations"
          element={
            <ProtectedRoute>
              <Conversations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-coins"
          element={
            <ProtectedRoute>
              <PurchaseCoins />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route path="/review/:artisanId" element={<Review />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<div className="not-found">404 - Page Not Found</div>} />
      </Routes>
    </>
  );
}

export default App;