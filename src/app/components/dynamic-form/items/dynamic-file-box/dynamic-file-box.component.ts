import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormField, FileBoxOptions } from '../../../../interface/dynamic-form-field';



@Component({
  selector: 'app-dynamic-file-box',
  templateUrl: './dynamic-file-box.component.html',
  styleUrls: ['./dynamic-file-box.component.scss'],
  standalone:true,
  imports:[CommonModule,FormsModule,ReactiveFormsModule],

})
export class DynamicFileBoxComponent implements AfterViewInit {



  @ViewChild('imageElement') imageElement: ElementRef | undefined;
  @ViewChild('fileInput') fileInput!: ElementRef;

  @Input() config!: DynamicFormField;
  @Input() formControlD!: FormControl;
  @Input() formGroup!: any;

  @Input() disabled = false;
  @Input() value:any = '';
  
  
  @Output() valueChange = new EventEmitter<string | string[]>();

  @Input() maxWidth = 300; // Larghezza massima per i post verticali tipo Instagram
  @Input() maxHeight = 1350; // Altezza massima per i post verticali tipo Instagram

  imageLoading= signal(true);
  blobImg: any;
  fileName: any;
  format: string = '';
  openFullScreen: boolean = false
  base64String: string | undefined;
  fileBoxOptions?:FileBoxOptions 
  fieldName:string = '';

  ngOnInit() { }
  
  ngAfterViewInit(): void {
    this.fileBoxOptions = this.config.fileBoxOptions;
    this.fieldName = this.config.name
    if (this.imageElement) {

      this.imageElement.nativeElement.onload = (event: Event) => {
        setTimeout(() => {
          this.imageLoading.set(false);  // Nasconde il loader
        }, 1500);

      };
      // Nel caso in cui si verifichi un errore nel caricamento dell'immagine
      this.imageElement.nativeElement.onerror = () => {
        this.imageLoading.set(false);;  // Nascondi il loader anche in caso di errore
      };
    }

    if (!this.imageElement) {
      this.imageLoading.set(false);  
    }

  }

  chooseFile(event: Event): void {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event) {

    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (this.validateFile(file)) {
        const reader = new FileReader();
        this.imageLoading.set(true);
        reader.onload = async (e: ProgressEvent<FileReader>) => {
          const dataUrl = e.target?.result as string;
  
          // Ridimensiona l'immagine prima di emetterla
          try {
            const maxWidth =  this.fileBoxOptions && this.fileBoxOptions.maxWidth ? this.fileBoxOptions.maxWidth : 600;
            const type =  file.type.replace('image/','')
            const resizedImage = await this.resizeImage(dataUrl, maxWidth, type); // Puoi cambiare 'jpeg' con il formato desiderato e 800 con la larghezza massima desiderata
  
            // Assegna il valore ridimensionato
            this.value = resizedImage.dataUrl;
            this.imageLoading.set(true);
            this.valueChange.emit(this.value);
          } catch (error) {
            console.error('Errore durante il ridimensionamento dell\'immagine:', error);
            this.imageLoading.set(true);
          }
        };
  
        // Legge il file come data URL
        reader.readAsDataURL(file);
      } else {
        alert('File non valido. Seleziona un file immagine di dimensioni inferiori a 2MB.');
      }
    }
  }

  validateFile(file: File): boolean {
    const maxSize = !this.fileBoxOptions?.maxSize ?  2 * 1024 * 1024 : this.fileBoxOptions.maxSize * 1024 * 1024 // 2MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    return file.size <= maxSize && allowedTypes.includes(file.type);
  }

  resizeImage(dataUrl: string, maxWidth: number,format:string): Promise<{ dataUrl: string; format: string }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = dataUrl;
  
      img.onload = () => {
        let canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
  
        let width = img.width;
        let height = img.height;
  
        // Calcolo del ridimensionamento mantenendo il rapporto d'aspetto
        if (width > maxWidth ) {
          const scaleFactor = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scaleFactor;
          
          width = maxWidth;
          height = img.height * scaleFactor;
        }
  
        
  
        ctx!.drawImage(img, 0, 0, width, height);
        
        const resizedDataUrl = canvas.toDataURL(`image/${format}`, 0.7);
        
        resolve({ dataUrl: resizedDataUrl, format: resizedDataUrl.split(";")[0].split("/")[1] });
      };
  
      img.onerror = (err) => {
        reject(err);
      };
    });
  }

  

  // Funzione per convertire dataURL (BASE64) in Blob m ora uso base64
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
}

