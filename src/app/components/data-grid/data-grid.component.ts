import { Component, ElementRef, EventEmitter, Input, OnInit, Output, AfterViewInit, SimpleChanges, ViewChildren, QueryList, ViewChild, AfterViewChecked, HostListener, inject, signal, input, effect, Renderer2 } from '@angular/core';


import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ColData, Colonne, detailOptions, ToolbarButton } from '../../interface/app.interface';
import { CommonModule } from '@angular/common';
import { alert, confirm } from '../../widgets/ui-dialogs';
import { AnagraficaService } from '../../services/anagrafica.service';
import { TdItemComponent } from './td-item/td-item.component';
import { ToolbarComponent } from '../../layout/toolbar/toolbar.component';
import { CustomScrollbarComponent } from '../custom-scrollbar/custom-scrollbar.component';
import { OverlayService } from '../../services/overlay.service';



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
  width?: number

}

@Component({
  selector: 'app-data-grid',
  templateUrl: './data-grid.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TdItemComponent,

    CustomScrollbarComponent
  ],

  styleUrls: ['./data-grid.component.scss']
})


export class DataGridComponent {
  @ViewChild('dataGridWrapper', { static: false }) dataGridWrapper!: ElementRef<HTMLDivElement>;

  @ViewChildren('riga')
  righe!: QueryList<ElementRef>;

  @ViewChildren('tbody')
  tbody!: QueryList<ElementRef>;

  @Input() idTable: any;
  @Input() service: any;
  @Input() api: any;
  @Input() queryString: string = ''; //per ora è string ma va generata dynamicamente ricordati di farlo (02/04/2024 query string è dinamica)
  @Input() queryStringInEditor: string = ''; //Eventuale query string da usare nella post o nella put, ES:api-->/CampoRichiestoDocRifiuti
  @Input() isKeyID: boolean = true; //se false l'api in put sarà senza /id  ES:api-->/CampoRichiestoDocRifiuti

  @Input() remoteOperation: boolean = false;

  dataSource = input<any[]>([]);
  rowsData = signal<any[]>([])

  @Input() overrideDataSource = null;
  @Input() dataJson: any
  @Input() selectedData: any[] = [] //Dati in ingresso ad esempio da una form , e seleziona/evidenzia le righe..(funziona solo su dati visibili) 
  @Input() tableHeight: number = 540;
  @Input() tableWidth!: number
  @Input()
  colonne!: Colonne[];
  @Input() isEditable: boolean = false

  @Input() modeEdit: string = 'row';

  @Input() selectionRowMode: string = 'single' //signle, multiple o detail, se detail e la griglia ha una riga di dettaglio seleziona solo le righe di dettaglio ;
  @Input() showFilter: boolean = false;
  @Input() showToolbarTop: boolean = false;
  @Input() showToolbarBottom: boolean = false;
  @Input() rowAlternate: boolean = true;
  @Input() isEditableNewRow: boolean = true;
  @Input() isEditableEditRow: boolean = true;
  @Input() isEditableDeleteRow: boolean = true;
  @Input() isSearchable: boolean = true;
  @Input() searchType: any = '';
  @Input() toolbarButtonsBottom!: ToolbarButton[];
  @Input() toolbarButtonsTop!: ToolbarButton[];
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

  @Input() continuousEditing: boolean = false;

  showT: boolean = false;

  colsHeader: ColData[] = [];
  colsGroup: any[] = [];

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

  showDetailRow: boolean[] = [false];
  haveDetail: boolean = false;
  colsRowDetail: any = [];
  colsGroupDetail: any;
  colsGroupCaption: any[] = []
  currentLastRowHeight = 0;
  lastRowOffsetHeight: number = 0;
  tBodyoffsetHeight!: number;

  bodyHeight: number = 200;
  colsGroupShow: boolean = false;
  bodyStyle!: { height?: string; display: string; 'overflow-y'?: string; width?: string; 'border-top': string; };
  theadStyle!: { display?: string; width?: string; };
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
  pageSize: number = 20; // Imposta la dimensione della pagina desiderata
  currentPage = 0;
  totalRecords = 0;
  isLoading: boolean = false;
  tableStyle!: { 'width.px'?: number; 'height.px'?: number; 'overflow-y'?: string; display?: string; 'table-layout'?: string; };
  searchText!: string

