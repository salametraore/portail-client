
///frequences-category.config.ts

import { Validators } from '@angular/forms';
import { BandeFreq, ModeDuplex, PuissanceClasse, TypeUsage } from 'src/app/shared/models/frequences.types';

/*
1 : PMR (privé)
2 : Aéronautique
3 : Mobiles ouverts au public
4 : Fixes
5 : Radio/TV/MMDS
6 : Satellite
7 : Amateur/Expérimental
 */

export type CategoryId = 1|2|3|4|5|6|7;

export interface FieldRule {
  visible: boolean;
  required?: boolean;
}

export interface StationRuleSet {
  type_station: FieldRule;
  puissance_classe: FieldRule;
  nbre_station: FieldRule;
  debit_classe: FieldRule;
  largeur_bande_mhz: FieldRule;
  bande_frequence: FieldRule;
  type_usage: FieldRule;
  nbre_tranche: FieldRule;
  localite: FieldRule;
}

export interface CanalRuleSet {
  type_station: FieldRule;
  type_canal: FieldRule;
  zone_couverture: FieldRule;
  nbre_tranche_facturation: FieldRule;
  largeur_bande_khz: FieldRule;
  bande_frequence: FieldRule;
  mode_duplex: FieldRule;
}

export interface CategoryConfig {
  stations: StationRuleSet;
  canaux:   CanalRuleSet;
  // Options éventuelles (bornes/valeurs) pour listes dépendantes de la catégorie
  bandeFreqOptions?: BandeFreq[];
  puissanceOptions?: PuissanceClasse[];
  usageOptions?: TypeUsage[];
  modeDuplexOptions?: ModeDuplex[];
}

/** Raccourcis */
const V = (required=false): FieldRule => ({ visible: true, required });
const H = (): FieldRule => ({ visible: false });

export const CATEGORY_CONFIG: Record<CategoryId, CategoryConfig> = {
  /** a) PMR privé */
  1: {
    stations: {
      type_station: V(true),
      puissance_classe: V(true), // si mobile/portative -> à gérer côté UI (sinon ignore)
      nbre_station: V(true),
      debit_classe: H(),
      largeur_bande_mhz: H(),
      bande_frequence: V(true),
      type_usage: H(),
      nbre_tranche: H(),
      localite: H(),
    },
    canaux: {
      type_station: H(),
      type_canal: V(true),
      zone_couverture: V(true),
      nbre_tranche_facturation: V(true),
      largeur_bande_khz: V(true),
      bande_frequence: V(true), // UHF/VHF
      mode_duplex: V(true),     // Duplex/Simplex si utile pour le calcul
    },
    bandeFreqOptions: ['UHF','VHF','NA'],
    puissanceOptions: ['LEQ_5W','GT_5W','NA'],
  },

  /** b) Aéronautique */
  2: {
    stations: {
      type_station: V(true),
      puissance_classe: H(),
      nbre_station: V(true),
      debit_classe: H(),
      largeur_bande_mhz: H(),
      bande_frequence: H(),
      type_usage: H(),
      nbre_tranche: H(),
      localite: H(),
    },
    canaux: {
      type_station: H(),
      type_canal: H(),
      zone_couverture: H(),
      nbre_tranche_facturation: H(),
      largeur_bande_khz: H(),
      bande_frequence: H(),
      mode_duplex: H(),
    }
  },

  /** c) Mobiles ouverts au public */
  3: {
    stations: {
      type_station: V(true),
      puissance_classe: H(),
      nbre_station: V(true),
      debit_classe: H(),
      largeur_bande_mhz: H(),
      bande_frequence: H(),
      type_usage: H(),
      nbre_tranche: H(),
      localite: H(),
    },
    canaux: {
      type_station: H(),
      type_canal: V(true),
      zone_couverture: V(true),
      nbre_tranche_facturation: V(true),
      largeur_bande_khz: V(true),
      bande_frequence: V(true), // <=2.3GHz, >2.3GHz (mappe vers LEQ_2_3_GHZ/GT_2_3_GHZ)
      mode_duplex: V(true),
    },
    bandeFreqOptions: ['LEQ_2_3_GHZ','GT_2_3_GHZ','NA'],
  },

  /** d) Fixes */
  4: {
    stations: {
      type_station: V(true),
      puissance_classe: V(true),
      nbre_station: V(true),
      debit_classe: H(),
      largeur_bande_mhz: H(),
      bande_frequence: H(),
      type_usage: H(),
      nbre_tranche: H(),
      localite: H(),
    },
    canaux: {
      type_station: V(true), // requis
      type_canal: V(true),
      zone_couverture: V(true),
      nbre_tranche_facturation: V(true),
      largeur_bande_khz: V(true),
      bande_frequence: V(true), // <=3GHz, >3GHz
      mode_duplex: V(true),
    },
    bandeFreqOptions: ['LEQ_3_GHZ','GT_3_GHZ','NA'],
    puissanceOptions: ['LEQ_5W','GT_5W','NA'],
  },

  /** e) Radio/TV/MMDS */
  5: {
    stations: {
      type_station: V(true),
      puissance_classe: V(true), // <=500W/>500W (tu peux mapper vers LEQ_500W/GT_500W)
      nbre_station: V(true),
      debit_classe: H(),
      largeur_bande_mhz: V(true),  // largeur d'une bande d'une tranche (utile TV)
      bande_frequence: V(true),
      type_usage: V(true),         // COMMERCIALE/NON_COMMERCIALE
      nbre_tranche: V(true),
      localite: V(true),
    },
    canaux: {
      type_station: H(),
      type_canal: V(true),
      zone_couverture: V(true),
      nbre_tranche_facturation: V(true),
      largeur_bande_khz: V(true),
      bande_frequence: V(true),
      mode_duplex: H(),
    },
    bandeFreqOptions: ['UHF','VHF','NA'],
    puissanceOptions: ['LEQ_500W','GT_500W','NA'],
    usageOptions: ['COMMERCIALE','NON_COMMERCIALE'],
  },

  /** f) Satellite */
  6: {
    stations: {
      type_station: V(true),
      puissance_classe: H(),
      nbre_station: V(true),      // si portable/transportable
      debit_classe: V(true),      // si VSAT/DAMA
      largeur_bande_mhz: V(true), // si station terrienne réseau public
      bande_frequence: H(),
      type_usage: H(),
      nbre_tranche: H(),
      localite: H(),
    },
    canaux: {
      type_station: V(true), // pour lier le canal à un type station si besoin
      type_canal: V(true),
      zone_couverture: V(true),
      nbre_tranche_facturation: V(true),
      largeur_bande_khz: V(true),
      bande_frequence: H(),
      mode_duplex: H(),
    }
  },

  /** g) Amateur/Expérimental */
  7: {
    stations: {
      type_station: V(true),
      puissance_classe: H(),
      nbre_station: V(true),
      debit_classe: H(),
      largeur_bande_mhz: H(),
      bande_frequence: H(),
      type_usage: H(),
      nbre_tranche: H(),
      localite: H(),
    },
    canaux: {
      type_station: H(),
      type_canal: H(),
      zone_couverture: H(),
      nbre_tranche_facturation: H(),
      largeur_bande_khz: H(),
      bande_frequence: H(),
      mode_duplex: H(),
    }
  },
};

/** Helpers validators par champ */
export const requiredIf = (rule: FieldRule) => (rule.required ? [Validators.required] : []);
