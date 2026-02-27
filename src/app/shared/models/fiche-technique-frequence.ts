// src/app/shared/models/fiche-technique-frequence.ts

import {StatutFicheTechnique} from "./statut-fiche-technique";

export class StationCanalRequest {
  // --- Ordre demandé ---
  produit!: number;
  type_station?: number | string | null;

  puissance?: number | null;
  puissance_unite?: string | null;

  nbre_station?: number | null;

  debit?: number | null;
  unite_debit?: string | null;

  largeur_bande!: number;
  largeur_bande_unite!: string;

  bande_frequence!: number | string;

  caractere_commercial?: string | null;

  nbre_tranche!: number;

  localite?: string | null;

  // --- Reste des propriétés ---
  type_canal!: number | string;
  zone_couverture!: number | string;

  created_at?: string;
  updated_at?: string;

  created_by?: number | null;
  updated_by?: number | null;
}


export class StationEquipementRequest {
  // --- Ordre demandé ---
  produit?: number | null;
  type_station!: number | string;

  puissance?: number | null;
  puissance_unite?: string | null;

  nbre_station?: number | null;

  debit?: number | null;
  unite_debit?: string | null;

  largeur_bande!: number;
  largeur_bande_unite!: string;

  bande_frequence!: number | string;

  caractere_commercial?: string | null;

  nbre_tranche?: number | null;

  localite!: string;

  // --- Reste des propriétés ---
  created_at?: string;
  updated_at?: string;

  created_by?: number | null;
  updated_by?: number | null;
}


export class FicheTechniqueFrequenceRequest {
  client!: number;
  categorie_produit?: number | null;
  objet?: string | null;
  commentaire?: string | null;

  statut?: StatutFicheTechnique;
  direction!: number;
  utilisateur?: number | null;
  date_creation?: string;
  position?: number | null;
  position_direction?: number | null;

  avis?: string | null;
  date_avis?: string | null;
  duree?: number | null;
  date_fin?: string | null;
  date_debut?: string | null;

  periode?: string | null;
  recurrente?: boolean | null;

  stations_canal?: StationCanalRequest[];
  stations_equipement?: StationEquipementRequest[];
}



export class StationCanal {
  // --- Toujours en premier ---
  id!: number;

  // --- Ordre demandé ---
  produit!: number;
  type_station?: number | string | null;

  puissance?: number | null;
  puissance_unite?: string | null;

  nbre_station?: number | null;

  debit?: number | null;
  unite_debit?: string | null;

  largeur_bande!: number;
  largeur_bande_unite!: string;

  bande_frequence!: number | string;

  caractere_commercial?: string | null;

  nbre_tranche!: number;

  localite?: string | null;

  // --- Reste des propriétés ---
  type_canal!: number | string;
  zone_couverture!: number | string;

  created_at?: string;
  updated_at?: string;

  created_by?: number | null;
  updated_by?: number | null;
}

export class StationEquipement {
  // Toujours en premier
  id!: number;

  // --- Ordre harmonisé ---
  produit?: number | null;
  type_station!: number | string;

  puissance?: number | null;
  puissance_unite?: string | null;

  nbre_station?: number | null;

  debit?: number | null;
  unite_debit?: string | null;

  largeur_bande!: number;
  largeur_bande_unite!: string;

  bande_frequence!: number | string;

  caractere_commercial?: string | null;

  nbre_tranche?: number | null;

  localite!: string;

  // --- Reste des propriétés ---
  created_at?: string;
  updated_at?: string;

  created_by?: number | null;
  updated_by?: number | null;
}


export class FicheTechniqueFrequence {
  id!: number;

  client!: number;
  client_nom!: string;

  categorie_produit?: number | null;
  objet?: string | null;
  commentaire?: string | null;
  statut?: StatutFicheTechnique | null;

  direction!: number;
  utilisateur?: number | null;
  date_creation?: string;
  position?: number | null;
  position_direction?: number | null;

  avis?: string | null;
  date_avis?: string | null;
  duree?: number | null;
  date_fin?: string | null;
  date_debut?: string | null;

  periode?: string | null;
  recurrente?: boolean | null;

  stations_canal?: StationCanal[];
  stations_equipement?: StationEquipement[];
}
