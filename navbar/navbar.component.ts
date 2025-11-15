import { Component, OnInit } from '@angular/core';
import { DataStorageService } from '../service/data-storage.service';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  cartCount: number = 0;
  isLoggedIn: boolean = false;

  constructor(
    private dataStorage: DataStorageService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.dataStorage.cart$.subscribe((cart: any[]) => {
      this.cartCount = cart.reduce((sum, item) => sum + (item.plusMinusCounter || 1), 0);
    });
    this.authService.isLoggedIn().subscribe((loggedIn) => {
      this.isLoggedIn = loggedIn;
      console.log('Navbar - isLoggedIn:', loggedIn);
    });
  }

  handleLoginLogout(): void {
    if (this.isLoggedIn) {
      this.authService.logout();
      this.router.navigate(['/user-login']);
    } else {
      this.router.navigate(['/user-login']);
    }
  }
}