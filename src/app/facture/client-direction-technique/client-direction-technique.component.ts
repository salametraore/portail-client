import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Client } from '../../shared/models/client';
import { ClientService } from '../../shared/services/client.service';
import { AuthService } from '../../authentication/auth.service';

@Component({
  selector: 'client-direction-technique',
  templateUrl: './client-direction-technique.component.html',
  styleUrl: './client-direction-technique.component.scss',
})
export class ClientDirectionTechniqueComponent implements OnInit {
  form!: FormGroup;
  loadingClient = false;

  clientId: number | null = null;
  client: Client | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private clientService: ClientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1) récupérer client_id depuis sessionStorage
    this.clientId = this.authService.getClientId();

    if (!this.clientId) {
      // pas de client_id => session expirée / non connecté
      this.authService.logout();
      return;
    }

    // 2) construire le form (comme clients-crud)
    this.buildForm();

    // 3) charger détails client connecté
    this.loadClient(this.clientId);
  }

  private buildForm(): void {
    this.form = this.fb.group({
      // Identité
      denomination_sociale: [''],
      type: [''],
      ifu: [null],
      rccm: [''],
      first_name: [''],
      last_name: [''],

      // Comptes
      compte_comptable: [null],
      compte_banque: [null],

      // Contact
      email: [''],
      adresse: [''],
      telephone: [''],
      qualite: [''],
      telephone_rep_legal: [null],
      email_rep_legal: [null],

      // Web / Geo
      site_web: [null],
      google_maps: [null],
      longitude: [null],
      latitude: [null],

      // Flags
      strategique: [false],
      mauvais_payeur: [false],
      litige: [false],

      // si tu as encore ce champ dans ton modèle
      utilisateur: [null]
    });
  }

  private loadClient(id: number): void {
    this.loadingClient = true;
    this.clientService.getItem(id).subscribe({
      next: (c: Client) => {
        this.client = c;
        this.form.patchValue(c);
        this.loadingClient = false;
      },
      error: () => {
        this.loadingClient = false;
      }
    });
  }

  // bouton “Voir détails client”
  viewClientDetails(): void {
    if (!this.clientId) return;
    this.router.navigate(['/facture/client-direction-technique-detail', this.clientId]);
  }

  // helper template
  get f() {
    return this.form.controls;
  }
}
