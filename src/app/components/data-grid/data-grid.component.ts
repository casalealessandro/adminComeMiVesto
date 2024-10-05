import { Component, ElementRef, EventEmitter, Input, OnInit, Output, AfterViewInit, SimpleChanges, ViewChildren, QueryList, ViewChild, AfterViewChecked, HostListener, inject } from '@angular/core';


import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ColData, Colonne, detailOptions, Odata, ToolbarButton } from '../../interface/app.interface';
import { CommonModule } from '@angular/common';
import { alert, confirm } from '../../widgets/ui-dialogs';
import { AnagraficaService } from '../../services/anagrafica.service';
import { TdItemComponent } from './td-item/td-item.component';
import { ToolbarComponent } from '../../layout/toolbar/toolbar.component';



export interface tasto {

  id: any;
  text?: string;
  icon?: string;
  disabled?: boolean;
  image?: string;
  separator?: boolean;
  visible?: boolean | Function;
  hint?: string;
  name?: string;
  widget: any;
  width?:number

}

@Component({
  selector: 'app-data-grid',
  templateUrl: './data-grid.component.html',
  standalone:true,
  imports:[CommonModule,TdItemComponent,ToolbarComponent],
  styleUrls: ['./data-grid.component.scss']
})


export class DataGridComponent{
  //@ViewChildren('tableRef') tableRef!: ElementRef<HTMLTableElement>;
  @ViewChildren('riga')
  righe!: QueryList<ElementRef>;

  @ViewChildren('tbody')
  tbody!: QueryList<ElementRef>;

  @Input() idTable:any;
  @Input() service:any;
  @Input() api:any;
  @Input() queryString: string = ''; //per ora è string ma va generata dynamicamente ricordati di farlo (02/04/2024 query string è dinamica)
  @Input() queryStringInEditor: string = ''; //Eventuale query string da usare nella post o nella put, ES:api-->/CampoRichiestoDocRifiuti
  @Input() isKeyID:  boolean = true; //se false l'api in put sarà senza /id  ES:api-->/CampoRichiestoDocRifiuti
  @Input() filterStatic?: string;
  @Input() remoteOperation: boolean = false;
  @Input() dataSource: any[] = [];
  @Input() overrideDataSource = null;
  @Input() dataJson:any
  @Input() selectedData: any[] = [] //Dati in ingresso ad esempio da una form , e seleziona/evidenzia le righe..(funziona solo su dati visibili) 
  @Input()
  tableHeight!: number;
  @Input() tableWidth: number = 1000;
  @Input()
  colonne!: Colonne[];
  @Input() isEditable: boolean = false
  @Input() justEditable: boolean = false //Mette tutte le righe in modalità editor, Attenzione! la griglia deve avere isEditable abilitato
  @Input() modeEdit: string = 'row';
  @Input() showEditorButtonsColls: boolean = true; //mostra la colonna dei bottoni di editor e cancella se false non appaiono anche se metti isEditable eq true
  @Input() selectionRowMode: string = 'single' //signle, multiple o detail, se detail e la griglia ha una riga di dettaglio seleziona solo le righe di dettaglio ;
  @Input() showFilter: boolean = false;
  @Input() showToolbarTop: boolean = false;
  @Input() showToolbarBottom: boolean = false;
  @Input() rowAlternate: boolean = true;
  @Input() isEditableNewRow: boolean = true;
  @Input() isEditableEditRow: boolean = true;
  @Input() isEditableDeleteRow: boolean = true;
  @Input() isSearchable: boolean = true;
  @Input() searchType: any= '';
  @Input() toolbarButtonsBottom!:ToolbarButton[];
  @Input() toolbarButtonsTop!:ToolbarButton[];
  @Input() detailOptions: detailOptions = {
    isRemote: false,
    service: '', api: '',
    isEditable: false,
    colonne: [],
    costantValue: [],
    queryString: '',
    groupDataField: ''
  };

  @Input() justRowExpanded: boolean = false;
  @Input() toolbarButtonsBottomLeft = [];
  @Input() toolbarButtonsBottomRight = [];
  @Input() toolbarButtonsTopLeft = [];
  @Input() toolbarButtonsTopRight = [];
  @Input() tabIndex = 800;
  @Input() showFooterSummary: boolean = false;

  @Output() emittendSelectionRow: EventEmitter<any> = new EventEmitter<any>();
  @Output() emittendDblRowClick: EventEmitter<any> = new EventEmitter<any>();
  @Output() emittendGridEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() emittendStartEdit: EventEmitter<any> = new EventEmitter<any>();
  @Output() emittendButtonExit: EventEmitter<any> = new EventEmitter<any>();
  @Output() emittendCellValueChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() emittendToolbarClick: EventEmitter<any> = new EventEmitter<any>();
  @Output() emittendBttonCellClick: EventEmitter<any> = new EventEmitter<any>();
  @Input() isOdata: boolean = true;
  @Input() continuousEditing: boolean = false;

  showT: boolean = false;

  colsHeader: ColData[] = [];
  colsGroup: any[] = [];
  colsRow: any[] = [];
  colsDetail: any[] = [];
  /**Variabili per le righe selezionate**/
  rowSelected: boolean[] = [];
  selectedRowIndex: number = 0;
  rowSelectedDetail: boolean[] = [false];
  selectedSubRowIndex: number = -1;
  rowIsDisable: boolean[] = [];
  /**************************************/

  showNullData: boolean = false;
  textEmpty: string = '...'
  showNullDataDetail: boolean = false;
  isSelIconVisible: boolean = false;
  showDetailRow: boolean[] = [false];
  haveDetail: boolean = false;
  colsRowDetail: any = [];
  colsGroupDetail:any ;
  colsGroupCaption: any[] = []
  currentLastRowHeight = 0;
  lastRowOffsetHeight: number = 0;
  tBodyoffsetHeight!: number;
  editorData: any[] = [];
  formGroupName!: FormGroup;
  showEditor: any;
  editorsElement: any = [];
  editorCellByRow: any=[];
  bodyHeight: number = 200;
  colsGroupShow: boolean = false;
  bodyStyle!: { height?: string; display: string; 'overflow-y': string; width?: string; 'border-top': string; };
  theadStyle!: { display?: string; width: string; };
  cellSelectWidth!: number;
  tableHeightWrapper!: number;
  buttonSXToolbar!: ToolbarButton[];
  buttonDXToolbar!: ToolbarButton[];
  buttonBottomToolbar!: tasto[];
  isSelIconMultipleVisible: boolean = false;
  groupIndexCol: any = null;
  groupedData: { [key: string]: any[] } | null = null;
  isSelIconDetailVisible: boolean = false;
  isOddRow: boolean = true;
  showEmptyRow: boolean = false;
  emptyRowStyleClass!: { height: string; backgroundColor: string; };
  pageSize = 20; // Imposta la dimensione della pagina desiderata
  currentPage = 0;
  totalRecords = 0;
  isLoading: boolean = false;
  tableStyle!: { 'width.px'?: number; 'height.px'?: number; 'overflow-y'?: string; display?: string; 'table-layout'?: string; };
  searchText!:string
  filterOdata: any;
  isHovered: any[] = [false];
  isHoveredDetatil: any[] = [false]; 
  rowcustomclass: any[] = []; 
  tableWidthDetail!: number;
  checkQueryStringError: boolean = false;
  validationObject: any = {}
  mockItem: any;
  inEditState: boolean = false;

  latestScrollTopPosition: number = 0;
  tableWrapWidth: number = 0;
  enableTfoot: boolean = false;
  valueSumm: any=[];
  rowSelectedAll: any=false;
  showEditorCellByRow: boolean=false;
  
  anagraficaService=inject(AnagraficaService)
  formservice: any;

  constructor(
    //private formservice: FormsTemplateService,
    private formBuilder: FormBuilder,
    private el: ElementRef,
    //private anagraficaService: AnagraficaService, 

  ) {

    this.refresh = this.refresh.bind(this);
    this.hideColumn = this.hideColumn.bind(this);
    this.calcolaSomma = this.calcolaSomma.bind(this);
  }

  

  @HostListener('window:scroll', ['$event'])
  @HostListener('window:keydown', ['$event'])

  handleKeyDown(event:any) {


    let tableId = document.getElementById(this.idTable) as HTMLElement;
    const focusedElement = document.activeElement as HTMLElement;

    
    if (event.code == 'Enter' || event.code == 'NumpadEnter') {
    
      setTimeout(() => {
        this.editorData.forEach((editor, i) => {

          this.saveEditorData(i, event)
        })
    
      }, 300);
      

    }

    if (event.code == 'NumpadAdd') {
           setTimeout(() => {
        if (this.continuousEditing) {
          this.addRow()
        }
      });
    }

    if (event.code == 'Escape') {
      event.stopPropagation();
      event.preventDefault(); 
       setTimeout(() => {
        if(this.inEditState){
          let rowEditIndex = this.editorData.findIndex(res=>res.edit)
         
          this.closeEditorData(rowEditIndex)
        }
        
       });
     }

    this.handleKeyboardEvents(event)
  }


  ngOnChanges(changes: SimpleChanges) {

    //console.log('ngOnChanges--->', changes)

    if (typeof changes['dataSource'] == 'undefined') {
      return
    }

    if (changes['dataSource'].currentValue &&  changes['dataSource'].firstChange) {

      this.renderGrid();

    }



  }

/*   ngAfterViewInit() {
   

  } */



  async ngAfterViewInit() {
    this.tableWrapWidth = (this.tableWidth - 5)
    this.editorData = [{
      rowIndex: null,
      data: {},
      edit: false,
      colProp: []
    }]


    if (!this.idTable) {
      
      alert('Manca ID devo aggiornare', 'Errore!')
    }

    if (typeof this.dataJson == 'string') {
      this.dataJson = JSON.parse(this.dataJson)
    }
//    console.log('dataJsonFilter-->',this.dataJson)
    await this.renderGrid();
    
    if(this.showToolbarTop){
      if(this.isSearchable){
        document.getElementById('toolbarInput')!.focus();
      }
    }
   
    this.focusRow(0);
  }



