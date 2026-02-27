import { AuthService } from '../auth.service';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginPayload } from '../auth.models';
import { Router } from '@angular/router';
import { take, finalize, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading: boolean = false;

  twoFaForm!: FormGroup;
  show2faForm: boolean = false;

  errorMessage: string = '';
  bgUrl = 'assets/images/background.png';

  private readonly DEFAULT_OTP_CODE = '002025';

  authErrorMsg: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });

    this.twoFaForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
    });

    this.authService.authError$.subscribe(msg => {
      this.authErrorMsg = msg;
      this.cdr.detectChanges();
    });
  }

  private isClient(user: any): boolean {
    const home = String(user?.home ?? '').toUpperCase();
    if (home) return home === 'PORTAIL_CLIENT';
    return String(user?.nature ?? '').toUpperCase() === 'CLIENT';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.authService.clearAuthError();

    const payload: LoginPayload = this.loginForm.value;

    this.authService.login(payload).pipe(
      take(1),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }),
      catchError(err => {
        this.errorMessage = err?.message || 'Erreur de connexion.';
        return throwError(() => err);
      })
    ).subscribe({
      next: (response) => {
        if (response?.detail) {
          // Bypass 2FA
          this.on2FaSubmit(this.DEFAULT_OTP_CODE);
          return;
        }

        // Si jamais ton endpoint login renvoie token direct (rare ici)
        if ((response as any)?.token) {
          this.router.navigate(['/facture/client-direction-technique']);
        }
      }
    });
  }

  on2FaSubmit(codeOverride?: string): void {
    if (!codeOverride && this.twoFaForm.invalid) {
      this.twoFaForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.authService.clearAuthError();

    const { email } = this.loginForm.value;
    const effectiveCode = codeOverride ?? this.twoFaForm.value.code;
    const payload = { email, code: effectiveCode };

    this.authService.verify2fa(payload).pipe(
      take(1),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }),
      catchError(err => {
        this.errorMessage = err?.message || 'Erreur lors de la vérification 2FA.';
        return throwError(() => err);
      })
    ).subscribe({
      next: (response: any) => {
        // ⚠️ Double sécurité : si l’AuthService a bloqué (personnel),
        // il a déjà nettoyé et redirigé login. On évite de naviguer ici.
        if (!response?.token || !this.isClient(response?.user)) {
          return;
        }

        // Navigation portail demandée
        this.router.navigate(['/facture/client-direction-technique']);
      }
    });
  }

  get loginF() {
    return this.loginForm.controls;
  }

  get twoFaF() {
    return this.twoFaForm.controls;
  }
}
