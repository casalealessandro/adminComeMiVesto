import { Component, inject, TemplateRef, ViewChild } from '@angular/core';


import { AnagraficaWrapperComponent } from "../../layout/anagrafica-wrapper/anagrafica-wrapper.component";
import {  NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PopUpService } from '../../services/popup.service';
import { ActivatedRoute, Router } from '@angular/router';
import { alert } from '../../widgets/ui-dialogs';
import { FormService } from '../../services/form.service';

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [CommonModule ,AnagraficaWrapperComponent,FormsModule,NgbModalModule,],
  templateUrl: './form-builder.component.html',
  styleUrl: './form-builder.component.scss'
})
export class FormBuilderComponent {
  
  elements = [
    { type: 'textBox', label: 'Text Box' },
    { type: 'selectBox', label: 'Select Box' },
    { type: 'radio', label: 'Radio Button' },
    { type: 'checkbox', label: 'Checkbox' },
    { type: 'textArea', label: 'Textarea' },
    { type: 'fileBox', label: 'FileBox' },
  ];

 elementIcons:{ [key: string]: string }  = {
    textBox:"mdi mdi-signature-text",
    selectBox:"mdi mdi-form-select",
    radio:"mdi mdi-radiobox-marked",
    checkbox:"mdi mdi-checkbox-marked-outline",
    textArea:"mdi mdi-form-textarea",
    fileBox:"mdi mdi-file-document-outline"
  }

  formElements: any[] = [];
  
  propertiesModal= inject ( PopUpService ); 
  formId: string | null = null; 
  formTitle = !this.formId ? 'Crea Nuovo Form' : 'Modifica Form' 
  formName: any = '';
  private formService= inject(FormService)
  selectedElement: any;

  constructor(
    private modalService: NgbModal, 
    
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.formId = params.get('id');
      if (this.formId) {
        this.formTitle = 'Modifica Form' 
        this.loadForm(this.formId);
      }
    });
  }

  loadForm(formId: string) {
    
    this.formService.getFormById(formId).subscribe((data:any) => {
      
      if (data) {
        this.formName = data.nameForm;
        this.formElements = JSON.parse(data.json);
        
      }
    });
  }
  
  onAdd(evt:any,index: any) {
    evt.preventDefault();
    evt.stopPropagation();
    const droppedElement = this.elements[index];
    this.formElements.push({ ...droppedElement, validation: [] });
    
   
      let newIndex = this.formElements.length - 1;
      this.openPropertiesModal(droppedElement,newIndex)
   
    
  }
  onRemove(index: any) {
    
    this.formElements.splice(index, 1)
    
       
  }

  openPropertiesModal(formElement: any,index:number) {
   this.selectedElement = { ...formElement };
   // this.modalService.open(this.propertiesModal);

    let guid = Math.random().toString().replace("0.", "");
    let InstanceData = {
      formField:this.selectedElement
    }
    
    this.propertiesModal.setNewPopUp(guid, 'ElementComponent', null, 800, null, InstanceData, false, true, "Gestione proprietà",'',false)
    

    this.propertiesModal.outputComponent.subscribe(resulOutputComponent=>{
      if(resulOutputComponent.guid == guid && resulOutputComponent.name == 'saveProperties'){
        
        if (index >= 0) {

          this.formElements[index] = resulOutputComponent.formField;

          this.propertiesModal.destroyCurrentOpenPopUpByGuid(guid);
          this.selectedElement = {}
        }
      }

      if(resulOutputComponent.guid == guid && resulOutputComponent.name == 'closeProperties'){
        //this.formElements[index] = 
        this.propertiesModal.destroyCurrentOpenPopUpByGuid(guid);
      }
    })
  }

  addAttribute(formElement: any) {
    const attribute = { name: '', value: '' };
    formElement.attributes.push(attribute);
  }

 

  saveForm(formName: string) {
    const formJson = JSON.stringify(this.formElements);

    console.log('saveForm',formJson)
    const idForm = this.formId === 'new'  ? Math.random().toString().replace("0.", "") : this.formId;
    const formNameS = this.formId == 'new' ? this.formName.trim() : this.formId;
    const data =  {
      nameForm: formNameS,
      json: formJson,
      id:idForm
    }
    this.formService.saveForm(formNameS,data).then(() => {
      alert('Form salvato con successo','Attenzione!');
      this.router.navigate(['/form-list']);
    }).catch((err:any) => {
      console.error('Errore durante il salvataggio del form:', err);
    });
  }

  returnPrev(){
    this.router.navigate(['/form-list']);
  }
}