  async renderGrid() {
    
    this.textEmpty = '...';

    this.enableTfoot = false;

    if(this.showFooterSummary){
      this.enableTfoot = true;
      this.valueSumm = []
    }
    
    
    if (this.showToolbarTop) {
      this.tableHeightWrapper = this.tableHeight + 40;

      this.renderToolBarGrid(true, false);

    } else if (this.isSearchable) {

      this.tableHeightWrapper = this.tableHeight + 40;

      this.renderToolBarGrid(true, false);
    }

    if (this.showToolbarBottom) {
      let cH = this.tableHeight
      if (this.tableHeightWrapper > 0) {
        cH = this.tableHeightWrapper
      }
      this.tableHeightWrapper = cH + 26;
    }


    if (this.remoteOperation) {
      
      this.buildAndTestQueryString()

      this.isLoading = true
      let theQueryStingOdata = '';
      if (this.isOdata) {


        const options:Odata = {
          '$top': this.pageSize,
          '$skip': (this.currentPage) * this.pageSize,
          '$count': true

        };


        /*
        if(typeof this.searchText == 'string' && this.searchText.length > 0 && options['$skip'] != 0)
          options['$skip'] = 0;
        */

        if (this.filterOdata != '') {
          options['$filter'] = this.filterOdata;
        }

        if (typeof this.filterStatic !== "undefined") {

          
          //Se contiene OData ed è anche presente OData nel nostro options (FUNZIONA)
          if(this.filterStatic.toLowerCase().match(/\?$filter=/g) && options['$filter']){

            options['$filter'] += `and ${this.filterStatic.replace(/\?$filter=/g,'')}`

          }
         
          
          
        }
        

        let firstCaratter = this.queryString != '' && this.queryString.includes('?') ? '&' : '?';

        for (let x in options) {

          if (x == '$filter'){
            theQueryStingOdata += `${x}=${options[x]}`
          }
          else{
            let c = options[x as keyof Odata] as string;
            theQueryStingOdata += `${x}=${c}&` 
          }
        }

        theQueryStingOdata = firstCaratter + theQueryStingOdata;



      } else {

        /*  if (typeof this.filterOdata !== 'undefined' && this.filterOdata.length > 0)
           this.queryString = this.filterOdata;
         */
      }
      if (!this.checkQueryStringError && typeof this.mockItem == 'undefined') {



        if (typeof this.filterStatic !== 'undefined') {

          //Se abbiamo 2 OData
          if (theQueryStingOdata.toLowerCase().match(/\$filter=/g) && this.filterStatic.toLowerCase().match(/\?\$filter=/g))
            theQueryStingOdata += `and (${this.filterStatic.replace(/\?\$filter=/g, '')})`;
          else if (!theQueryStingOdata.toLowerCase().match(/\$filter=/g) && this.filterStatic.toLowerCase().match(/\?\$filter=/g))
            theQueryStingOdata = `${theQueryStingOdata}${this.filterStatic.replace(/\?/g,'')}`;

        }


        let res = await this.anagraficaService.getElenco(this.api, '', this.queryString, theQueryStingOdata);
        let resul
        if (res) {

          if (this.isOdata) {
            this.totalRecords = res['totalCount'];
          }

          if (res['items']) {
            res = res['items']
          } else {
            res = res
          }
          if (res[0]) {

            this.mockItem = Object.assign({}, res[0] as Object);

            Object.keys(this.mockItem).forEach((key) => {

              if (this.mockItem[key])
                this.mockItem[key] = null;

            });


          }
          resul = res
          this.dataSource = resul;
          this.dataSourceTemp = JSON.parse(JSON.stringify(resul));



          this.isLoading = false;
          if (this.showNullData && this.dataSource.length > 0) {
            this.showNullData = false;
            this.textEmpty = '...Caricato'
          }
        }

      }
    }



    this.buildRowData();

    this.selectRowByData()

    
    let cols

    let colonne = typeof this.colonne == 'undefined' ? [] : this.colonne 
    
    if (this.service && colonne.length == 0) {

      //cols = JSON.parse(JSON.stringify(this.formservice.getService(this.service)));

    } else {
      let findItem = this.colonne.find(ress => ress.itemType)
      if (typeof findItem == 'undefined') {
        let colSpan = this.colonne.length
        cols = [{
          itemType: "group", colSpan: colSpan, caption: "",
          groupDataField: '',

          data: this.colonne
        }]
      } else {
        cols = this.colonne;
      }


    }

    let detailGridCols = cols!.filter(res => res.itemType == 'dettaglio');

    

    this.buildHeaderColumns(cols!);

    await this.builDetailGrid(detailGridCols, detailGridCols);

    await this.resizeCols();

    this.eliminaRigheVuoteDallaPaginazioneSePresenti();

    await this.setEditorData();
    await this.setStyleBody()
    await this.setStyleEmptyRowRemote(this.dataSource);

    if(this.enableTfoot){
      await this.calcSommaryCells()
    }
    if (this.justEditable && this.isEditable) {
      this.startAllEditor()
    }


    let dataOutput = {
      name: 'gridHasInitialized',
      dataSource: this.dataSource,
      compnent: this,
      colonne: this.colsHeader

    }

    this.emittendGridEvent.emit(dataOutput);

  }

  renderToolBarGrid(isToobarTop: boolean, isToobarBottom: boolean) {


    try {

      this.buttonSXToolbar=[];
      this.buttonDXToolbar=[];

      if (isToobarTop) {
  
        this.showToolbarTop = isToobarTop;
        this.buttonDXToolbar = [
          {
            id: 'addRow',
            name: 'Nuovo',
            text: 'Nuovo',
            icon: 'icon-plus-circled',
            disabled: false,
            visible: this.isEditableNewRow,
            widget: 'button'
          },

          
        ]
        this.buttonSXToolbar = [{
          id: 'searchable',
          name: 'searchable',
          text: 'Cerca',
          icon: 'icon-cerca-barra',
          disabled: false,
          visible: this.isSearchable,
          widget: 'textBox',
          width:300,
        }]
        if (typeof this.toolbarButtonsTop != 'undefined') {
          this.toolbarButtonsTop.forEach(buttonDXToolbar => {
            if(typeof buttonDXToolbar.position != 'undefined'){
              if(buttonDXToolbar.position == 'left'){
                this.buttonSXToolbar.unshift(buttonDXToolbar);
                 
              }else if(buttonDXToolbar.position == 'right'){
                this.buttonDXToolbar.unshift(buttonDXToolbar)
              }

            }else{
              this.buttonDXToolbar.unshift(buttonDXToolbar)
            }
            


          })
        }
      

        
      }

      if (isToobarBottom) {
        let isVisible = this.selectionRowMode == 'multiple' ? true : false
        this.showToolbarBottom = true


      }
      //this.showToolbarBottom = true;
    } catch (error) {

    }

  }

  buildHeaderColumns(hCol:any) {

    this.colsGroup = [];
    this.colsHeader = [];
    this.colsDetail = []
    let tabIndex = 1;
    let widthCell = 0

    if (this.selectionRowMode == 'single') {
      this.colsGroup.push({
        span: '0',
        caption: null,
        class: 'single',

        style: 'background-color: #D6EEEE',
      })
      this.isSelIconVisible = true; // a gianni non piace l'iconcina che seleziona quindi la nascondo per sempre
      /* this.cellSelectWidth = 30;
      this.colsHeader.unshift({
        type: 'selection',
        id: 'selection',
        caption: '',
        search: false,
        colWidth: this.cellSelectWidth,
        class: null,
        dataField: null,
        colSpan: null,
        captionAlign: null,
        align: null,
        format: null,
        isEditable: false,
        edit: false,
        editorType: null,
        customizedOption: null,
        min: null,
        max: null,
        maxLength: null,

      }) */

    }
    if (this.selectionRowMode == 'multiple') {
      this.colsGroup.push({
        span: '0',
        caption: null,
        class: 'nultiple',

        style: 'background-color: #D6EEEE',
      })
      this.isSelIconMultipleVisible = true;
      this.cellSelectWidth = 30;
      this.colsHeader.unshift({
        type: 'selection',
        id: 'selection',
        caption: '',
        colWidth: this.cellSelectWidth,
        
        colCaption: undefined,
        allowFiltering: undefined,
        dataField: '',
        labelAlignment: undefined,
        edit: undefined,
        groupDataField: undefined,
   
      })
    }

    hCol.forEach((h:any) => {



      if (this.showToolbarBottom) {


        this.renderToolBarGrid(false, this.showToolbarBottom);

        /*this.cellSelectWidth = 30;

         this.colsHeader.unshift({
          type: 'selection',
          id: 'selection',
          caption: '',
          search: false,
          colWidth: this.cellSelectWidth,
          class: null,
          dataField: null,
          colSpan: null,
          captionAlign: null,
          align: null,
          format: null,
          isEditable: false,
          edit: false,
          editorType: null,
          customizedOption: null,
          min: null,
          max: null,
          maxLength: null,

        }) */

      }

      if (h.caption && h.colSpan && h.itemType == 'group') {
        this.colsGroupShow = true
        this.colsGroup.push({
          span: h.colSpan,
          caption: h.caption,
          class: h.class,

          style: 'background-color: #D6EEEE',
        })
      }



      h.data.forEach((resColH:ColData) => {

        tabIndex++
        let customizedOption
        
        if (typeof resColH.colVisible != 'undefined' && !resColH.colVisible) {
          return
        }

        if (resColH.type == 'empty') {
          return
        }

        if (resColH.type == 'campoDesc') {
          return
        }

        if (resColH.type == 'campoButton' ) {
          this.colsHeader.push({
            type: 'campoButton',
            search: false,
            id: resColH.dataField,
            caption: resColH.caption,
            colWidth: !resColH.colWidth ? resColH.colWidth = 'auto' : resColH.colWidth,
            width: resColH.colWidth,
            class: resColH.class,
            dataField: resColH.dataField,
            colSpan: resColH.colSpan,
            colAlignment: resColH.colAlignment,
            format: resColH.format,
            isEditable: false,
            edit: false,
            editorType: resColH.editorType,
            customizedOptions: customizedOption,
          
            validation: resColH.validation ? resColH.validation : [],
            min: resColH.min,
            max: resColH.max,
            maxLength: resColH.maxLength,
            tabIndex: tabIndex,
            button: resColH.button,
            labelAlignment: undefined,
            groupDataField: undefined,
            
            colCaption: undefined,
            allowFiltering: undefined
          })
          return
        }


        let customizedOptionKey

       
        if (typeof resColH.dynamic != 'undefined') {
          customizedOptionKey = 'dynamic';
          customizedOption = resColH.dynamic;

          if (customizedOption.queryString) {
            let queryString = customizedOption.queryString
            for (let x in this.dataJson) {
              if (queryString.includes(x)) {
                queryString = queryString.replace('$' + x, this.dataJson[x])
              }
            }

            resColH.dynamic.queryString = queryString;
            customizedOption.queryString = queryString;
          }

          //resColH.labelVisible = false
        }

        if (typeof resColH.lista != 'undefined') {
          customizedOptionKey = 'lista'
          customizedOption = resColH.lista

        }

        if (typeof resColH.lookup != 'undefined') {
          customizedOptionKey = 'lookup'
          customizedOption = resColH.lookup

        }

        let allowEditing = true
        if (typeof resColH.allowEditing != 'undefined') {
          allowEditing = resColH.allowEditing
        }
        if (typeof resColH.colWidth != 'undefined') {
          let colW = resColH.colWidth;
          
            if (typeof colW === 'string') {
              if (colW.includes('px')) {
                colW = colW.replace('px', '');
              }
            }
            


          
          resColH.colWidth = colW
        } else if (resColH.width) {

          let fieldW = resColH.width;
          if (typeof fieldW == 'string') {
            if (fieldW.includes('px')) {
              fieldW = fieldW.replace('px', '')
            }
          }
          resColH.colWidth = fieldW
        } else {
          resColH.colWidth = 'auto'
        }

        if (typeof resColH.groupIndex != 'undefined') {
          this.groupIndexCol = {

            customizedOptions: customizedOption,
            colSpan: resColH.colSpan,
            id: resColH.dataField,
            caption: resColH.caption,
            colWidth: !resColH.colWidth ? resColH.colWidth = 'auto' : resColH.colWidth,
            class: resColH.class,
            dataField: resColH.dataField,
            format: resColH.format,
            dataOptions: resColH,
            min: resColH.min,
            max: resColH.max,
            maxLength: resColH.maxLength,
            tabIndex: tabIndex,


          };

          return

        }


        let showInSummary = typeof resColH.showInSummary != 'undefined' ? resColH.showInSummary : false;

        let colCaption = resColH.caption;

        if(typeof resColH.colCaption != 'undefined'){
          if(resColH.colCaption){
            colCaption = resColH.colCaption
          }
        } 

        this.colsHeader.push({
          type: resColH.type,
          
          search: typeof this.showFilter != 'undefined' ? this.showFilter : resColH.allowFiltering,
          id: resColH.dataField,
          caption: colCaption,
          colWidth: !resColH.colWidth ? resColH.colWidth = 'auto' : resColH.colWidth,
          width: resColH.colWidth,
          class: resColH.class,
          dataField: resColH.dataField,
          colSpan: resColH.colSpan,
          colAlignment: resColH.colAlignment,
          format: resColH.format,
          isEditable: allowEditing,
          editorType: resColH.editorType,
          customizedOptions: customizedOption,
          validation: resColH.validation ? resColH.validation : [],
          min: resColH.min,
          max: resColH.max,
          maxLength: resColH.maxLength,
          tabIndex: tabIndex,
          showInSummary: showInSummary,
          
          colCaption: undefined,
          allowFiltering: undefined,
          labelAlignment: undefined,
          edit: undefined,
          groupDataField: undefined,
    
        })

        this.valueSumm[resColH.dataField] = null;
      })

    })
    console.log('colsHeader',this.colsHeader)
    if (this.isEditable && this.showEditorButtonsColls) {
      this.colsGroup.push({
        span: '0',
        caption: null,
        class: 'editable',

        style: 'background-color: #D6EEEE',
      })

      this.colsHeader.push({
        type: 'editorButtons',
        id: 'editorButtons',
        caption: '',
        search: false,
        colWidth: 30,
        class: null,


        isEditable: false,
        edit: false,
        labelAlignment: undefined,
        groupDataField: undefined,
    
        
        colCaption: undefined,
        allowFiltering: undefined,
        dataField: ''
      })
      this.colsHeader.push({
        type: 'removeButtons',
        id: 'removeButtons',
        caption: '',
        search: false,
        colWidth: 50,
        class: null,



        isEditable: false,
        edit: false,
        labelAlignment: undefined,
        groupDataField: undefined,
       
        
        colCaption: undefined,
        allowFiltering: undefined,
        dataField: ''
      })

    }

    if (this.colsRow.length > 0) {
      //this.setLastRow()
    }


        
  }

