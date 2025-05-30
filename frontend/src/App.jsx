import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import FileUpload from './pages/FileUpload'
import Search from './pages/Search'

// Protected Route component with better error handling
const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if token exists and is valid
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Basic token validation (check if it's not expired)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp > currentTime) {
          setIsAuthenticated(true);
        } else {
          // Token is expired, remove it
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Invalid token format, remove it
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    // Show loading spinner instead of black screen
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="relative">
          {/* Background elements */}
          <div className="absolute inset-0 bg-white/60 backdrop-blur-3xl rounded-2xl"></div>
          
          <div className="relative z-10 text-center p-12">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg animate-pulse">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <div className="space-y-3">
              <svg className="animate-spin mx-auto h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              
              <h3 className="text-lg font-semibold text-gray-900">Loading...</h3>
              <p className="text-sm text-gray-600 max-w-sm">
                Initializing Cross-Reference Database System
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <div className="App min-h-screen">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/upload" element={
          <ProtectedRoute>
            <FileUpload />
          </ProtectedRoute>
        } />
        <Route path="/search" element={
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        } />
        {/* Redirect authenticated users to upload by default */}
        <Route path="/" element={
          localStorage.getItem('token') ? 
            <Navigate to="/upload" replace /> : 
            <Navigate to="/login" replace />
        } />
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
