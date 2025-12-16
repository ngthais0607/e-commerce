import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { useAuthStore } from './store/authStore';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentFailedPage = lazy(() => import('./pages/PaymentFailedPage'));
const MockPaymentPage = lazy(() => import('./pages/MockPaymentPage'));
const BankTransferPage = lazy(() => import('./pages/BankTransferPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));

// Admin pages - lazy loaded
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminCouponForm = lazy(() => import('./pages/admin/AdminCouponForm'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'));
const StaffDashboard = lazy(() => import('./pages/admin/StaffDashboard'));

function AdminHome() {
  const { user } = useAuthStore();

  if (user?.role === 'STAFF') {
    return <StaffDashboard />;
  }

  return <AdminDashboard />;
}

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="product/:slug" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route
            path="checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ProtectedRoute>
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="contact" element={<ContactPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="privacy" element={<PrivacyPolicyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="payment/success" element={<PaymentSuccessPage />} />
          <Route path="payment/failed" element={<PaymentFailedPage />} />
          <Route path="payment/momo" element={<MockPaymentPage />} />
          <Route path="payment/zalopay" element={<MockPaymentPage />} />
          <Route
            path="payment/bank"
            element={
              <ProtectedRoute>
                <BankTransferPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin & Staff Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole={['ADMIN', 'STAFF']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHome />} />
          <Route
            path="products"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="products/new"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminProductForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="products/:id/edit"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminProductForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ProtectedRoute requiredRole={['ADMIN', 'STAFF']}>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders/:id"
            element={
              <ProtectedRoute requiredRole={['ADMIN', 'STAFF']}>
                <AdminOrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="coupons"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminCoupons />
              </ProtectedRoute>
            }
          />
          <Route
            path="coupons/new"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminCouponForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="coupons/:code/edit"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminCouponForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="support"
            element={
              <ProtectedRoute requiredRole="STAFF">
                <AdminSupport />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;

