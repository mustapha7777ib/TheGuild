import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import App from '../pages/App.jsx';
import ErrorBoundary from './ErrorBoundary';
import '../pages/header.css';
import '../pages/signin.css';
import '../pages/signup.css';
import '../pages/workers.css';
import '../pages/profile.css';
import '../pages/artisanprofile.css'
import '../pages/body.css';
import '../pages/PurchaseCoins.css'
import '../pages/conversations.css'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

