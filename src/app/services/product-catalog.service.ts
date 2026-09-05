import { inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map, Observable } from 'rxjs';

export interface LegacyCatalogProduct {
  id: number;
  userId: string;
  name: string;
  outfitCategory: string;
  outfitSubCategory: string;
  brend: string;
  color: string;
  link?: string;
  images: string[];
  ImageUrl?: string;
  imageUrl?: string;
  price?: number;
  prezzo?: number;
  gender?: any;
}

@Injectable({ providedIn: 'root' })
export class ProductCatalogService {
  private readonly firestore = inject(AngularFirestore);

  // TODO affiliate-catalog migration:
  // This service intentionally isolates the last direct Firestore access used by
  // the legacy product catalog screen. Replace it with firebase-api endpoints.
  getProducts(): Observable<LegacyCatalogProduct[]> {
    return this.firestore
      .collection('outfitsProducts')
      .valueChanges()
      .pipe(map((products: any[]) => products));
  }

  async updateProduct(id: string | number, data: Partial<LegacyCatalogProduct>): Promise<boolean> {
    try {
      await this.firestore.collection('outfitsProducts').doc(String(id)).update(data);
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      return false;
    }
  }

  async removeProduct(id: string | number): Promise<boolean> {
    try {
      await this.firestore.collection('outfitsProducts').doc(String(id)).ref.delete();
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }
}
