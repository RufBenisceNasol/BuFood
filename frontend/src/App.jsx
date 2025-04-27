import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './auth/loginPage'
import RegisterPage from './auth/registerPage'
import SplashScreen from './components/SplashScreen'
import Navbar from './components/Navbar'
import CustomerNavbar from './components/CustomerNavbar'
// Seller imports
import DashboardPage from './seller/DashboardPage'
import AddProductPage from './seller/AddProductPage'
import ProductList from './seller/ProductList'
import StoreSettings from './seller/StoreSettings'
import OrdersPage from './seller/OrdersPage'
// Customer imports
import HomePage from './customer/HomePage'
import ProductPage from './customer/ProductPage'
import CartPage from './customer/CartPage'
import CustomerOrdersPage from './customer/OrdersPage'
import { Box } from '@mui/material'
import './App.css'

const CustomerLayout = ({ children }) => (
  <>
    <CustomerNavbar />
    <Box sx={{ mt: '64px', minHeight: 'calc(100vh - 64px)', bgcolor: '#f5f5f5' }}>
      {children}
    </Box>
  </>
);

function App() {
  return (
    <div className="app-container">
      <Router>
        <Routes>
          {/* Auth and Splash Routes */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Seller Routes - with Navbar */}
          <Route path="/seller/*" element={
            <>
              <Navbar />
              <Routes>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="add-product" element={<AddProductPage />} />
                <Route path="product-list" element={<ProductList />} />
                <Route path="store-settings" element={<StoreSettings />} />
                <Route path="manage-orders" element={<OrdersPage />} />
              </Routes>
            </>
          } />

          {/* Customer Routes - with CustomerNavbar */}
          <Route path="/home" element={<CustomerLayout><HomePage /></CustomerLayout>} />
          <Route path="/store/:id" element={<CustomerLayout><ProductPage /></CustomerLayout>} />
          <Route path="/cart" element={<CustomerLayout><CartPage /></CustomerLayout>} />
          <Route path="/orders" element={<CustomerLayout><CustomerOrdersPage /></CustomerLayout>} />
          <Route path="/product/:id" element={<CustomerLayout><ProductPage /></CustomerLayout>} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
