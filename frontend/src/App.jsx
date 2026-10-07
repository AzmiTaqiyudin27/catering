import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Users = lazy(() => import('./pages/Users'));
const Income = lazy(() => import('./pages/finance/Income'));
const Expense = lazy(() => import('./pages/finance/Expense'));
const FinanceRecap = lazy(() => import('./pages/finance/FinanceRecap'));
const OrdersIn = lazy(() => import('./pages/orders/OrdersIn'));
const OrdersOut = lazy(() => import('./pages/orders/OrdersOut'));
const OrdersRecap = lazy(() => import('./pages/orders/OrdersRecap'));
const Menus = lazy(() => import('./pages/menu/Menus'));
const Ingredients = lazy(() => import('./pages/menu/Ingredients'));
const IngredientsRecap = lazy(() => import('./pages/menu/IngredientsRecap'));
const Employees = lazy(() => import('./pages/hr/Employees'));
const Activities = lazy(() => import('./pages/Activities'));

const PageFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <LoadingSpinner text="Memuat halaman..." />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#f8fafc',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#f8fafc',
              },
            },
          }}
        />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              
              {/* User Management - Super Admin Only */}
              <Route path="users" element={<Users />} />
              
              {/* Finance */}
              <Route path="finance/income" element={<Income />} />
              <Route path="finance/expense" element={<Expense />} />
              <Route path="finance/recap" element={<FinanceRecap />} />
              
              {/* Orders */}
              <Route path="orders/in" element={<OrdersIn />} />
              <Route path="orders/out" element={<OrdersOut />} />
              <Route path="orders/recap" element={<OrdersRecap />} />
              
              {/* Menu & Ingredients */}
              <Route path="menu/list" element={<Menus />} />
              <Route path="menu/ingredients" element={<Ingredients />} />
              <Route path="menu/recap" element={<IngredientsRecap />} />
              
              {/* HR */}
              <Route path="hr/employees" element={<Employees />} />
              
              {/* Activity Logs */}
              <Route path="activities" element={<Activities />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

