import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

import React from 'react';
import { AuthProvider } from './Authcontext.jsx';
import { AdminAuthProvider } from './AdminAuthContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
    <AuthProvider>
      <AdminAuthProvider>
    <App/>
    </AdminAuthProvider>
    </AuthProvider>
    </BrowserRouter>
    
    </React.StrictMode>
)