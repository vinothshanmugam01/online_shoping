import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css'],
})
export class UserLoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  loading = false;
  isRegisterMode = false;

  // Hardcoded admin credentials
  private readonly ADMIN_EMAIL = 'admin@infinite-mart.com';
  private readonly ADMIN_PASSWORD = 'Admin123';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Initialize form in constructor
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: [!this.isRegisterMode ? 'user' : null, !this.isRegisterMode ? Validators.required : []],
    });
  }

  toggleMode(event: Event): void {
    event.preventDefault();
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMessage = null;
    this.loginForm.reset();
    // Reinitialize form to update role field based on mode
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: [!this.isRegisterMode ? 'user' : null, !this.isRegisterMode ? Validators.required : []],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      const { email, password, role } = this.loginForm.value;
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

      if (this.isRegisterMode) {
        // Registration is for users only
        this.authService.register(email, password).subscribe({
          next: () => {
            this.loading = false;
            this.isRegisterMode = false;
            this.errorMessage = 'Registration successful! Please login.';
            // Reinitialize form for login mode
            this.loginForm = this.fb.group({
              email: ['', [Validators.required, Validators.email]],
              password: ['', Validators.required],
              role: ['user', Validators.required],
            });
          },
          error: (err: any) => {
            this.loading = false;
            this.errorMessage = err.error.message;
          },
        });
      } else {
        // Login mode
        if (role === 'admin' && email === this.ADMIN_EMAIL && password === this.ADMIN_PASSWORD) {
          // Admin login: Navigate to admin route
          this.loading = false;
          this.router.navigate(['/admin']);
        } else if (role === 'user') {
          // User login
          this.authService.login(email, password).subscribe({
            next: () => {
              this.loading = false;
              this.router.navigate([returnUrl]);
            },
            error: (err: any) => {
              this.loading = false;
              this.errorMessage = err.error.message;
            },
          });
        } else {
          // Invalid role or credentials
          this.loading = false;
          this.errorMessage = 'Invalid role or credentials.';
        }
      }
    }
  }
}