import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SplashScreen from './components/SplashScreen'
import { Box } from '@mui/material'
import './App.css'
import { supabase } from './supabaseClient'
import ProtectedRoute, { SellerRoute, CustomerRoute } from './components/ProtectedRoute'
import useSupabaseAxiosSync from './hooks/useSupabaseAxiosSync'

// Lazy-loaded routes (code splitting)
const LoginPage = lazy(() => import('./auth/loginPage'))
const RegisterPage = lazy(() => import('./auth/registerPage'))
const ForgotPasswordPage = lazy(() => import('./auth/ForgotPasswordPage'))
const ResetPasswordConfirmationPage = lazy(() => import('./auth/ResetPasswordConfirmationPage'))
const VerifyEmailPage = lazy(() => import('./auth/VerifyEmailPage'))
const SupabaseResetPasswordPage = lazy(() => import('./auth/SupabaseResetPasswordPage'))
const SupabaseVerifyPage = lazy(() => import('./auth/SupabaseVerifyPage'))

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
const SellerSettingsPage = lazy(() => import('./seller/SellerSettingsPage'))
// Chat pages removed

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
// Chat pages removed

const CustomerLayout = ({ children }) => (
  <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
    {children}
  </Box>
);

const SellerLayout = ({ children }) => (
  <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
    {children}
  </Box>
);

function App() {
  useSupabaseAxiosSync();
  // Keep token updated automatically
  React.useEffect(() => {
    // Seed current token on first load
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const tok = data?.session?.access_token;
        if (tok) localStorage.setItem('access_token', tok);
      } catch {}
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token) {
        localStorage.setItem('access_token', session.access_token)
      } else {
        localStorage.removeItem('access_token')
      }
    })
    return () => {
      sub?.subscription?.unsubscribe?.()
    }
  }, [])
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
            {/* Route all verify links to SupabaseVerifyPage (Supabase tokens come via hash/query) */}
            <Route path="/verify" element={<SupabaseVerifyPage />} />
            <Route path="/verify/:token" element={<SupabaseVerifyPage />} />

            {/* Seller Routes (protected) */}
            <Route path="/seller/dashboard" element={<SellerRoute><SellerLayout><DashboardPage /></SellerLayout></SellerRoute>} />
            <Route path="/seller/add-product" element={<SellerRoute><SellerLayout><AddProductPage /></SellerLayout></SellerRoute>} />
            <Route path="/seller/product-list" element={<SellerRoute><SellerLayout><ProductList /></SellerLayout></SellerRoute>} />
            <Route path="/seller/store-settings" element={<SellerRoute><SellerLayout><StoreSettings /></SellerLayout></SellerRoute>} />
            <Route path="/seller/manage-orders" element={<SellerRoute><SellerLayout><OrdersPage /></SellerLayout></SellerRoute>} />
            <Route path="/seller/profile" element={<SellerRoute><SellerLayout><ProfilePage /></SellerLayout></SellerRoute>} />
            <Route path="/seller/settings" element={<SellerRoute><SellerLayout><SellerSettingsPage /></SellerLayout></SellerRoute>} />
            <Route path="/seller/product/:productId" element={<SellerRoute><SellerLayout><SellerProductDetailPage /></SellerLayout></SellerRoute>} />
            <Route path="/seller/edit-product/:productId" element={<SellerRoute><SellerLayout><EditProductPage /></SellerLayout></SellerRoute>} />
            <Route path="/seller/analytics" element={<SellerRoute><SellerLayout><AnalyticsPage /></SellerLayout></SellerRoute>} />

            {/* Customer Routes (protected) */}
            <Route path="/customer/home" element={<CustomerRoute><CustomerLayout><HomePage /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/profile" element={<CustomerRoute><CustomerLayout><CustomerProfilePage /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/settings" element={<CustomerRoute><CustomerLayout><SettingsPage /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/stores" element={<CustomerRoute><CustomerLayout><StoresPage /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/store/:storeId" element={<CustomerRoute><CustomerLayout><StoreDetailPage /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/cart" element={<CustomerRoute><CustomerLayout><CartPage /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/orders" element={<CustomerRoute><CustomerLayout><CustomerOrdersPage /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/order-summary" element={<CustomerRoute><CustomerLayout><OrderSummaryPage /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/success-order" element={<CustomerRoute><CustomerLayout><SuccessOrderMessagePage /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/product/:productId" element={<CustomerRoute><CustomerLayout><SingleProductPage /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/products" element={<CustomerRoute><CustomerLayout><ProductPage /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/view-my-order" element={<CustomerRoute><CustomerLayout><ViewMyOrder /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/favorites" element={<CustomerRoute><CustomerLayout><FavoritesPage /></CustomerLayout></CustomerRoute>} />
            <Route path="/gcash-callback" element={<GCashCallback />} />
            <Route path="/supabase-reset" element={<SupabaseResetPasswordPage />} />
            <Route path="/verified" element={<SupabaseVerifyPage />} />

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
            
            {/* Chat routes removed */}
          </Routes>
        </Suspense>
      </Router>
    </div>
  )
}

export default App