  isHovered: any[] = [false];
  isHoveredDetatil: any[] = [false];
  rowcustomclass: any[] = [];
  tableWidthDetail!: number;
  checkQueryStringError: boolean = false;
  validationObject: any = {}
  inEditState: boolean = false;

  latestScrollTopPosition: number = 0;
  tableWrapWidth!: number
  enableTfoot: boolean = false;
  valueSumm: any = [];
  rowSelectedAll: any = false;
  showEditorCellByRow: boolean = false;

  anagraficaService = inject(AnagraficaService);
  overrideService = inject(OverlayService);
  formservice: any;
  sortDirection: 'asc' | 'desc' = 'asc'; // fleg per l'ordinamento asc e desc
  sortedColumn: any; //  colonna orginatata

  constructor(
    //private formservice: FormsTemplateService,

  ) {
    effect(() => {
      if (this.dataSource()?.length > 0) {
        this.renderGrid();
      }
    }, { allowSignalWrites: true });
    //this.refresh = this.refresh.bind(this);
    //this.hideColumn = this.hideColumn.bind(this);
    //this.calcolaSomma = this.calcolaSomma.bind(this);


  }



  @HostListener('window:scroll', ['$event'])
  @HostListener('window:keydown', ['$event'])

  handleKeyDown(event: any) {


    let tableId = document.getElementById(this.idTable) as HTMLElement;
    const focusedElement = document.activeElement as HTMLElement;


    if (event.code == 'Enter' || event.code == 'NumpadEnter') {

      setTimeout(() => {

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

    }


  }






  ngAfterViewInit() {
    //imposto il paddig che ho dichiarato nel css sia dx che a sx se cambia sputtana tt 
    const paddingGrid = 1.25
    const scrollbarWidth = 10;

    const remInPixels = this.getBaseRemInPixels();
    const sizeInPixels = this.convertRemToPixels(paddingGrid, remInPixels);
    console.log(`1.25rem in pixels: ${sizeInPixels}px`);

    if (!this.tableWidth) {
      if (!this.dataGridWrapper) {

        const dataGridWrapper = document.getElementById('dataGridWrapper');

        if (dataGridWrapper) {
          this.tableWidth = dataGridWrapper.offsetWidth - sizeInPixels - scrollbarWidth;
        }


      } else {
        this.tableWidth = this.dataGridWrapper.nativeElement.getBoundingClientRect().width - sizeInPixels - scrollbarWidth;
      }
    }

    this.tableWrapWidth = this.tableWidth


    if (!this.idTable) {

      alert('Manca ID devo aggiornare', 'Errore!')
    }

    if (typeof this.dataJson == 'string') {
      this.dataJson = JSON.parse(this.dataJson)
    }


  }

  getBaseRemInPixels(): number {
    const fontSize = getComputedStyle(document.documentElement).fontSize;
    return parseFloat(fontSize);
  }

  convertRemToPixels(remValue: number, baseRemInPixels: number): number {
    return remValue * baseRemInPixels;
  }


  /**
   * Renders the grid based on the provided parameters.
   *
   * @remarks
   * This function initializes the grid, sets up the toolbar, and handles remote or local data operations.
   * It also builds the header columns, detail grid, and editor data.
   *
   * @returns {Promise<void>} - A promise that resolves when the grid has been initialized.
   */
  async renderGrid(): Promise<void> {

    this.textEmpty = '...';

    this.enableTfoot = false;

    if (this.showFooterSummary) {
      this.enableTfoot = true;
      this.valueSumm = []
    }

    this.renderToolBarGrid(this.showToolbarTop, this.showToolbarBottom);

    if (this.remoteOperation) {

      const check = await this.buildAndTestQueryString()
      if (check) {
        await this.loadRemoteRecords()
      }

    } else {
      this.rowsData.set(this.dataSource())
 
      this.totalRecords = this.rowsData().length
    }

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


    await this.buildHeaderColumns(cols!);

    let detailGridCols = cols!.filter(res => res.itemType == 'dettaglio');
    await this.builDetailGrid(detailGridCols, detailGridCols);

    await this.resizeCols();

    await this.setStyleBody()


    if (this.enableTfoot) {
      this.calcSommaryCells()
    }


    let dataOutput = {
      name: 'gridHasInitialized',
      dataSource: this.rowsData(),
      compnent: this,
      colonne: this.colsHeader
    }

    this.emittendGridEvent.emit(dataOutput);

  }

  /**
   * Renders the toolbar grid based on the provided parameters.
   *
   * @param isToobarTop - Indicates whether the toolbar should be rendered at the top.
   * @param isToobarBottom - Indicates whether the toolbar should be rendered at the bottom.
   */
  renderToolBarGrid(isToobarTop: boolean, isToobarBottom: boolean) {


    try {
      if (this.showToolbarBottom) {

      }

      this.buttonSXToolbar = [];
      this.buttonDXToolbar = [];

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
          width: 300,
        }]
        if (typeof this.toolbarButtonsTop != 'undefined') {
          this.toolbarButtonsTop.forEach(buttonDXToolbar => {
            if (typeof buttonDXToolbar.position != 'undefined') {
              if (buttonDXToolbar.position == 'left') {
                this.buttonSXToolbar.unshift(buttonDXToolbar);

              } else if (buttonDXToolbar.position == 'right') {
                this.buttonDXToolbar.unshift(buttonDXToolbar)
              }

            } else {
              this.buttonDXToolbar.unshift(buttonDXToolbar)
            }



          })
        }


        let cH = this.tableHeight
        if (this.tableHeightWrapper > 0) {
          cH = this.tableHeightWrapper
        }
        this.tableHeightWrapper = cH + 26;
      }

      if (isToobarBottom) {

        this.showToolbarBottom = true

      }
      //this.showToolbarBottom = true;
    } catch (error) {

    }

  }


  buildHeaderColumns(hCol: any): Promise<boolean> {

    this.colsGroup = [];
    this.colsHeader = [];
    this.colsDetail = []
    let tabIndex = 1;

    if (this.selectionRowMode == 'single') {
      this.colsGroup.push({
        span: '0',
        caption: null,
        class: 'single',

        style: 'background-color: #D6EEEE',
      })

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

    hCol.forEach((h: any) => {

      if (h.caption && h.colSpan && h.itemType == 'group') {
        this.colsGroupShow = true
        this.colsGroup.push({
          span: h.colSpan,
          caption: h.caption,
          class: h.class,

          style: 'background-color: #D6EEEE',
        })
      }


      h.data.forEach((resColH: ColData) => {

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

        if (resColH.type == 'campoButton') {
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

        let allowEditing = true
        if (typeof resColH.allowEditing != 'undefined') {
          allowEditing = resColH.allowEditing
        }
        if (typeof resColH.colWidth != 'undefined') {
          let colW = resColH.colWidth;

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

        if (typeof resColH.colCaption != 'undefined') {
          if (resColH.colCaption) {
            colCaption = resColH.colCaption
          }
        }

        this.colsHeader.push({
          type: resColH.type,

          search: typeof this.showFilter != 'undefined' ? this.showFilter : resColH.allowFiltering,
          id: resColH.dataField,
          caption: colCaption,
          colWidth: !resColH.colWidth ? resColH.colWidth = 'auto' : Number(resColH.colWidth),
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


    this.colsHeader.push(
      {
        type: 'editorButtons',
        id: 'editorButtons',
        caption: '',
        search: false,
        colWidth: 40,
        class: null,
        isEditable: this.isEditable,
        edit: false,
        labelAlignment: undefined,
        groupDataField: undefined,
        colCaption: undefined,
        allowFiltering: undefined,
        dataField: '',
        editorbuttons: [
          {
            id: 'edit',
            nameEvent: 'onEditEvent',
            text: 'Modifica',
            icon: 'mdi mdi-pencil-outline',
            disabled: false,
            visible: this.isEditableEditRow,
            cssClass: null,
            widget: 'button',
            position: 'left'
          },
          {
            id: 'delete',
            nameEvent: 'onDeleteEvent',
            text: 'Elimina',
            icon: 'mdi mdi-trash-can-outline',
            disabled: false,
            visible: this.isEditableDeleteRow,
            cssClass: null,
            widget: 'button',
            position: 'left'
          }
        ]
      })




    return Promise.resolve(true)


  }


  async builDetailGrid(detailGrid: any, keyRow?: any) {

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
        let findItem = this.detailOptions['colonne'].find((ress: any) => ress['itemType'])

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

    colsDetail.forEach((col: Colonne) => {
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
      this.rowsData().forEach((rrr, c) => {
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

  async resizeCols(cols?: any) {


    // Creo una costante larghezza fissa della tabella
    const larghezzaTabella = this.tableWrapWidth;

    if (!cols) {
      cols = this.colsHeader
    }

    cols = cols.map((ress: ColData) => {
      if (!ress.colWidth) {
        if (ress.colCaption) {
          ress.colWidth = ress.colCaption.length;
        } else if (ress.caption) {
          ress.colWidth = ress.caption.length;
        } else {
          ress.colWidth = 'auto';
        }

      }
      return ress
    })

    const totalWidthCols = cols.reduce((accumulatore: any, col: ColData) => {
      return accumulatore + Number(col.colWidth);
    }, 0); // 0 è il valore iniziale di accumulatore


    // Creo una costante dimension che le celle fisse occupano 

    const data = ['icon', 'selection', 'editorButtons', 'removeButtons', 'detail', 'campoDesc', 'empty'];


    //rimuove dall'oggetto cols le celle di funzione che hanno una dimensione fissa
    const colonneFisse = cols.filter((col: any) => data.some(d => d == col.type));

    const totalWidthfixCols = colonneFisse.reduce((accumulatore: any, col: ColData) => {
      return accumulatore + col.colWidth;
    }, 0); // 0 è il valore iniziale di accumulatore

    //ricalcolo la larghezza della tabella senza le celle fisse.
    //const totalWidthRestante = larghezzaTabella - totalWidthfixCols
    //rimuove dall'oggetto cols le celle di funzione che hanno una dimensione fissa
    const colonneFiltrate = cols.filter((col: any) => !data.some(d => d == col.type));

    const totalWidthFilterCols = colonneFiltrate.reduce((accumulatore: any, col: ColData) => {
      if (col.colWidth != 'auto')
        return accumulatore + Number(col.colWidth);
    }, 0);
    const diffWidthCols = larghezzaTabella - totalWidthFilterCols;
    //ricalcolo la larghezza della tabella senza le celle fisse.
    const totalWidthRestante = diffWidthCols - totalWidthfixCols
    // Calcola il fattore di scala basato sulla larghezza rimanente e la larghezza totale della tabella
    const scala: number = totalWidthRestante / colonneFiltrate.length;;
    for (let i = 0; i < colonneFiltrate.length; i++) {

      if (colonneFiltrate[i].colWidth != 'auto') {
        const newW = Number(colonneFiltrate[i].colWidth) + scala;
        const indx = cols.findIndex((col: ColData) => col.dataField == colonneFiltrate[i].dataField);

        cols[indx].colWidth = newW
      }

    }

    const tt = cols.reduce((accumulatore: any, col: ColData) => {
      if (col.colWidth != 'auto')
        return accumulatore + Number(col.colWidth);
    }, 0);

    console.log('dddd', tt)
    return

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


  latestSkipLoaded: number = 0;

  async onScroll(event: Event) {


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
    if (this.selectedData && this.selectedData.length > 0) {
      this.selectedData.forEach(elemento => {
        this.rowSelected[this.rowsData().indexOf(elemento)] = true;
      });
    }

  }

  /**Funzioni di render**/
  alternateRowColor(rowIndex: any, rowAlternate: any) {
    if (rowAlternate) {

      this.isOddRow = !this.isOddRow;

    }
  }

  calcSommaryCells() {

    this.colsHeader.forEach(col => {
      this.calcolaSomma(col)
    })
  }

  setStyleBody(): Promise<boolean> {


    const numRows = this.rowsData().length
    const rowHeight = 27; // Altezza di una singola riga
    const totalHeight = this.tableHeight;

    const maxRowsByBody = Math.floor(totalHeight / rowHeight);
    let tWidth = this.tableWrapWidth;

    //const setOverflow = (maxRowsByBody * rowHeight) < (numRows * rowHeight) ;
    this.bodyHeight = totalHeight
    this.bodyStyle = {


      'display': 'block',

      'border-top': '1px solid #e8eaeb'
    };
    this.theadStyle = {

      'display': 'block',
    }

    if (this.colsGroupShow) {
      this.tableStyle = { 'width.px': tWidth, 'height.px': this.tableHeight, 'overflow-y': 'clip', 'table-layout': 'auto', 'display': 'block' }
      this.bodyStyle.display = 'unset'
      this.bodyStyle['overflow-y'] = 'unset';
      return Promise.resolve(true)
    }

    return Promise.resolve(true)

  }

  /**Fine Funzioni di render */


  /**Funzione di dataRourceRemote **/
  loadRemoteRecords(): Promise<boolean> {


    try {


      this.anagraficaService.getElenco(this.api, this.queryString).subscribe(data => {

        this.dataSource = data;

        this.rowsData.set(data)
        if (data.totalCount) {
          this.totalRecords = data.totalCount;
        }
        //this.totalRecords = data['@odata.count'];

        return Promise.resolve(true)
      });






    } catch (ex) {
      return Promise.resolve(false)

    } finally {

      return Promise.resolve(true)
    }


  }

  /**Fine funzione di dataRourceRemote **/
  buildAndTestQueryString(): Promise<boolean> {

    if (this.queryString != '') {

      let queryString = this.queryString;


      if (this.queryString.includes('$')) {

        for (let x in this.dataJson) {
          if (x) {
            if (queryString.includes(x)) {
              let regex = new RegExp('\\$' + x + '\\b', 'g');

              if (!this.dataJson[x]) {

                return Promise.resolve(false);
              }

              queryString = queryString.replace(regex, this.dataJson[x]);


            }
          }

        }
        this.queryString = queryString;
        return Promise.resolve(true);
      }
    }

    return Promise.resolve(true);
  }
  async addRow() {


    let newRowData: any;


    if (this.rowsData().length == 0) {
      this.showNullData = false
    }



    this.colsHeader.forEach(cells => {
      if (cells.dataField) {
        let value = null;
        if (cells.editorType == 'dxNumberBox') {
          value = 0
        }
        newRowData = { ...newRowData, [cells.dataField]: value }
      }
    })


    if (typeof newRowData != 'undefined') {
      newRowData.isNewRow = true
      this.rowsData().push(newRowData)
    }

    /* let tdEmpty = ''
    for (let index = 0; index < this.colsHeader.length; index++) {
      //insert Row
      tdEmpty += `<td></td>`

    }*/

    let indexLastRow = this.dataSource.length - 1




    this.rowSelected = [false];
    setTimeout(() => {
      this.rowSelected[indexLastRow] = true
    }, 300);
  }

  deleteRow(index?: any): any[] {



    if (index == 0) {


      if (this.dataSource().length == 0) {
        this.rowsData.update(res => res = []);
      }


    }

    this.rowsData.update(res => this.dataSource().splice(index, 1));
    return this.rowsData()


  }
  /**Funzioni di editor**/

  btnActionClick(evt: any) {
    console.log('btnActionClick', evt);
    switch (evt.action) {
      case "onEditEvent":
        this.startEdit(evt.rowIndex, evt)
        break;
      case "onDeleteEvent":
        this.removeRowData(evt.rowIndex, evt)
        break;

      default:
        break;
    }
  }

  startEdit(index: any, event: any) {


    let eventEditor = {
      infoEvent: event,
      rowIndex: index,
      data: this.rowsData()[index],
      name: 'buttonEditRowEvent',
      idTable: this.idTable,
      service: this.service,
      cancel: false,
      component: this
    }
    this.emittendStartEdit.emit(eventEditor)

    if (eventEditor.cancel) {
      return
    }


  }


  async removeRowData(index: any, event: any) {


    confirm('Sei certo di voler eliminare questo record?', 'Attenzione!', res => {


      if (!res) {
        return
      }

      let delEvent = {
        name: 'delRows',
        rowIndex: index,
        rowData: this.rowsData()[index]
      }

      this.emittendGridEvent.emit(delEvent)

      if (!this.remoteOperation) {

        this.deleteRow(index);


        //this.renderGrid()

      } else if (res) {
        let id = this.rowsData()[index].id
        this.anagraficaService.actionDelete(this.api, id).then(res => {

          this.renderGrid()
        })
      }
    })

  }





  emitButtonDynamic(event: any, rowIndex: any) {
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

  saveAndExit() {


    let dataSourceRowSelected: any[] = []
    this.rowSelected.forEach((re, i) => {
      if (re) {

        dataSourceRowSelected.push(this.rowsData()[i])
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

  /***Funzioni di selezione riga***/
  setStateHover(rowIndex: any) {
    this.isHovered[rowIndex] = true;
  }
  leaveStateHover(ev: any, element: any, rowIndex: any) {
    this.isHovered[rowIndex] = false;
  }

  selectRow(event: any, index: any, row: any, selectRowIndex?: any) {

    let prevIndex = index - 1

    //this.selectionChange(event, prevIndex)

    let infoRows = {
      isRowFather: false,
      isRowDetail: false
    }


    let eventClickRow = {
      event: event,
      rowData: row,
      component: this,
      dataSource: this.dataSource,
      infoRows: infoRows,
      rowIndex: index,
      name: 'onRowOnlyClick',
      cancel: false
    }

    this.emittendSelectionRow.emit(eventClickRow);

    if (eventClickRow.cancel) {
      return
    }

    if (!this.selectionRowMode) {

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
        fatherData: this.rowsData()[selectRowIndex],
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



    let eventSelectRow = {
      event: event,
      data: row,
      infoRows: infoRows,
      rowIndex: index,

      name: 'onRowSelectionChange'
    }


    this.emittendSelectionRow.emit(eventSelectRow);

  }
  dblRowClick(event: any, index: any, row: any, selectRowIndex?: any) {

    let prevIndex = index - 1

    //this.selectionChange(event, prevIndex)



    let eventDblClickRow = {
      event: event,
      rowData: row,
      component: this,
      dataSource: this.dataSource,
      rowIndex: index,
      name: 'onDblRowClick',
      cancel: false
    }

    this.emittendDblRowClick.emit(eventDblClickRow);









  }

  selectRowDetail(event: any, index: number, row: any, selectRowIndex?: any) {

    let prevIndex = index - 1


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



    let eventSelectRowDetail = {
      event: event,
      data: row,
      fatherData: this.rowsData()[selectRowIndex],
      infoRows: infoRows,
      rowIndex: index,

      name: 'onRowSelectionChange'
    }
    this.emittendSelectionRow.emit(eventSelectRowDetail);


  }

  clickToSelectRowMultiple(event: any, index: any, checkBoxSelect: any) {

    let selRow = this.rowSelected[index];
    if (!selRow) {

      this.rowSelected[index] = true;

    } else {

      this.rowSelected[index] = false;

    }
    //this.selectRowMultiple(event, index)
    event.stopPropagation();
  }


  selectRowMultiple(event: any, index: any, row?: any) {


    let selRow = this.rowSelected[index];
    if (!selRow) {
      this.rowSelected[index] = true;
    } else {
      this.rowSelected[index] = false;
    }

    if (event) {

      event.stopPropagation();
      event.preventDefault();

    }



    let eventSelectRow = {
      event: event,
      data: row,
      rowIndex: index,
      component: this,
      dataSource: this.dataSource,
      rowsSelected: this.rowSelected[index],
      name: 'onRowMultipleSelection'
    }

    this.emittendSelectionRow.emit(eventSelectRow);

  }

  clickToSelectAllRows() {
    this.rowSelectedAll = false;

    let dataSourceLength = this.rowsData().length;


    if (dataSourceLength > 0) {
      if ((this.rowSelected.length - 1) == dataSourceLength) {
        this.rowSelected = [false];
        this.rowSelectedAll = false
        return
      }

      for (let x = 0; x <= dataSourceLength; x++) {
        this.rowSelected[x] = true;
      }

      this.rowSelectedAll = true
    }


  }




  removeSelAndExit(event: any) {

  }

  chooseRow(event: any, i: any, colRow: any) {

    if (this.showDetailRow[i]) {
      return
    }
    this.selectRow(event, i, colRow)
  }

  tdClick(event: any, colInfo: ColData, tdIndex: any, rowIndex: any) {
/* console.log(event)
    if (this.modeEdit != 'cell') {
      return
    } */
    const colType = colInfo.type
    switch (colType) {

      case 'campoButton':
        event.stopPropagation()
        this.buttonClick(event, colInfo.button, colInfo, rowIndex)
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


  /** Funzioni di dettaglio **/
  collapse(e: any, row: any, index: any, groupDataField?: any) {


    var elems = document.querySelectorAll(".dx-datagrid-group-opened");

    [].forEach.call(elems, (el: any) => {
      el.className = el.className.replace('dx-datagrid-group-opened', "dx-datagrid-group-closed");
    });

    let boxW = document.querySelector<HTMLElement>('.-data-grid-wrapper ');
    if (boxW)
      boxW.classList.add('scroll-bottom');

    let table = document.getElementById(this.idTable)
    if (table) {



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

        this.colsRowDetail[index] = this.rowsData()[index][groupDataField];

        if (this.colsRowDetail[index].length == 0) {

          this.showNullDataDetail = true


        }

        this.showDetailRow[index] = true;

        let eventExpandingRow = {
          cancel: false,
          data: row,
          rowIndex: index,
          expandedData: this.rowsData()[index][groupDataField],
          name: 'onRowExpanded'
        }

        this.emittendGridEvent.emit(eventExpandingRow);

        targetDetailCol.classList.remove('dx-datagrid-group-closed');

        targetDetailCol.classList.add('dx-datagrid-group-opened')
      }

    }

  }

  async renderGridDetailData(detailOptions: detailOptions, row: any, index: any) {


    let cols
    this.showNullDataDetail = false;
    let queryString = '';
    let api = detailOptions.api;
    let costantValues = detailOptions.costantValue;
    let values: any
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

    this.anagraficaService.getElenco(api, queryString).subscribe(ress => {



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


    })

  }








  // Funzione per calcolare la somma di una colonna specifica
  calcolaSomma(cols: ColData): number {


    if (!cols.dataField) {
      return 0
    }

    if (!cols.showInSummary) {
      return 0
    }
    let dataField = cols.dataField;

    let value = this.rowsData().reduce((acc, curr) => acc + curr[dataField], 0);

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
      finallyData = `${year}-${month}-${day}`;
    }

    if (type == 'it') {
      finallyData = `${day}-${month}-${year} `;
    }

    return finallyData
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


  async searchData(event: any) {

    return;


  }


  async toolbarValueChanged(event: { value: any; event: any; }) {
    console.log('toolbarValueChanged', event)
    let value = event.value;
    let evt = event.event

    this.searchText = value;
    this.textEmpty = 'Sto cercando...'

    //da finire
    this.searchData(event)


  }

  buttonEmitted(event: any) {
    console.log('buttonEmitted-->', event)
    switch (event) {
      case 'addRow':

        let eventRowClick = {
          infoEventButtons: event,
          name: 'buttonNewRowEvent',
          idTable: this.idTable,
          service: this.service,
          cancel: false,
          component: this
        }
        this.emittendToolbarClick.emit(eventRowClick)


        this.emittendStartEdit.emit(eventRowClick)
        if (!eventRowClick.cancel) {

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

    //Da fare
    //this.focusRow(this.selectedRowIndex, this.selectedSubRowIndex);

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
      data = this.rowsData()[this.selectedRowIndex];
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



  buttonClick(event: any, button: any, col: any, rowIndex: any) {
    let eventToEmit = button;
    eventToEmit.dataSource = this.dataSource;
    eventToEmit.rowData = this.rowsData()[rowIndex];
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


  }

  /**
   * refresh
   */

  public refresh() {

    if (this.currentPage >= 1) {
      this.currentPage = 0;
    }

    this.colsHeader = [];
    this.rowsData.update(res => res = [])

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

  //Orginamento delle colonne 
  sortColumn(column: string): void {
    if (this.sortedColumn === column) {
      // Cambia la direzione dell'ordinamento
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Imposta una nuova colonna ordinata
      this.sortedColumn = column;
      this.sortDirection = 'asc';
    }

    // Applica l'ordinamento ai dati
    this.rowsData().sort((a, b) => {
      const valueA = a[column];
      const valueB = b[column];

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
}
