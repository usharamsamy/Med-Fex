import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Login from './views/Login';
import Register from './views/Register';
import CustomerDashboard from './views/CustomerDashboard';
import RetailerDashboard from './views/RetailerDashboard';
import Navbar from './components/Navbar';

const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (role && user.role !== role) return <Navigate to="/" />;
    return children;
};

const AppContent = () => {
    const { user } = useContext(AuthContext);

    return (
        <Router>
            {user && <Navbar />}
            <main className="container" style={{ padding: '2rem 0' }}>
                <Routes>
                    <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'retailer' ? '/retailer' : '/customer'} />} />
                    <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'retailer' ? '/retailer' : '/customer'} />} />

                    <Route path="/customer" element={
                        <ProtectedRoute role="customer">
                            <CustomerDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/retailer" element={
                        <ProtectedRoute role="retailer">
                            <RetailerDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/" element={<Navigate to={user ? (user.role === 'retailer' ? '/retailer' : '/customer') : '/login'} />} />
                </Routes>
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
