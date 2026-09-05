import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { DataGridComponent } from '../../components/data-grid/data-grid.component';
import { Colonne } from '../../interface/app.interface';
import { AnagraficaWrapperComponent } from '../../layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { outfitCategories, OutfitsService } from '../../services/outfit.service';
import { PopUpService } from '../../services/popup.service';
import { confirm } from '../../widgets/ui-dialogs';

@Component({
  selector: 'app-outfit-category',
  standalone: true,
  imports: [DataGridComponent, CommonModule, AnagraficaWrapperComponent, RouterLink],
  templateUrl: './outfit-category.component.html',
  styleUrl: './outfit-category.component.scss'
})
export class OutfitCategoryComponent {
  colOutfitsCategory: Colonne[] = [
    {
      itemType: 'group',
      groupDataField: '',
      data: [
        {
          type: 'campo',
          colVisible: true,
          allowEditing: true,
          dataField: 'id',
          colWidth: '50',
          caption: '',
          colCaption: '',
          class: '',
          edit: false,
          groupDataField: undefined
        },
        {
          type: 'campoImg',
          colVisible: true,
          allowEditing: true,
          dataField: 'imageUrl',
          colWidth: '77',
          class: 'outfit-image',
          colCaption: 'Immagine',
          allowFiltering: undefined,
          edit: undefined,
          groupDataField: undefined
        },
        {
          type: 'campo',
          colVisible: true,
          allowEditing: true,
          dataField: 'categoryName',
          colWidth: '200',
          colCaption: 'Categoria',
          edit: undefined,
          groupDataField: undefined
        },
        {
          type: 'campo',
          colVisible: true,
          allowEditing: true,
          dataField: 'parentCategory',
          colWidth: '90',
          colCaption: 'Parent',
          edit: undefined,
          groupDataField: undefined
        },
        {
          type: 'campoLista',
          colVisible: true,
          allowEditing: true,
          dataField: 'status',
          colWidth: '110',
          colCaption: 'Stato',
          allowFiltering: undefined,
          edit: undefined,
          groupDataField: undefined,
          lista: {
            valueExp: 'id',
            displayExp: 'value',
            multiple: false,
            parent: null,
            remote: false,
            options: [
              { id: '1', value: 'Attivo' },
              { id: '0', value: 'Non attivo' }
            ]
          }
        },
        {
          type: 'campoNumber',
          colVisible: true,
          allowEditing: true,
          dataField: 'order',
          colWidth: '70',
          colCaption: 'Ordine',
          edit: undefined,
          groupDataField: undefined
        },
        {
          type: 'campoDateTime',
          colVisible: true,
          allowEditing: true,
          dataField: 'createdAt',
          colWidth: '110',
          caption: 'Creazione',
          colCaption: 'Creazione',
          edit: undefined,
          groupDataField: undefined
        },
        {
          type: 'campoDateTime',
          colVisible: true,
          allowEditing: true,
          dataField: 'editedAt',
          colWidth: '110',
          colCaption: 'Ultima modifica',
          allowFiltering: undefined,
          labelAlignment: undefined,
          edit: undefined,
          groupDataField: undefined
        },
        {
          type: 'campo',
          colVisible: true,
          allowEditing: true,
          dataField: 'gender',
          colWidth: '90',
          colCaption: 'Genere',
          edit: undefined,
          groupDataField: undefined
        }
      ]
    }
  ];

  private readonly outFitService = inject(OutfitsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly propertiesModal = inject(PopUpService);

  outFitCategories$!: Observable<outfitCategories[]>;
  outFitCategories: outfitCategories[] = [];
  showGrid = false;
  title = "Elenco categorie outfit da mostrare nell'app";
  subTitle = '';
  selectedCatOutfit?: outfitCategories;
  categoryId: string | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.categoryId = params.get('id');
      this.selectedCatOutfit = this.readNavigationCategory();

      if (this.categoryId) {
        this.title = this.selectedCatOutfit?.categoryName
          ? `Elenco delle sottocategorie di: ${this.selectedCatOutfit.categoryName}`
          : 'Elenco sottocategorie';
        this.outFitCategories$ = this.outFitService.getOutFitCategories(this.categoryId);
      } else {
        this.selectedCatOutfit = undefined;
        this.title = "Elenco categorie outfit da mostrare nell'app";
        this.outFitCategories$ = this.outFitService.getOutFitCategories();
      }

      this.loadOutFitCategories();
    });
  }

  private readNavigationCategory(): outfitCategories | undefined {
    const state = history.state as { category?: outfitCategories };
    return state?.category;
  }

  loadOutFitCategories(): void {
    this.showGrid = false;
    this.outFitCategories$.subscribe({
      next: categories => {
        this.outFitCategories = categories;
        this.showGrid = true;
      },
      error: () => {
        this.outFitCategories = [];
        this.showGrid = true;
      }
    });
  }

  addCategoryOutfit(_event: any): void {
    const editData = this.categoryId
      ? { parentCategory: this.categoryId }
      : undefined;

    this.createOrEditCategories({
      service: 'outfitCategories',
      idData: editData
    });
  }

  editCategoryOutfit(event: any): void {
    event.cancel = true;
    this.selectedCatOutfit = event.data as outfitCategories;

    this.createOrEditCategories({
      service: 'outfitCategories',
      editData: this.selectedCatOutfit
    });
  }

  editCategoryCard(category: outfitCategories): void {
    this.editCategoryOutfit({ data: category, cancel: false });
  }

  openSubcategories(category: outfitCategories): void {
    void this.navigateToSubcategories(category);
  }

  private navigateToSubcategories(category: outfitCategories): Promise<boolean> {
    return this.router.navigate(
      ['/outfit-category', category.id],
      { state: { category } }
    );
  }

  deleteCategory(category: outfitCategories): void {
    confirm(
      `Eliminare la categoria “${category.categoryName}”?`,
      'Conferma',
      yes => {
        if (yes) void this.deleteCategoryConfirmed(category.id);
      }
    );
  }

  private async deleteCategoryConfirmed(id: string): Promise<void> {
    try {
      await this.outFitService.removeOutfitCategories(id);
      this.outFitCategories = this.outFitCategories.filter(item => item.id !== id);
    } catch {
      // Error details are handled by the shared HTTP/UI layer.
    }
  }

  createOrEditCategories(instanceData: any): void {
    const guid = Math.random().toString().replace('0.', '');
    this.propertiesModal.setNewPopUp(
      guid,
      'DynamicFormComponent',
      null,
      800,
      null,
      instanceData,
      false,
      true,
      'Modifica Outfit',
      '',
      false
    );

    this.propertiesModal.outputComponent.subscribe(async result => {
      if (result.guid === guid && result.name === 'submitForm') {
        const formData = result.formData;
        formData.parentCategory = formData.parentCategory || '';

        const saved = result.inEdit
          ? await this.outFitService.updateOutfitCategories(formData.id, formData)
          : await this.outFitService.saveOutfitCategories(formData);

        if (saved) {
          this.propertiesModal.destroyCurrentOpenPopUpByGuid(guid);
          this.outFitCategories$ = this.outFitService.getOutFitCategories(this.categoryId || undefined);
          this.loadOutFitCategories();
        }
      }

      if (result.guid === guid && result.name === 'cancelForm') {
        this.propertiesModal.destroyCurrentOpenPopUpByGuid(guid);
      }
    });
  }

  gridEvent(event: any): void {
    if (event.name === 'delRows') {
      this.deleteCategory(event.rowData as outfitCategories);
    }
  }

  dblClickRow(event: any): void {
    void this.navigateToSubcategories(event.rowData as outfitCategories);
  }
}