  groupData() {

    this.groupedData = {};

    /* this.dataSource.forEach(item => {
      if (!this.groupedData[item[this.groupIndexCol]]) {
        this.groupedData[item[this.groupIndexCol]] = [];
      }
      this.groupedData[item[this.groupIndexCol]].push(item);
    });

    console.log(this.groupedData) */

  }

  async builDetailGrid(detailGrid:any, keyRow?:any) {

    let colsDetail = [];
    let groupDataField = 'detail-grid'
    if (detailGrid.length > 0) {
      colsDetail = detailGrid;
      groupDataField = detailGrid[0].groupDataField
    }

    if (this.tableWidth) {
      this.tableWidthDetail = this.tableWidth - 90
    }

    if (!this.detailOptions) {
      return
    }

    if (this.detailOptions['service']) {
      colsDetail = this.formservice.getService(this.detailOptions['service']);
      colsDetail = colsDetail.filter((rees: { itemType: null; }) => rees.itemType != null)

    }

    if (typeof this.detailOptions['colonne'] != 'undefined') {

      if (this.detailOptions['colonne'].length > 0) {
        let findItem = this.detailOptions['colonne'].find((ress:any) => ress['itemType'])

        if (typeof findItem == 'undefined') {
          let colSpan = this.detailOptions['colonne'].length
          colsDetail = [{
            itemType: "group", colSpan: colSpan, caption: "",
            groupDataField: groupDataField,

            data: this.detailOptions['colonne']
          }]
        } else {
          colsDetail = this.detailOptions['colonne'];
        }
      }

    }



    if (colsDetail.length == 0) {
      return
    }

    this.haveDetail = true;


    let indexDetail = this.colsHeader.findIndex(resD => resD.type == 'detail')

    if (indexDetail >= 0) {
      return
    }

    this.colsHeader.unshift({
      type: 'detail',
      id: 'detail',
      caption: '',
      search: false,
      colWidth: '30',
      class: 'detailCol',
      groupDataField: groupDataField,
      labelAlignment: undefined,
      edit: undefined,
      
      
      colCaption: undefined,
      allowFiltering: undefined,
      dataField: ''
    })

    this.colsGroupCaption = []

    colsDetail.forEach((col:Colonne) => {
      //Sta puttanata che ho fatto qui sotto va gestita bene ricordati
      if (!this.detailOptions['isRemote']) {

        this.colsGroupCaption.push({
          span: col.colSpan,
          caption: col.caption,
          class: col.class,
          style: 'background-color: #D6EEEE',
        })
        this.colsGroupShow = true;

        this.colsGroup.unshift({
          span: '1',
          caption: '',
          class: col.class + ' dettaglio',
        })
      }


      col.data.forEach(resColH => {

        if (typeof resColH.colVisible != 'undefined' && !resColH.colVisible) {
          return
        }



        this.colsDetail.push({
          type: 'data-detail',
          id: resColH.dataField,
          caption: resColH.caption,
          colWidth: resColH.colWidth,
          class: resColH.class,
          dataField: resColH.dataField,
          colSpan: resColH.colSpan,
          captionAlign: resColH.labelAlignment,
          align: resColH.colAlignment,
          format: resColH.format,


        })


      })

    })




    if (this.selectionRowMode == 'detail') {
      this.isSelIconDetailVisible = true;
      this.cellSelectWidth = 30
      this.colsDetail.unshift({
        type: 'selection-detail',
        id: 'selection-detail',
        caption: '',
        search: false,
        colWidth: this.cellSelectWidth,
        class: null,
        dataField: null,
        colSpan: null,
        captionAlign: null,
        align: null,
        format: null,
        isEditable: false,
        edit: false,
        editorType: null,
        customizedOption: null,
        min: null,
        max: null,
        maxLength: null,

      })

    }

    if (this.justRowExpanded) {
      this.dataSource.forEach((rrr, c) => {
        for (let x in rrr) {
          if (x == groupDataField) {
            this.showDetailRow[c] = true
            this.colsRowDetail[c] = rrr[groupDataField];
            this.collapse(null, rrr, c, groupDataField)

          }
        }
      })
    }



  }

  async resizeCols(cols?:any) {
    //this.tableWidth
    // Larghezza fissa della tabella
    const larghezzaTabella = typeof this.tableWrapWidth == 'undefined' ? 1000 : this.tableWrapWidth;

    if (!cols) {
      cols = this.colsHeader
    }

    const larghezzaCelleArray = cols.map((ress:any) => {
      if (ress.colWidth == 'auto') {
        return ress.colCaption.length
      }
      if (ress.colWidth != null) {
        return Number(ress.colWidth);
      }
    })
    const data = ['icon','selection','editorButtons','removeButtons','detail','campoDesc','empty']
    // Calcola la larghezza totale delle celle già presenti
    const larghezzaCellePresenti = larghezzaCelleArray.reduce((acc: any, larghezza: any) => acc + larghezza, 0);

    // Calcola la larghezza disponibile per le celle dinamiche
    let larghezzaCelleDinamiche = larghezzaTabella - larghezzaCellePresenti;

    // Verifica se la larghezza delle celle dinamiche è positiva
    if (larghezzaCelleDinamiche < 0) {

      // Calcola il fattore di scala per adattare le larghezze delle celle
      const fattoreDiScala = larghezzaCelleDinamiche / larghezzaCellePresenti;



      // Aggiorna le larghezze delle celle già presenti e la nuova cella dinamica
      const larghezzeAggiornate = larghezzaCelleArray.map((larghezza: number) => larghezza * (1 + fattoreDiScala) /*sarà 1- se fattore di scala è negativo*/);

      // Ora puoi utilizzare le larghezzeAggiornate per impostare la larghezza delle celle nel tuo loop

      
      const columnsData = this.colsHeader.filter((res:any) => !data.some(res.type))

      for (let i = 0; i < larghezzeAggiornate.length; i++) {
        if (!columnsData.some(cols[i].type)) {
          cols[i].colWidth = larghezzeAggiornate[i].toFixed(3)
          cols[i].width = larghezzeAggiornate[i].toFixed(3)

        }

      }

    } else {
      
      const colonneEscluse = cols.filter((col:any) => data.some(col.type) || typeof col.groupIndex != 'undefined');

      let larghezzaColonneEscluse: number = 0;
      colonneEscluse.forEach((colonnaEsclusa:any) => {
        larghezzaColonneEscluse += Number(colonnaEsclusa.colWidth);
      });


      const larghezzaTotaleColonne: number = larghezzaCellePresenti


      const larghezzaRimanente: number = this.tableWrapWidth  - larghezzaColonneEscluse;

      // Calcola il fattore di scala basato sulla larghezza rimanente e la larghezza totale delle colonne
      const scala: number = larghezzaRimanente / (larghezzaTotaleColonne - larghezzaColonneEscluse);


      //const scala: number = larghezzaRimanente / (this.colsHeader.length - colonneEscluse.length);

      for (let i = 0; i < cols.length; i++) {
        if (cols[i].colWidth != 'auto') {
          cols[i].colWidth = cols[i].colWidth * scala;
        } else if (cols[i].colWidth == 'auto') {
          cols[i].colWidth = larghezzaCelleArray[i] * scala;
        }
      }



    }
    
    this.colsHeader = cols
  }


  buildRowData() {
    this.colsRow = [];


    if (typeof this.dataSource == 'undefined') {
      this.dataSource = []
      return
    }

    if(this.overrideDataSource){
      this.dataSource = this.overrideDataSource
    }

    if(typeof this.dataSource != 'object'){
      this.dataSource = []
    }
    if(!this.dataSource){
      this.dataSource = []
    }

    if (this.dataSource.length == 0) {
      this.showNullData = true;
      this.textEmpty = 'Nessun dato da mostrare '
      return
    }

    this.colsRow = this.dataSource;


    let data: any[] = []

    const arrayOggetti = this.dataSource
    for (let i = 0; i < arrayOggetti.length; i++) {
      for (let chiave in arrayOggetti[i]) {
        if (chiave === null) {
          delete arrayOggetti[i][chiave];
        }
      }
    }


    if (this.dataSource.length > 0) {
      data = this.dataSource;
      /*
        Alcune variabili e controlli sono state aggiunte dopo, considerato che shownulldata è successivo come controllo ho dovuto settare a false questa variabile per mostrare i dati non remoti se vegono aggiornati successivamente.
      */
      
      if(!this.remoteOperation){
        this.showNullData = false;
      }
    }
    
        
     

    let dataEmit = {
      data: data,
      name: 'dataSourceChange',
      masterComponent: this
    }

    this.emittendGridEvent.emit(dataEmit)


  }

  async setEditorData() {
    this.editorCellByRow = []
    this.editorData = []


    this.dataSource.forEach((item:any, i) => {


      this.editorData[i] = {
        rowIndex: i,
        data: { ...item },
        edit: false,
        colProp: this.setCellProperty(item) // this.setCellProperty(item)
      }

      this.colsHeader.forEach(cell => {
        if (cell.isEditable) {
          this.editorCellByRow[i] = {
            ... this.editorCellByRow[i],
            [cell.dataField]: cell.edit

          }
        }
      })

    })

    this.editorsElement = [];


  }

  setCellProperty(item: any) {
    let cellProperty: any[] = [];

    for (let x in item) {
      const colsHeaderProp = this.colsHeader.filter(res => res.dataField == x)
      if (colsHeaderProp.length > 0) {
        cellProperty = { ...cellProperty, [x]: colsHeaderProp[0] }

      }


    }


    return cellProperty
  }

  isMockDataLoadingFn(item: any) : boolean{

    if(!item || item == this.mockItem)
      return true;
    else
      return false;

  }
  
  latestSkipLoaded: number = 0;

