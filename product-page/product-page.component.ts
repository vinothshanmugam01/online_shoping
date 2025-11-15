import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GetDataService } from '../service/get-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-page',
  templateUrl: './product-page.component.html',
  styleUrls: ['./product-page.component.css'],
})
export class ProductPageComponent implements OnInit, OnDestroy {
  getParamValue: string | null = null;
  getProductData: any[] = [];
  getSubCategoryOption: any[] = [];
  filterProductData: any[] = [];
  private productsSubscription: Subscription | null = null;
  private routeSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private getData: GetDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.getParamValue = params.get('name')?.toLowerCase() || null;
      console.log('Route Param (category):', this.getParamValue);
      this.getSubCategoryOption = this.getData.subCategorisFilterData.filter(
        (ele: any) => ele.categories.toLowerCase() === this.getParamValue
      );
      console.log('Subcategory Options:', this.getSubCategoryOption);
      if (this.getParamValue) {
        console.log(`Navigating to category: ${this.getParamValue}`);
      } else {
        console.log('No category parameter provided');
      }
      this.getData.forceRefresh(); // Force refresh on route change
    });

    this.productsSubscription = this.getData.products$.subscribe(products => {
      console.log('Received products:', products);
      if (this.getParamValue) {
        this.getProductData = products.filter((ele: any) => {
          const categoryMatch = ele.pdCategory && ele.pdCategory.toLowerCase() === this.getParamValue;
          console.log(`Checking product: ${ele.pdName}, pdCategory: ${ele.pdCategory}, matches ${this.getParamValue}: ${categoryMatch}`);
          return categoryMatch;
        });
        this.filterProductData = [...this.getProductData];
        console.log(`Filtered Products for ${this.getParamValue}:`, this.filterProductData);
      } else {
        console.log('No category parameter, setting empty product list');
        this.getProductData = [];
        this.filterProductData = [];
      }
      this.cdr.detectChanges(); // Force UI update
    });
  }

  ngOnDestroy(): void {
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  filterSelect(event: any): void {
    const selectedSubCategory = event.target.value;
    console.log('Selected Subcategory:', selectedSubCategory);
    if (selectedSubCategory === 'all') {
      this.filterProductData = [...this.getProductData];
    } else {
      this.filterProductData = this.getProductData.filter(
        (ele: any) => ele.pdSubCategory && ele.pdSubCategory.toLowerCase() === selectedSubCategory.toLowerCase()
      );
    }
    console.log('Filtered Product Data:', this.filterProductData);
    this.cdr.detectChanges(); // Force UI update
  }
}