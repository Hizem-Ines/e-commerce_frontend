// src/services/__tests__/orderService.test.js
import * as orderService from '../orderService';
import api from '../api';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get:    jest.fn(),
    post:   jest.fn(),
    put:    jest.fn(),
    patch:  jest.fn(),
    delete: jest.fn(),
  },
}));

const fakeOrder = { id: 42, status: 'en_attente', total: 89.50 };

beforeEach(() => jest.clearAllMocks());

describe('orderService', () => {

  describe('createOrder', () => {
    it('appelle POST /orders avec les données de commande', async () => {
      const payload = { items: [{ variant_id: 7, quantity: 2 }] };
      api.post.mockResolvedValueOnce({ data: { order: fakeOrder } });

      const result = await orderService.createOrder(payload);

      expect(api.post).toHaveBeenCalledWith('/orders', payload);
      expect(result.data.order.id).toBe(42);
    });

    it('propage l\'erreur 400 si stock insuffisant', async () => {
      api.post.mockRejectedValueOnce({ response: { status: 400 } });

      await expect(orderService.createOrder({}))
        .rejects.toMatchObject({ response: { status: 400 } });
    });
  });

  describe('createGuestOrder', () => {
    it('appelle POST /orders/guest avec les données invité', async () => {
      const payload = { email: 'guest@test.ch', items: [] };
      api.post.mockResolvedValueOnce({ data: { order: fakeOrder } });

      await orderService.createGuestOrder(payload);

      expect(api.post).toHaveBeenCalledWith('/orders/guest', payload);
    });
  });

  describe('getMyOrders', () => {
    it('appelle GET /orders/my et retourne la liste', async () => {
      api.get.mockResolvedValueOnce({ data: { orders: [fakeOrder] } });

      const result = await orderService.getMyOrders();

      expect(api.get).toHaveBeenCalledWith('/orders/my');
      expect(result.data.orders).toHaveLength(1);
    });

    it('retourne un tableau vide si aucune commande', async () => {
      api.get.mockResolvedValueOnce({ data: { orders: [] } });

      const result = await orderService.getMyOrders();

      expect(result.data.orders).toEqual([]);
    });
  });

  describe('getSingleOrder', () => {
    it('appelle GET /orders/:id avec le bon id', async () => {
      api.get.mockResolvedValueOnce({ data: { order: fakeOrder } });

      await orderService.getSingleOrder(42);

      expect(api.get).toHaveBeenCalledWith('/orders/42');
    });

    it('propage l\'erreur 404 si commande introuvable', async () => {
      api.get.mockRejectedValueOnce({ response: { status: 404 } });

      await expect(orderService.getSingleOrder(9999))
        .rejects.toMatchObject({ response: { status: 404 } });
    });
  });

  describe('cancelOrder', () => {
    it('appelle PATCH /orders/:id/cancel avec la raison', async () => {
      api.patch.mockResolvedValueOnce({ data: { message: 'Annulée' } });

      await orderService.cancelOrder(42, 'Commande en double');

      expect(api.patch).toHaveBeenCalledWith('/orders/42/cancel', { reason: 'Commande en double' });
    });
  });

  describe('validatePromo', () => {
    it('appelle POST /orders/validate-promo et retourne valid: true', async () => {
      const payload = { code: 'GOFFA10', subtotal: 100 };
      api.post.mockResolvedValueOnce({ data: { discount: 10, valid: true } });

      const result = await orderService.validatePromo(payload);

      expect(api.post).toHaveBeenCalledWith('/orders/validate-promo', payload);
      expect(result.data.valid).toBe(true);
    });

    it('propage l\'erreur 400 si code promo invalide', async () => {
      api.post.mockRejectedValueOnce({ response: { status: 400 } });

      await expect(orderService.validatePromo({ code: 'FAKE' }))
        .rejects.toMatchObject({ response: { status: 400 } });
    });
  });

  describe('getShippingCost', () => {
    it('appelle GET /orders/shipping-cost avec subtotal en params', async () => {
      api.get.mockResolvedValueOnce({ data: { shipping_cost: 7.50 } });

      await orderService.getShippingCost(89.50);

      expect(api.get).toHaveBeenCalledWith('/orders/shipping-cost', { params: { subtotal: 89.50 } });
    });

    it('retourne 0 si livraison gratuite', async () => {
      api.get.mockResolvedValueOnce({ data: { shipping_cost: 0 } });

      const result = await orderService.getShippingCost(200);

      expect(result.data.shipping_cost).toBe(0);
    });
  });

  describe('getAllOrders (admin)', () => {
    it('appelle GET /orders/all avec les filtres en params', async () => {
      const params = { status: 'confirmee', page: 1 };
      api.get.mockResolvedValueOnce({ data: { orders: [fakeOrder] } });

      await orderService.getAllOrders(params);

      expect(api.get).toHaveBeenCalledWith('/orders/all', { params });
    });
  });

  describe('updateOrderStatus (admin)', () => {
    it('appelle PATCH /orders/:id/status avec le nouveau statut', async () => {
      api.patch.mockResolvedValueOnce({ data: {} });

      await orderService.updateOrderStatus(42, 'expediee');

      expect(api.patch).toHaveBeenCalledWith('/orders/42/status', { status: 'expediee' });
    });
  });

  describe('updateDelivery (admin)', () => {
    it('appelle PATCH /orders/:id/delivery avec les données', async () => {
      const data = { tracking_number: 'CH123456', carrier: 'La Poste' };
      api.patch.mockResolvedValueOnce({ data: {} });

      await orderService.updateDelivery(42, data);

      expect(api.patch).toHaveBeenCalledWith('/orders/42/delivery', data);
    });
  });

  describe('getLowStockProducts (admin)', () => {
    it('appelle GET /orders/admin/low-stock', async () => {
      api.get.mockResolvedValueOnce({ data: { products: [] } });

      await orderService.getLowStockProducts();

      expect(api.get).toHaveBeenCalledWith('/orders/admin/low-stock');
    });
  });

  describe('adminUpdateShipping (admin)', () => {
    it('appelle PUT /orders/:id/shipping avec les données', async () => {
      const data = { address_line1: 'Neue Strasse 5', city: 'Zürich' };
      api.put.mockResolvedValueOnce({ data: {} });

      await orderService.adminUpdateShipping(42, data);

      expect(api.put).toHaveBeenCalledWith('/orders/42/shipping', data);
    });
  });

});