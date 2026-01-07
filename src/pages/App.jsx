import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from './AuthContext';
import Header from './header.jsx';
import Body from './body.jsx';
import Services from './services.jsx';
import About from './about.jsx';
import Workers from './workers.jsx';
import Footer from './footer.jsx';
import Join from './join.jsx';
import SignIn from './signin.jsx';
import SignUp from './signup.jsx';
import Profile from './profile.jsx';
import ArtisanProfile from './artisanprofile.jsx';
import MatchingArtisansPage from './matching-artisans.jsx';
import PublicArtisanProfile from './PublicArtisanProfile.jsx';
import Chat from './chat.jsx';
import Conversations from './conversations.jsx';
import EditProfile from './editprofile.jsx';
import PurchaseCoins from './PurchaseCoins.jsx';
import Review from "./reviews.jsx";
import AdminDashboard from './AdminDashboard.jsx';
import Process from './process.jsx';
import Testimonials from './testimonials.jsx';
import Hero from './hero.jsx';
import Gallery from './gallery.jsx';

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


  if (loading) return <div className="loading">Loading...</div>;

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
          path="/artisan-profile/:id"
          element={
            <ProtectedRoute>
              <PublicArtisanProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:recipientId"
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