import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Login from "./components/page/Login";
import Home from "./components/page/HomePage";
import { useEffect, useState } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthenticationStore } from "./store/authentication";

export default function App() {
  const token = useAuthenticationStore((state) => state.token);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  useEffect(() => {
    setIsAuthenticated(!!token);
  }, [token]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
