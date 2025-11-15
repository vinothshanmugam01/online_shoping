import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { GetDataService } from '../service/get-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  bannerImgs = [
    { id: 1, img: '/assets/images/banner/ef637eb93bf1a887.webp' },
    { id: 2, img: '/assets/images/banner/9021283f0be266c1.webp' },
    { id: 3, img: '/assets/images/banner/7dcc28ed89760319.webp' },
  ];

  getCategorisData: any;
  getApplianceProductData: any[] = [];
  getFashionProductData: any[] = [];

  constructor(private getData: GetDataService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.getCategorisData = this.getData.categoriesData;
    this.getData.products$.subscribe(products => {
      this.getApplianceProductData = products.filter(
        (ele) => ele.pdCategory?.toLowerCase() === 'appliances'
      );
      this.getFashionProductData = products.filter(
        (ele) => ele.pdCategory?.toLowerCase() === 'fashion'
      );
      console.log('Appliance Products:', this.getApplianceProductData);
      console.log('Fashion Products:', this.getFashionProductData);
      this.cdr.detectChanges(); // Force UI update
    });
    this.getData.refreshProducts(); // Ensure initial fetch
  }

  onImgError(productName: string, category: string, productData: any[]): void {
    const product = productData.find(p => p.pdName === productName);
    console.error(`Failed to load image for product: ${productName} in ${category}. Check URL: http://localhost:3000/uploads/${product?.pdImg}`);
  }
}