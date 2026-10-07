import { useState, useEffect } from 'react';
import { ordersOutAPI, menusAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  HiOutlineSearch,
  HiOutlinePaperAirplane,
  HiOutlineEye,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineTrash as HiTrashMini,
} from 'react-icons/hi';

const OrdersOut = () => {
  const { canEdit } = useAuth();
  const [orders, setOrders] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  
  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialFormData = {
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    orderDate: format(new Date(), 'yyyy-MM-dd'),
    deliveryDate: format(new Date(), 'yyyy-MM-dd'),
    completedDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'DELIVERED',
    notes: '',
    items: [{ menuId: '', menuName: '', quantity: 1, unitPrice: 0, notes: '' }],
  };

  const [formData, setFormData] = useState(initialFormData);

  const statuses = ['DELIVERED', 'COMPLETED'];

  useEffect(() => {
    fetchOrders();
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersOutAPI.getAll({ page, limit: 10, search, status: statusFilter });
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
      setMenus(response.data.data || []);
    } catch (error) {
      console.error('Fetch menus error:', error);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedOrder(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const openEditModal = (order) => {
    setSelectedOrder(order);
    setFormData({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      orderDate: format(new Date(order.orderDate), 'yyyy-MM-dd'),
      deliveryDate: format(new Date(order.deliveryDate), 'yyyy-MM-dd'),
      completedDate: order.completedDate ? format(new Date(order.completedDate), 'yyyy-MM-dd') : '',
      status: order.status,
      notes: order.notes || '',
      items: order.items?.length > 0 ? order.items.map(item => ({
        menuId: item.menuId || '',
        menuName: item.menuName,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        notes: item.notes || '',
      })) : [{ menuId: '', menuName: '', quantity: 1, unitPrice: 0, notes: '' }],
    });
    setIsFormModalOpen(true);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { menuId: '', menuName: '', quantity: 1, unitPrice: 0, notes: '' }],
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) {
      toast.error('Pesanan harus memiliki minimal 1 item');
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    if (field === 'menuId') {
      const selectedMenu = menus.find(m => m.id === parseInt(value));
      if (selectedMenu) {
        newItems[index] = {
          ...newItems[index],
          menuId: selectedMenu.id,
          menuName: selectedMenu.name,
          unitPrice: parseFloat(selectedMenu.price),
        };
      } else {
        newItems[index][field] = value;
      }
    } else {
      newItems[index][field] = value;
    }
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0 || !formData.items.some(i => i.menuName)) {
      toast.error('Mohon isi minimal satu menu pesanan');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        items: formData.items.filter(item => item.menuName && item.quantity > 0),
      };

      if (selectedOrder) {
        await ordersOutAPI.update(selectedOrder.id, payload);
        toast.success('Pesanan keluar berhasil diperbarui');
      } else {
        await ordersOutAPI.create(payload);
        toast.success('Pesanan keluar berhasil ditambahkan');
      }

      setIsFormModalOpen(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan pesanan keluar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    try {
      await ordersOutAPI.delete(selectedOrder.id);
      toast.success('Pesanan keluar berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus pesanan');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const badges = {
      DELIVERED: 'badge-info',
      COMPLETED: 'badge-success',
    };
    return badges[status] || 'badge-gray';
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Pesanan Keluar</h1>
          <p className="page-subtitle">Daftar dan manajemen pesanan yang telah dikirim ke pelanggan</p>
        </div>
        {canEdit('orders') && (
          <button
            onClick={openCreateModal}
            className="btn btn-primary"
          >
            <HiOutlinePlus className="w-5 h-5 mr-2" />
            Tambah Pesanan Keluar
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
            icon={HiOutlinePaperAirplane}
            title="Belum ada pesanan keluar"
            description="Pesanan yang sudah dikirim akan muncul di sini"
            action={
              canEdit('orders') && (
                <button onClick={openCreateModal} className="btn btn-primary">
                  <HiOutlinePlus className="w-5 h-5 mr-2" />
                  Tambah Pesanan Keluar
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedOrder ? 'Edit Pesanan Keluar' : 'Tambah Pesanan Keluar'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nama Pelanggan</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="input"
                placeholder="Contoh: Ibu Ani"
                required
              />
            </div>
            <div>
              <label className="label">Nomor Telepon</label>
              <input
                type="text"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="input"
                placeholder="08xxxxxxxxxx"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Alamat Pengiriman</label>
            <textarea
              value={formData.customerAddress}
              onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
              className="input"
              rows={2}
              placeholder="Alamat lengkap penerima..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Tanggal Pesan</label>
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
                <option value="DELIVERED">DELIVERED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Tanggal Selesai (Opsional)</label>
            <input
              type="date"
              value={formData.completedDate}
              onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Item Pesanan</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <HiOutlinePlus className="w-4 h-4" />
                Tambah Menu
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {formData.items.map((item, index) => (
                <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      {menus.length > 0 ? (
                        <select
                          value={item.menuId}
                          onChange={(e) => handleItemChange(index, 'menuId', e.target.value)}
                          className="input text-sm py-1.5"
                          required
                        >
                          <option value="">-- Pilih Menu --</option>
                          {menus.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({formatCurrency(m.price)})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Nama menu..."
                          value={item.menuName}
                          onChange={(e) => handleItemChange(index, 'menuName', e.target.value)}
                          className="input text-sm py-1.5"
                          required
                        />
                      )}
                    </div>
                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="input text-sm py-1.5"
                        required
                      />
                    </div>
                    <div className="w-28">
                      <input
                        type="number"
                        placeholder="Harga"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="input text-sm py-1.5"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg self-center"
                      title="Hapus baris"
                    >
                      <HiTrashMini className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 px-1">
                    <span>Subtotal: {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 p-3 bg-primary-50 rounded-xl flex justify-between items-center font-semibold text-primary-900">
              <span>Total Estimasi:</span>
              <span className="text-lg">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          <div>
            <label className="label">Catatan Tambahan</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={2}
              placeholder="Catatan khusus pesanan..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="btn btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Menyimpan...' : (selectedOrder ? 'Simpan Perubahan' : 'Tambah Pesanan')}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail Pesanan Keluar"
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
                <p className="text-sm text-slate-500">Tanggal Kirim</p>
                <p className="font-medium">{format(new Date(selectedOrder.deliveryDate), 'dd MMMM yyyy', { locale: id })}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Tanggal Selesai</p>
                <p className="font-medium">
                  {selectedOrder.completedDate 
                    ? format(new Date(selectedOrder.completedDate), 'dd MMMM yyyy', { locale: id })
                    : '-'}
                </p>
              </div>
            </div>

            {selectedOrder.notes && (
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Catatan</p>
                <p className="text-sm text-slate-700">{selectedOrder.notes}</p>
              </div>
            )}

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
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Pesanan Keluar"
        message={`Apakah Anda yakin ingin menghapus pesanan keluar ${selectedOrder?.orderNumber}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        danger
      />
    </div>
  );
};

export default OrdersOut;
