import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { DataGridComponent } from '../../components/data-grid/data-grid.component';
import { DynamicFormComponent } from '../../components/dynamic-form/dynamic-form.component';
import { Colonne } from '../../interface/app.interface';
import { AnagraficaWrapperComponent } from '../../layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { OutfitsService, wardrobesItem } from '../../services/outfit.service';
import { PopUpService } from '../../services/popup.service';

@Component({
  selector: 'app-outfit-products',
  standalone: true,
  imports: [CommonModule, AnagraficaWrapperComponent, DataGridComponent, DynamicFormComponent],
  templateUrl: './outfit-products.component.html',
  styleUrl: './outfit-products.component.scss'
})
export class OutfitProductsComponent {
  @Output() selectProduct = new EventEmitter<wardrobesItem>();

  private readonly outFitService = inject(OutfitsService);
  private readonly popupModal = inject(PopUpService);

  readonly products$: Observable<wardrobesItem[]> = this.outFitService.getProducts();
  products: wardrobesItem[] = [];
  subtitle = "Elenco dei prodotti disponibili nell'app";
  showGrid = false;

  colProductsGrid: Colonne[] = [
    {
      itemType: 'group',
      groupDataField: '',
      data: [
        {
          type: 'campo',
          edit: false,
          groupDataField: undefined,
          colCaption: 'ID',
          dataField: 'id',
          colWidth: 40
        },
        {
          type: 'campoImg',
          colVisible: true,
          allowEditing: true,
          dataField: 'imageUrl',
          colWidth: 50,
          class: 'outfit-image',
          colCaption: 'Immagine',
          allowFiltering: undefined,
          edit: undefined,
          groupDataField: undefined
        },
        {
          type: 'campo',
          edit: false,
          colWidth: 90,
          groupDataField: undefined,
          colCaption: 'Prodotto',
          dataField: 'name'
        },
        {
          type: 'campo',
          edit: false,
          groupDataField: undefined,
          colCaption: 'Categoria',
          dataField: 'outfitSubCategory',
          colWidth: 90
        },
        {
          type: 'campo',
          edit: false,
          groupDataField: undefined,
          colCaption: 'Brand',
          dataField: 'brend',
          colWidth: 70
        },
        {
          type: 'campoNumber',
          edit: false,
          groupDataField: undefined,
          colCaption: 'Prezzo',
          dataField: 'price',
          colWidth: 50,
          format: '#.##'
        },
        {
          type: 'campoLista',
          edit: false,
          groupDataField: undefined,
          colCaption: 'Genere',
          dataField: 'gender',
          colWidth: 50,
          lista: {
            displayExp: 'name',
            valueExp: 'id',
            options: [
              { id: 'U', name: 'Uomo' },
              { id: 'D', name: 'Donna' }
            ],
            multiple: false,
            remote: false,
            parent: null
          }
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadProduct();
  }

  loadProduct(): void {
    this.showGrid = false;
    this.products$.subscribe({
      next: products => {
        this.products = products;
        this.showGrid = true;
      },
      error: error => {
        console.error('Error loading products:', error);
        this.products = [];
        this.showGrid = true;
      }
    });
  }

  editProduct(event: any): void {
    event.cancel = true;
    this.createOrEditCategories({
      service: 'outfitProducts',
      editData: event.data
    });
  }

  private createOrEditCategories(instanceData: any): void {
    const guid = Math.random().toString().replace('0.', '');
    this.popupModal.setNewPopUp(
      guid,
      'DynamicFormComponent',
      null,
      800,
      null,
      instanceData,
      false,
      true,
      'Modifica Prodotto',
      '',
      false
    );

    this.popupModal.outputComponent.subscribe(async result => {
      if (result.guid === guid && result.name === 'submitForm') {
        const formData = result.formData;
        const now = Date.now();

        if (result.inEdit) {
          formData.createdAt = formData.createdAt || now;
          formData.editedAt = now;
          const saved = this.outFitService.updateProductOutfit(formData.id, formData);
          if (saved) {
            this.popupModal.destroyCurrentOpenPopUpByGuid(guid);
            this.loadProduct();
          }
        }
      }

      if (result.guid === guid && result.name === 'cancelForm') {
        this.popupModal.destroyCurrentOpenPopUpByGuid(guid);
      }
    });
  }

  async gridEvent(event: any): Promise<void> {
    if (event.name === 'onRowOnlyClick') {
      this.selectProduct.emit(event);
    }

    if (event.name === 'delRows') {
      const removed = await this.outFitService.removeProductOutfit(event.rowData.id);
      if (removed) this.loadProduct();
    }
  }

  filterProduct(event: any): void {
    if (event.name === 'cancelForm') {
      this.loadProduct();
      event.form.reset();
      return;
    }

    const formData = event.formData as wardrobesItem;
    let filtered = [...this.products];

    if (formData.gender) {
      filtered = filtered.filter(product => product.gender === formData.gender);
    }
    if (formData.outfitSubCategory) {
      filtered = filtered.filter(product => product.outfitSubCategory === formData.outfitSubCategory);
    }
    if (formData.outfitCategory) {
      filtered = filtered.filter(product => product.outfitCategory === formData.outfitCategory);
    }

    this.products = filtered;
  }
}
