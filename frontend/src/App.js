import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './auth/loginPage.js'
import RegisterPage from './auth/registerPage.js'
import SellerDashboard from './seller/SellerDashboard.jsx'
import CustomerDashboard from './customer/CustomerDashboard.jsx'
import Cart from './customer/Cart.jsx'
import Orders from './customer/Orders.jsx'

// Private route wrapper component
const PrivateRoute = ({ element, allowedRole }) => {
  const isAuthenticated = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check if user has the allowed role
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'Seller' ? '/seller-dashboard' : '/customer-dashboard'} />;
  }

  return element;
};

function App() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const defaultRoute = user.role === 'Seller' ? '/seller-dashboard' : '/customer-dashboard';

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Seller routes */}
        <Route 
          path="/seller-dashboard" 
          element={<PrivateRoute element={<SellerDashboard />} allowedRole="Seller" />} 
        />

        {/* Customer routes */}
        <Route 
          path="/customer-dashboard" 
          element={<PrivateRoute element={<CustomerDashboard />} allowedRole="Customer" />} 
        />
        <Route 
          path="/cart" 
          element={<PrivateRoute element={<Cart />} allowedRole="Customer" />} 
        />
        <Route 
          path="/orders" 
          element={<PrivateRoute element={<Orders />} allowedRole="Customer" />} 
        />

        {/* Default redirect */}
        <Route 
          path="/" 
          element={<Navigate to={localStorage.getItem('token') ? defaultRoute : '/login'} />} 
        />
      </Routes>
    </Router>
  )
}

export default App
