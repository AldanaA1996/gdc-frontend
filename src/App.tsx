import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '@/features/auth/pages/Login';
import Dashboard from '@/features/dashboard/pages/Dashboard';
import PrivateRoute from '@/routes/PrivateRoute';
import { AuthProvider } from '@/features/auth/context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
