/// PORTAIL CLIENT ---- src/app/authentication/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import {
  LoginPayload, LoginResponse, TwoFaPayload, AuthState, User,
  PasswordResetPayload, PasswordResetConfirmPayload, VerifyResetCodePayload
} from './auth.models';

import { Utilisateur } from '../shared/models/utilisateur';
import { UtilisateurRole } from '../shared/models/droits-utilisateur';
import { AppConfigService } from '../core/config/app-config.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private get apiUrl(): string {
    return this.cfg.baseUrl.replace(/\/$/, '');
  }

  private authState = new BehaviorSubject<AuthState>(this.getInitialState());
  public authState$ = this.authState.asObservable();

  private authErrorSubject = new BehaviorSubject<string | null>(
    sessionStorage.getItem('auth_error')
  );
  public authError$ = this.authErrorSubject.asObservable();

  private readonly CLIENT_ID_KEY = 'client_id';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cfg: AppConfigService
  ) {}

  private getInitialState(): AuthState {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? (JSON.parse(userStr) as User) : null;
    return { isAuthenticated: !!token, token, user };
  }

  private setAuthError(msg: string | null): void {
    this.authErrorSubject.next(msg);
    if (msg) sessionStorage.setItem('auth_error', msg);
    else sessionStorage.removeItem('auth_error');
  }

  clearAuthError(): void {
    this.setAuthError(null);
  }

  // ✅ Détection interne/backoffice (bloquante)
  private isClearlyBackoffice(util: any): boolean {
    const home = String(util?.home ?? '').toUpperCase();
    const nature = String(util?.nature ?? '').toUpperCase();
    return home === 'BACKOFFICE' || nature === 'PERSONNEL' || util?.is_staff === true;
  }

  private extractClientId(util: any): number | null {
    const v = util?.client ??  null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  // ✅ Validation souple (évite rejet si OTP renvoie user “light”)
  private validateClientProfile(util: any): string | null {
    if (!util) return 'Profil utilisateur invalide.';

    if (this.isClearlyBackoffice(util)) {
      return "Cette application est réservée aux clients. Veuillez utiliser l'application Backoffice.";
    }

    const home = String(util?.home ?? '').toUpperCase();
    const nature = String(util?.nature ?? '').toUpperCase();
    const clientId = this.extractClientId(util);

    const looksClient = home === 'PORTAIL_CLIENT' || nature === 'CLIENT' || clientId !== null;
    if (!looksClient) return "Profil non compatible avec le Portail Client.";

    return null;
  }

  private hardLogoutToLogin(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('UtilisateurConnecte');
    sessionStorage.removeItem('utilisateurRole');
    sessionStorage.removeItem(this.CLIENT_ID_KEY);
    this.authState.next({ isAuthenticated: false, token: null, user: null });
    this.router.navigate(['/auth/login']);
  }

  setClientId(clientId: number | null | undefined): void {
    if (clientId === null || clientId === undefined) {
      sessionStorage.removeItem(this.CLIENT_ID_KEY);
      return;
    }
    sessionStorage.setItem(this.CLIENT_ID_KEY, String(clientId));
  }

  getClientId(): number | null {
    const v = sessionStorage.getItem(this.CLIENT_ID_KEY);
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  // ✅ PATCH: si /auth/login/ renvoie un token, on l’applique comme verify2fa
  login(payload: LoginPayload): Observable<LoginResponse> {
    this.setAuthError(null);
    const url = `${this.apiUrl}/auth/login/`;

    return this.http.post<LoginResponse>(url, payload).pipe(
      tap((response: any) => {
        if (!response?.token) return;

        const msg = this.validateClientProfile(response.user);
        if (msg) {
          this.setAuthError(msg);
          this.hardLogoutToLogin();
          return;
        }

        this.setToken(response.token, response.user);
        const clientId = this.extractClientId(response.user);
        this.setClientId(clientId);
        this.setConnectedUser(response.user as unknown as Utilisateur);
      }),
      catchError(this.handleError)
    );
  }

  verify2fa(payload: TwoFaPayload): Observable<LoginResponse> {
    const url = `${this.apiUrl}/auth/verify-otp/`;
    return this.http.post<LoginResponse>(url, payload).pipe(
      tap((response: any) => {
        if (!response?.token) return;

        console.log('OTP user:', response.user);
        console.log('isClearlyBackoffice:', this.isClearlyBackoffice(response.user));
        console.log('clientId extracted:', this.extractClientId(response.user));
        console.log('validate msg:', this.validateClientProfile(response.user));

        const msg = this.validateClientProfile(response.user);
        if (msg) {
          this.setAuthError(msg);
          this.hardLogoutToLogin();
          return;
        }

        this.setToken(response.token, response.user);

        const clientId = this.extractClientId(response.user);
        this.setClientId(clientId);
        this.setConnectedUser(response.user as unknown as Utilisateur);
      }),
      catchError(this.handleError)
    );
  }

  private setToken(token: string, user: User): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.authState.next({ isAuthenticated: true, token, user });
  }

  public getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setConnectedUser(utilisateur: Utilisateur): void {
    sessionStorage.setItem('UtilisateurConnecte', JSON.stringify(utilisateur));
  }

  getConnectedUser(): Utilisateur | null {
    const s = sessionStorage.getItem('UtilisateurConnecte');
    return s ? (JSON.parse(s) as Utilisateur) : null;
  }

  // optionnel (si du code existant l’utilise)
  setConnectedUtilisateurRole(utilisateurRole: UtilisateurRole): void {
    sessionStorage.setItem('utilisateurRole', JSON.stringify(utilisateurRole));
  }
  getConnectedUtilisateurRole(): UtilisateurRole | null {
    const s = sessionStorage.getItem('utilisateurRole');
    return s ? (JSON.parse(s) as UtilisateurRole) : null;
  }

  logout(): void {
    this.setAuthError(null);
    this.hardLogoutToLogin();
  }

  public isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && this.isTokenValid(token);
  }

  private isTokenValid(_token: string): boolean {
    return true; // placeholder
  }

  requestPasswordReset(payload: PasswordResetPayload): Observable<any> {
    const url = `${this.apiUrl}/password_reset/`;
    return this.http.post(url, payload).pipe(catchError(this.handleError));
  }

  verifyResetCode(payload: VerifyResetCodePayload): Observable<any> {
    const url = `${this.apiUrl}/password_reset/verify-reset-code/`;
    return this.http.post(url, payload).pipe(catchError(this.handleError));
  }

  confirmPasswordReset(payload: PasswordResetConfirmPayload): Observable<any> {
    const url = `${this.apiUrl}/password_reset/confirm/`;
    return this.http.post(url, payload).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      if (error.error?.message !== undefined) {
        errorMessage = error.error.message || 'Identifiants ou code 2FA incorrects.';
      } else if (error.error?.detail !== undefined) {
        errorMessage = error.error.detail;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage = JSON.stringify(error.error ?? {});
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
