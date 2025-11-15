import { Component, OnInit } from '@angular/core';
import { BackendService } from '../service/backend.service';
import { DataStorageService } from '../service/data-storage.service';

@Component({
  selector: 'app-admin-orders',
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.css'],
})
export class AdminOrdersComponent implements OnInit {
  orders: any[] = [];
  userDetails: any = null;
  loading = true;
  error: string | null = null;
  successMessage: string | null = null;
  updatingOrderId: string | null = null;

  constructor(
    private backend: BackendService,
    private dataStorage: DataStorageService
  ) {}

  ngOnInit(): void {
    this.userDetails = this.dataStorage.getUserDetails();
    this.loadOrders();
  }

  loadOrders(): void {
    this.backend.getAdminOrders().subscribe({
      next: (orders) => {
        console.log('Admin orders received:', JSON.stringify(orders, null, 2));
        // Merge local statuses from DataStorageService
        this.orders = orders.map((order) => ({
          ...order,
          status: this.dataStorage.getOrderStatus(order._id) || 'Pending',
        }));
        this.loading = false;
        if (orders.length === 0) {
          this.error = 'No orders with generated bills found.';
        }
      },
      error: (err) => {
        console.error('Error fetching admin orders:', err);
        this.error = err.error?.message || 'Failed to load orders. Please try again later.';
        this.loading = false;
      },
    });
  }

  updateStatus(orderId: string, status: string): void {
    this.updatingOrderId = orderId;
    this.error = null;
    this.successMessage = null;
    try {
      this.dataStorage.setOrderStatus(orderId, status);
      this.orders = this.orders.map((order) =>
        order._id === orderId ? { ...order, status } : order
      );
      this.successMessage = `Order ${orderId} status updated to ${status}.`;
      this.updatingOrderId = null;
    } catch (err: any) {
      console.error('Error updating order status:', err);
      this.error = 'Failed to update order status.';
      this.updatingOrderId = null;
    }
  }

  cancelOrder(orderId: string): void {
    if (confirm('Are you sure you want to cancel this order?')) {
      this.updatingOrderId = orderId;
      this.error = null;
      this.successMessage = null;
      try {
        this.dataStorage.setOrderStatus(orderId, 'Cancelled');
        this.orders = this.orders.map((order) =>
          order._id === orderId ? { ...order, status: 'Cancelled' } : order
        );
        this.successMessage = `Order ${orderId} has been cancelled.`;
        this.updatingOrderId = null;
      } catch (err: any) {
        console.error('Error cancelling order:', err);
        this.error = 'Failed to cancel order.';
        this.updatingOrderId = null;
      }
    }
  }
}