  async onScroll(event: Event) {

    if (!this.isLoading && this.remoteOperation) {

      let isNearBottom = this.isScrollingNearBottom(event);

      if (isNearBottom == true && this.dataSource.length >= this.pageSize) {

        (document.getElementsByTagName('body').item(0) as HTMLBodyElement).style.cursor = "progress";
        this.isLoading = true;



        this.currentPage++;

        let tempArray = [];


        for (let i = 0; i < this.pageSize; i++) {

          if (i + this.latestSkipLoaded < this.totalRecords) {

            //tempArray[i] = {...this.mockItem};
            //tempArray[i] = {};
            //tempArray[i] = this.mockItem;
            tempArray.push(this.mockItem);

          }

        }

//        console.warn(tempArray, this.pageSize)

        this.latestSkipLoaded = this.currentPage * this.pageSize;

        

        this.dataSource.push(...tempArray);



        this.remoteOperation = false; 



        this.buildRowData();
        await this.setEditorData();
        //this.setStyleEmptyRowRemote(this.dataSource);
        //this.setStyleBody()


        this.remoteOperation = true;


        //Devo fare un funzione piu veloce per caricare i restanti record se uso loadRemoteRecords() è molto lento
        //e non mi da l'idea del virtual scrolling
        //await this.renderGrid();

        //const t = this;

        //this.loadRemoteRecords = this.loadRemoteRecords.bind(t);

        setTimeout(
          async () => {

            await this.loadRemoteRecords();

            this.isLoading = false;

          }, 800
        )




      }
      else {



      }
      /*
      else {
        this.currentPage = this.currentPage > 0 ? this.currentPage - 1 : 0;



        //await this.loadRemoteRecords();

      }
      */
    }
    else if(this.isLoading == true){
      var scrollBarCustom = document.getElementById("scrollBarCustom");
      if (scrollBarCustom && scrollBarCustom.scrollHeight - scrollBarCustom.clientHeight ==  Math.floor(scrollBarCustom.scrollTop))
      {

    
          var targetElement = event.target as HTMLElement;
          scrollBarCustom.scrollTop = (targetElement.scrollTop - 10);
    
        }
      
    

    }

  }


  private isScrollingNearBottom(event: any): boolean {
 
    const element: Element = event.target;
    const offset = event.target.offsetHeight - 1; // Imposta un offset in pixel per attivare la paginazione


    //Devo fare la somma in pixel di tutti gli elementi attuali
    let table: HTMLTableElement = document.getElementById(this.idTable) as HTMLTableElement;

    let primaRiga: HTMLTableRowElement = table.children.item(0) as HTMLTableRowElement;

    let totaleAltezza = (primaRiga.offsetHeight - 1) * this.dataSource.length;

 
    


    if (element.scrollTop > 0 && element.scrollTop >= ((totaleAltezza - offset) - 10) && element.scrollTop >= this.latestScrollTopPosition && (this.dataSource.length <= this.totalRecords)) {

      this.latestScrollTopPosition = element.scrollTop;


     table.scrollTo(0, element.scrollTop - 10);

      return true;
    }



    return false;
  }



  selectRowByData() {
    if (typeof this.selectedData == 'undefined' || this.selectedData == null) {
      return
    }

    if (!this.selectedData) {
      return
    }

    if (this.selectedData.length > 0) {

      let index = []

      // Funzione di confronto per verificare se due oggetti sono uguali
      const sonoUguali = (oggetto1: any, oggetto2: any) => {
        // Implementa la tua logica di confronto qui
        // Ad esempio, confronta tutti i valori degli oggetti
        for (let p in oggetto1) {
          if (oggetto1[p] == oggetto2) {
            return true
          }
        }
        return false
      };

      // Inizializza un array per memorizzare gli indici degli elementi trovati
      const indiciElementiPresenti: number[] = [];

      // Verifica se oggettoCon5Elementi è un array semplice o una collezione di elementi
      if (Array.isArray(this.selectedData)) {
        // Se è un array semplice
        this.dataSource.forEach((elemento, indice) => {
          this.selectedData.forEach(select => {
            if (sonoUguali(elemento, select)) {
              this.rowSelected[indice] = true

            }
          })

        });
      } else if (typeof this.selectedData === 'object' && this.selectedData !== null) {
        // Se è una collezione di elementi
        this.dataSource.forEach((elemento, indice) => {
          if (sonoUguali(elemento, this.selectedData)) {

            this.rowSelected[indice] = true
          }
        });
      } else {
        console.log("1038 - Tipo di oggetto non supportato.");
      }

      // console.log("Indici degli elementi presenti:", indiciElementiPresenti)

    }
  }

  /**Funzioni di render**/
  alternateRowColor(rowIndex: any, rowAlternate: any) {
    if (rowAlternate) {

      this.isOddRow = !this.isOddRow;
      
    }
  }

  calcSommaryCells(){

    this.colsHeader.forEach(col=>{
      this.calcolaSomma(col)
    })
  }
  /**Fine Funzioni di render */


  /**Funzione di dataRourceRemote **/
  async loadRemoteRecords() {



    /*

      $count=true   =>   Restituisce il conteggio di TUTTI gli elementi restituiti dalla richiesta

      $top=10      =>    GRANDEZZA PAGINA , Quanti items devono essere restituiti dalla richiesta (es griglia con 10 record a video)

      $skip=1       =>   NUMERO PAGINA , Salta del numero di pagina inserit (es ho come prima 10 record a video, se metto skip=1 vedo gli altri 20 a video)

      $count=true   =>   TOTAL COUNT , Restituisce il conteggio di TUTTI gli elementi restituiti dalla richiesta

      $top=10      =>    GRANDEZZA PAGINA , Quanti items devono essere restituiti dalla richiesta (es griglia con 10 record a video)

      $skip=1       =>   NUMERO PAGINA , Salta del numero di pagina inserit (es ho come prima 10 record a video, se metto skip=1 vedo gli altri 10 a video, se metto skip=0 o non passo lo skip ritono ai primi 10 records)
    
    */





    this.buildAndTestQueryString()


    const options = {
      '$top': this.pageSize,
      '$skip': this.latestSkipLoaded,
      '$count': true,
      '$filter':''

    };

    /*
    if(typeof this.searchText == 'string' && this.searchText.length > 0 && options['$skip'] != 0)
      options['$skip'] = 0;
    */

    if (this.filterOdata != '') {
      options['$filter'] = this.filterOdata;

    }

    let theQueryStingOdata = ''
    let firstCaratter = this.queryString == '' ? '?' : '&'
    for (let x in options) {
      let c = options[x as keyof Odata] as string;
      theQueryStingOdata += `${x}=${c}&` 
      //theQueryStingOdata += `${x}=${options[x]}&`
    }

    theQueryStingOdata = firstCaratter + theQueryStingOdata
      if(this.filterStatic)
      // Eventuali filtri statici durante lo scroll SENZA FILTRI APPLICATI NELLA BARRA DI RICERCA
      if (!theQueryStingOdata.toLowerCase().match(/\$filter=/g) && this.filterStatic.toLowerCase().match(/\?\$filter=/g))
        theQueryStingOdata = `${theQueryStingOdata}${this.filterStatic.replace(/\?/g,'')}`;
      else if(theQueryStingOdata.toLowerCase().match(/\$filter=/g) && this.filterStatic.toLowerCase().match(/\?\$filter=/g))
        theQueryStingOdata = `${theQueryStingOdata} and ${this.filterStatic.replace(/\?\$filter=/g,'')}`;
    /*
    setTimeout(
      async ()=>{
      */


    try {


      let res = await this.anagraficaService.getElenco(this.api, '', this.queryString, theQueryStingOdata);

     

      if (res['items'].length == 0) {
        return
      }




      //Tutti i vari temp mock objects andranno ora rimpiazzati dai dati della paginazione OData successiva


      for (let i = 0; i < this.pageSize; i++) {

        if (this.dataSource[i + this.latestSkipLoaded] == this.mockItem)
          this.dataSource[i + this.latestSkipLoaded] = res['items'][i];
        /*
        if(i == this.pageSize)
        setTimeout(()=>{
        
          this.isLoading = false;
      
        },500);
        */
      }





      /*

      Objecthis.values(obj).every(value => value === null)
      console.log(this.dataSource);
      */


      //this.dataSource = this.dataSource.concat(res['items']);

      this.totalRecords = res['totalCount'];
      this.dataSourceTemp = JSON.parse(JSON.stringify(res['items']));


    } catch (ex) {


    }
    finally {


      this.isLoading = false;
      this.showNullData = false;

      (document.getElementsByTagName('body').item(0) as HTMLBodyElement).style.cursor = "auto";

      /*
            let index = this.dataSource.findIndex(item => {return typeof item == 'undefined' ||item.id == null });
            console.log('prima',this.dataSource,index);
             
            if(index != -1){
      
              this.dataSource.splice(index);
              
            }
      
            console.log('dopo',this.dataSource);
      */

 


      await this.renderGrid();



    }
    /*
  },500
  );
*/

  }

  /**Fine funzione di dataRourceRemote **/
  buildAndTestQueryString() {

    if (this.queryString != '') {

      let queryString = this.queryString;

      // crea un'espressione regolare per cercare "$filter=(...)"
      let regexFilter = /\$filter=\([^]*\)*/;

      // Esegui la ricerca nella stringa
      let matchFilter = queryString.match(regexFilter);

      // Verifica se c'è una corrispondenza
      if (matchFilter) {

        let parteSenzaFilter = matchFilter[0].replace(/\$filter=/, '');
        //rimuovere solo la parte ?$filter= 
        console.log("Trovato:", parteSenzaFilter);

        if (parteSenzaFilter.includes('$')) {
          for (let x in this.dataJson) {
            if (queryString.includes(x)) {
              let regex = new RegExp('\\$' + x + '\\b', 'g');
              parteSenzaFilter = parteSenzaFilter.replace(regex, this.dataJson[x]);
              //queryString = queryString.replace('$' + x, this.dataJson[x]);

            }
          }

        }

        this.filterOdata = parteSenzaFilter;

        queryString = queryString.replace(regexFilter, '');

        //Pezzottissimo
        if (queryString == '?)') {
          queryString = ''
        }

        //Altro pezzottissimo

        if (queryString.endsWith('?')) {
          queryString = queryString.replace('?', '')
        }

        //............
        this.queryString = queryString;
      }


      if (this.queryString.includes('$')) {
        for (let x in this.dataJson) {
          if(x){
            if (queryString.includes(x)) {
              let regex = new RegExp('\\$' + x + '\\b', 'g');
              if (typeof this.dataJson[x] == 'undefined') {
                this.checkQueryStringError = true;
                return
              }
  
              
  
              if (!this.dataJson[x]) {
                this.checkQueryStringError = true;
                return
              }
  
              queryString = queryString.replace(regex, this.dataJson[x]);
  
  
            }
          }
          
        }
        this.checkQueryStringError = false;
        this.queryString = queryString
      }
    }
  }

