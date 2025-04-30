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
import ProfilePage from './seller/ProfilePage'
import SellerProductDetailPage from './seller/SellerProductDetailPage'
import EditProductPage from './seller/EditProductPage'
// Customer imports
import HomePage from './customer/HomePage'
import ProductPage from './customer/ProductPage'
import CartPage from './customer/CartPage'
import CustomerOrdersPage from './customer/OrdersPage'
import SingleProductPage from './customer/SingleProductPage'
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


          {/* Seller Routes - without Navbar */}
          <Route path="/seller/dashboard" element={<DashboardPage />} />
          <Route path="/seller/add-product" element={<AddProductPage />} />
          <Route path="/seller/product-list" element={<ProductList />} />
          <Route path="/seller/store-settings" element={<StoreSettings />} />
          <Route path="/seller/manage-orders" element={<OrdersPage />} />
          <Route path="/seller/profile" element={<ProfilePage />} />
          <Route path="/seller/product/:productId" element={<SellerProductDetailPage />} />
          <Route path="/seller/edit-product/:productId" element={<EditProductPage />} />

          {/* Customer Routes - with Navbar */}
          <Route path="/customer" element={<CustomerLayout />}>
            <Route path="home" element={<HomePage />} />
            <Route path="product/:id" element={<ProductPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="orders" element={<CustomerOrdersPage />} />
          </Route>

          {/* Single Product Route */}
          <Route path="/product/:productId" element={<SingleProductPage />} />
          
        </Routes>
      </Router>
    </div>
  )
}

export default App
