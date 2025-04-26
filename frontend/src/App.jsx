import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './auth/loginPage'
import RegisterPage from './auth/registerPage'
import SplashScreen from './components/SplashScreen'
import DashboardPage from './seller/DashboardPage'
import AddProductPage from './seller/AddProductPage'
import ProductList from './seller/ProductList'
import StoreSettings from './seller/StoreSettings'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Seller Routes */}
          <Route path="/seller/dashboard" element={<DashboardPage />} />
          <Route path="/seller/add-product" element={<AddProductPage />} />
          <Route path="/seller/product-list" element={<ProductList />} />
          <Route path="/seller/store-settings" element={<StoreSettings />} />
          {/* <Route path="/seller/manage-orders" element={<DashboardPage />} /> */}
          {/* <Route path="/seller/profile" element={<ProfilePage />} /> */}
        </Routes>
      </Router>
    </div>
  )
}

export default App