  /**Funzioni di editor**/
  isEditorCellByRowNotEmpty() {
    return this.editorCellByRow.length > 0; 
  }
  startEditor(event: any, index: any) {

    if (event) {
      event.preventDefault();
      event.stopPropagation();

    }

    let eventOutput = {
      event: event,
      rowIndex: index,
      data: this.dataSource[index],
      cellsInfo: this.editorData[index]['colProp'],
      cancel: false,
      name: 'startingRowEditor'
    }

    this.emittendStartEdit.emit(eventOutput);

    if (eventOutput.cancel) {
      return;
    }

    const allColls = this.editorData[index]['colProp'];
    let validation: any = []
    for (let dataField in allColls) {

      allColls[dataField].edit = false,
        allColls[dataField].class = ''
      if (allColls[dataField].validation.length > 0) {
        validation[dataField] = allColls[dataField].validation[0].type == 'required' ? Validators.required : null

        this.validationObject = {
          ...this.validationObject,
          [dataField]: {
            type: allColls[dataField].validation[0].type,
            message: allColls[dataField].validation[0].message
          }

        }


      }



    }


    this.editorData.forEach(res => {
      res.edit = false;
    })

    let dataRow = this.editorData[index].data;
    const formGroupFields:any = {};
    let formGroup = {};



    //https://stackblitz.com/edit/angular-reactive-forms-dynamic-validation?file=src%2Fapp%2Fcontrol-messages.component.ts
    for (let x in dataRow) {

      formGroupFields[x] = [{ value: dataRow[x], disabled: false, }, validation[x]]

    }

    formGroup = {
      ['row' + index]: this.formBuilder.group(formGroupFields)
    }

    this.formGroupName = this.formBuilder.group(formGroup);


    this.editorData[index].edit = true;



    for (let dataField in this.editorCellByRow[index]) {
      if (allColls[dataField].isEditable) {
        if (typeof this.editorCellByRow[index][dataField] != 'undefined')
          this.editorCellByRow[index][dataField] = true;
      }
    }

    for (let dataField in allColls) {

      if (allColls[dataField].isEditable) {
        //allColls[dataField].edit = true,
        allColls[dataField].class = allColls[dataField].class.concat(' editor-cell')
      }
    }

    this.inEditState = true


    setTimeout(() => {
            
      let cols = this.colsHeader.filter((r:ColData) =>  r.isEditable);
  
      if (this.editorsElement.length == cols.length) {
        this.editorsElement[0].htmlElement.focus();
        //this.editorsElement[0].component.onFocusInEvent()
      }
  
   
    }, 500);

  }

  startEdit(index: any, event: any) {

    this.dataSource[index].isNewRow = false;

    let eventEditor = {
      infoEvent: event,
      rowIndex: index,
      data: this.dataSource[index],
      name: 'buttonEditRowEvent',
      idTable:this.idTable,
      service:this.service,
      cancel:false,
      component:this
    }
    this.emittendStartEdit.emit(eventEditor)
    
    if(eventEditor.cancel){
      return 
    }

    this.startEditor(event, index);

  }

  public startAllEditor() {
    let formGroup = {};
    this.dataSource.forEach((row, index) => {

      const allColls = this.editorData[index]['colProp'];
      let validation: any = []
      for (let dataField in allColls) {

        allColls[dataField].edit = false
        //allColls[dataField].class = ''
        if (allColls[dataField].validation.length > 0) {
          validation[dataField] = allColls[dataField].validation[0].type == 'required' ? Validators.required : null
        }


      }


      let dataRow = row;
      const formGroupFields:any = {};





      //https://stackblitz.com/edit/angular-reactive-forms-dynamic-validation?file=src%2Fapp%2Fcontrol-messages.component.ts
      for (let x in dataRow) {

        formGroupFields[x] = [{ value: dataRow[x], disabled: false, }, validation[x]]
        formGroup = { ...formGroup, ['row' + index]: this.formBuilder.group(formGroupFields) }


      }




      this.editorData[index].edit = true;


      for (let dataField in this.editorCellByRow[index]) {
        if (allColls[dataField].isEditable) {
          if (typeof this.editorCellByRow[index][dataField] != 'undefined')
            this.editorCellByRow[index][dataField] = true;
        }
      }

      for (let dataField in allColls) {
        let colClass = ''
        if (allColls[dataField].isEditable) {
          if (allColls[dataField].class) {
            colClass = allColls[dataField].class
          }
          allColls[dataField].class = colClass.concat(' editor-cell')
        }
      }
    })

    this.formGroupName = this.formBuilder.group(formGroup);
  }


  async removeRowData(index: any, event:any) {


    event.stopPropagation();
    event.preventDefault();
    
    confirm('Sei certo di voler eliminare questo record?', 'Attenzione!',res=>{
     
      
      if (!res) {
        return
      }

      let delEvent = {
        name:'delRows',
        rowIndex:index,
        rowData:this.dataSource[index]
      }

      this.emittendGridEvent.emit(delEvent)

      if (!this.remoteOperation) {

        let dataSource = this.deleteRow(index);
        if (dataSource.length == 0) {
          this.dataSource = [];
          
        }
        
        this.renderGrid()

      } else if (res) {
        let id = this.dataSource[index].id
        this.anagraficaService.actionDelete(this.api, id).then(res => {
          this.dataSource = []
          this.colsRow = []
          this.resetPageInfo()
          this.renderGrid()
        })
      }
    })

  }

  getFormGroup(index: string) {

    //console.log('getFormGroup-->',this.formGroupName.get('row' + index))
    return this.formGroupName.get('row' + index)

  }

  editorElement(event: { htmlElement: any; component: any; }, indexEl: any) {




    this.editorsElement.push(
      {
        htmlElement: event.htmlElement,
        component: event.component
      }
    );


   
    
  }

  saveEditorDataInbatch() {
    let dataLav: any[] = []
    this.editorData.forEach((editor, i) => {
      let check = this.sonoTuttiNulli(editor.data)
      if (!check) {
        dataLav[i] = editor.data;
      }
      this.dataSource[i] = editor.data;
    })

    return dataLav
  }

  async saveEditorData(index: number, event: { stopPropagation: () => void; preventDefault: () => void; }) {

    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    if (this.formGroupName.invalid) {
      const campiObbligatoriMancanti = this.controllers(this.formGroupName);


      let msg = campiObbligatoriMancanti.join('-')
      alert(msg, 'Attenzione!')
     
      return
    }



    if (!this.remoteOperation) {
      const arrayOggetti = this.editorData[index].data
      for (let i = 0; i < arrayOggetti.length; i++) {
        for (let chiave in arrayOggetti[i]) {
          if (chiave === null) {
            delete arrayOggetti[i][chiave];
          }
        }
      }

      this.dataSource[index] = arrayOggetti;

      /***Se ci sono campi relazionari***/

      let related = this.editorData[index]['colProp'].related

      /***************************************/
      

      

      await this.closeEditorData(index);
      //

      let dataOutput = {
        name: 'saveEditorData',
        dataSource: this.dataSource,
        currentData: this.dataSource[index]
      }

      this.emittendGridEvent.emit(dataOutput);

      this.inEditState = false;
      this.mockItem = undefined
      this.renderGrid();
      

    } else {

      this.dataSource[index] = this.editorData[index].data;
      if (this.dataSource[index].isNewRow) {
        let dataToSend

        for (let x in this.dataJson) {
          this.dataSource[index] = { ...this.dataSource[index], [x]: this.dataJson[x] }
        }

        dataToSend = this.dataSource[index];

        this.anagraficaService.actionInsert(this.api, dataToSend).then(results => {
          this.dataSource = []
          this.colsRow = []
          this.mockItem = undefined;
          this.inEditState = false
          this.renderGrid();

        })
      }

      if (!this.dataSource[index].isNewRow) {
        let dataToSend


        dataToSend = this.dataSource[index];
        
       
      

        this.anagraficaService.actionPut(this.api, dataToSend,this.isKeyID).then(results => {
          this.dataSource = []
          this.colsRow = []
          this.mockItem = undefined;
          this.inEditState = false
          this.renderGrid();

        })
      }
      //alert('Funzione in arrivo', 'Attenzione!')
    }








  }

  controllers(formGroup: FormGroup | FormArray): string[] {
    let campiObbligatoriMancanti: string[] = [];

    Object.keys(formGroup.controls).forEach(campo => {
      const control = formGroup.get(campo);

      if (control instanceof FormGroup || control instanceof FormArray) {
        campiObbligatoriMancanti = campiObbligatoriMancanti.concat(this.controllers(control));
      } else if (control && control.errors && control.errors['required']) {
        //console.log('validationObject-->', this.validationObject.campo)
        if (typeof this.validationObject[campo] != 'undefined') {
          let message = this.validationObject[campo].message

          campiObbligatoriMancanti.push(message);
        }

      }
    });

    return campiObbligatoriMancanti;
  }

  sonoTuttiNulli(obj: { [key: string]: any }): boolean {
    delete obj['isNewRow']
    return Object.values(obj).every(value => value === null);
  }

  async closeEditorData(index: number, event?: { stopPropagation: () => void; preventDefault: () => void; } | undefined) {

    if (event) {

      event.stopPropagation();
      event.preventDefault();

    }

    let check = this.sonoTuttiNulli(this.editorData[index].data)

    if (this.formGroupName.invalid || check) {
      //await this.closeEditorData(index)
      await this.deleteRow(index);
      this.inEditState = false;
      this.renderGrid()
      return;
    }

    const allColls = this.colsHeader;

    allColls.forEach(col => {

      col.edit = false,
      col.class = ''


    });

    //Mi confermo i dati
    const dataEditors= this.editorData[index].data
      
    this.dataSource[index] = dataEditors;


    for (let dataField in this.editorCellByRow[index]) {

      if (typeof this.editorCellByRow[index][dataField] != 'undefined')
        this.editorCellByRow[index][dataField] = false
    }
    this.editorData[index].edit = false;
    this.inEditState = false;
    this.righe.map(row => {
      let ro = row.nativeElement

      if (ro.classList.contains('error-row')) {
        ro.classList.remove('error-row')
      }

      return ro;
    })
  }


  emitButtonDynamic(event:any,rowIndex: any) {
    //console.log('emitButtonD88888ynamic', event)

    switch (event.name) {
      case 'emitButtonDynamic':




        break;
      case 'emitButtonType2':
        //this.actionCampoButton(event);
        break;
      case 'beforeEmitButtonDynamic':
        event.dataSource = this.dataSource;
        event.dataGridComponent = this
        event.rowIndex = rowIndex
        this.emittendGridEvent.emit(event);
        break;

      default:
        break;
    }

  }

  outputElementValue(ev: { campo: { dataField: any; }; }, rowIndex: number) {
    console.log('outputElementValue--->', ev);
    let dataField = ev.campo.dataField;
    if (rowIndex >= 0 && typeof dataField != 'undefined') {
      if (this.editorData[rowIndex].edit && this.justEditable) {

        this.dataSource[rowIndex][dataField] = this.editorData[rowIndex]['data'][dataField];

        let dataToEmit = {
          value: this.editorData[rowIndex]['data'][dataField],
          cellName: dataField,
          cols: this.colsHeader,
          rowIndex: rowIndex,
          dataSource: this.dataSource,
          rowData: this.dataSource[rowIndex],
          name: 'cellValueChange'


        }
        this.emittendCellValueChange.emit(dataToEmit)
      }

    }
    return

  }
  /**Fine Funzioni di editor**/

  /**Inizio Funzioni di selezione**/
  setStateHover(ev: any, element: any, rowIndex: any) {
    this.isHovered[rowIndex] = true

    /*
    
    
    
    */

  }

  leaveStateHover(ev: any, element: any, rowIndex:any) {
    this.isHovered[rowIndex] = false;
  }

