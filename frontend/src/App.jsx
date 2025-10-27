import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SplashScreen from './components/SplashScreen'
import { Box } from '@mui/material'
import './App.css'
import { supabase } from './utils/supabaseClient'
import { ChatProvider } from './contexts/ChatContext'

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
const SellerChatPage = lazy(() => import('./pages/chat/SellerChatPage'))

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
const CustomerChatPage = lazy(() => import('./pages/chat/CustomerChatPage'))

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
        <ChatProvider>
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

            {/* Seller Routes */}
            <Route path="/seller/dashboard" element={<DashboardPage />} />
            <Route path="/seller/add-product" element={<AddProductPage />} />
            <Route path="/seller/product-list" element={<ProductList />} />
            <Route path="/seller/store-settings" element={<StoreSettings />} />
            <Route path="/seller/manage-orders" element={<OrdersPage />} />
            <Route path="/seller/profile" element={<ProfilePage />} />
            <Route path="/seller/settings" element={<SellerSettingsPage />} />
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
            
            {/* Chat Routes */}
            <Route path="/customer/chat" element={<CustomerLayout><CustomerChatPage /></CustomerLayout>} />
            <Route path="/customer/chat/:conversationId" element={<CustomerLayout><CustomerChatPage /></CustomerLayout>} />
            
            {/* Seller Chat Routes */}
            <Route path="/seller/chat" element={<SellerLayout><SellerChatPage /></SellerLayout>} />
            <Route path="/seller/chat/:conversationId" element={<SellerLayout><SellerChatPage /></SellerLayout>} />
          </Routes>
          </Suspense>
        </ChatProvider>
      </Router>
    </div>
  )
}

export default App
