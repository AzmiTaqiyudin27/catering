import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  HiOutlineCurrencyDollar,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineClipboardList,
  HiOutlineCollection,
  HiOutlineUserGroup,
  HiOutlineExclamation,
  HiOutlineArrowRight,
  HiOutlineChartBar,
  HiOutlineChartPie,
} from 'react-icons/hi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  PROCESSING: '#8b5cf6',
  DELIVERED: '#06b6d4',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
};

const Dashboard = () => {
  const { user, getRoleName, canView } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await reportsAPI.getDashboard();
      setData(response.data.data);
    } catch (error) {
      console.error('Fetch dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatShortCurrency = (amount) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)} jt`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)} rb`;
    }
    return `${amount}`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const stats = [
    {
      name: 'Pemasukan Bulan Ini',
      value: formatCurrency(data?.summary?.incomeThisMonth || 0),
      icon: HiOutlineTrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      show: canView('finance'),
      link: '/finance/income',
    },
    {
      name: 'Pengeluaran Bulan Ini',
      value: formatCurrency(data?.summary?.expenseThisMonth || 0),
      icon: HiOutlineTrendingDown,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      show: canView('finance'),
      link: '/finance/expense',
    },
    {
      name: 'Keuntungan',
      value: formatCurrency(data?.summary?.profit || 0),
      icon: HiOutlineCurrencyDollar,
      color: 'from-primary-500 to-primary-600',
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-600',
      show: canView('finance'),
      link: '/finance/recap',
    },
    {
      name: 'Pesanan Bulan Ini',
      value: data?.summary?.ordersThisMonth || 0,
      icon: HiOutlineClipboardList,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      show: canView('orders'),
      link: '/orders/in',
    },
    {
      name: 'Menu Tersedia',
      value: data?.summary?.totalMenus || 0,
      icon: HiOutlineCollection,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      show: canView('menu'),
      link: '/menu/list',
    },
    {
      name: 'Total Karyawan',
      value: data?.summary?.totalEmployees || 0,
      icon: HiOutlineUserGroup,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-600',
      show: canView('hr'),
      link: '/hr/employees',
    },
  ];

  const visibleStats = stats.filter((stat) => stat.show);

  // Format orders by status for Pie Chart
  const pieChartData = data?.ordersByStatus?.map((item) => ({
    name: item.status,
    value: item._count,
    color: STATUS_COLORS[item.status] || '#94a3b8',
  })) || [];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Selamat datang kembali, {user?.name}! 👋
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleStats.map((stat, index) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="stat-card group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center ${stat.textColor} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Lihat detail
              <HiOutlineArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Low Stock Alert */}
      {canView('menu') && data?.summary?.lowStockCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
            <HiOutlineExclamation className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800">Peringatan Stok Rendah</h3>
            <p className="text-amber-700 text-sm">
              Ada {data.summary.lowStockCount} bahan dengan stok di bawah batas minimum.
            </p>
          </div>
          <Link to="/menu/ingredients" className="btn btn-secondary text-sm">
            Lihat Detail
          </Link>
        </div>
      )}

      {/* Interactive Charts Section */}
      {(canView('finance') || canView('orders')) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cashflow Trend Chart */}
          {canView('finance') && (
            <div className={`card ${canView('orders') ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                    <HiOutlineChartBar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Tren Arus Kas (6 Bulan Terakhir)</h3>
                    <p className="text-xs text-slate-500">Perbandingan pemasukan, pengeluaran, dan laba bersih</p>
                  </div>
                </div>
                <Link to="/finance/recap" className="text-sm text-primary-600 hover:text-primary-700">
                  Lihat Rekap
                </Link>
              </div>
              <div className="p-4">
                {data?.monthlyCashflow?.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data.monthlyCashflow}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={12}
                          tickLine={false}
                          tickFormatter={formatShortCurrency}
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            formatCurrency(value),
                            name === 'income' ? 'Pemasukan' : name === 'expense' ? 'Pengeluaran' : 'Laba Bersih',
                          ]}
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            borderRadius: '10px',
                            border: 'none',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                        />
                        <Legend
                          formatter={(value) => (
                            <span className="text-xs text-slate-600 font-medium">
                              {value === 'income' ? 'Pemasukan' : value === 'expense' ? 'Pengeluaran' : 'Laba Bersih'}
                            </span>
                          )}
                        />
                        <Area
                          type="monotone"
                          dataKey="income"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorIncome)"
                        />
                        <Area
                          type="monotone"
                          dataKey="expense"
                          stroke="#ef4444"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorExpense)"
                        />
                        <Area
                          type="monotone"
                          dataKey="profit"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorProfit)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    Belum ada data keuangan untuk ditampilkan
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Orders Status Distribution */}
          {canView('orders') && (
            <div className={`card ${!canView('finance') ? 'lg:col-span-3' : 'lg:col-span-1'}`}>
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <HiOutlineChartPie className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Distribusi Pesanan</h3>
                    <p className="text-xs text-slate-500">Status pesanan terkini</p>
                  </div>
                </div>
                <Link to="/orders/in" className="text-sm text-primary-600 hover:text-primary-700">
                  Detail
                </Link>
              </div>
              <div className="p-4">
                {pieChartData.length > 0 ? (
                  <>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              borderRadius: '8px',
                              border: 'none',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                      {pieChartData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-2 text-xs">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-slate-600 font-medium truncate">{entry.name}:</span>
                          <span className="text-slate-900 font-bold ml-auto">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    Belum ada data pesanan
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        {canView('orders') && (
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Pesanan Masuk Terbaru</h3>
              <Link to="/orders/in" className="text-sm text-primary-600 hover:text-primary-700">
                Lihat Semua
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {data?.recentOrders?.length > 0 ? (
                data.recentOrders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{order.orderNumber}</p>
                        <p className="text-sm text-slate-500">{order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900">
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <span className={`badge ${
                          order.status === 'COMPLETED' ? 'badge-success' :
                          order.status === 'PENDING' ? 'badge-warning' :
                          order.status === 'CANCELLED' ? 'badge-danger' :
                          'badge-info'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  Belum ada pesanan
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        {canView('activities') && (
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Log Aktivitas Terbaru</h3>
              <Link to="/activities" className="text-sm text-primary-600 hover:text-primary-700">
                Lihat Semua
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {data?.recentActivities?.length > 0 ? (
                data.recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 flex-shrink-0">
                        {activity.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 truncate">{activity.description}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {activity.user?.name} • {format(new Date(activity.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  Belum ada aktivitas
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Role Info for non-admin users */}
      {!canView('activities') && (
        <div className="p-6 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl text-white shadow-lg">
          <h3 className="text-xl font-bold mb-2">Halo, {user?.name}!</h3>
          <p className="text-white/80 mb-4">
            Anda login sebagai <strong>{getRoleName(user?.role)}</strong>.
            Gunakan navigasi cepat berikut untuk mengakses modul kerja Anda:
          </p>
          <div className="flex flex-wrap gap-2">
            {canView('finance') && (
              <Link to="/finance/income" className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors font-medium">
                Kelola Keuangan
              </Link>
            )}
            {canView('orders') && (
              <Link to="/orders/in" className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors font-medium">
                Kelola Pesanan
              </Link>
            )}
            {canView('menu') && (
              <Link to="/menu/list" className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors font-medium">
                Kelola Menu & Bahan
              </Link>
            )}
            {canView('hr') && (
              <Link to="/hr/employees" className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors font-medium">
                Kelola Karyawan
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