  selectRow(event: any, index: any, row: any, selectRowIndex?:any) {
    
    let prevIndex = index - 1

    this.selectionChange(event, prevIndex)

    let infoRows = {
      isRowFather: false,
      isRowDetail: false
    }


    let eventClickRow = {
      event: event,
      rowData: row,
      component:this,
      dataSource: this.dataSource,
      infoRows: infoRows,
      rowIndex: index,
      name: 'onRowOnlyClick',
      cancel:false
    }

    this.emittendSelectionRow.emit(eventClickRow);

    if(eventClickRow.cancel){
      return
    }

    if(!this.selectionRowMode){
      
      return
    }

    if (this.selectionRowMode == 'detail') {
      this.collapse(event, row, index);
     
      return
    }


    if (this.selectionRowMode == 'multiple') {
      this.selectRowMultiple(event, index, row)
      return
    }

    if (this.showDetailRow[selectRowIndex]) {
      infoRows.isRowDetail = true;
      this.rowSelectedDetail = [false]

      if (!this.rowSelectedDetail[index]) {

        this.rowSelectedDetail[index] = true;


      } else {

        this.rowSelectedDetail[index] = false;
      }

      let eventSelectRow = {
        event: event,
        data: row,
        fatherData: this.dataSource[selectRowIndex],
        infoRows: infoRows,
        rowIndex: index,

        name: 'onRowSelectionChange'
      }
      this.emittendSelectionRow.emit(eventSelectRow);


      return
    }

    this.rowSelected = []

    if (!this.rowSelected[index]) {

      this.rowSelected[index] = true;

    } else {

      this.rowSelected[index] = false;
    }

    if (this.editorData[index].edit) {
      return
    }

    let eventSelectRow = {
      event: event,
      data: row,
      infoRows: infoRows,
      rowIndex: index,

      name: 'onRowSelectionChange'
    }


    this.emittendSelectionRow.emit(eventSelectRow);

  }
  dblRowClick(event: any, index: any, row: any, selectRowIndex?:any) {
    
    let prevIndex = index - 1

    //this.selectionChange(event, prevIndex)

   

    let eventDblClickRow = {
      event: event,
      rowData: row,
      component:this,
      dataSource: this.dataSource,
      rowIndex: index,
      name: 'onDblRowClick',
      cancel:false
    }

    this.emittendDblRowClick.emit(eventDblClickRow);

    

    
   
   
    

    
  }

  selectRowDetail(event: any, index: number, row: any, selectRowIndex?:any) {

    let prevIndex = index - 1

    ///this.selectionChange(event, prevIndex)

    
    /* if (this.selectionRowMode == 'detail') {
      this.collapse(event, row, index, null);
  
      return
    } 


    if (this.selectionRowMode == 'multiple') {
      this.selectRowMultiple(event, index, row)
      return
    }
    */
    let infoRows = {
      isRowFather: false,
      isRowDetail: false
    }
    infoRows.isRowDetail = true;

    if (this.showDetailRow[selectRowIndex]) {
     

        this.rowSelectedDetail[index] = false;
    }

    

    if (!this.rowSelectedDetail[index]) {

      this.rowSelectedDetail[index] = true;

    } else {

      this.rowSelectedDetail[index] = false;
    }

    if (this.editorData[index].edit) {
      return
    }

    let eventSelectRowDetail = {
      event: event,
      data: row,
      fatherData: this.dataSource[selectRowIndex],
      infoRows: infoRows,
      rowIndex: index,

      name: 'onRowSelectionChange'
    }
    this.emittendSelectionRow.emit(eventSelectRowDetail);
    

  }

  clickToSelectRowMultiple(event: any, index:any, checkBoxSelect: any) {

    let selRow = this.rowSelected[index];
    if (!selRow) {

      this.rowSelected[index] = true;

    } else {

      this.rowSelected[index] = false;

    }
    //this.selectRowMultiple(event, index)
    event.stopPropagation();
  }
  
  
  selectRowMultiple(event: any, index:any, row?: any) {


    let selRow = this.rowSelected[index];
    if (!selRow) {
      this.rowSelected[index] = true;
    } else {
      this.rowSelected[index] = false;
    }

    if(event){
      
      event.stopPropagation();
      event.preventDefault();
    
    }
    
    
  
    let eventSelectRow = {
      event: event,
      data: row,
      rowIndex: index,
      component:this,
      dataSource:this.dataSource,
      rowsSelected:this.rowSelected[index],
      name: 'onRowMultipleSelection'
    }
  
    this.emittendSelectionRow.emit(eventSelectRow);

  }

  clickToSelectAllRows(){
    this.rowSelectedAll = false;

    let dataSourceLength = this.dataSource.length; 
    
    if(this.isOdata ){
      dataSourceLength = this.pageSize
    }

    if(dataSourceLength>0){
      if((this.rowSelected.length - 1) == dataSourceLength){
        this.rowSelected = [false];
        this.rowSelectedAll = false
        return 
      }

      for(let x=0; x <= dataSourceLength;x++ ){
        this.rowSelected[x] = true;
      }

      this.rowSelectedAll = true
    }

    
  }

  selectionChange(event: any, rowIndex: number) {
    if (rowIndex >= 0) {
      if (this.editorData[rowIndex].edit && this.justEditable) {
        this.selectedRowIndex = rowIndex
        this.dataSource[rowIndex] = this.editorData[rowIndex].data

      }

    }

    /*  if(this.isEditable){
 
       this.saveEditorData(selectRowIndex,event)
     } */
  }

  saveAndExit() {


    let dataSourceRowSelected: any[] = []
    this.rowSelected.forEach((re, i) => {
      if (re) {
       
        dataSourceRowSelected.push(this.dataSource[i])
        //console.log('dataSourceSel', this.dataSource[i]);
      }
    })
    let eventSelectRows = {
      component: this,
      dataSelected: dataSourceRowSelected,


      name: 'onRowMultipleSelectionChange'
    }

    this.emittendSelectionRow.emit(eventSelectRows);


    return;
    /* let eventSelectRow = {
      component: this,
      data: row,
      rowIndex: index,
  
      name: 'onRowMultipleSelectionChange'
    }
  
    this.emittendSelectionRow.emit(eventSelectRow); */
  }

  removeSelAndExit(event: any) {

  }

  chooseRow(event: any, i: any, colRow: any) {

    if (this.showDetailRow[i]) {
      return
    }
    this.selectRow(event, i, colRow)
  }

  tdClick(event: any, colInfo:ColData, tdIndex: any, rowIndex: any) {
   
    if (this.modeEdit != 'cell') {
      return
    }
    const colType = colInfo.type
    switch (colType) {

      case 'campoButton':
        event.stopPropagation()
       this.buttonClick(event,colInfo.button,colInfo,rowIndex)
        break;

      default:
        break;
    }

    console.log('colInfo-->', colInfo)
  }

  updateRowClasses(rowIndex: number) {
    return {
      '-disabled': this.rowIsDisable[rowIndex],
      'selected-row': this.rowSelected[rowIndex],
      'state-hover': this.isHovered[rowIndex],
      'select-have-detail': this.isHoveredDetatil[rowIndex],
      'custom-class': this.rowcustomclass[rowIndex]
    };
  }

  /**Fine Funzioni di selezione**/


  setRelatedCellChange(event: { data: any; },index:any){
    console.log('setRelatedCellChange',event);
    this.dataSource[index] = event.data
  }

  /** Funzioni di dettaglio **/
  collapse(e: any, row: any, index: any, groupDataField?: any) {


    var elems = document.querySelectorAll(".dx-datagrid-group-opened");

    [].forEach.call(elems,(el:any)=>{
      el.className = el.className.replace('dx-datagrid-group-opened', "dx-datagrid-group-closed");
    });

    let boxW = document.querySelector<HTMLElement>('.-data-grid-wrapper ');
    if(boxW)
      boxW.classList.add('scroll-bottom');

    let table = document.getElementById(this.idTable)
    if(table){
        

        
      let currentTarget = table.getElementsByTagName("tbody")[0].rows[index]
      if (e) {
        e.stopPropagation();
        e.preventDefault();
        currentTarget = e.currentTarget;
      }


      /**Tutto questo devi andattarlo ad angualar, per antonio o Adele */
      let thisRows = currentTarget
      let targetDetailCol
      if (thisRows.classList.contains('dx-datagrid-group-opened') || thisRows.classList.contains('dx-datagrid-group-closed')) {
        targetDetailCol = thisRows
      } else {
        if (thisRows.getElementsByClassName('detailCol').length == 0) {
          return
        }
        targetDetailCol = thisRows.getElementsByClassName('detailCol')[0].children[0];
      }


      if (this.showDetailRow[index]) {
        this.showDetailRow = [false];
        //this.colsRowDetail = [];

        targetDetailCol.classList.remove('dx-datagrid-group-opened');
        targetDetailCol.classList.add('dx-datagrid-group-closed')
        return
      }


      this.showDetailRow = [false];

      let fieldDetail = this.colsGroupDetail;

      if (this.detailOptions['isRemote']) {

        this.renderGridDetailData(this.detailOptions, row, index);

        targetDetailCol.classList.remove('dx-datagrid-group-closed');

        targetDetailCol.classList.add('dx-datagrid-group-opened');



        return
      } else {

        if (!groupDataField) {
          let detailCol = this.colsHeader.filter(r => r.type == 'detail')
          groupDataField = detailCol[0].groupDataField
        }

        this.showDetailRow[index] = true;

        this.colsRowDetail[index] = this.dataSource[index][groupDataField];

        if (this.colsRowDetail[index].length == 0) {

          this.showNullDataDetail = true


        }

        this.showDetailRow[index] = true;

        let eventExpandingRow = {
          cancel: false,
          data: row,
          rowIndex: index,
          expandedData: this.dataSource[index][groupDataField],
          name: 'onRowExpanded'
        }

        this.emittendGridEvent.emit(eventExpandingRow);

        targetDetailCol.classList.remove('dx-datagrid-group-closed');

        targetDetailCol.classList.add('dx-datagrid-group-opened')
      }

  }  

  }

  async renderGridDetailData(detailOptions: detailOptions, row:any, index: any) {


    let cols
    this.showNullDataDetail = false;
    let queryString = '';
    let api = detailOptions.api;
    let costantValues = detailOptions.costantValue;
    let values:any
    if (detailOptions.costantValue) {

      const costantValue = detailOptions.costantValue;

      costantValue.forEach((element: any) => {
        let keyEle = element['key'];
        let val = ''
        if (typeof row[element['value']] != 'undefined') {
          val = row[element['value']]
        } else {
          val = element['value']
        }

        values = { ...values, [keyEle]: val }
      })

    }


    if (detailOptions.queryString) {
      if (detailOptions.queryString.includes('$')) {

        let myqueryString = detailOptions.queryString;
        for (let x in row) {
          if (myqueryString.includes(x)) {

            var regex = new RegExp('\\$' + x + '\\b', 'g');
            // Crea un'espressione regolare usando il costruttore RegExp


            if (myqueryString.match(regex)) {
              myqueryString = myqueryString.replace(regex, row[x])
            }

          }
        }

        for (let k in values) {
          if (myqueryString.includes(k)) {

            var regex = new RegExp('\\$' + k + '\\b', 'g');
            // Crea un'espressione regolare usando il costruttore RegExp


            if (myqueryString.match(regex)) {
              myqueryString = myqueryString.replace(regex, values[k])
            }

          }
        }
        queryString = myqueryString



      } else {
        queryString = detailOptions.queryString
      }
    }

    let ress = await this.anagraficaService.getElenco(api, '', queryString)
    
    

      if (ress['items']) {
        ress = ress['items']
      } else {
        ress = ress
      }



      this.colsRowDetail[index] = ress;

      if (this.colsRowDetail.length == 0) {

        this.showNullDataDetail = true


      }

      this.showDetailRow[index] = true;



      let eventExpandingRow = {
        cancel: false,
        data: row,
        rowIndex: index,
        expandedData: this.colsRowDetail[index],
        name: 'onRowExpanded'
      }

      this.emittendGridEvent.emit(eventExpandingRow);

   
   

  }

