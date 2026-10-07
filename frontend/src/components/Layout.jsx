import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUploadUrl } from '../services/api';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineCurrencyDollar,
  HiOutlineClipboardList,
  HiOutlineCollection,
  HiOutlineUserGroup,
  HiOutlineClipboardCheck,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineChevronDown,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineDocumentReport,
  HiOutlineCube,
  HiOutlineInbox,
  HiOutlinePaperAirplane,
} from 'react-icons/hi';

const Layout = () => {
  const { user, logout, getRoleName, canView } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HiOutlineHome,
      show: true,
    },
    {
      name: 'Kelola User',
      href: '/users',
      icon: HiOutlineUsers,
      show: canView('users'),
    },
    {
      name: 'Keuangan',
      icon: HiOutlineCurrencyDollar,
      show: canView('finance'),
      children: [
        { name: 'Pemasukan', href: '/finance/income', icon: HiOutlineTrendingUp },
        { name: 'Pengeluaran', href: '/finance/expense', icon: HiOutlineTrendingDown },
        { name: 'Rekapitulasi', href: '/finance/recap', icon: HiOutlineDocumentReport },
      ],
    },
    {
      name: 'Pesanan',
      icon: HiOutlineClipboardList,
      show: canView('orders'),
      children: [
        { name: 'Pesanan Masuk', href: '/orders/in', icon: HiOutlineInbox },
        { name: 'Pesanan Keluar', href: '/orders/out', icon: HiOutlinePaperAirplane },
        { name: 'Rekapitulasi', href: '/orders/recap', icon: HiOutlineDocumentReport },
      ],
    },
    {
      name: 'Menu & Bahan',
      icon: HiOutlineCollection,
      show: canView('menu'),
      children: [
        { name: 'Daftar Menu', href: '/menu/list', icon: HiOutlineCollection },
        { name: 'Stok Bahan', href: '/menu/ingredients', icon: HiOutlineCube },
        { name: 'Rekapitulasi', href: '/menu/recap', icon: HiOutlineDocumentReport },
      ],
    },
    {
      name: 'SDM',
      icon: HiOutlineUserGroup,
      show: canView('hr'),
      children: [
        { name: 'Data Karyawan', href: '/hr/employees', icon: HiOutlineUserGroup },
      ],
    },
    {
      name: 'Log Aktivitas',
      href: '/activities',
      icon: HiOutlineClipboardCheck,
      show: canView('activities'),
    },
  ];

  useEffect(() => {
    navigation.forEach((item) => {
      if (item.children?.some((child) => location.pathname.startsWith(child.href))) {
        setOpenMenus((prev) => ({ ...prev, [item.name]: true }));
      }
    });
  }, [location.pathname]);

  const NavItem = ({ item }) => {
    if (!item.show) return null;

    if (item.children) {
      const isOpen = openMenus[item.name];
      return (
        <div>
          <button
            onClick={() => toggleMenu(item.name)}
            className="sidebar-link w-full justify-between"
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </div>
            <HiOutlineChevronDown
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isOpen && (
            <div className="ml-4 mt-1 space-y-1 animate-fade-in">
              {item.children.map((child) => (
                <NavLink
                  key={child.href}
                  to={child.href}
                  className={({ isActive }) =>
                    `sidebar-link pl-8 text-sm ${isActive ? 'active' : ''}`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <child.icon className="w-4 h-4" />
                  <span>{child.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        to={item.href}
        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      >
        <item.icon className="w-5 h-5" />
        <span>{item.name}</span>
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Catering</h1>
              <p className="text-xs text-slate-500">Management System</p>
            </div>
          </div>
          <button
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img
                  src={getUploadUrl(user.avatar)}
                  alt={user.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
              ) : (
                <span className="text-primary-700 font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{getRoleName(user?.role)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <NavLink
              to="/profile"
              className="flex-1 btn btn-secondary text-sm py-2"
              onClick={() => setSidebarOpen(false)}
            >
              <HiOutlineUser className="w-4 h-4 mr-1" />
              Profil
            </NavLink>
            <button
              onClick={handleLogout}
              className="btn btn-danger text-sm py-2 px-3"
            >
              <HiOutlineLogout className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-72">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <button
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <HiOutlineMenu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{getRoleName(user?.role)}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img
                  src={getUploadUrl(user.avatar)}
                  alt={user.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
              ) : (
                <span className="text-primary-700 font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

