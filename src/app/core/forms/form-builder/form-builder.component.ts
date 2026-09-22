import { Component, inject } from '@angular/core';


import { AnagraficaWrapperComponent } from "../../layout/anagrafica-wrapper/anagrafica-wrapper.component";
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PopUpService } from '../../services/popup.service';
import { ActivatedRoute, Router } from '@angular/router';
import { alert, confirm } from '../../widgets/ui-dialogs';
import { FORM_DEFINITION_REPOSITORY } from '../../services/form-definition-repository';
import { DynamicFormField, normalizeDynamicFormFields } from '../../interface/dynamic-form-field';
import { Subscription } from 'rxjs';

export function buildFormPayload(id: string, nameForm: string, json: any[]) {
  return { id, nameForm: nameForm.trim(), json: normalizeDynamicFormFields(json) };
}

export interface FormBuilderRow {
  id: string;
  fields: DynamicFormField[];
  visibleFields: DynamicFormField[];
  hiddenFields: DynamicFormField[];
  indexes: number[];
  visibleIndexes: number[];
  hiddenIndexes: number[];
}

/** Builds canonical rows without mutating fields that temporarily lack a rowId. */
export function groupFormBuilderRows(fields: DynamicFormField[]): FormBuilderRow[] {
  const rows: FormBuilderRow[] = [];
  fields.forEach((field, index) => {
    const rowId = field.layout?.rowId;
    const previous = rows[rows.length - 1];
    if (rowId && previous && previous.id === rowId) {
      previous.fields.push(field);
      previous.indexes.push(index);
    } else {
      rows.push({
        id: rowId || '',
        fields: [field],
        visibleFields: [],
        hiddenFields: [],
        indexes: [index],
        visibleIndexes: [],
        hiddenIndexes: []
      });
    }
    const row = rows[rows.length - 1];
    const hidden = field.type === 'hiddenBox';
    (hidden ? row.hiddenFields : row.visibleFields).push(field);
    (hidden ? row.hiddenIndexes : row.visibleIndexes).push(index);
  });
  return rows;
}

export function isRowWidthValid(fields: DynamicFormField[]): boolean {
  const visibleFields = fields.filter(field => field.type !== 'hiddenBox');
  const customTotal = visibleFields
    .reduce((total, field) => total + (field.layout?.colSpan ?? 0), 0);
  const hasAuto = visibleFields.some(field => field.layout?.colSpan == null);

  return hasAuto ? customTotal < 12 : customTotal <= 12;
}

