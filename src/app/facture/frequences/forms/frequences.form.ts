///frequence.forms.ts

import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  FicheFrequencesDTO, FicheFrequencesCanal, FicheFrequencesStation, FicheTechniquesFrequences
} from 'src/app/shared/models/frequences.types';
import { CATEGORY_CONFIG, CategoryId, requiredIf } from '../config/frequences-category.config';

export function buildFicheForm(
  fb: FormBuilder,
  fiche?: FicheTechniquesFrequences,
  stations?: FicheFrequencesStation[],
  canaux?: FicheFrequencesCanal[],
): FormGroup {
  return fb.group({
    fiche: fb.group({
      id: new FormControl(fiche?.id),
      client: new FormControl(fiche?.client, Validators.required),
      client_nom: new FormControl(fiche?.client_nom),
      direction: new FormControl(fiche?.direction),
      utilisateur: new FormControl(fiche?.utilisateur),
      date_creation: new FormControl(fiche?.date_creation),
      position: new FormControl(fiche?.position),
      position_direction: new FormControl(fiche?.position_direction),
      categorie_produit: new FormControl(fiche?.categorie_produit, Validators.required),
      statut: new FormControl(fiche?.statut),
      objet: new FormControl(fiche?.objet),
      commentaire: new FormControl(fiche?.commentaire),
      avis: new FormControl(fiche?.avis),
      duree: new FormControl(fiche?.duree),
      date_fin: new FormControl(fiche?.date_fin),
      date_debut: new FormControl(fiche?.date_debut),
      periode: new FormControl(fiche?.periode),
    }),
    stations: fb.array(stations?.map(s => buildStationRow(fb, s, (fiche?.categorie_produit as CategoryId) || 1)) ?? []),
    canaux:   fb.array(canaux?.map(c => buildCanalRow(  fb, c, (fiche?.categorie_produit as CategoryId) || 1)) ?? []),
  });
}

export function buildStationRow(
  fb: FormBuilder,
  s: Partial<FicheFrequencesStation> = {},
  cat: CategoryId
) {
  const cfg = CATEGORY_CONFIG[cat].stations;
  return fb.group({
    id:                   new FormControl(s.id),
    fiche_technique:      new FormControl(s.fiche_technique),
    categorie_produit_id: new FormControl(s.categorie_produit_id),

    // ⬇️ Validators et "obligatoire" dynamiques selon la catégorie
    type_station:         new FormControl(s.type_station,      requiredIf(cfg.type_station)),
    puissance_classe:     new FormControl(s.puissance_classe,  requiredIf(cfg.puissance_classe)),
    nbre_station:         new FormControl(s.nbre_station,      requiredIf(cfg.nbre_station)),
    debit_classe:         new FormControl(s.debit_classe,      requiredIf(cfg.debit_classe)),
    largeur_bande_mhz:    new FormControl(s.largeur_bande_mhz, requiredIf(cfg.largeur_bande_mhz)),
    bande_frequence:      new FormControl(s.bande_frequence ?? 'NA', requiredIf(cfg.bande_frequence)),
    type_usage:           new FormControl(s.type_usage,        requiredIf(cfg.type_usage)),
    nbre_tranche:         new FormControl(s.nbre_tranche,      requiredIf(cfg.nbre_tranche)),
    localite:             new FormControl(s.localite,          requiredIf(cfg.localite)),
  });
}


export function buildCanalRow(fb: FormBuilder, c: Partial<FicheFrequencesCanal>, cat: CategoryId) {
  const cfg = CATEGORY_CONFIG[cat].canaux;
  return fb.group({
    id:                        new FormControl(c.id),
    fiche_technique:           new FormControl(c.fiche_technique),
    categorie_produit_id:      new FormControl(c.categorie_produit_id),
    type_station:              new FormControl(c.type_station, requiredIf(cfg.type_station)),
    type_canal:                new FormControl(c.type_canal, requiredIf(cfg.type_canal)),
    zone_couverture:           new FormControl(c.zone_couverture, requiredIf(cfg.zone_couverture)),
    nbre_tranche_facturation:  new FormControl(c.nbre_tranche_facturation ?? 1, [ ...(cfg.nbre_tranche_facturation.required ? [Validators.required] : []), Validators.min(1)]),
    largeur_bande_khz:         new FormControl(c.largeur_bande_khz, requiredIf(cfg.largeur_bande_khz)),
    bande_frequence:           new FormControl(c.bande_frequence ?? 'NA', requiredIf(cfg.bande_frequence)),
    mode_duplex:               new FormControl(c.mode_duplex ?? 'DUPLEX', requiredIf(cfg.mode_duplex)),
  });
}

/** Helpers */
export const getStationsFA = (form: FormGroup) => form.get('stations') as FormArray;
export const getCanauxFA   = (form: FormGroup) => form.get('canaux') as FormArray;

export function formToDTO(form: FormGroup): FicheFrequencesDTO {
  const v = form.getRawValue();
  return {
    fiche: v.fiche,
    stations: v.stations ?? [],
    canaux: v.canaux ?? [],
  };
}
