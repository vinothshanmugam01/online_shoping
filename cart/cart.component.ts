import { Component, OnInit } from '@angular/core';
import { DataStorageService } from '../service/data-storage.service';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  totalPrice: number = 0;
  totalCart: number = 0;

  constructor(
    private dataStorage: DataStorageService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.cartItems = this.dataStorage.getCartData();
    this.calculateTotal();
    this.calculateTotalCart();
  }

  calculateTotal(): void {
    this.totalPrice = this.cartItems.reduce(
      (sum, item) => sum + item.pdPrice * (item.plusMinusCounter || 1),
      0
    );
  }

  calculateTotalCart(): void {
    this.totalCart = this.cartItems.reduce(
      (sum, item) => sum + (item.plusMinusCounter || 1),
      0
    );
  }

  updateQuantity(item: any, change: number): void {
    item.plusMinusCounter = Math.max(1, (item.plusMinusCounter || 1) + change);
    this.calculateTotal();
    this.calculateTotalCart();
    this.dataStorage.storeCartData(this.cartItems);
  }

  removeItem(item: any): void {
    this.cartItems = this.cartItems.filter((i) => i !== item);
    this.calculateTotal();
    this.calculateTotalCart();
    this.dataStorage.storeCartData(this.cartItems);
  }

  placeOrder(): void {
    if (!this.authService.getToken()) {
      this.router.navigate(['/user-login'], {
        queryParams: { returnUrl: '/payment' },
      });
      return;
    }
    this.router.navigate(['/payment']);
  }
}