import Login from "@/app/components/page/Login";
import SignUp from "./components/page/SignUp";
import Inventario from "@/app/components/page/Inventory";
import Pañol from "./components/page/Paniol";
import DepartmentsPage from "@/app/components/page/departments/DepartmentsPage";
import DepartmentDetailPage from "@/app/components/page/departments/[id]";
import ToolsPage from "@/app/components/page/Tools";
import { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes  } from "react-router-dom";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useAuthenticationStore } from "@/app/store/authentication";
import { useParams as useReactRouterParams } from "react-router-dom";
import { supabase } from "@/app/lib/supabaseClient";
import { Movements } from "./components/page/Movements";
import SearchPage from "./components/page/Search";
import { Info } from "./components/page/Info";
import Shop from "./components/page/Shop";


export default function App() {
   const { setSession } = useAuthenticationStore()
 
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) =>{
            if (data.session) {
                setSession(data.session)
            }
        })
    
    const {
        data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
    })

    return() => subscription.unsubscribe()
}, [setSession])

   

    return (
        <>
        <Router>

            <Routes>
                <Route path="/app" element={<Login />} />
                <Route path="/app/signup" element={<SignUp />} />

                {/* Protected route for the dashboard page */}
                 <Route
                    path="/app/paniol"
                    element={
                        <ProtectedRoute>
                            <Pañol/>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/app/shop"
                    element={
                        <ProtectedRoute>
                            <Shop/>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/app/inventario"
                    element={
                        <ProtectedRoute>
                            <Inventario />
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

                <Route path="/app/movements"
                    element={
                            <ProtectedRoute>
                                <Movements />
                            </ProtectedRoute>
                        }
                    />
                <Route path="/app/search" 
                        element={
                            <ProtectedRoute>
                              <SearchPage/>
                            </ProtectedRoute>
                        }
                    />
                <Route path="/app/info" 
                        element={
                            <ProtectedRoute>
                              <Info/>
                            </ProtectedRoute>
                        }
                    />
                
            </Routes>
        </Router>
    </>
    )
}