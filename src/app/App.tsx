import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '@/app/components/page/Login';
import Home from '@/app/components/page/HomePage';
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
                <Home />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
