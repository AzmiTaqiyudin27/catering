import { useState, useEffect } from 'react';
import { ordersInAPI, ordersOutAPI, menusAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineInbox,
  HiOutlineEye,
  HiOutlineX,
  HiOutlinePaperAirplane,
} from 'react-icons/hi';

const OrdersIn = () => {
  const { canEdit } = useAuth();
  const [orders, setOrders] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    orderDate: format(new Date(), 'yyyy-MM-dd'),
    deliveryDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'PENDING',
    notes: '',
    items: [{ menuName: '', quantity: 1, unitPrice: 0 }],
  });

  const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED'];

  useEffect(() => {
    fetchOrders();
    fetchMenus();
  }, [page, search, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersInAPI.getAll({ page, limit: 10, search, status: statusFilter });
      setOrders(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Gagal memuat data pesanan');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenus = async () => {
    try {
      const response = await menusAPI.getAll({ limit: 100 });
      setMenus(response.data.data);
    } catch (error) {
      console.error('Fetch menus error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        items: formData.items.filter(item => item.menuName && item.quantity > 0),
      };
      
      if (selectedOrder) {
        await ordersInAPI.update(selectedOrder.id, data);
        toast.success('Pesanan berhasil diperbarui');
      } else {
        await ordersInAPI.create(data);
        toast.success('Pesanan berhasil ditambahkan');
      }
      setIsModalOpen(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan pesanan');
    }
  };

  const handleDelete = async () => {
    try {
      await ordersInAPI.delete(selectedOrder.id);
      toast.success('Pesanan berhasil dihapus');
      fetchOrders();
    } catch (error) {
      toast.error('Gagal menghapus pesanan');
    }
  };

  const handleDispatchToOut = async (order) => {
    try {
      const payload = {
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        orderDate: format(new Date(order.orderDate), 'yyyy-MM-dd'),
        deliveryDate: format(new Date(order.deliveryDate), 'yyyy-MM-dd'),
        status: 'DELIVERED',
        notes: order.notes ? `Dari Pesanan Masuk #${order.orderNumber}. Catatan: ${order.notes}` : `Dari Pesanan Masuk #${order.orderNumber}`,
        items: order.items?.map((item) => ({
          menuId: item.menuId,
          menuName: item.menuName,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
          notes: item.notes,
        })) || [],
      };
      await ordersOutAPI.create(payload);
      if (order.status !== 'COMPLETED') {
        await ordersInAPI.update(order.id, { status: 'COMPLETED' });
      }
      toast.success(`Pesanan #${order.orderNumber} berhasil diteruskan ke Pesanan Keluar!`);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal meneruskan ke pesanan keluar');
    }
  };

  const openEditModal = (order) => {
    setSelectedOrder(order);
    setFormData({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      orderDate: format(new Date(order.orderDate), 'yyyy-MM-dd'),
      deliveryDate: format(new Date(order.deliveryDate), 'yyyy-MM-dd'),
      status: order.status,
      notes: order.notes || '',
      items: order.items?.length > 0 ? order.items.map(item => ({
        menuName: item.menuName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })) : [{ menuName: '', quantity: 1, unitPrice: 0 }],
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setSelectedOrder(null);
    setFormData({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      orderDate: format(new Date(), 'yyyy-MM-dd'),
      deliveryDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'PENDING',
      notes: '',
      items: [{ menuName: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { menuName: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    if (field === 'menuName') {
      const menu = menus.find(m => m.name === value);
      if (menu) {
        newItems[index].unitPrice = menu.price;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'badge-warning',
      CONFIRMED: 'badge-info',
      PROCESSING: 'badge-info',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-danger',
    };
    return badges[status] || 'badge-gray';
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Pesanan Masuk</h1>
          <p className="page-subtitle">Kelola pesanan yang masuk</p>
        </div>
        {canEdit('orders') && (
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <HiOutlinePlus className="w-5 h-5 mr-2" />
            Tambah Pesanan
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor pesanan atau nama pelanggan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input pl-12"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input w-full sm:w-48"
          >
            <option value="">Semua Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={HiOutlineInbox}
            title="Belum ada pesanan"
            description="Mulai dengan menambahkan pesanan baru"
            action={
              canEdit('orders') && (
                <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                  <HiOutlinePlus className="w-5 h-5 mr-2" />
                  Tambah Pesanan
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Pesanan</th>
                    <th>Pelanggan</th>
                    <th>Tanggal Kirim</th>
                    <th className="text-right">Total</th>
                    <th>Status</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <p className="font-medium text-slate-900">{order.orderNumber}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(order.orderDate), 'dd MMM yyyy', { locale: id })}
                        </p>
                      </td>
                      <td>
                        <p className="font-medium text-slate-900">{order.customerName}</p>
                        <p className="text-xs text-slate-500">{order.customerPhone}</p>
                      </td>
                      <td>{format(new Date(order.deliveryDate), 'dd MMM yyyy', { locale: id })}</td>
                      <td className="text-right font-semibold">{formatCurrency(order.totalAmount)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(order.status)}`}>{order.status}</span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsViewModalOpen(true);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                            title="Lihat Detail"
                          >
                            <HiOutlineEye className="w-5 h-5" />
                          </button>
                          {canEdit('orders') && (
                            <>
                              <button
                                onClick={() => handleDispatchToOut(order)}
                                className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600"
                                title="Kirim ke Pesanan Keluar"
                              >
                                <HiOutlinePaperAirplane className="w-5 h-5 rotate-90" />
                              </button>
                              <button
                                onClick={() => openEditModal(order)}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                                title="Edit"
                              >
                                <HiOutlinePencil className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                                title="Hapus"
                              >
                                <HiOutlineTrash className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedOrder ? 'Edit Pesanan' : 'Tambah Pesanan'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nama Pelanggan</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">No. Telepon</label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Alamat</label>
            <textarea
              value={formData.customerAddress}
              onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
              className="input min-h-[60px]"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Tanggal Order</label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Tanggal Kirim</label>
              <input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Item Pesanan</label>
              <button type="button" onClick={addItem} className="text-sm text-primary-600 hover:text-primary-700">
                + Tambah Item
              </button>
            </div>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <select
                    value={item.menuName}
                    onChange={(e) => updateItem(index, 'menuName', e.target.value)}
                    className="input flex-1"
                  >
                    <option value="">Pilih Menu</option>
                    {menus.map((menu) => (
                      <option key={menu.id} value={menu.name}>
                        {menu.name} - {formatCurrency(menu.price)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    className="input w-20"
                    placeholder="Qty"
                    min="1"
                  />
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', parseInt(e.target.value) || 0)}
                    className="input w-32"
                    placeholder="Harga"
                  />
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-3 hover:bg-red-50 rounded-lg text-red-600"
                    >
                      <HiOutlineX className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 text-right">
              <span className="text-sm text-slate-500">Total: </span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          <div>
            <label className="label">Catatan (Opsional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input min-h-[60px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedOrder ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail Pesanan"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">No. Pesanan</p>
                <p className="font-medium">{selectedOrder.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <span className={`badge ${getStatusBadge(selectedOrder.status)}`}>{selectedOrder.status}</span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Pelanggan</p>
                <p className="font-medium">{selectedOrder.customerName}</p>
                <p className="text-sm text-slate-500">{selectedOrder.customerPhone}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Alamat</p>
                <p className="font-medium">{selectedOrder.customerAddress}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Tanggal Order</p>
                <p className="font-medium">{format(new Date(selectedOrder.orderDate), 'dd MMMM yyyy', { locale: id })}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Tanggal Kirim</p>
                <p className="font-medium">{format(new Date(selectedOrder.deliveryDate), 'dd MMMM yyyy', { locale: id })}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-2">Item Pesanan</p>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Item</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Harga</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index} className="border-t border-slate-100">
                        <td className="px-4 py-2 text-sm">{item.menuName}</td>
                        <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50">
                    <tr>
                      <td colSpan="3" className="px-4 py-2 text-right font-medium">Total</td>
                      <td className="px-4 py-2 text-right font-bold text-primary-600">{formatCurrency(selectedOrder.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {selectedOrder.notes && (
              <div>
                <p className="text-sm text-slate-500">Catatan</p>
                <p className="font-medium">{selectedOrder.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Pesanan"
        message={`Apakah Anda yakin ingin menghapus pesanan "${selectedOrder?.orderNumber}"?`}
        confirmText="Ya, Hapus"
      />
    </div>
  );
};

export default OrdersIn;

