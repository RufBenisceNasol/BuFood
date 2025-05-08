import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './auth/loginPage'
import RegisterPage from './auth/registerPage'
import SplashScreen from './components/SplashScreen'
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
import CustomerProfilePage from './customer/ProfilePage'
import FavoritesPage from './customer/FavoritesPage'
import SettingsPage from './customer/SettingsPage'
import StoresPage from './customer/StoresPage'
import { Box } from '@mui/material'
import './App.css'

const CustomerLayout = ({ children }) => (
  <>
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
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

          {/* Seller Routes */}
          <Route path="/seller/dashboard" element={<DashboardPage />} />
          <Route path="/seller/add-product" element={<AddProductPage />} />
          <Route path="/seller/product-list" element={<ProductList />} />
          <Route path="/seller/store-settings" element={<StoreSettings />} />
          <Route path="/seller/manage-orders" element={<OrdersPage />} />
          <Route path="/seller/profile" element={<ProfilePage />} />
          <Route path="/seller/product/:productId" element={<SellerProductDetailPage />} />
          <Route path="/seller/edit-product/:productId" element={<EditProductPage />} />

          {/* Customer Routes - Both with and without /customer prefix */}
          
          {/* Home Routes */}
          <Route path="/home" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <HomePage />
            </Box>
          } />
          <Route path="/customer/home" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <HomePage />
            </Box>
          } />
          
          {/* Profile Routes */}
          <Route path="/profile" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <CustomerProfilePage />
            </Box>
          } />
          <Route path="/customer/profile" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <CustomerProfilePage />
            </Box>
          } />
          
          {/* Favorites Routes */}
          <Route path="/favorites" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <FavoritesPage />
            </Box>
          } />
          <Route path="/customer/favorites" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <FavoritesPage />
            </Box>
          } />
          
          {/* Settings Routes */}
          <Route path="/settings" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <SettingsPage />
            </Box>
          } />
          <Route path="/customer/settings" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <SettingsPage />
            </Box>
          } />
          
          {/* Stores Routes */}
          <Route path="/stores" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <StoresPage />
            </Box>
          } />
          <Route path="/customer/stores" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <StoresPage />
            </Box>
          } />
          
          {/* Cart Routes */}
          <Route path="/cart" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <CartPage />
            </Box>
          } />
          <Route path="/customer/cart" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <CartPage />
            </Box>
          } />
          
          {/* Orders Routes */}
          <Route path="/orders" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <CustomerOrdersPage />
            </Box>
          } />
          <Route path="/customer/orders" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <CustomerOrdersPage />
            </Box>
          } />
          
          {/* Product Routes */}
          <Route path="/product/:productId" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <SingleProductPage />
            </Box>
          } />
          <Route path="/customer/product/:productId" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <SingleProductPage />
            </Box>
          } />
          
          {/* Products Category/List Route */}
          <Route path="/products" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <ProductPage />
            </Box>
          } />
          <Route path="/customer/products" element={
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
              <ProductPage />
            </Box>
          } />
        </Routes>
      </Router>
    </div>
  )
}

export default App
