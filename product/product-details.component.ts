import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GetDataService } from '../service/get-data.service';
import { DataStorageService } from '../service/data-storage.service';
import { Subscription } from 'rxjs';

// Define an interface for the product
interface Product {
  pdId: number;
  pdName: string;
  pdCategory: string;
  pdDesc?: string;
  pdPrice: number;
  pdImg?: string;
  plusMinusCounter?: number;
}

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css'],
})
export class ProductDetailsComponent implements OnInit {
  getParamCategory: string | null | undefined = null; // Allow undefined
  getParamId: string | null | undefined = null; // Allow undefined
  getProductDetails: Product | null = null;
  storeCartArry: Product[] = [];
  inCart: boolean = false;
  private productsSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private getData: GetDataService,
    private dataStorage: DataStorageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getParamCategory = this.route.snapshot.paramMap.get('category')?.toLowerCase();
    this.getParamId = this.route.snapshot.paramMap.get('id');
    this.productsSubscription = this.getData.products$.subscribe(products => {
      if (this.getParamCategory && this.getParamId) {
        this.getProductDetails = products.find((p: Product) => 
          p.pdCategory?.toLowerCase() === this.getParamCategory && p.pdId === Number(this.getParamId)
        );
        console.log('Fetched product details:', this.getProductDetails);
        if (this.getProductDetails) {
          console.log('Product image URL:', this.getProductDetails.pdImg ? `http://localhost:3000/uploads/${this.getProductDetails.pdImg}` : 'No pdImg');
        } else {
          console.warn('Product not found for category:', this.getParamCategory, 'pdId:', this.getParamId);
        }
        let getData = this.dataStorage.getCartData();
        if (getData) {
          getData.forEach((ele: Product) => {
            if (ele.pdId === Number(this.getParamId)) {
              this.inCart = true;
            }
          });
        }
        this.cdr.detectChanges(); // Force UI update
      }
    });
    this.getData.refreshProducts(); // Ensure data is fetched
  }

  ngOnDestroy(): void {
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
  }

  onImgError(productName: string): void {
    console.error(`Failed to load image for product: ${productName}. Check URL: http://localhost:3000/uploads/${this.getProductDetails?.pdImg}`);
  }

  addCart(data: Product): void {
    let getData = this.dataStorage.getCartData();
    if (getData) {
      this.storeCartArry = getData;
    }
    data.plusMinusCounter = 1;
    this.storeCartArry.push(data);
    this.dataStorage.storeCartData(this.storeCartArry);
    this.router.navigate(['/cart']);
  }
}