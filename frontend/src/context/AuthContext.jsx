import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data);
    } catch (error) {
      console.error('Fetch user error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      toast.success(`Selamat datang, ${userData.name}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login gagal';
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (data) => {
    try {
      const response = await api.post('/auth/register', data);
      toast.success('Registrasi berhasil! Silakan login.');
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Registrasi gagal';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      toast.success('Logout berhasil');
    }
  };

  const updateProfile = async (data) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      });

      const response = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setUser(response.data.data);
      toast.success('Profil berhasil diperbarui');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Gagal memperbarui profil';
      toast.error(message);
      return { success: false, message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password berhasil diubah');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Gagal mengubah password';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Role check helpers
  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role) || user.role === 'SUPER_ADMIN';
  };

  const canView = (module) => {
    if (!user) return false;
    if (module === 'users') return user.role === 'SUPER_ADMIN';
    if (user.role === 'SUPER_ADMIN' || user.role === 'PEMILIK') return true;
    
    const moduleRoles = {
      finance: ['ADMIN_KEUANGAN'],
      orders: ['ADMIN_CS'],
      menu: ['ADMIN_MENU'],
      hr: ['ADMIN_SDM'],
      users: ['SUPER_ADMIN'],
      activities: ['PEMILIK', 'SUPER_ADMIN'],
    };
    
    return moduleRoles[module]?.includes(user.role) || false;
  };

  const canEdit = (module) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.role === 'PEMILIK') return false; // Pemilik only view
    
    const moduleRoles = {
      finance: ['ADMIN_KEUANGAN'],
      orders: ['ADMIN_CS'],
      menu: ['ADMIN_MENU'],
      hr: ['ADMIN_SDM'],
      users: ['SUPER_ADMIN'],
    };
    
    return moduleRoles[module]?.includes(user.role) || false;
  };

  const getRoleName = (role) => {
    const roleNames = {
      PEMILIK: 'Pemilik',
      SUPER_ADMIN: 'Super Admin',
      ADMIN_KEUANGAN: 'Admin Keuangan',
      ADMIN_CS: 'Admin Customer Service',
      ADMIN_MENU: 'Admin Menu & Bahan',
      ADMIN_SDM: 'Admin SDM',
    };
    return roleNames[role] || role;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    hasRole,
    canView,
    canEdit,
    getRoleName,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

