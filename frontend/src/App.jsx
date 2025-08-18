import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './auth/loginPage'
import RegisterPage from './auth/registerPage'
import ForgotPasswordPage from './auth/ForgotPasswordPage'
import ResetPasswordConfirmationPage from './auth/ResetPasswordConfirmationPage'
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
import AnalyticsPage from './seller/AnalyticsPage'
// Customer imports
import HomePage from './customer/HomePage'
import ProductPage from './customer/ProductPage'
import CartPage from './customer/CartPage'
import CustomerOrdersPage from './customer/OrdersPage'
import SingleProductPage from './customer/SingleProductPage'
import CustomerProfilePage from './customer/ProfilePage'
import OrderSummaryPage from './customer/OrderSummaryPage'
import SuccessOrderMessagePage from './customer/SuccessOrderMessagePage'
import SettingsPage from './customer/SettingsPage'
import StoresPage from './customer/StoresPage'
import StoreDetailPage from './customer/StoreDetailPage'
import ViewMyOrder from './customer/ViewMyOrder'
import FavoritesPage from './customer/FavoritesPage'
import GCashCallback from './customer/GCashCallback'
import { Box } from '@mui/material'
import './App.css'

const CustomerLayout = ({ children }) => (
  <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
    {children}
  </Box>
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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordConfirmationPage />} />

          {/* Seller Routes */}
          <Route path="/seller/dashboard" element={<DashboardPage />} />
          <Route path="/seller/add-product" element={<AddProductPage />} />
          <Route path="/seller/product-list" element={<ProductList />} />
          <Route path="/seller/store-settings" element={<StoreSettings />} />
          <Route path="/seller/manage-orders" element={<OrdersPage />} />
          <Route path="/seller/profile" element={<ProfilePage />} />
          <Route path="/seller/product/:productId" element={<SellerProductDetailPage />} />
          <Route path="/seller/edit-product/:productId" element={<EditProductPage />} />
          <Route path="/seller/analytics" element={<AnalyticsPage />} />

          {/* Customer Routes */}
          <Route path="/customer/home" element={<CustomerLayout><HomePage /></CustomerLayout>} />
          <Route path="/customer/profile" element={<CustomerLayout><CustomerProfilePage /></CustomerLayout>} />
          <Route path="/customer/settings" element={<CustomerLayout><SettingsPage /></CustomerLayout>} />
          <Route path="/customer/stores" element={<CustomerLayout><StoresPage /></CustomerLayout>} />
          <Route path="/customer/store/:storeId" element={<CustomerLayout><StoreDetailPage /></CustomerLayout>} />
          <Route path="/customer/cart" element={<CustomerLayout><CartPage /></CustomerLayout>} />
          <Route path="/customer/orders" element={<CustomerLayout><CustomerOrdersPage /></CustomerLayout>} />
          <Route path="/customer/order-summary" element={<CustomerLayout><OrderSummaryPage /></CustomerLayout>} />
          <Route path="/customer/success-order" element={<CustomerLayout><SuccessOrderMessagePage /></CustomerLayout>} />
          <Route path="/customer/product/:productId" element={<CustomerLayout><SingleProductPage /></CustomerLayout>} />
          <Route path="/customer/products" element={<CustomerLayout><ProductPage /></CustomerLayout>} />
          <Route path="/customer/view-my-order" element={<CustomerLayout><ViewMyOrder /></CustomerLayout>} />
          <Route path="/customer/favorites" element={<CustomerLayout><FavoritesPage /></CustomerLayout>} />
          <Route path="/gcash-callback" element={<GCashCallback />} />

          {/* Redirects for root-level customer routes to /customer/* */}
          <Route path="/home" element={<CustomerLayout><HomePage /></CustomerLayout>} />
          <Route path="/profile" element={<CustomerLayout><CustomerProfilePage /></CustomerLayout>} />
          <Route path="/settings" element={<CustomerLayout><SettingsPage /></CustomerLayout>} />
          <Route path="/stores" element={<CustomerLayout><StoresPage /></CustomerLayout>} />
          <Route path="/store/:storeId" element={<CustomerLayout><StoreDetailPage /></CustomerLayout>} />
          <Route path="/cart" element={<CustomerLayout><CartPage /></CustomerLayout>} />
          <Route path="/orders" element={<CustomerLayout><CustomerOrdersPage /></CustomerLayout>} />
          <Route path="/product/:productId" element={<CustomerLayout><SingleProductPage /></CustomerLayout>} />
          <Route path="/products" element={<CustomerLayout><ProductPage /></CustomerLayout>} />
          <Route path="/favorites" element={<CustomerLayout><FavoritesPage /></CustomerLayout>} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