  setLastRowHeight(cols: any) {

    let table = document.getElementById(this.idTable)!

    let rows = table.getElementsByTagName("tbody")[0].rows

    if (rows.length == 0) {
      return
    }

    let last = rows[rows.length - 1];

    //this.lastRowOffsetHeight = last.offsetHeight;

    let offsetHeight = 0;

    if (this.currentLastRowHeight <= 0) {
      this.currentLastRowHeight = last.offsetHeight
      return offsetHeight;

    }
    return
  }

  async setLastRow() {
    let table = document.getElementById(this.idTable)!
    let tBodyoffsetHeight = table.getElementsByTagName("tbody")[0].offsetHeight;

    let rows = table.getElementsByTagName("tbody")[0].rows;

    if (rows.length == 0) {
      return
    }

    let indexLastRow = rows.length - 1;
    if (this.currentLastRowHeight <= 0) {
      this.tBodyoffsetHeight = tBodyoffsetHeight;
      if (rows[indexLastRow].offsetHeight <= 28)
        this.currentLastRowHeight = rows[indexLastRow].offsetHeight;
      else
        this.currentLastRowHeight = 28;
    }



    //this.setStyleEmptyRow();


  }

  setStyleEmptyRow() {

    this.deleteRow(null, 'empty-row', null);

    // Altezza fissa della tabella
    const altezzaTabella = this.tableHeight;

    // Larghezza della cella fissa
    let altezzarigaFissa = 27;

    if (this.showToolbarTop) {

      altezzarigaFissa = altezzarigaFissa + 27
    }

    if (this.showFilter) {
      altezzarigaFissa = altezzarigaFissa + 27
    }

    let table = document.getElementById(this.idTable)!
    let tableRef = table.getElementsByTagName('tbody')[0];
    //const colsGroup = document.getElementsByTagName()
    const rows = tableRef.rows


    let altezzaRigaArray = [];

    if (this.colsGroupShow) {
      tableRef.insertRow().innerHTML = '<td></td>'
    }

    if (rows.length > 0) {
      // Cicla attraverso tutte le righe della tabella
      for (let i = 0; i < rows.length; i++) {
        const riga = rows[i];
        // Ottieni l'altezza della riga
        altezzaRigaArray.push(riga.offsetHeight);

        //console.log(`Altezza della riga ${i + 1}: ${altezzaRigaArray}px`);
      }
    } else {

      this.setStyleEmptyRowRemote(this.colsRow);

      return
    }


    // Calcola la larghezza totale delle celle già presenti
    const altezzaRighePresenti = altezzaRigaArray.reduce((acc, altezza) => acc + altezza, 0);

    let altezzaBaseTotaleRighe = altezzarigaFissa * rows.length;

    if (altezzaRighePresenti <= altezzaBaseTotaleRighe) {
      return
    }


    let tdEmpty = ''
    for (let index = 0; index < this.colsHeader.length; index++) {
      //insert Row
      tdEmpty += `<td style=" border-left: 1px solid #e8eaeb;border-right: 1px solid #e8eaeb;border-bottom: 1px solid #e8eaeb;"></td>`

    }

    // Calcola la larghezza disponibile per le celle dinamiche
    let altezzaRigaDinamica = altezzaRighePresenti - altezzaBaseTotaleRighe;


    tableRef.insertRow().innerHTML = tdEmpty


    let indexLastRow = tableRef.rows.length - 1
    tableRef.rows[indexLastRow].classList.add('empty-row')
    tableRef.rows[indexLastRow].style.height = altezzaRigaDinamica + 'px'
    tableRef.rows[indexLastRow].style.backgroundColor = '#fff'

    return


  }

  setStyleEmptyRowRemote(rows: string | any[]) {

     // Calcola l'altezza aggiuntiva necessaria per raggiungere l'altezza desiderata
     const additionalSpaceHeight = Math.max(0, this.tableHeight - this.bodyHeight);

     

     
  
     if(additionalSpaceHeight>0){
      const adjustedTotalHeight = this.bodyHeight + additionalSpaceHeight; // Aggiungi l'altezza aggiuntiva
      this.bodyStyle.height = adjustedTotalHeight + 'px'
       this.emptyRowStyleClass = {
 
         height: additionalSpaceHeight + 'px',
         backgroundColor: '#fff'
       }
       if (this.colsGroupShow) {
         this.showEmptyRow = true;
       }
   
       if(!this.remoteOperation){
         this.showEmptyRow = true;
       } 
     }
    return 
    let altezzaBaseTotaleRighe = 26 * rows.length;

    if (this.tableHeight <= altezzaBaseTotaleRighe) {
      return;
    }

    if (this.showToolbarTop) {
      altezzaBaseTotaleRighe = altezzaBaseTotaleRighe + 26
    }
    if (this.showFilter) {
      altezzaBaseTotaleRighe = altezzaBaseTotaleRighe + 26
    }

    if (this.groupIndexCol) {
      altezzaBaseTotaleRighe = altezzaBaseTotaleRighe + 26
    }



    let altezzaRigaDinamica = this.tableHeight - altezzaBaseTotaleRighe;




    this.emptyRowStyleClass = {

      height: altezzaRigaDinamica + 'px',
      backgroundColor: '#fff'
    }
    if (this.colsGroupShow) {
      this.showEmptyRow = true;
    }

    /* riparti da qui if(!this.remoteOperation){
      this.showEmptyRow = true;
    } */

    return

  }

  setStyleBody() {

   
    const numRows = this.dataSource.length
    const rowHeight = 27; // Altezza di una singola riga
    const maxRows = Math.floor(this.tableHeight / rowHeight); // Numero massimo di righe visibili
    const totalHeight = Math.min(numRows * rowHeight, maxRows * rowHeight);

    const maxRowsByBody = Math.floor(totalHeight / rowHeight);
    let tWidth = this.tableWrapWidth;

    
    this.bodyHeight = totalHeight
    this.bodyStyle = {
      'width': tWidth + 'px',
      'height': totalHeight + 'px',
      'display': 'block',
      'overflow-y': numRows > maxRowsByBody ? 'auto' : 'hidden',
      'border-top': '1px solid #e8eaeb'
    };
    this.theadStyle = {
      'width': tWidth + 'px',
      'display': 'block',
    }
    if (this.colsGroupShow) {
      this.tableStyle = { 'width.px': tWidth,'height.px': this.tableHeight, 'overflow-y': 'clip', 'table-layout': 'auto','display':'block' }
      this.bodyStyle.display = 'unset'
      this.bodyStyle['overflow-y'] = 'unset';
      return
    }


   
  }

  async addRow() {

    let tableRef = document.getElementById(this.idTable)!;
    let tbody = tableRef.getElementsByTagName('tbody')[0];

    let newRowData:any;

    if (Array.isArray(this.dataSource)) {
      if (this.dataSource.length == 0) {
        this.showNullData = false
      }
    } else {
      if (!this.dataSource) {
        this.dataSource = []
        this.showNullData = false
      }
    }


    this.colsHeader.forEach(cells => {
      if(cells.dataField){
        let value = null;
        if(cells.editorType == 'dxNumberBox'){
          value = 0
        }
        newRowData = { ...newRowData, [cells.dataField]: value }
      }
    })


    if (typeof newRowData != 'undefined') {
      newRowData.isNewRow = true
      this.dataSource.push(newRowData)
    }

    /* let tdEmpty = ''
    for (let index = 0; index < this.colsHeader.length; index++) {
      //insert Row
      tdEmpty += `<td></td>`

    }*/

    let indexLastRow = this.dataSource.length - 1

    /* tbody.insertRow(indexLastRow).innerHTML = tdEmpty
    
    tbody.rows[indexLastRow].classList.add('newrow-row')  */

    await this.setEditorData();

    await this.setStyleEmptyRowRemote(this.dataSource);

    this.rowSelected = [false];
    setTimeout(() => {
      this.startEditor(null, indexLastRow)
      this.rowSelected[indexLastRow] = true
    }, 300);
  }

  deleteRow(index?: any, className?: any, id?:any):any[] {

    let tableRef = document.getElementById(this.idTable)!
    let tableBody = tableRef.getElementsByTagName('tbody')[0];
    let rows = tableBody.rows;
    if (rows.length == 0) {
      return []
    }

    let rowByclass = document.getElementsByClassName(className)
    if (rowByclass.length > 0 && typeof className != 'undefined') {
      for (let x = 0; x <= rows.length; x++) {
        if (rows[x].classList[0] == 'empty-row') {
          tableBody.deleteRow(x)
        }
      }
    } else if (index >= 0) {

      if (index == 0) {
        this.dataSource.splice(index, 1);
        if (this.dataSource.length == 0) {
          this.dataSource = []
        }
        return this.dataSource

      }
      tableBody.deleteRow(index)
      this.dataSource.splice(index, 1);
      return this.dataSource
    }
    return this.dataSource
  }

  // Funzione per calcolare la somma di una colonna specifica
  calcolaSomma(cols:ColData): number {
    
    
    if(!cols.dataField){
      return 0
    }

    if(!cols.showInSummary){
      return 0
    }
    let dataField = cols.dataField;

    let value =  this.dataSource.reduce((acc, curr) => acc + curr[dataField], 0);
    
    return this.valueSumm[dataField] = value
  }

  // Funzione di utilità per formattare le date
  private formatDate(dateString: string, type: 'EN' | 'it' = 'EN'): string {

    const regExpISO: RegExp = /(\d{4})([\/-])(\d{1,2})\2(\d{1,2})/;
    const regExpIT: RegExp = /(\d{1,2})([\/-])(\d{1,2})\2(\d{4})/;


    let isMatchISO = dateString.match(regExpISO);
    let isMatchIT = dateString.match(regExpIT);

    //Se nessuno dei 2 formati è valido
    if (!isMatchISO && !isMatchIT) {
      return '';
    }

    if (isMatchIT) {

      if (dateString.includes('-'))
        dateString = `${dateString.split('-')[2]}-${dateString.split('-')[1]}-${dateString.split('-')[0]}`;
      else if (dateString.includes('/'))
        dateString = `${dateString.split('/')[2]}-${dateString.split('/')[1]}-${dateString.split('/')[0]}`;
    }

    const date = new Date(dateString);

    // Formatta la data come necessario
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mese è 0-based
    const day = date.getDate().toString().padStart(2, '0');
    
    let finallyData = ''
    if (type == 'EN') {
      finallyData= `${year}-${month}-${day}`;
    }

    if (type == 'it') {
      finallyData = `${day}-${month}-${year} `;
    }

    return finallyData
  }


  async filterValueChange(event?: any) {

    await this.resetPageInfo();

    setTimeout(
      async () => {
        const data = ['icon','selection','editorButtons','removeButtons','detail','campoDesc','empty']
        const columnsData = this.colsHeader.filter((res:any) => !data.some(res.type))

        let myqueryStrigOdata: (string | null | undefined)[] = []

        // Verifica se è gia creato un odatafilter.

        if (this.filterOdata != '') {
          this.filterOdata = '';
        }

        /*
        if(this.queryString != ''){
          this.queryString = '';
        }
        */

        columnsData.forEach(columnData => {
          let type = columnData.customizedOptions.dataType;
          let searchType = this.searchType;
          if (typeof type != 'undefined') {
            if (this.builderOdataSearchString(columnData.dataField, type, searchType)) {
              myqueryStrigOdata.push(this.builderOdataSearchString(columnData.dataField, type, searchType))
            }
          }



        })

        let queryStrigOdata = ''



        if (myqueryStrigOdata.length == 0) {

          await this.renderGrid();

          return
        }
        queryStrigOdata = myqueryStrigOdata.join(' or ')
        if (this.filterOdata) {

          //queryStrigOdata = `${this.filterOdata} and ${queryStrigOdata}`

        }
        this.filterOdata = `(${queryStrigOdata})`;

        console.warn(this.filterOdata)

        await this.renderGrid()



      }, 500
    )


  }



