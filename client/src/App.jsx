import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Login from './views/Login';
import Register from './views/Register';
import CustomerDashboard from './views/CustomerDashboard';
import RetailerDashboard from './views/RetailerDashboard';
import HomePage from './views/HomePage';
import RoleSelection from './views/RoleSelection';
import Navbar from './components/Navbar';

const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login-role" />;
    if (role && user.role !== role) return <Navigate to="/" />;
    return children;
};

const AppContent = () => {
    const { user } = useContext(AuthContext);

    return (
        <Router>
            <Navbar />
            <main style={{ padding: user ? (['retailer', 'customer'].includes(user.role) ? '0' : '2rem 0') : '0' }}>
                <div className={user && !['retailer', 'customer'].includes(user.role) ? "container" : ""}>
                <Routes>
                    <Route path="/" element={!user ? <HomePage /> : <Navigate to={user.role === 'retailer' ? '/retailer' : '/customer'} />} />
                    <Route path="/login-role" element={!user ? <RoleSelection /> : <Navigate to={user.role === 'retailer' ? '/retailer' : '/customer'} />} />
                    <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'retailer' ? '/retailer' : '/customer'} />} />
                    <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'retailer' ? '/retailer' : '/customer'} />} />

                    <Route path="/customer/*" element={
                        <ProtectedRoute role="customer">
                            <CustomerDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/retailer/*" element={
                        <ProtectedRoute role="retailer">
                            <RetailerDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                </div>
            </main>
        </Router>
    );
};

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
