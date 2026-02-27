// src/app/facture/frequences/frequences-crud/frequences-crud.component.ts

import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";

import {FicheTechniques} from "../../../shared/models/ficheTechniques";
import {
  FicheFrequencesDTO,
  FicheFrequencesStation,
  FicheFrequencesCanal,
  FicheTechniquesFrequences,
  LigneTarifee,
  CategoryId
} from "../../../shared/models/frequences.types";

import {
  buildFicheForm,
  buildStationRow,
  buildCanalRow,
  getStationsFA,
  getCanauxFA,
  formToDTO
} from "../forms/frequences.form";

import {CATEGORY_CONFIG} from "../config/frequences-category.config";
import {FrequencesFicheService} from "../../../shared/services/frequences-fiche.service";
import {MsgMessageServiceService} from "../../../shared/services/msg-message-service.service";
import {DialogService} from "../../../shared/services/dialog.service";
import {operations} from "../../../constantes";

import {
  StationFrequencesDialogComponent,
  StationDialogData
} from "../modals/station-frequences-dialog/station-frequences-dialog.component";
import {
  CanalFrequencesDialogComponent,
  CanalDialogData
} from "../modals/canal-frequences-dialog/canal-frequences-dialog.component";
import {CategorieProduit} from "../../../shared/models/categorie-produit";
import {StatutFicheTechnique} from "../../../shared/models/statut-fiche-technique";
import {Client} from "../../../shared/models/client";
import {Produit} from "../../../shared/models/produit";
import {HistoriqueFicheTechnique} from "../../../shared/models/historique-traitement-fiche-technique";
import {FicheTechniquesService} from "../../../shared/services/fiche-techniques.service";
import {CategorieProduitService} from "../../../shared/services/categorie-produit.service";
import {ProduitService} from "../../../shared/services/produits.service";
import {ClientService} from "../../../shared/services/client.service";
import {StatutFicheTechniqueService} from "../../../shared/services/statut-fiche-technique.service";
import {MatTable} from "@angular/material/table";
import {TypeBandeFrequenceList} from "../../../shared/models/typeBandeFrequenceList";
import {TypeCanalList} from "../../../shared/models/typeCanalList";
import {TypeStation} from "../../../shared/models/type-station";
import {TypeBandesFrequenceService} from "../../../shared/services/type-bandes-frequence.service";
import {TypeStationService} from "../../../shared/services/type-station.service";
import {TypeCanauxService} from "../../../shared/services/type-canaux.service";
import {ZoneCouverture} from "../../../shared/models/zone-couverture";
import {ZoneCouvertureService} from "../../../shared/services/zone-couverture.service";


@Component({
  selector: 'frequences-crud',
  templateUrl: './frequences-crud.component.html'
})
export class FrequencesCrudComponent implements OnInit {

  @Input() operation: string;
  @Input() ficheTechnique: FicheTechniques;

  @Output() notifyActionOperation = new EventEmitter<string>();
  @Output() notifyFicheTechnique = new EventEmitter<FicheTechniques>();

  displayedColumnsStations: string[] = ['type_station','puissance_classe','nbre_station','debit_classe','largeur_bande_mhz','bande_frequence','type_usage','nbre_tranche','localite','actions'];
  displayedColumnsCanaux:  string[] = ['type_station','type_canal','zone_couverture','nbre_tranche_facturation','largeur_bande_khz','bande_frequence','actions'];

  @ViewChild('stationsTable') stationsTable: MatTable<any>;
  @ViewChild('canauxTable')  canauxTable: MatTable<any>;


  form: FormGroup;
  lignesTarifees: LigneTarifee[] = [];

  // catégorie courante, déduite de la fiche (step 1)
  cat: CategoryId;
  cfg = CATEGORY_CONFIG;

  loading = false;
  errorMsg = '';