  builderOdataSearchString(dataField: any, tipoCampo: any, searchType?: 'contains' | 'startsWith') {
    if (!this.searchText) {
        return ''; // Restituisci una stringa vuota o null
    }

    switch (tipoCampo.toLowerCase()) {
        case 'text':
        case 'string':
            if (typeof searchType === 'undefined' || searchType === 'contains') {
                return `(contains(tolower(${dataField}),'${this.searchText.toLowerCase()}'))`;
            } else {
                return `(startswith(tolower(${dataField}),'${this.searchText.toLowerCase()}'))`;
            }

        case 'number':
            let strToNumber = Number(this.searchText);
            if (!isNaN(strToNumber)) {
                return `(${dataField} eq ${strToNumber})`;
            }
            return ''; // Restituisci una stringa vuota se la conversione non è valida

        case 'date':
        case 'dateTime':
            let dataFormattata = this.formatDate(this.searchText);
            if (typeof dataFormattata !== 'undefined') {
                return `(${dataField} eq ${dataFormattata})`;
            }
            return ''; // Restituisci una stringa vuota se la data non è valida

        case 'boolean':
            return ''; // Restituisci una stringa vuota per booleani

        default:
            if (typeof searchType === 'undefined' || searchType === 'contains') {
                return `(contains(tolower(${dataField}),'${this.searchText.toLowerCase()}'))`;
            } else {
                return `(startswith(tolower(${dataField}),'${this.searchText.toLowerCase()}'))`;
            }
    }
}


  async searchData(event: any, dataField: any, inputFilter: { value: any; }) {

    return;

    const functionalKeys = ['Backspace', 'ArrowRight', 'ArrowLeft'];

    if (functionalKeys.indexOf(event.data) !== -1) {
      return;
    }

    await this.resetPageInfo();

    let searchText = inputFilter.value

    

    if (searchText == '') {
      this.dataSource = this.colsRow;

      this.setStyleEmptyRowRemote(this.dataSource)
      return;
    }

    if (searchText.length > 0) {
      setTimeout(() => {
        const items = this.dataSource

        let res = this.filterNonRemoteDataSource(items,  dataField, searchText);
        this.dataSource = res;
        this.setStyleEmptyRowRemote(this.dataSource)

      }, 500);

    }
  }

  /** Data Source Temporaneo filtrato NON PER ODATA */
  dataSourceTemp : any[] = [];

  async searchDataNoOdata(event:any) {


    const functionalKeys = ['Backspace', 'ArrowRight', 'ArrowLeft'];

    if (functionalKeys.indexOf(event.data) !== -1) {
      return;
    }

    //await this.resetPageInfo();

    let searchText = this.searchText

    console.log('searchText-->', searchText)

    if (searchText == '' || typeof searchText == 'undefined') {
      this.dataSource = this.dataSourceTemp;

      //Serve per ricostruire la riga vuota che uso per lasciare lo spazio bianco...........
      //this.setStyleEmptyRowRemote(this.dataSource)
      await this.renderGrid();
      return;
    }

    if (searchText.length > 0) {
      setTimeout(async() => {

        let dataFields = this.colsHeader.filter(res => res.dataField)



        console.log(dataFields);

        dataFields.forEach(hD => {
          this.dataSource  = this.filterNonRemoteDataSource(this.dataSourceTemp, hD.dataField, searchText);

          console.log(this.dataSource);

          
        })

        //this.setStyleEmptyRowRemote(this.dataSource)


        await this.renderGrid();
      }, 500);

    }
  }

  filterNonRemoteDataSource(array:any[], dataField: string | number, sText: string) {

    
    return array.filter((item)=>{
      return item[dataField] && !Array.isArray(item[dataField]) && (typeof item[dataField] == 'string' || typeof item[dataField] == 'number') && (item[dataField] as any).toString().toLowerCase().includes(sText.toLowerCase())  
    })
    
   
  }


  async toolbarValueChanged(event: { value: any; event: any; }) {
    console.log('toolbarValueChanged', event)
    let value = event.value;
    let evt = event.event

    this.searchText = value;
    this.textEmpty = 'Sto cercando...'
    if (!this.isOdata) {
      //da finire
      this.searchDataNoOdata(event)
      return
    }
    await this.filterValueChange();
    //this.buildOdataSearch


  }

  buttonEmitted(event: any) {
    console.log('buttonEmitted-->', event)
    switch (event) {
      case 'addRow':

      let eventRowClick = {
        infoEventButtons: event,
        name: 'buttonNewRowEvent',
        idTable:this.idTable,
        service:this.service,
        cancel:false,
        component:this
      }
      this.emittendToolbarClick.emit(eventRowClick)
      
      
      this.emittendStartEdit.emit(eventRowClick)
        if(!eventRowClick.cancel){
      
          this.addRow()
        }
        break;

      case 22:
        this.saveAndExit()
        break;
      case 23:
        let eventOutput = {
          event: event,
          cancel: false,
          name: 'annullaSelezione'
        }
        this.emittendButtonExit.emit(eventOutput)
        break;

      case 0:
        let eventOutputZero = {
          event: event,
          cancel: false,
          name: 'annullaSelezione'
        }
        this.emittendButtonExit.emit(eventOutputZero)
        break;
      case 21:
        let eventOutputButtons = {
          event: event,
          cancel: false,
          name: 'newButtonClick'
        }

        let eventOutputClick = {
          infoEventButtons: eventOutputButtons,
          name: 'toolbarButtonClick'
        }

        this.emittendButtonExit.emit(eventOutputClick)
        break;
      default:
        let eventCustomClick = {
          infoEventButtons: event,
          name: 'toolbarButtonClick',
          
        }

        this.emittendToolbarClick.emit(eventCustomClick)
        break;
    }

  }

  public selectContent(){
    //alert('IS_SELECTED','ATTENZIONE!')
    this.focusRow(0)
  }

  focusRow(rowIndex: number, subRowIndex: number = -1) {

    this.isHovered = [false];

    let table = document.getElementById(this.idTable)!

    let rows = table.getElementsByTagName("tbody")[0].rows

    if (rows.length > 0) {
      for (let i = 0; i < rows.length; i++) {
        if (i === rowIndex) {
          this.isHovered[i] = true;

          //rows[i].classList.add('focused')
          //rows[i].focus();

          if (subRowIndex !== -1) {
            this.isHoveredDetatil[i] = true
          }
          break;

        }
      }
    }
  }

  isSelectedSubRow(rowIndex: number, subRowIndex: number): boolean {
    return this.selectedRowIndex === rowIndex && this.selectedSubRowIndex === subRowIndex;
  }

  // Metodo per navigare tra le righe utilizzando le frecce su e giù
  handleKeyboardEvents(event: KeyboardEvent) {
    
    if (event.key === 'ArrowDown') {

      this.navigateByKeyboard('ArrowDown');

    } else if (event.key === 'ArrowUp') {

      this.navigateByKeyboard('ArrowUp');

    }
  }

  public navigateByKeyboard(key: string) {
    
    this.isHoveredDetatil = [false]
    switch (key) {
      case 'ArrowDown':

        if (this.showDetailRow[this.selectedRowIndex] && this.selectedSubRowIndex < this.colsRowDetail[this.selectedRowIndex].length - 1) {

          this.selectedSubRowIndex++;

          //this.selectedSubRowIndex = -1;
        } else if (this.selectedRowIndex < this.dataSource.length - 1) {

          this.selectedRowIndex++;
          this.selectedSubRowIndex = -1;
        }
        break;
      case 'ArrowUp':


        if (this.selectedSubRowIndex === -1 || this.selectedRowIndex > 0) {
          // Se non c'è alcuna riga di dettaglio selezionata o se siamo sulla riga principale
          if (this.selectedSubRowIndex == -1 && this.selectedRowIndex > 0) {
            this.selectedRowIndex--;
          }
          this.selectedSubRowIndex = -1;
        } else if (this.selectedSubRowIndex > 0) {
          // Se siamo su una riga di dettaglio e ci sono più righe di dettaglio disponibili
          this.selectedSubRowIndex--;
        }

        if (this.selectedRowIndex == 0) {
          this.selectedSubRowIndex = 0;
        }



        break;


      default:
        break;
    }


    this.focusRow(this.selectedRowIndex, this.selectedSubRowIndex);

    let data

    let infoRows = {
      isRowFather: false,
      isRowDetail: false
    }

    let index = 0;

    if (this.selectionRowMode == 'detail') {
      data = this.colsRowDetail[this.selectedRowIndex][this.selectedSubRowIndex];
      infoRows.isRowDetail = true;
      index = this.selectedSubRowIndex;

    } else if (this.selectionRowMode == 'single') {
      data = this.dataSource[this.selectedRowIndex];
      infoRows.isRowDetail = false;
      index = this.selectedSubRowIndex
    }

    if (Object.keys(data).length > 0) {
      let eventSelectRow = {
        event: null,
        data: data,
        infoRows: infoRows,
        rowIndex: index,
        keyPressed: key,
        name: 'onRowSelectionChange'
      }

      this.emittendSelectionRow.emit(eventSelectRow);
    }


  }

  /** Nel caso dello scorrimento delle pagine OData le righe superflue dal totale andranno rimosse */
  private eliminaRigheVuoteDallaPaginazioneSePresenti(){
      
    if((this.isEditableNewRow==true || this.isEditableEditRow==true || this.isEditable == true || this.inEditState == true || !this.isOdata))
      return;
    
    let index = this.dataSource.findIndex(item => {return typeof item == 'undefined' ||item.id == null });
              
    if(index != -1 && (this.latestSkipLoaded + index) >= this.totalRecords){
      
      this.dataSource.splice(index);
      
    }

  }

  buttonClick(event: any,button: any,col: any,rowIndex:any) { 
    let eventToEmit = button;
    eventToEmit.dataSource = this.dataSource;
    eventToEmit.rowData= this.dataSource[rowIndex];
    eventToEmit.col = col;
    eventToEmit.rowIndex = rowIndex
    eventToEmit.component = this;
    eventToEmit.event = event
    this.emittendBttonCellClick.emit(eventToEmit);

    event.stopPropagation()
    event.preventDefault()
  }

  /** Da richiamare dopo evento KeyUp barra di ricerca per il refresh di OData  */
  async resetPageInfo() {

    this.showNullData = true;

    this.latestSkipLoaded = 0;
    this.latestScrollTopPosition = 0;
    this.currentPage = 0;
    this.dataSource = [];
    this.mockItem = undefined;
    if (this.currentPage >= 1) {
      this.currentPage = 0;
    }
    //await this.renderGrid();

  }

  /**
   * refresh
   */

  public refresh() {

    if (this.currentPage >= 1) {
      this.currentPage = 0;
    }
    this.colsRow = [];
    this.colsHeader = [];
    this.dataSource = [];
    this.filterOdata = '';
    this.rowSelected = [false]
    this.rowSelectedDetail = [false];
    this.rowIsDisable = [false]
    this.resetPageInfo()
    this.renderGrid();
  }

  public hideColumn(colIndex: number) {
    this.colsHeader.splice(colIndex, 1)
    this.resizeCols(this.colsHeader);

  }
}
