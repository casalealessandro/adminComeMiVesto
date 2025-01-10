import { Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, signal, ViewChild, WritableSignal } from '@angular/core';
import { alert, confirm } from '../../../widgets/ui-dialogs';
import { DomSanitizer } from '@angular/platform-browser';
import { PopUpService } from '../../../services/popup.service';
import { CommonModule } from '@angular/common';
import { Tag } from '../../../services/outfit.service';
import { FormsModule } from '@angular/forms';


interface tagStyle {
  [key: string]: {
    left: string;
    top: string;
  }

}
@Component({
  selector: 'app-foto-outfit',
  templateUrl: './foto-outfit.page.html',
  styleUrls: ['./foto-outfit.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]

})

export class FotoOutfitPage implements OnInit {
  // ... rest of the class code



  @ViewChild('imageElement', { static: false }) imageElement: ElementRef | undefined;
  @ViewChild('fileInput') fileInput!: ElementRef;

  @Input() image = signal<string>('');
  @Input() showTag = signal<boolean>(false);
  @Input() tags = signal<Tag[]>([]);
  @Input() enableSetTagsImage: boolean = true


  @Input() enableNewImagecaptured = signal<boolean>(true);

  @Output() eventFotoCaptured: EventEmitter<any> = new EventEmitter<any>(); //Emit all'esterno;
  @Output() eventImageTags: EventEmitter<any> = new EventEmitter<any>(); //Emit all'esterno;
  @Output() eventBeforeFotoCaptured: EventEmitter<any> = new EventEmitter<any>(); //Emit all'esterno;
  @Output() eventImageShowFull: EventEmitter<any> = new EventEmitter<any>(); //Emit all'esterno;





  tagStyle: any = {}
  imageLoading = signal(true)
  tagToggleButton: any = {};
  blobImg: any;
  fileName: any;
  format: string = '';
  openFullScreen: boolean = false;
  propertiesModal = inject(PopUpService);





  ngOnInit(): void {

  }

  ngAfterViewInit(): void {

    if (this.imageElement) {

      this.imageElement.nativeElement.onload = (event: Event) => {

        this.imageLoading.set(true)
        this.onImageLoad(event);

      };

      // Nel caso in cui si verifichi un errore nel caricamento dell'immagine
      this.imageElement.nativeElement.onerror = () => {
        this.imageLoading.set(false);  // Nascondi il loader anche in caso di errore
      };

    }

    //Nascondi loader se sto in inserimento
    if (this.enableNewImagecaptured()) {
      this.imageLoading.set(false);
    }


  }

  onImageLoad(event: Event): void {
    if (this.tags().length > 0) {
      const image = this.imageElement?.nativeElement as HTMLElement;
      const rect = image.getBoundingClientRect();
      this.setDisplayTag(rect)
    }

    this.imageLoading.set(false);  // Nasconde il loader
  }

  chooseFile(): void {
    this.fileInput.nativeElement.click();

  }

  async captureImage(event: Event) {
    if (this.tags.length > 0 && typeof this.image !== 'undefined') {
      let respo = await this.confirmChangeFoto();
      if (!respo) {
        return;
      }
    }

    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (this.validateFile(file)) {
        const reader = new FileReader();
        this.imageLoading.set(true)
        reader.onload = async (e: ProgressEvent<FileReader>) => {
          const dataUrl = e.target?.result as string;

          // Ridimensiona l'immagine prima di emetterla
          try {
            const maxWidth = 600;
            const type = file.type.replace('image/', '')
            const resizedImage = await this.resizeImage(dataUrl, maxWidth, 600); // Puoi cambiare 'jpeg' con il formato desiderato e 800 con la larghezza massima desiderata

            // Assegna il valore ridimensionato
            this.image.set(resizedImage.dataUrl);
            this.imageLoading.set(false);

          } catch (error) {
            console.error('Errore durante il ridimensionamento dell\'immagine:', error);
            this.imageLoading.set(false);
          }
        };

        // Legge il file come data URL
        reader.readAsDataURL(file);
      } else {
        alert('File non valido. Seleziona un file immagine di dimensioni inferiori a 2MB.', 'Attenzione!');
      }


      /* let eventToEmit = {
        img: this.dataURLtoBlob(this.image),
        imgName: this.fileName,
        contentType: contentType,
      };
      this.eventFotoCaptured.emit(eventToEmit); */
    }
  }

  validateFile(file: File): boolean {
    const maxSize = 5 * 1024 * 1024 // 2MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    return file.size <= maxSize && allowedTypes.includes(file.type);
  }


  resizeImage(dataUrl: string, maxWidth: number, maxHeight: number): Promise<{ dataUrl: string; format: string }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = dataUrl;

      img.onload = () => {
        let canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = img.width;
        let height = img.height;

        // Calcolo del ridimensionamento mantenendo il rapporto d'aspetto
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const bestRatio = Math.min(widthRatio, heightRatio);

          width *= bestRatio;
          height *= bestRatio;
        }

        canvas.width = width;
        canvas.height = height;

        ctx!.drawImage(img, 0, 0, width, height);

        const resizedDataUrl = canvas.toDataURL();
        resolve({ dataUrl: resizedDataUrl, format: resizedDataUrl.split(";")[0].split("/")[1] });
      };

      img.onerror = (err) => {
        reject(err);
      };
    });
  }


  async confirmChangeFoto(): Promise<boolean> {
    return new Promise(async () => {
      return confirm("Procedendo perderai anche tutti i tag associati e la priorità acquisita nell'elenco", "Attenzione!", (resp => {
        if (resp) {

          this.tags = signal([]);
          this.image = signal('');

          let eventtoEmit = {
            tags: this.tags
          }
          this.eventImageTags.emit(eventtoEmit);
        }
      }))



    });
  }

  async editTag(tag: Tag) {
    const modalResponse = await this.openModal(tag)
    if (Object.keys(modalResponse).length > 0) {


      const tags = this.tags()
      let indexTag = tags.findIndex(r => r.id == tag.id)
      let link = !modalResponse.link ? '#' : modalResponse.link
      let images = !modalResponse.Images ? '' : modalResponse.Images
      images = modalResponse.images ? modalResponse.images : images
      images = modalResponse.imageUrl ? modalResponse.imageUrl : images
      tags[indexTag] =
      {
        id: tag.id,
        name: modalResponse.name,
        x: tag.x,
        y: tag.y,
        link: link,
        color: modalResponse.color,
        brend: modalResponse.brend,
        images: images,
        prezzo: modalResponse.prezzo,
        outfitCategory: modalResponse.outfitCategory,
        outfitSubCategory: modalResponse.outfitSubCategory

      }

      this.tags.set(tags);


      let eventtoEmit = {
        tags: this.tags()
      }
      this.eventImageTags.emit(eventtoEmit)
    }

  }

  async addTag(event: any) {

    if (!this.enableSetTagsImage) {

      this.eventImageShowFull.emit()
      return
    }

    let name = ''
    let link = ''

    let result: any = await this.openModal();
    if (Object.keys(result).length > 0) {
      const image = this.imageElement?.nativeElement as HTMLElement;
      const rect = image.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      let link = !result.link ? '#' : result.link
      let brend = !result.brend ? null : result.brend
      let prezzo = !result.prezzo ? null : result.prezzo
      let id = !result.id ? result.name.replace(' ', '_') : result.id;
      let images = !result.Images ? '' : result.Images
      images = result.imageUrl ? result.imageUrl : images
      let tags = []
      tags.push(
        {
          id: id,
          name: result.name,
          x: x,
          y: y,
          link: link,
          color: result.color,
          brend: brend,
          prezzo: prezzo,
          price: prezzo,
          images: images,
          outfitCategory: result.outfitCategory,
          outfitSubCategory: result.outfitSubCategory

        }

      );

      this.tags.set(tags);
      this.setDisplayTag(rect)
      this.setDisplayButtonTag(rect);

      let eventtoEmit = {
        tags: this.tags()
      }
      this.eventImageTags.emit(eventtoEmit)
    }
    return

  }

  setDisplayTag(rect: DOMRect) {

    this.tags().forEach(tag => {
      this.tagStyle[tag.id] = {
        left: `${tag.x * rect.width}px`,
        top: `${tag.y * rect.height}px`
      };
    });


  }

  toggleTags() {
    this.showTag.update(prev => !prev);
  }

  setDisplayButtonTag(rect: DOMRect) {

    const bottomOffset = 0.1 * rect.height;  // Offset dal fondo (10% dell'altezza dell'immagine)
    const rightOffset = 0.05 * rect.width;    // Offset da destra (5% della larghezza dell'immagine)

    this.tagToggleButton = {
      bottom: `${bottomOffset}px`,
      right: `${rightOffset}px`,
      position: 'absolute',
      zIndex: 10
    };
  }

  async openModal(tagData?: Tag): Promise<any> {
    console.log('openModal', tagData);
    /*  
     let images = !tagData.Images ? '' : tagData.Images
      images = tagData.imageUrl ? tagData.imageUrl : images */

    let guid = Math.random().toString().replace("0.", "");
    let InstanceData = {
      service: 'tagForm',
      editData: tagData
    }
    let data = {}

    this.propertiesModal.setNewPopUp(guid, 'DynamicFormComponent', null, 800, null, InstanceData, false, true, "Modifica Tag", '', false)


    return new Promise((resolve, reject) => {
      this.propertiesModal.outputComponent.subscribe(async respo => {
        if (respo.guid === guid) {

          if (respo.name === 'functionalInputClick') {
            this.openOutfitProducts()
            console.log('functionalInputClick-->', respo);
          }


          if (respo.name === 'submitForm') {
            const resolveC = respo.formData;
            this.propertiesModal.destroyCurrentOpenPopUpByGuid(guid);
            //this.propertiesModal.onSubScribe();
            resolve(resolveC); // Risolvi la Promise con i dati del form
          }

          if (respo.name === 'cancelForm') {
            this.propertiesModal.destroyCurrentOpenPopUpByGuid(guid);
            resolve(false); // Risolvi la Promise
          }
        }

      });
    });

    return this.propertiesModal.getOutputComponent(guid)


  }

  removeTag(tagId: any) {
    const newTags = this.tags().filter(tag => tag.id !== tagId);
    this.tags.set(newTags);
  }

  async openOutfitProducts() {

    let guid = Math.random().toString().replace("0.", "");
    this.propertiesModal.setNewPopUp(guid, 'OutfitProductsComponent', null, 1000, null, {}, true, true, "Prodotti Outfit", '', true)
    ///let respo = await this.propertiesModal.getOutputComponent(guid)



    this.propertiesModal.outputComponent.subscribe(async resulOutputComponent => {
      if (resulOutputComponent.guid === guid) {


        console.log(resulOutputComponent)

      }
    });
  }

  /**utility**/

  // Funzione per convertire dataURL (BASE64) in Blob
  private dataURLtoBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  }

  onImageError(event: any) {

    event.target.src = 'assets/images/fallback-image.jpg';

  }

  closeModalFullScreen() {
    this.openFullScreen = false;
  }


}