  clients: Client[];
  client: Client;
  categories: CategorieProduit[];
  categoriesFiltered: CategorieProduit[];
  categorie: CategorieProduit;
  statutFicheTechniques: StatutFicheTechnique[];
  statutFicheTechnique: StatutFicheTechnique;
  historiqueFicheTechniques: HistoriqueFicheTechnique[];

  typeBandeFrequences : TypeBandeFrequenceList[];
  typeBandeFrequence : TypeBandeFrequenceList;
  typeCanaux:TypeCanalList[];
  tyepCanal:TypeCanalList;
  typeStations : TypeStation[];
  typeStation : TypeStation;
  zoneCouvertures:ZoneCouverture[];
  zoneCouverture:ZoneCouverture;

  // Gestion création / visibilité des steps
  isNew: boolean = true;
  showStationsStep: boolean = false;
  showCanauxStep: boolean = false;
  showTarifsStep: boolean = false;

  // 🔹 Stepper linéaire uniquement jusqu'à la validation de la fiche
  isLinear: boolean = true;


  protected readonly operations = operations;

  constructor(
    private fb: FormBuilder,
    private api: FrequencesFicheService,
    private msgService: MsgMessageServiceService,
    private dialogService: DialogService,
    private dialog: MatDialog,
    private ficheTechniquesService: FicheTechniquesService,
    private categorieProduitService: CategorieProduitService,
    private produitService: ProduitService,
    private clientService: ClientService,
    private typeBandesFrequenceService: TypeBandesFrequenceService,
    private typeStationService: TypeStationService,
    private typeCanauxService: TypeCanauxService,
    private zoneCouvertureService: ZoneCouvertureService,
    private statutFicheTechniqueService: StatutFicheTechniqueService,
  ) {
  }

  // Getters pratiques
  get ficheFG(): FormGroup {
    return this.form.get('fiche') as FormGroup;
  }

  get stationsFA(): FormArray {
    return getStationsFA(this.form);
  }

  get canauxFA(): FormArray {
    return getCanauxFA(this.form);
  }

  ngOnInit(): void {

    this.loadData();

    // 👉 Cas création : on ne bloque pas si ficheTechnique est null
    if (this.operation === operations.create) {
      this.isNew = true;
      this.initCreate();
      return;
    }

    // 👉 Cas édition / transmettre : là, il faut une fiche sélectionnée
    if (!this.ficheTechnique) {
      this.errorMsg = 'Aucune fiche sélectionnée';
      return;
    }

    // Catégorie connue pour les anciennes fiches
    this.cat = (this.ficheTechnique.categorie_produit as CategoryId) || 1;
    this.isNew = false;
    this.initUpdate();
  }

