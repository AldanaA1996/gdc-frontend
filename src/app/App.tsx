import Login from "./components/page/Login";
import Dashboard from "./components/page/Dashboard";
import { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes  } from "react-router";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthenticationStore } from "./store/authentication";

export default function App() {
    const token = useAuthenticationStore((state) => state.token)
    const [isAuthenticated, setIsAuthenticated] = useState(!!token)

    useEffect(() => {
        setIsAuthenticated(!!token)
    }
    , [token])

    return (
        <Router>
            <Routes>
                <Route path="/app" element={<Login />} />

                {/* Protected route for the dashboard page */}
                <Route path="/app/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>} />
                {/* Add other routes here */}
            </Routes>
        </Router>
    )
}