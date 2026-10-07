import { useState, useEffect } from 'react';
import { ordersInAPI, ordersOutAPI, reportsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  HiOutlineInbox,
  HiOutlinePaperAirplane,
  HiOutlineDownload,
  HiOutlineCalendar,
  HiOutlineDocumentReport,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const OrdersRecap = () => {
  const [loading, setLoading] = useState(true);
  const [ordersInSummary, setOrdersInSummary] = useState(null);
  const [ordersOutSummary, setOrdersOutSummary] = useState(null);
  const [dateFilter, setDateFilter] = useState({
    start: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  const COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444'];

  useEffect(() => {
    fetchSummary();
  }, [dateFilter]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const params = { startDate: dateFilter.start, endDate: dateFilter.end };
      const [inRes, outRes] = await Promise.all([
        ordersInAPI.getSummary(params),
        ordersOutAPI.getSummary(params),
      ]);
      setOrdersInSummary(inRes.data.data);
      setOrdersOutSummary(outRes.data.data);
    } catch (error) {
      toast.error('Gagal memuat rekapitulasi');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await reportsAPI.exportOrders({
        startDate: dateFilter.start,
        endDate: dateFilter.end,
        type: 'all',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan-pesanan-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Laporan Excel berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh laporan Excel');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await reportsAPI.generatePDF({
        type: 'orders',
        startDate: dateFilter.start,
        endDate: dateFilter.end,
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan-pesanan-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Laporan PDF berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh laporan PDF');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const totalOrdersIn = ordersInSummary?.count || 0;
  const totalOrdersOut = ordersOutSummary?.count || 0;
  const totalAmountIn = Number(ordersInSummary?.total) || 0;
  const totalAmountOut = Number(ordersOutSummary?.total) || 0;

  const ordersByStatus = ordersInSummary?.byStatus?.map(item => ({
    name: item.status,
    value: item._count,
    amount: Number(item._sum?.totalAmount) || 0,
  })) || [];

  const comparisonData = [
    { name: 'Pesanan Masuk', count: totalOrdersIn, amount: totalAmountIn },
    { name: 'Pesanan Keluar', count: totalOrdersOut, amount: totalAmountOut },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Rekapitulasi Pesanan</h1>
          <p className="page-subtitle">Ringkasan pesanan masuk dan keluar</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportPDF} className="btn btn-secondary">
            <HiOutlineDocumentReport className="w-5 h-5 mr-2 text-red-500" />
            Export PDF
          </button>
          <button onClick={handleExport} className="btn btn-primary">
            <HiOutlineDownload className="w-5 h-5 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="card mb-6">
        <div className="p-4 flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium text-slate-700">Periode:</span>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <HiOutlineCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                className="input pl-12"
              />
            </div>
            <span className="text-slate-500">-</span>
            <div className="relative">
              <HiOutlineCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                className="input pl-12"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Pesanan Masuk</p>
              <p className="text-2xl font-bold text-slate-900">{totalOrdersIn}</p>
              <p className="text-sm text-slate-500 mt-1">pesanan</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
              <HiOutlineInbox className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Nilai Pesanan Masuk</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalAmountIn)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Pesanan Keluar</p>
              <p className="text-2xl font-bold text-slate-900">{totalOrdersOut}</p>
              <p className="text-sm text-slate-500 mt-1">pesanan</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
              <HiOutlinePaperAirplane className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Nilai Pesanan Keluar</p>
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(totalAmountOut)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Perbandingan Pesanan</h3>
          </div>
          <div className="card-body h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  formatter={(value, name) => [name === 'amount' ? formatCurrency(value) : value, name === 'amount' ? 'Nilai' : 'Jumlah']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Jumlah" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Pesanan Masuk per Status</h3>
          </div>
          <div className="card-body h-80">
            {ordersByStatus.length > 0 ? (
              <div className="flex items-center gap-4 h-full">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ordersByStatus}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={40}
                      >
                        {ordersByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {ordersByStatus.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm text-slate-600">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-slate-900">{item.value} pesanan</span>
                        <p className="text-xs text-slate-500">{formatCurrency(item.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                Tidak ada data
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersRecap;

