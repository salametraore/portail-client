// src/app/facture/frequences/modals/station-frequences-dialog/station-frequences-dialog.component.ts

import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

import {FicheFrequencesStation, CategoryId} from "../../../../shared/models/frequences.types";
import {buildStationRow} from "../../forms/frequences.form";
import {CATEGORY_CONFIG} from "../../config/frequences-category.config";
import {TypeCanalList} from "../../../../shared/models/typeCanalList";
import {TypeStation} from "../../../../shared/models/type-station";
import {TypeBandeFrequenceList} from "../../../../shared/models/typeBandeFrequenceList";
import {TypeBandesFrequenceService} from "../../../../shared/services/type-bandes-frequence.service";
import {TypeStationService} from "../../../../shared/services/type-station.service";
import {TypeCanauxService} from "../../../../shared/services/type-canaux.service";
import {ZoneCouverture} from "../../../../shared/models/zone-couverture";
import {ZoneCouvertureService} from "../../../../shared/services/zone-couverture.service";

export interface StationDialogData {
  station?: FicheFrequencesStation;
  cat: CategoryId;   // 🔹 comme pour Canal : on passe la catégorie
}

@Component({
  selector: 'app-station-frequences-dialog',
  templateUrl: './station-frequences-dialog.component.html'
})
export class StationFrequencesDialogComponent implements OnInit {

  form: FormGroup;
  title = "Ajouter une station";

  typeBandeFrequences : TypeBandeFrequenceList[];
  typeBandeFrequence : TypeBandeFrequenceList;
  typeCanaux:TypeCanalList[];
  tyepCanal:TypeCanalList;
  typeStations : TypeStation[];
  typeStation : TypeStation;
  zoneCouvertures:ZoneCouverture[];
  zoneCouverture:ZoneCouverture;

  // config de la catégorie courante
  cfg = CATEGORY_CONFIG[1 as CategoryId];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<StationFrequencesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StationDialogData,
    private typeBandesFrequenceService: TypeBandesFrequenceService,
    private typeStationService: TypeStationService,
    private typeCanauxService: TypeCanauxService,
    private zoneCouvertureService: ZoneCouvertureService,
  ) {}

  // petit alias pratique pour le template
  get stationCfg() {
    return this.cfg.stations;
  }

  ngOnInit(): void {
    this.title = this.data.station ? 'Modifier la station' : 'Ajouter une station';

    // mettre la bonne config de catégorie
    this.cfg = CATEGORY_CONFIG[this.data.cat];

    this.loadData();

    // FormGroup déjà construit dynamiquement selon la catégorie
    this.form = buildStationRow(this.fb, this.data.station ?? {}, this.data.cat);
  }

  onCancel() {
    this.dialogRef.close();
  }

  loadData(): void {
    this.typeCanauxService.getListItems().subscribe((listeCanaux: TypeCanalList[]) => {
      console.log("listeCanaux");
      console.log(listeCanaux);
      this.typeCanaux = listeCanaux;
    });

    this.typeStationService.getListItems().subscribe((listeTypeStations: TypeStation[]) => {
      console.log("listeTypeStations");
      console.log(listeTypeStations);
      this.typeStations = listeTypeStations;
    });

    this.typeBandesFrequenceService.getListItems().subscribe((listeTypeBandesFreq: TypeBandeFrequenceList[]) => {
      console.log("listeTypeBandesFreq");
      console.log(listeTypeBandesFreq);
      this.typeBandeFrequences = listeTypeBandesFreq;
    });

    this.zoneCouvertureService.getListItems().subscribe((listeZones: ZoneCouverture[]) => {
      console.log("listeZones");
      console.log(listeZones);
      this.zoneCouvertures = listeZones;
    });

  }


  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue() as FicheFrequencesStation;

    // sécurité : on s’assure que la catégorie est bien posée
    if (!value.categorie_produit_id) {
      value.categorie_produit_id = this.data.cat;
    }

    console.log('STATION renvoyée par la modale :', value);
    this.dialogRef.close(value);   // 🔁 renvoi au parent
  }

}
