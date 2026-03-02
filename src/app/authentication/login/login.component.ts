/* PORTAIL CLIENT ---- src/app/authentication/login/login.component.ts */

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

    // Message “persisté” par AuthService (ex: blocage backoffice)
    this.authService.authError$.subscribe(msg => {
      this.authErrorMsg = msg;
      this.cdr.detectChanges();
    });
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
      next: (response: any) => {
        if (response?.detail) {
          // Bypass 2FA
          this.on2FaSubmit(this.DEFAULT_OTP_CODE);
          return;
        }

        // Si jamais ton endpoint login renvoie token direct
        if (response?.token) {
          // ✅ ne navigue que si le token est réellement stocké/valide
          if (this.authService.isAuthenticated()) {
            this.router.navigate(['/facture/client-direction-technique']);
          }
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
      next: (_response: any) => {
        /**
         * ✅ IMPORTANT
         * On ne se base PAS sur response.user / response.token pour décider :
         * - si AuthService a bloqué (profil interne ou incohérent), il a fait hardLogoutToLogin()
         *   => token non stocké => isAuthenticated() = false
         * - si OK, le token est stocké => isAuthenticated() = true
         */
        if (!this.authService.isAuthenticated()) {
          return;
        }

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
