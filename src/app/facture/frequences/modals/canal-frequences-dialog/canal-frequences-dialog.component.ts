// src/app/facture/frequences/modals/canal-frequences-dialog/canal-frequences-dialog.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { FicheFrequencesCanal, CategoryId } from '../../../../shared/models/frequences.types';
import { buildCanalRow } from '../../forms/frequences.form';
import { CATEGORY_CONFIG } from '../../config/frequences-category.config';
import {TypeCanalList} from "../../../../shared/models/typeCanalList";
import {TypeStation} from "../../../../shared/models/type-station";
import {TypeBandeFrequenceList} from "../../../../shared/models/typeBandeFrequenceList";
import {TypeBandesFrequenceService} from "../../../../shared/services/type-bandes-frequence.service";
import {TypeStationService} from "../../../../shared/services/type-station.service";
import {TypeCanauxService} from "../../../../shared/services/type-canaux.service";
import {ZoneCouverture} from "../../../../shared/models/zone-couverture";
import {ZoneCouvertureService} from "../../../../shared/services/zone-couverture.service";

export interface CanalDialogData {
  canal?: FicheFrequencesCanal;
  cat: CategoryId;   // catégorie courante (1..)
}

@Component({
  selector: 'app-canal-frequences-dialog',
  templateUrl: './canal-frequences-dialog.component.html'
})
export class CanalFrequencesDialogComponent implements OnInit {

  form: FormGroup;
  title = 'Ajouter un canal';

  // config de la catégorie courante (même principe que pour les stations)
  cfg = CATEGORY_CONFIG[1 as CategoryId];

  typeBandeFrequences : TypeBandeFrequenceList[];
  typeBandeFrequence : TypeBandeFrequenceList;
  typeCanaux:TypeCanalList[];
  tyepCanal:TypeCanalList;
  typeStations : TypeStation[];
  typeStation : TypeStation;
  zoneCouvertures:ZoneCouverture[];
  zoneCouverture:ZoneCouverture;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CanalFrequencesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CanalDialogData,
    private typeBandesFrequenceService: TypeBandesFrequenceService,
    private typeStationService: TypeStationService,
    private typeCanauxService: TypeCanauxService,
    private zoneCouvertureService: ZoneCouvertureService,
  ) {}

  // alias pratique pour le template
  get canalCfg() {
    return this.cfg.canaux;
  }

  ngOnInit(): void {
    this.title = this.data.canal ? 'Modifier le canal' : 'Ajouter un canal';

    // mettre la bonne config de catégorie
    this.cfg = CATEGORY_CONFIG[this.data.cat];

    this.loadData();

    // FormGroup construit dynamiquement selon la catégorie
    this.form = buildCanalRow(this.fb, this.data.canal ?? {}, this.data.cat);
  }

  loadData(): void {
    this.typeCanauxService.getListItems().subscribe((listeCanaux: TypeCanalList[]) => {
      this.typeCanaux = listeCanaux;
    });

    this.typeStationService.getListItems().subscribe((listeTypeStations: TypeStation[]) => {
      this.typeStations = listeTypeStations;
    });

    this.typeBandesFrequenceService.getListItems().subscribe((listeTypeBandesFreq: TypeBandeFrequenceList[]) => {
      this.typeBandeFrequences = listeTypeBandesFreq;
    });

    this.zoneCouvertureService.getListItems().subscribe((listeZones: ZoneCouverture[]) => {
      this.zoneCouvertures = listeZones;
    });

  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    console.log("onSave");

 /*   if (this.form.invalid) {
      console.log("form invalide")
      this.form.markAllAsTouched();
      return;
    }*/

    const value = this.form.getRawValue() as FicheFrequencesCanal;
    console.log("value");
    console.log(value);

    if (!value.categorie_produit_id) {
      value.categorie_produit_id = this.data.cat;
    }

    console.log('CANAL renvoyé par la modale :', value);
    this.dialogRef.close(value);   // 🔁 renvoi au parent
  }


}
