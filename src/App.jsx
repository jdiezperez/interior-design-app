import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import Locations from './pages/Locations';
import Furniture from './pages/Furniture';
import Styles from './pages/Styles';
import Projects from './pages/Projects';
import Credits from './pages/Credits';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="team" element={<Team />} />
                    <Route path="locations" element={<Locations />} />
                    <Route path="furniture" element={<Furniture />} />
                    <Route path="styles" element={<Styles />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="credits" element={<Credits />} />
                </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
