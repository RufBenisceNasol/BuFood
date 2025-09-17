import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SplashScreen from './components/SplashScreen'
import { Box } from '@mui/material'
import './App.css'

// Lazy-loaded routes (code splitting)
const LoginPage = lazy(() => import('./auth/loginPage'))
const RegisterPage = lazy(() => import('./auth/registerPage'))
const ForgotPasswordPage = lazy(() => import('./auth/ForgotPasswordPage'))
const ResetPasswordConfirmationPage = lazy(() => import('./auth/ResetPasswordConfirmationPage'))
const VerifyEmailPage = lazy(() => import('./auth/VerifyEmailPage'))

// Seller
const DashboardPage = lazy(() => import('./seller/DashboardPage'))
const AddProductPage = lazy(() => import('./seller/AddProductPage'))
const ProductList = lazy(() => import('./seller/ProductList'))
const StoreSettings = lazy(() => import('./seller/StoreSettings'))
const OrdersPage = lazy(() => import('./seller/OrdersPage'))
const ProfilePage = lazy(() => import('./seller/ProfilePage'))
const SellerProductDetailPage = lazy(() => import('./seller/SellerProductDetailPage'))
const EditProductPage = lazy(() => import('./seller/EditProductPage'))
const AnalyticsPage = lazy(() => import('./seller/AnalyticsPage'))

// Customer
const HomePage = lazy(() => import('./customer/HomePage'))
const ProductPage = lazy(() => import('./customer/ProductPage'))
const CartPage = lazy(() => import('./customer/CartPage'))
const CustomerOrdersPage = lazy(() => import('./customer/OrdersPage'))
const SingleProductPage = lazy(() => import('./customer/SingleProductPage'))
const CustomerProfilePage = lazy(() => import('./customer/ProfilePage'))
const OrderSummaryPage = lazy(() => import('./customer/OrderSummaryPage'))
const SuccessOrderMessagePage = lazy(() => import('./customer/SuccessOrderMessagePage'))
const SettingsPage = lazy(() => import('./customer/SettingsPage'))
const StoresPage = lazy(() => import('./customer/StoresPage'))
const StoreDetailPage = lazy(() => import('./customer/StoreDetailPage'))
const ViewMyOrder = lazy(() => import('./customer/ViewMyOrder'))
const FavoritesPage = lazy(() => import('./customer/FavoritesPage'))
const GCashCallback = lazy(() => import('./customer/GCashCallback'))

const CustomerLayout = ({ children }) => (
  <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
    {children}
  </Box>
);

function App() {
  return (
    <div className="app-container">
      <Router>
        <Suspense fallback={<div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>}>
          <Routes>
            {/* Auth and Splash Routes */}
            <Route path="/" element={<SplashScreen />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordConfirmationPage />} />
            <Route path="/verify/:token" element={<VerifyEmailPage />} />

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
        </Suspense>
      </Router>
    </div>
  )
}

export default App
