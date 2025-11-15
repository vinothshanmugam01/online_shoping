import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DataStorageService } from '../service/data-storage.service';
import { BackendService } from '../service/backend.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
})
export class PaymentComponent implements OnInit {
  paymentForm: FormGroup;
  cartItems: any[] = [];
  totalAmount: number = 0;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dataStorage: DataStorageService,
    private backend: BackendService,
    private router: Router
  ) {
    this.paymentForm = this.fb.group({
      paymentMethod: ['', Validators.required],
      name: ['', Validators.required],
      address: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    });
  }

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.dataStorage.cart$.subscribe((cart) => {
      this.cartItems = cart;
      this.totalAmount = this.cartItems.reduce(
        (total, item) => total + item.pdPrice * (item.plusMinusCounter || 1),
        0
      );
    });
  }

  onSubmit(): void {
    if (this.paymentForm.valid) {
      this.loading = true;
      this.error = null;
      const orderData = {
        products: this.cartItems.map((item) => ({
          productId: item.pdId,
          quantity: item.plusMinusCounter || 1,
          price: item.pdPrice,
        })),
        totalAmount: this.totalAmount,
        userDetails: {
          name: this.paymentForm.value.name,
          address: this.paymentForm.value.address,
          phone: this.paymentForm.value.phone,
          paymentMethod: this.paymentForm.value.paymentMethod,
        },
      };

      this.backend.createOrder(orderData).subscribe({
        next: (response: any) => {
          console.log('Order placed:', response);
          // Store userDetails in DataStorageService
          this.dataStorage.setUserDetails(orderData.userDetails);
          this.dataStorage.clearCart();
          this.loading = false;
          this.router.navigate(['/order-confirmation'], {
            queryParams: { orderId: response.orderId },
          });
        },
        error: (err) => {
          console.error('Order placement failed:', err);
          this.loading = false;
          this.error = err.error?.message || 'Failed to place order. Please try again.';
        },
      });
    } else {
      this.error = 'Please fill out all required fields correctly.';
    }
  }
}