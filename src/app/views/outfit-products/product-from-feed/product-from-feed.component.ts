import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { ProdottiOnlineService } from '../../../services/prodotti-online.service';
import { OutfitsService, Tag, wardrobesItem } from '../../../services/outfit.service';
import { alert } from '../../../widgets/ui-dialogs';

@Component({
  selector: 'app-product-from-feed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-from-feed.component.html',
  styleUrl: './product-from-feed.component.scss'
})
export class ProductFromFeedComponent {
  


  selectedStore: any;
  productService = inject(ProdottiOnlineService);
  outfitService = inject(OutfitsService);
  pageNumber: number = 1;
  totalProducts: number = 0
  public stores: any = [
    {
      id: '44191',
      name: 'PULL and BEAR IT'
    },
    {
      id: '35306',
      name: 'PrimaDonna IT'
    },
    {
      id: '36745',
      name: 'Bershka IT'
    },
    {
      id: '38925',
      name: 'Julian Fashion'
    },
    {
      id: '39848',
      name: 'Julian Fashion IT- Lys'
    }

  ] // Store disponibili

  public storeCategories: any = []



  selectGender: any = [];
  products: any[] = [];
  filterProduct: any[] = [];
  categories = this.outfitService.getFilteredCollection('outfitsCategories', [{
    field: 'parentCategory',
    operator: '!=',
    value: ""
  }]);
  categoryForm: FormGroup = new FormGroup({});
  colors = [
    {
      id: "N",
      value: "Nero",
      parent: null,
      hex: "#000000"
    },
    {
      id: "B",
      value: "Bianco",
      parent: null,
      hex: "#FFFFFF"
    },
    {
      id: "G",
      value: "Grigio",
      parent: null,
      hex: "#808080"
    },
    {
      id: "Bg",
      value: "Beige",
      parent: null,
      hex: "#F5F5DC"
    },
    {
      id: "BN",
      value: "Blu navy",
      parent: null,
      hex: "#000080"
    },
    {
      id: "BJ",
      value: "Blu Jeans",
      parent: null,
      hex: "#5DADEC"
    },
    {
      id: "R",
      value: "Rosso",
      parent: null,
      hex: "#FF0000"
    },
    {
      id: "VO",
      value: "Verde oliva",
      parent: null,
      hex: "#808000"
    },
    {
      id: "GS",
      value: "Giallo senape",
      parent: null,
      hex: "#FFDB58"
    },
    {
      id: "RP",
      value: "Rosa pallido",
      parent: null,
      hex: "#FFD1DC"
    },
    {
      id: "RSA",
      value: "Rosa",
      parent: null,
      hex: "#FFC0CB"
    },
    {
      id: "A",
      value: "Azzurro",
      parent: null,
      hex: "#ADD8E6"
    },
    {
      id: "M",
      value: "Marrone",
      parent: null,
      hex: "#964B00"
    },
    {
      id: "O",
      value: "Arancione",
      parent: null,
      hex: "#FFA500"
    }
  ];
  gender = [{
    id: 'U', value: 'Uomo'
  },
  {
    id: 'D', value: 'Donna'
  }]
  justImported: Set<string> = new Set();
  selectedStoreCategory: any;



  loadProducts() {
    if (this.products.length <= this.totalProducts ) {
      this.productService.getProdottiFromFeed(this.selectedStore, this.pageNumber).subscribe(resultProucts => {

        this.products.push(...resultProucts.products);
        this.totalProducts = resultProucts.productHeader.totalHits;
        this.filterProduct = JSON.parse(JSON.stringify(this.products))
        this.filterProduct.forEach(async ree => {
          const id = ree.offers[0].id;
          this.storeCategories.push(ree.categories[0])
          ree.selectedColor = null,  // oppure un valore di default
            ree.selectedCategory = null,
            ree.selectedGender = null
          this.selectGender[id] = null;
          let res = await this.outfitService.getFilteredCollection('outfitsProducts', [{
            field: 'id',
            operator: '==',
            value: id
          }])

          if (res.length > 0) {
            this.justImported.add(id)
          }
        })


        this.storeCategories = this.storeCategories.filter((obj: any, index: any, self: any) =>
          index === self.findIndex((t: any) => (t.name === obj.name))
        );
        this.storeCategories = this.storeCategories.sort((a:any, b:any) => {
          if (a.name < b.name) {
              return -1; // a viene prima di b
          }
          if (a.name > b.name) {
              return 1; // b viene prima di a
          }
          return 0; // sono uguali
      });
        if(this.selectedStoreCategory){
          this.onChangeCategory()
        }
      })
    }

  }

  isJustImported(id: string): boolean {
    // Verifica se l'outfitId è presente nel set dei preferiti
    return this.justImported.has(id);
  }

  loadMoreProducts() {

    this.pageNumber++
    this.filterProduct = []
    this.loadProducts()
  }
  async saveToWardrobe(product: any) {
    if (!product.selectCategories && product.selectColor && product.selectGender) {
      alert('Nessuna categoria selezionata', 'Errore!')
      return
    }
    let price = product.offers[0].priceHistory[0].price.value
    let link = product.offers[0].productUrl
    let feedId = product.offers[0].feedId;
    let parentCategory = (await this.categories).filter(ress => ress.id == product.selectCategories)[0].parentCategory;
    let imageUrl = product.productImage.url
    const id = product.offers[0].id;
    let dateEdit = new Date();
    let prodSave = {
      id: product.offers[0].id,
      price: price,
      name: product.name,
      outfitCategory: parentCategory,
      outfitSubCategory: product.selectCategories,
      brend: product.brand,
      color: product.selectColor,
      imageUrl: imageUrl.replace('http://', 'https://'),
      link: link,
      feedId: feedId,
      gender: product.selectGender,
      createdAt: dateEdit.getTime(),
      editedAt: dateEdit.getTime(),

    }

    let res = await this.outfitService.saveOutfitsProducts(id, prodSave);

    if (res) {
      this.justImported.add(id)
    }
  }

  onChangeStore(event: Event) {
    this.products = [];
    this.totalProducts = 0;
    this.pageNumber = 1;
    this.justImported.clear()
    this.storeCategories = []
    this.loadProducts()
  }

  splitCategories(categories: any) {
    return categories.map((res: any) => res.name).join('-')
  }
  setPrice(offers: any) {
    let price = ''
    offers.forEach((res: any) => {
      price = res.priceHistory.map((res: any) => res.price.value).join('-')
    })
    return price
  }


  onSelectCategories(event: Event) {
   
  }
  onChangeCategory($event?: Event) {
    this.filterProduct = this.products.filter(resProd=> resProd.categories.map((res: any) => res.name).includes(this.selectedStoreCategory))
  }
}