export function duplicateFormField(fields: DynamicFormField[], index: number): DynamicFormField[] {
  const source = fields[index];
  if (!source) return fields;
  const duplicate = JSON.parse(JSON.stringify(source)) as DynamicFormField;
  const baseName = `${source.name || 'field'}_copy`;
  const names = new Set(fields.map(field => field.name));
  let name = baseName;
  let suffix = 2;
  while (names.has(name)) name = `${baseName}${suffix++}`;
  duplicate.name = name;
  duplicate.label = `${source.label || 'Campo'} (copia)`;
  if (duplicate.type === 'hiddenBox' && duplicate.layout) delete duplicate.layout.colSpan;
  return [...fields.slice(0, index + 1), duplicate, ...fields.slice(index + 1)];
}

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
    { type: 'checkBox', label: 'Checkbox' },
    { type: 'textArea', label: 'Textarea' },
    { type: 'fileBox', label: 'FileBox' },
    { type: 'hiddenBox', label: 'Hidden box' }
  ];

 elementIcons:{ [key: string]: string }  = {
    textBox:"mdi mdi-signature-text",
    selectBox:"mdi mdi-form-select",
    radio:"mdi mdi-radiobox-marked",
    checkBox:"mdi mdi-checkbox-marked-outline",
    textArea:"mdi mdi-form-textarea",
    fileBox:"mdi mdi-file-document-outline",
    hiddenBox:"mdi mdi-file-hidden",
  }

  formElements: any[] = [];
  emptyRowIds: string[] = [];
  activeRowId: string | null = null;
  readonly columnSpans = Array.from({ length: 12 }, (_, index) => index + 1);
  readonly isRowWidthValid = isRowWidthValid;
  
  propertiesModal= inject ( PopUpService ); 
  formId: string | null = null; 
  formTitle = !this.formId ? 'Crea Nuovo Form' : 'Modifica Form' 
  formName: any = '';
  private formService= inject(FORM_DEFINITION_REPOSITORY)
  selectedElement: any;

  constructor(
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  get rows(): FormBuilderRow[] {
    return [
      ...groupFormBuilderRows(this.formElements),
      ...this.emptyRowIds.map(id => ({
        id, fields: [], visibleFields: [], hiddenFields: [], indexes: [], visibleIndexes: [], hiddenIndexes: []
      }))
    ];
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.formId = params.get('id');
      if (this.formId === 'new') {
        this.formTitle = 'Crea Nuovo Form';
        this.formName = '';
        this.formElements = [];
        return;
      }
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
        this.formElements = normalizeDynamicFormFields(data.json);
        
      }
    });
  }
  
  onAdd(evt:any,index: any) {
    evt.preventDefault();
    evt.stopPropagation();
    const droppedElement = this.elements[index] as Pick<DynamicFormField, 'type' | 'label'>;
    let rowId = this.activeRowId || this.createRow();
    const field = { ...droppedElement, name: '', typeInput: '', validation: [], layout: { rowId } } as DynamicFormField;
    const row = this.rows.find(item => item.id === rowId);
    const insertAt = row?.indexes.length ? row.indexes[row.indexes.length - 1] + 1 : this.formElements.length;
    this.formElements.splice(insertAt, 0, field);
    this.emptyRowIds = this.emptyRowIds.filter(id => id !== rowId);
    this.openPropertiesModal(field, insertAt);
  }

  createRow(): string {
    const id = this.newRowId();
    this.emptyRowIds.push(id);
    this.activeRowId = id;
    return id;
  }

  selectRow(row: FormBuilderRow): void {
    this.activeRowId = row.fields.length ? row.fields[0].layout?.rowId || null : row.id;
  }
  onRemove(index: any) {
    
    this.formElements.splice(index, 1)
    
       
  }

  moveElement(index: number, offset: number) {
    const row = this.rows.find(item => item.indexes.includes(index));
    if (!row) return;
    const indexes = this.formElements[index]?.type === 'hiddenBox' ? row.hiddenIndexes : row.visibleIndexes;
    const position = indexes.indexOf(index);
    const targetIndex = indexes[position + offset];
    if (targetIndex === undefined) return;
    const [element] = this.formElements.splice(index, 1);
    this.formElements.splice(targetIndex, 0, element);
  }

  setColumnSpan(index: number, value: string): void {
    const field = this.formElements[index];
    if (!field) return;
    if (field.type === 'hiddenBox') return;
    const rowId = field.layout?.rowId;
    if (!rowId) return;
    const colSpan = value === 'auto' ? undefined : Number(value);
    this.formElements[index].layout = { rowId, ...(colSpan ? { colSpan } : {}) };
  }

  private newRowId(): string {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID() : `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  moveRow(rowIndex: number, offset: number): void {
    const rows = this.rows;
    const target = rowIndex + offset;
    if (target < 0 || target >= rows.length || !rows[rowIndex].indexes.length || !rows[target].indexes.length) return;
    const blocks = rows.filter(row => row.indexes.length).map(row => row.fields);
    const sourceBlockIndex = rows.slice(0, rowIndex).filter(row => row.indexes.length).length;
    const targetBlockIndex = rows.slice(0, target).filter(row => row.indexes.length).length;
    const [block] = blocks.splice(sourceBlockIndex, 1);
    blocks.splice(targetBlockIndex, 0, block);
    this.formElements = blocks.flat();
  }

  removeRow(row: FormBuilderRow): void {
    const remove = () => {
      const indexes = new Set(row.indexes);
      this.formElements = this.formElements.filter((_field, index) => !indexes.has(index));
      this.emptyRowIds = this.emptyRowIds.filter(id => id !== row.id);
      if (this.activeRowId === row.id) this.activeRowId = null;
    };
    row.fields.length ? confirm('Eliminare la riga e tutti i campi contenuti?', 'Conferma', ok => ok && remove()) : remove();
  }

  duplicateElement(index: number) {
    this.formElements = duplicateFormField(this.formElements, index);
  }

  openPropertiesModal(formElement: any,index:number) {
   this.selectedElement = { ...formElement };
   // this.modalService.open(this.propertiesModal);

    let guid = Math.random().toString().replace("0.", "");
    let InstanceData = {
      formField:this.selectedElement
    }
    
    this.propertiesModal.setNewPopUp(guid, 'ElementComponent', null, 800, null, InstanceData, false, true, "Gestione proprietà",'',false)
    

    let outputSubscription: Subscription | undefined;
    outputSubscription = this.propertiesModal.outputComponent.subscribe(resulOutputComponent=>{
      if(resulOutputComponent.guid == guid && resulOutputComponent.name == 'saveProperties'){
        
        if (index >= 0) {

          this.formElements[index] = resulOutputComponent.formField;

          this.propertiesModal.destroyCurrentOpenPopUpByGuid(guid);
          this.selectedElement = {}
          outputSubscription?.unsubscribe();
        }
      }

      if(resulOutputComponent.guid == guid && resulOutputComponent.name == 'closeProperties'){
        //this.formElements[index] = 
        this.propertiesModal.destroyCurrentOpenPopUpByGuid(guid);
        outputSubscription?.unsubscribe();
      }
    })
  }

  addAttribute(formElement: any) {
    const attribute = { name: '', value: '' };
    formElement.attributes.push(attribute);
  }

 

  saveForm(_formName: string) {
    this.formElements = normalizeDynamicFormFields(this.formElements);
    const formJson = this.formElements;

    const idForm = this.formId === 'new' ? Math.random().toString().replace("0.", "") : this.formId;
    const formNameS = this.formName.trim();
    if (!formNameS) {
      alert('Il nome del form è obbligatorio','Attenzione!');
      return;
    }

    const invalidRow = this.rows.find(row => !isRowWidthValid(row.fields));
    if (invalidRow) {
      alert('La somma delle larghezze personalizzate della riga supera 12. Ridurre una o più larghezze.', 'Layout non valido');
      return;
    }

    let fieldNames = this.formElements.map(element => element.name);
    let duplicateFieldName = fieldNames.find((name,index) => name && fieldNames.indexOf(name) != index);
    if (duplicateFieldName) {
      alert('Esiste già un campo con nome ' + duplicateFieldName,'Attenzione!');
      return;
    }

    const data = buildFormPayload(idForm!, formNameS, formJson);
    this.formService.saveForm(this.formId === 'new' ? 'new' : idForm!, data).then(() => {
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