  loadData() {

    this.categorieProduitService.getListItems().subscribe((categories: CategorieProduit[]) => {
      this.categories = categories;
      this.categoriesFiltered = categories.filter(f => f.id < 8);
    });

    this.statutFicheTechniqueService.getListItems().subscribe((statutFicheTechniques: StatutFicheTechnique[]) => {
      this.statutFicheTechniques = statutFicheTechniques.filter(st => st.id < 7);
      this.statutFicheTechnique = statutFicheTechniques.find(st => st.id === 1);
    });

    this.clientService.getItems().subscribe((clients: Client[]) => {
      this.clients = clients;
    });

    if (this.ficheTechnique?.id) {
      this.ficheTechniquesService
        .getHistoriqueTraitementFicheTechnique(this.ficheTechnique.id)
        .subscribe((historiqueFicheTechniquesLoc: HistoriqueFicheTechnique[]) => {
          this.historiqueFicheTechniques = historiqueFicheTechniquesLoc;
        });
    } else {
      this.historiqueFicheTechniques = [];
    }

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

  onGetClient(item: Client) {
    this.client = item;
  }

  private initCreate() {
    this.loading = false;
    this.errorMsg = '';

    // Fiche "vide" pour initialiser le formulaire
    // 👉 Remets ici ton objet ficheFreq complet comme avant
    const ficheFreq: FicheTechniquesFrequences = {
      id: undefined,
      client: null,
      categorie_produit: null,
      objet: null,
      commentaire: null,
    } as any;

    // on démarre avec aucun station / canal
    this.form = buildFicheForm(this.fb, ficheFreq, [], []);

    // 👉 nouvelle fiche : steps 2–4 invisibles
    this.showStationsStep = false;
    this.showCanauxStep = false;
    this.showTarifsStep = false;

    // catégorie par défaut (sera mise à jour quand l’utilisateur choisit)
    this.cat = 1 as CategoryId;

    this.updateDisplayedColumns();

    // pour les nouvelles fiches : on met à jour cat dès que l'utilisateur choisit la catégorie
    this.ficheFG.get('categorie_produit')?.valueChanges.subscribe(val => {
      if (val != null) {
        this.cat = val as CategoryId;
        this.updateDisplayedColumns(); // <-- pour ajuster les colonnes
      }
    });

  }

  private initUpdate() {
    this.loading = true;
    this.errorMsg = '';

    this.api.get(this.ficheTechnique.id, {withLines: true}).subscribe({
      next: (dto: FicheFrequencesDTO) => {
        this.cat = dto.fiche.categorie_produit as CategoryId;
        this.form = buildFicheForm(this.fb, dto.fiche, dto.stations, dto.canaux);
        this.lignesTarifees = dto.lignes_tarifees ?? [];
        this.loading = false;

        this.updateDisplayedColumns();

        // 👉 fiche existante : tous les steps sont visibles
        this.showStationsStep = true;
        this.showCanauxStep = true;
        this.showTarifsStep = true;

        // pour les anciennes aussi, si on change de catégorie dans l'UI
        this.ficheFG.get('categorie_produit')?.valueChanges.subscribe(val => {
          if (val) {
            this.cat = val as CategoryId;
            this.updateDisplayedColumns();
          }
        });
      },
      error: (e) => {
        console.error('GET DTO failed:', e);
        this.errorMsg = `${e.status} ${e.statusText} — ${e?.error?.detail || e?.message || 'Chargement impossible'}`;
        this.loading = false;
      }
    });
  }

  // ---------- STATIONS : TABLE + MODALE ----------

  onOpenStationDialog(index?: number): void {
    let stationValue: FicheFrequencesStation | undefined;

    if (index != null) {
      const fg = this.stationsFA.at(index) as FormGroup;
      stationValue = fg.getRawValue() as FicheFrequencesStation;
    }

    const dialogRef = this.dialog.open<
      StationFrequencesDialogComponent,
      StationDialogData,
      FicheFrequencesStation
      >(StationFrequencesDialogComponent, {
      width: '800px',
      data: {
        station: stationValue,
        cat: this.cat
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return; // annulé
      }

      if (index != null) {
        // ✏️ modification d’une ligne existante
        (this.stationsFA.at(index) as FormGroup).patchValue(result);
      } else {
        // ➕ ajout d’une nouvelle station
        this.stationsFA.push(buildStationRow(this.fb, result, this.cat));
      }

      // 🔄 forcer le refresh visuel de la table
      this.stationsTable?.renderRows();
    });
  }



  // ---------- CANAUX : TABLE + MODALE ----------

  onOpenCanalDialog(index?: number): void {
    let canalValue: FicheFrequencesCanal | undefined;

    if (index != null) {
      const fg = this.canauxFA.at(index) as FormGroup;
      canalValue = fg.getRawValue() as FicheFrequencesCanal;
    }

    const dialogRef = this.dialog.open<
      CanalFrequencesDialogComponent,
      CanalDialogData,
      FicheFrequencesCanal
      >(CanalFrequencesDialogComponent, {
      width: '800px',
      data: {
        canal: canalValue,
        cat: this.cat
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return; // annulé
      }

      if (index != null) {
        // ✏️ modification
        (this.canauxFA.at(index) as FormGroup).patchValue(result);
      } else {
        // ➕ ajout
        this.canauxFA.push(buildCanalRow(this.fb, result, this.cat));
      }

      this.canauxTable?.renderRows();
    });
  }



  onRemoveStation(index: number): void {
    this.dialogService.yes_no({message: 'Supprimer cette station ?'})
      .subscribe(yes => {
        if (yes) {
          this.stationsFA.removeAt(index);
        }
      });
  }


  onRemoveCanal(index: number): void {
    this.dialogService.yes_no({message: 'Supprimer ce canal ?'})
      .subscribe(yes => {
        if (yes) {
          this.canauxFA.removeAt(index);
        }
      });
  }

  // ---------- VALIDATIONS PAR STEP ----------

  isFicheValid(): boolean {
    return this.ficheFG?.valid;
  }

  isStationsValid(): boolean {
    return this.stationsFA?.valid;
  }

  isCanauxValid(): boolean {
    return this.canauxFA?.valid;
  }

  // ---------- VALIDATION DU STEP 1 (FICHE) ----------

  onFicheStepValidated(): void {
    // sécurité au cas où
    if (!this.isFicheValid()) {
      this.ficheFG.markAllAsTouched();
      return;
    }

    // mettre à jour la catégorie depuis le form
    const catVal = this.ficheFG.get('categorie_produit')?.value;
    if (catVal != null) {
      this.cat = catVal as CategoryId;
      this.updateDisplayedColumns();   // <-- avant d’afficher les steps 2/3
    }

    // 👉 Nouvelle fiche : on NE crée PLUS de ligne par défaut
    if (this.isNew) {
      // on repart d'un FormArray propre, mais vide
      this.stationsFA.clear();
      this.canauxFA.clear();
      // ❌ plus de:
      // this.stationsFA.push(buildStationRow(this.fb, {}, this.cat));
      // this.canauxFA.push(buildCanalRow(this.fb, {}, this.cat));
      //
      // L’utilisateur devra cliquer sur "Ajouter une station"
      // ou "Ajouter un canal" pour créer la première ligne.
    }

    // 👉 Règle métier :
    // "Quand la fiche est validée (donc bouton Continuer actif),
    //  on rend visibles les steps Stations, Canaux et Lignes tarifées."
    this.showStationsStep = true;
    this.showCanauxStep   = true;
    this.showTarifsStep   = true;

    // 🔓 À partir de maintenant, on peut naviguer librement entre les steps
    this.isLinear = false;
  }


  // ---------- SAUVEGARDE / RECALCUL ----------

  private prepareDto(): FicheFrequencesDTO {
    const dto = formToDTO(this.form);
    const fiche = this.ficheFG.value as FicheTechniquesFrequences;

    dto.stations = (dto.stations || []).map(s => ({
      ...s,
      fiche_technique: fiche.id!,
      categorie_produit_id: fiche.categorie_produit!
    }));
    dto.canaux = (dto.canaux || []).map(c => ({
      ...c,
      fiche_technique: fiche.id!,
      categorie_produit_id: fiche.categorie_produit!
    }));
    return dto;
  }

  savePutAndRecalc() {
    const dto = this.prepareDto();
    this.loading = true;
    this.errorMsg = '';

    this.api.put(this.ficheTechnique.id, dto, {withLines: true}).subscribe({
      next: (res) => {
        this.form = buildFicheForm(this.fb, res.fiche, res.stations, res.canaux);
        this.lignesTarifees = res.lignes_tarifees ?? [];
        this.msgService.success('Fiche fréquences sauvegardée');
        this.loading = false;
      },
      error: (e) => {
        console.error('PUT failed:', e);
        this.errorMsg = 'Sauvegarde impossible';
        this.loading = false;
      }
    });
  }

  patchUpsert() {
    const dto = this.prepareDto();
    this.loading = true;
    this.errorMsg = '';

    this.api.patch(this.ficheTechnique.id, dto, {withLines: true}).subscribe({
      next: (res) => {
        this.form = buildFicheForm(this.fb, res.fiche, res.stations, res.canaux);
        this.lignesTarifees = res.lignes_tarifees ?? [];
        this.msgService.success('Fiche fréquences mise à jour');
        this.loading = false;
      },
      error: (e) => {
        console.error('PATCH failed:', e);
        this.errorMsg = 'Upsert impossible';
        this.loading = false;
      }
    });
  }

  recalcOnly() {
    this.loading = true;
    this.errorMsg = '';
    this.api.get(this.ficheTechnique.id, {withLines: true, recalc: true}).subscribe({
      next: (dto) => {
        this.form = buildFicheForm(this.fb, dto.fiche, dto.stations, dto.canaux);
        this.lignesTarifees = dto.lignes_tarifees ?? [];
        this.loading = false;
      },
      error: (e) => {
        console.error('Recalc failed:', e);
        this.errorMsg = 'Recalcul impossible';
        this.loading = false;
      }
    });
  }

  private updateDisplayedColumns(): void {
    const stationCfg = this.cfg[this.cat]?.stations;
    const canalCfg   = this.cfg[this.cat]?.canaux;

    // ---------- STATIONS ----------
    const sCols: string[] = [];

    // type_station
    if (!stationCfg || stationCfg.type_station?.visible !== false) {
      sCols.push('type_station');
    }
    // puissance_classe
    if (!stationCfg || stationCfg.puissance_classe?.visible !== false) {
      sCols.push('puissance_classe');
    }
    // nbre_station
    if (!stationCfg || stationCfg.nbre_station?.visible !== false) {
      sCols.push('nbre_station');
    }
    // debit_classe
    if (!stationCfg || stationCfg.debit_classe?.visible !== false) {
      sCols.push('debit_classe');
    }
    // largeur_bande_mhz
    if (!stationCfg || stationCfg.largeur_bande_mhz?.visible !== false) {
      sCols.push('largeur_bande_mhz');
    }
    // bande_frequence
    if (!stationCfg || stationCfg.bande_frequence?.visible !== false) {
      sCols.push('bande_frequence');
    }
    // type_usage
    if (!stationCfg || stationCfg.type_usage?.visible !== false) {
      sCols.push('type_usage');
    }
    // nbre_tranche
    if (!stationCfg || stationCfg.nbre_tranche?.visible !== false) {
      sCols.push('nbre_tranche');
    }
    // localite
    if (!stationCfg || stationCfg.localite?.visible !== false) {
      sCols.push('localite');
    }

    // actions toujours
    sCols.push('actions');
    this.displayedColumnsStations = sCols;

    // ---------- CANAUX ----------
    const cCols: string[] = [];

    // type_station (si tu l'affiches aussi côté canaux)
    if (!canalCfg || canalCfg.type_station?.visible !== false) {
      cCols.push('type_station');
    }
    // type_canal
    if (!canalCfg || canalCfg.type_canal?.visible !== false) {
      cCols.push('type_canal');
    }
    // zone_couverture
    if (!canalCfg || canalCfg.zone_couverture?.visible !== false) {
      cCols.push('zone_couverture');
    }
    // nbre_tranche_facturation
    if (!canalCfg || canalCfg.nbre_tranche_facturation?.visible !== false) {
      cCols.push('nbre_tranche_facturation');
    }
    // largeur_bande_khz
    if (!canalCfg || canalCfg.largeur_bande_khz?.visible !== false) {
      cCols.push('largeur_bande_khz');
    }
    // bande_frequence
    if (!canalCfg || canalCfg.bande_frequence?.visible !== false) {
      cCols.push('bande_frequence');
    }

    // actions toujours
    cCols.push('actions');
    this.displayedColumnsCanaux = cCols;
  }




  // ---------- RETOUR LISTE ----------
  onRetourListe() {
    this.notifyFicheTechnique.emit(this.ficheTechnique);
    this.notifyActionOperation.emit(operations.table);
  }
}
