import Login from "./components/page/Login";
import Dashboard from "./components/page/Dashboard";
import DepartmentsPage from "./components/page/departments/DepartmentsPage";
import DepartmentDetailPage from "./components/page/departments/[documentId]";
import ToolsPage from "./components/page/Tools";
import { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes  } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthenticationStore } from "./store/authentication";
import { useParams as useReactRouterParams } from "react-router-dom";


export default function App() {
    const token = useAuthenticationStore((state) => state.token)
    const [isAuthenticated, setIsAuthenticated] = useState(!!token)
    const { documentId } = useReactRouterParams();

    useEffect(() => {
        setIsAuthenticated(!!token)
    }
    , [token])

   

    return (
        <Router>
            <Routes>
                <Route path="/app" element={<Login />} />
              

                {/* Protected route for the dashboard page */}
                
                <Route path="/app/dashboard" 
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                 
                    />
                <Route path="/app/departments" 
                        element={
                            <ProtectedRoute>
                                <DepartmentsPage />
                            </ProtectedRoute>
                        }
                    />
                <Route path="/app/departments/:documentId" 
                        element={
                            <ProtectedRoute>
                              <DepartmentDetailPage/>
                            </ProtectedRoute>
                        }
                    />

                <Route path="/app/addTool"
                    element={
                            <ProtectedRoute>
                                <ToolsPage />
                            </ProtectedRoute>
                        }
                    />
                
            </Routes>
        </Router>
    )
}