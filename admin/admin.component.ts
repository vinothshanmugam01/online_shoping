import { Component, OnInit } from '@angular/core';
import { BackendService } from '../service/backend.service';
import { DataStorageService } from '../service/data-storage.service';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';
import { Chart, ChartOptions, ChartType, ChartDataset } from 'chart.js';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  products: any[] = [];
  feedbacks: any[] = [];
  newProduct: any = { pdId: null, pdName: '', pdDesc: '', pdPrice: null, pdCategory: '', pdSubCategory: '', pdImg: null };
  editingProduct: any = null;
  categoriesData = [
    { code: 'fashion', name: 'Fashion' },
    { code: 'appliances', name: 'Appliances' },
    { code: 'home-and-furniture', name: 'Home and Furniture' },
    { code: 'toys', name: 'Toys' },
  ];
  subCategorisFilterData = [
    { categories: 'fashion', subcategories: 't-shirts' },
    { categories: 'fashion', subcategories: 'jeans' },
    { categories: 'appliances', subcategories: 'kitchen' },
    { categories: 'appliances', subcategories: 'electronics' },
    { categories: 'home-and-furniture', subcategories: 'furniture' },
    { categories: 'home-and-furniture', subcategories: 'decor' },
    { categories: 'toys', subcategories: 'educational' },
    { categories: 'toys', subcategories: 'action-figures' },
  ];
  subCategories: string[] = [];

  // Statistical Data (Dynamic)
  totalSales: number = 0;
  totalOrders: number = 0;
  totalFeedbacks: number = 0;
  errorMessage: string | null = null;

  // Bar Chart Data (Orders per month)
  barChartOptions: ChartOptions = {
    responsive: true,
    scales: {
      x: {
        display: true,
        title: { display: true, text: 'Month' },
      },
      y: {
        display: true,
        title: { display: true, text: 'Number of Orders' },
        beginAtZero: true,
        ticks: {
          stepSize: 1, // Ensure whole numbers for order counts
        },
      },
    },
  };
  barChartLabels: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  barChartType: ChartType = 'bar';
  barChartDatasets: ChartDataset<'bar'>[] = [
    { data: [], label: 'Orders', backgroundColor: '#4A90E2' }, // Single dataset for total orders
  ];

  // Pie Chart Data (Product Category Distribution)
  pieChartOptions: ChartOptions = { responsive: true };
  pieChartLabels: string[] = ['Fashion', 'Appliances', 'Home & Furniture', 'Toys'];
  pieChartType: ChartType = 'pie';
  pieChartDatasets: ChartDataset<'pie'>[] = [
    { data: [], backgroundColor: ['#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9'] },
  ];

  constructor(
    private backend: BackendService,
    private dataStorage: DataStorageService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadFeedbacks();
    this.loadStatistics();
  }

  loadProducts(): void {
    this.backend.getProducts().subscribe({
      next: (products: any[]) => {
        this.products = products;
        console.log('Fetched products:', JSON.stringify(this.products, null, 2)); // Debug: Log the products array
        if (this.products.length === 0) {
          console.warn('No products fetched from backend. Using mock data.');
          // Add mock data to ensure the pie chart has something to display
          this.products = [
            { pdId: 1, pdName: 'T-Shirt', pdDesc: 'Cotton T-Shirt', pdPrice: 500, pdCategory: 'fashion', pdSubCategory: 't-shirts', pdImg: null },
            { pdId: 2, pdName: 'Blender', pdDesc: 'Kitchen Blender', pdPrice: 2000, pdCategory: 'appliances', pdSubCategory: 'kitchen', pdImg: null },
            { pdId: 3, pdName: 'Sofa', pdDesc: 'Comfortable Sofa', pdPrice: 15000, pdCategory: 'home-and-furniture', pdSubCategory: 'furniture', pdImg: null },
            { pdId: 4, pdName: 'Action Figure', pdDesc: 'Superhero Figure', pdPrice: 300, pdCategory: 'toys', pdSubCategory: 'action-figures', pdImg: null },
            { pdId: 5, pdName: 'Jeans', pdDesc: 'Denim Jeans', pdPrice: 1000, pdCategory: 'fashion', pdSubCategory: 'jeans', pdImg: null },
          ];
        }
        this.updatePieChartData(this.products);
      },
      error: (err: any) => {
        console.error('Error fetching products:', err);
        this.errorMessage = 'Failed to load products. Using mock data for charts.';
        // Use mock data on error to ensure the pie chart has data
        this.products = [
          { pdId: 1, pdName: 'T-Shirt', pdDesc: 'Cotton T-Shirt', pdPrice: 500, pdCategory: 'fashion', pdSubCategory: 't-shirts', pdImg: null },
          { pdId: 2, pdName: 'Blender', pdDesc: 'Kitchen Blender', pdPrice: 2000, pdCategory: 'appliances', pdSubCategory: 'kitchen', pdImg: null },
          { pdId: 3, pdName: 'Sofa', pdDesc: 'Comfortable Sofa', pdPrice: 15000, pdCategory: 'home-and-furniture', pdSubCategory: 'furniture', pdImg: null },
          { pdId: 4, pdName: 'Action Figure', pdDesc: 'Superhero Figure', pdPrice: 300, pdCategory: 'toys', pdSubCategory: 'action-figures', pdImg: null },
          { pdId: 5, pdName: 'Jeans', pdDesc: 'Denim Jeans', pdPrice: 1000, pdCategory: 'fashion', pdSubCategory: 'jeans', pdImg: null },
        ];
        this.updatePieChartData(this.products);
      },
    });
  }

  loadFeedbacks(): void {
    this.feedbacks = this.dataStorage.getFeedbacks();
    this.totalFeedbacks = this.feedbacks.length;
    console.log('Fetched feedbacks:', JSON.stringify(this.feedbacks, null, 2));
    if (this.feedbacks.length === 0) {
      this.errorMessage = 'No feedbacks found.';
    }
  }

  loadStatistics(): void {
    this.backend.getAdminOrders().subscribe({
      next: (orders: any[]) => {
        console.log('Orders fetched:', JSON.stringify(orders, null, 2));
        this.totalOrders = orders.length;
        this.totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        this.updateBarChartData(orders);
      },
      error: (err: any) => {
        console.error('Error fetching orders:', err);
        this.totalOrders = 0;
        this.totalSales = 0;
        this.errorMessage = 'Failed to load orders. Please try again.';
      },
    });
  }

  updateBarChartData(orders: any[]): void {
    console.log('Processing orders for bar chart:', JSON.stringify(orders, null, 2));
    const ordersByMonth: number[] = new Array(8).fill(0);

    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const monthIndex = orderDate.getMonth();
      if (monthIndex >= 0 && monthIndex < 8) {
        ordersByMonth[monthIndex]++;
      }
    });

    console.log('Orders by month:', ordersByMonth);
    this.barChartDatasets = [
      {
        data: ordersByMonth,
        label: 'Orders',
        backgroundColor: '#4A90E2',
      },
    ];
    console.log('Updated barChartDatasets:', JSON.stringify(this.barChartDatasets, null, 2));
  }

  updatePieChartData(products: any[]): void {
    const categoryCounts: { [key: string]: number } = {
      fashion: 0,
      appliances: 0,
      'home-and-furniture': 0,
      toys: 0,
    };

    products.forEach((product: any) => {
      const category = product.pdCategory?.toLowerCase();
      if (categoryCounts[category] !== undefined) {
        categoryCounts[category]++;
      } else {
        console.warn(`Product category "${category}" does not match expected categories:`, Object.keys(categoryCounts));
      }
    });

    console.log('Category counts:', categoryCounts); // Debug: Log the counts

    // Map counts to pie chart data in the correct order
    const data = [
      categoryCounts['fashion'],
      categoryCounts['appliances'],
      categoryCounts['home-and-furniture'],
      categoryCounts['toys'],
    ];

    console.log('Pie chart data before assignment:', data);

    // Assign the data to force chart update
    this.pieChartDatasets = [
      {
        data: data,
        backgroundColor: ['#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9'],
      },
    ];

    console.log('Updated pieChartDatasets:', JSON.stringify(this.pieChartDatasets, null, 2)); // Debug: Log the final dataset
  }

  getCategoryName(categoryCode: string): string {
    const category = this.categoriesData.find((c) => c.code === categoryCode);
    return category ? category.name : categoryCode;
  }

  getImageUrl(pdImg: string | null): string {
    return pdImg ? `http://localhost:3000/uploads/${pdImg}` : '/assets/images/placeholder.jpg';
  }

  updateSubCategories(isEditing = false): void {
    const category = isEditing ? this.editingProduct.pdCategory : this.newProduct.pdCategory;
    this.subCategories = this.subCategorisFilterData
      .filter((item) => item.categories === category)
      .map((item) => item.subcategories);
    if (isEditing) {
      this.editingProduct.pdSubCategory = '';
    } else {
      this.newProduct.pdSubCategory = '';
    }
  }

  onFileChange(event: any, type: string): void {
    const file = event.target.files[0];
    if (type === 'new') {
      this.newProduct.pdImg = file;
    } else {
      this.editingProduct.pdImg = file;
    }
  }

  addProduct(): void {
    const formData = new FormData();
    formData.append('pdId', this.newProduct.pdId);
    formData.append('pdName', this.newProduct.pdName);
    formData.append('pdDesc', this.newProduct.pdDesc);
    formData.append('pdPrice', this.newProduct.pdPrice);
    formData.append('pdCategory', this.newProduct.pdCategory);
    formData.append('pdSubCategory', this.newProduct.pdSubCategory);
    if (this.newProduct.pdImg) {
      formData.append('pdImg', this.newProduct.pdImg);
    }

    this.backend.addProduct(formData).subscribe({
      next: () => {
        this.loadProducts();
        this.newProduct = { pdId: null, pdName: '', pdDesc: '', pdPrice: null, pdCategory: '', pdSubCategory: '', pdImg: null };
      },
      error: (err: any) => {
        console.error('Error adding product:', err);
        this.errorMessage = 'Failed to add product. Please try again.';
      },
    });
  }

  editProduct(product: any): void {
    this.editingProduct = { ...product };
    this.updateSubCategories(true);
  }

  updateProduct(): void {
    const formData = new FormData();
    formData.append('pdId', this.editingProduct.pdId);
    formData.append('pdName', this.editingProduct.pdName);
    formData.append('pdDesc', this.editingProduct.pdDesc);
    formData.append('pdPrice', this.editingProduct.pdPrice);
    formData.append('pdCategory', this.editingProduct.pdCategory);
    formData.append('pdSubCategory', this.editingProduct.pdSubCategory);
    if (this.editingProduct.pdImg instanceof File) {
      formData.append('pdImg', this.editingProduct.pdImg);
    } else {
      formData.append('pdImg', this.editingProduct.pdImg || '');
    }

    this.backend.updateProduct(this.editingProduct._id, formData).subscribe({
      next: () => {
        this.loadProducts();
        this.editingProduct = null;
      },
      error: (err: any) => {
        console.error('Error updating product:', err);
        this.errorMessage = 'Failed to update product. Please try again.';
      },
    });
  }

  deleteProduct(id: string): void {
    this.backend.deleteProduct(id).subscribe({
      next: () => {
        this.loadProducts();
      },
      error: (err: any) => {
        console.error('Error deleting product:', err);
        this.errorMessage = 'Failed to delete product. Please try again.';
      },
    });
  }

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}