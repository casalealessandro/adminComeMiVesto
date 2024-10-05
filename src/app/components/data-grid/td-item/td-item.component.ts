import { Component, EventEmitter, inject, Input, Output, } from '@angular/core';
import { CommonModule, getLocaleNumberFormat, registerLocaleData } from '@angular/common'
import { formatCurrency, formatDate, formatNumber, formatPercent, } from '@angular/common';
import localeFit from '@angular/common/locales/it'
import { AnagraficaService } from '../../../services/anagrafica.service';
import { alert } from '../../../widgets/ui-dialogs';


registerLocaleData(localeFit);
@Component({
  selector: 'app-td-item',
  templateUrl: './td-item.component.html',
  standalone:true,
  imports:[CommonModule],
  styleUrls: ['./td-item.component.scss']
})
export class TdItemComponent  {

  @Input() colProperty: any;
  @Input() colType: any;
  @Input() value: any;
  @Input() editorData: any;
  @Input() rowIndex: any;
  @Input() dataRow = [];
  @Input() searchText: any = null
  @Input() showSummaryText: boolean = false;
  @Output() emitClick: EventEmitter<any> = new EventEmitter<any>(); //Emit all'esterno                    
  @Output() emitText: EventEmitter<any> = new EventEmitter<any>(); //Emit all'esterno                    
  @Input() isMockDataLoading : boolean = false;

  remoteData:any;
  staticData: any;
  dataField: any
  
  styleData: any = {}
  notEditing: boolean = false
  showBooleanFlag: boolean = false;
  summaryTextHtml = ''
  anagraficaService=inject(AnagraficaService)
  displayExpr: any;
  isTooltipVisible: boolean=false;
  tooltipStyle!: {
    position: string;
    top: string; // 10px sotto il cursore
    left: string;
  };
  toolTipImg: any;
 

  ngAfterViewInit() {

    const colPropertyAlign =  !this.colProperty.colAlignment ? 'left' : this.colProperty.colAlignment

    this.styleData = {
      'text-align': colPropertyAlign,
    }

  /*  
    lo commento perchè vorrei gerstire i tipi di campo se passati, preferisco così non devo scervellarmi se fare o meno dei controlli sul tipo di valore che mi arriva.
  if (this.colProperty.customizedOptions) {
      const customizedOption = this.colProperty.customizedOptions;
      this.renderDataColumn(this.value, customizedOption);

    } else {
      this.staticData = this.renderHtmlColumn(this.value, this.colProperty.format);
    } */
    this.staticData = this.renderHtmlColumn(this.value, this.colProperty.format);
    this.colProperty.labelVisible = false
    this.dataField = this.colProperty.dataField;

   
  }

  async renderDataColumn(data: any, colData:any,items?: any ) {
    //console.log('data-->' + data, colData);

    if (colData.valueExpr && colData.valueExpr != 'object') {

      let dataSource = colData.dataSource;
      if (!this.value) {
        return
      }
      if(typeof colData.static != 'undefined'){
          if(colData.static){
            /*let staticData = typeof colData.items != 'undefined' ? colData.items : this.formservice.getService(colData.dataSource);

            const staticaData = staticData.filter((dataF: { [x: string]: any; })=>data == dataF[colData.valueExpr])
            this.staticData = staticaData[0][colData.displayExpr];*/
            return
          }
      }
      if (Array.isArray(data)) {
        //let displayExpr = !colData.valueExpr ? colData.displayExpr : colData.valueExpr
        this.staticData = data
        
      }else{
        await this.getElementValue(dataSource, colData, this.value);
      }

      if (this.remoteData) {
        if (colData.displayExpr) {
          this.displayExpr = colData.displayExpr;
          this.staticData = this.remoteData[this.displayExpr];
        } else {
          this.displayExpr = colData.valueExpr;
          this.staticData = this.remoteData[this.displayExpr];
        }
        this.staticData = this.renderHtmlColumn(this.staticData, '')
      }
    } else if (colData.valueExpr == 'object') {

      if (Array.isArray(data)) {
        let displayExpr = colData.displayExpr
        this.staticData = data.map(res => {
          return res[displayExpr]
        })
      }


    }
    else {
      this.staticData = this.value
    }

  /*   if(colData.related){
      let related = colData.related;

      related.forEach((values:any, key) => {
        let arrayValue = values.split('|')
        if (arrayValue.length > 1) {
          if(typeof  this.remoteData[arrayValue[1]] !='undefined')
            this.dataRow[arrayValue[1]] = this.remoteData[arrayValue[0]]
        } else {
          if(typeof  this.remoteData[values] !='undefined')
            this.dataRow[values] = this.remoteData[values]
        }

      })
      
    } */

  }

  async getElementValue(api: any, colData: any, value: any) {
    let queryString = ''

      await this.anagraficaService.getValue(api, value, queryString).then((res:any) => {



        if (res['items']) {
          res = res['items']
        }
        this.remoteData = res
        return this.remoteData
      })

  }

  


  renderHtmlColumn(text: any, format: any) {

    const type = this.colType
    console.log('type',type)
    let result = text
    switch (type) {
      case 'campo':
        result =this.defaultRender(text,format)
        
        break;
      case 'campoLista':
        result =this.listaRender(text)
        
      break;  
      case 'campoDateTime':
      case 'campoData':
        result =this.dateRender(text,format)
        
        break;
      case 'campoImg':
        this.toolTipImg = text
        result = `<img src="${text}" class="cell-img" >`
        break;
      case 'campoButton':
        const buttonInfo = this.colProperty['button'];
        console.log('buttonInfo',buttonInfo);

        result = `<button class="btn "><span class="${buttonInfo.icon}"></span></button>`;
        
        break;
      default:
        result =this.defaultRender(text,format)
    }

    return result
  }

  defaultRender(text:any,format:any):string{

    if(this.showSummaryText && text){
      this.summaryTextHtml += "<span style=\"padding-right:5px\">Tot: </span>"
    }

    let dateType = /(\d{4})([\/-])(\d{1,2})\2(\d{1,2})/;
    let isMatch = dateType.test(text);

    if (isMatch) {

      if (format) {
        let date = new Date(text)
        return formatDate(date, format, 'en-US')
      } else {
        let date = new Date(text)
        return formatDate(date, "dd/MM/yyyy", 'en-US')
      }

    }

    if (typeof text == 'boolean') {
      const dataOptions = this.colProperty.dataOptions
      if (typeof dataOptions.trueText == 'undefined' || dataOptions.falseText == 'undefined') {
        this.showBooleanFlag = true;

      } else {
        if (text) {
          text = dataOptions.trueText;
        } else {
          text = dataOptions.falseText;
        }
      }


    }

    if (typeof text == 'number') {

      this.styleData = {
        'text-align': 'right',
      }

      if (!format) {

        let numberUSFormatted = formatNumber(text, 'it-IT', '1.0-3');
        return numberUSFormatted;

      } else {

        /**
         * Retrieves a number format for a given locale.
         *
         * I numeri vengono formattati utilizzando modelli, come "#,###.00". Ad esempio, il modello "#,###.00".
         * se utilizzato per formattare il numero 12345.678 potrebbe risultare in "12'345.678". Ciò accadrebbe se il
         * Il separatore di raggruppamento per la tua lingua è un apostrofo e il separatore decimale è una virgola.
         *
         * <b>Importante:</b> i caratteri `.` `,` `0` `#` (e altri di seguito) sono segnaposto speciali
         * che rappresentano il separatore decimale e così via e NON sono caratteri reali.
         * NON devi "tradurre" i segnaposto. Ad esempio, non cambiare `.` in `,` anche se in
         * nella tua lingua il punto decimale si scrive con una virgola. I simboli dovrebbero essere sostituiti da
         * equivalenti locali, utilizzando il `NumberSymbol` appropriato per la tua lingua.
         *
         * Here are the special characters used in number patterns:
         *
         * | Symbol | Meaning |
         * |--------|---------|
         * | . | Replaced automatically by the character used for the decimal point. |
         * | , | Replaced by the "grouping" (thousands) separator. |
         * | 0 | Replaced by a digit (or zero if there aren't enough digits). |
         * | # | Replaced by a digit (or nothing if there aren't enough). |
         * | ¤ | Replaced by a currency symbol, such as $ or USD. |
         * | % | Marks a percent format. The % symbol may change position, but must be retained. |
         * | E | Marks a scientific format. The E symbol may change position, but must be retained. |
         * | ' | Special characters used as literal characters are quoted with ASCII single quotes. |
         *
         */

        if (format.includes('#')) {
          /*  let spilitted = format.split('.');
 
           let count = spilitted.length; */
          const parts = text.toFixed(3).split('.');
          const [integerPart, decimalPart] = parts;

          const integerFormatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

          // Utilizza la variabile 'format' per determinare il numero di cifre decimali
          const decimalDigits = format.split('.')[1].length;
          const formattedNumber = `${integerFormatted},${decimalPart.slice(0, decimalDigits)}`;

          return formattedNumber;
        } else {
          let numberUSFormatted = formatNumber(text, 'it-IT', '1.0-3');
          return numberUSFormatted;
        }
     

      }


    }




    return text
  }
  
  dateRender(date:any,format="dd/MM/yyyy"){
    
    // Proviamo a gestire l'input come un tipo stringa o numero (timestamp)
    let dateR: Date;

    if (typeof date === 'string' || typeof date === 'number') {
        // Se è una stringa, cerchiamo di riconoscerla come data
        // Proviamo a usare una regex per i formati di stringa riconosciuti
        const dateStringType1 = /(\d{4})([\/-])(\d{1,2})\2(\d{1,2})/; // yyyy-mm-dd o yyyy/mm/dd
        const dateStringType2 = /(\d{1,2})([\/-])(\d{1,2})\2(\d{4})/; // dd-mm-yyyy o dd/mm/yyyy

        if (typeof date == 'string' && dateStringType1.test(date)) {
            // Formato yyyy-mm-dd o yyyy/mm/dd
            dateR = new Date(date);
        } else if (typeof date == 'string' && dateStringType2.test(date)) {
            // Formato dd-mm-yyyy o dd/mm/yyyy, dobbiamo riorganizzare i pezzi
            const parts = date.split(/[-\/]/);
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // JavaScript usa mesi indicizzati da 0
            const year = parseInt(parts[2], 10);
            dateR = new Date(year, month, day);
        } else {
            // Tenta di costruire una data con il costruttore predefinito di JavaScript
            dateR = new Date(date);
        }
    } else if (date instanceof Date) {
        // Se è già un oggetto Date, lo usiamo direttamente
        dateR = date;
    } else {
        // Se l'input non è riconosciuto, restituiamo un errore o null
        return 'Invalid date format';
    }

    // Controlla se la data è valida
    if (isNaN(dateR.getTime())) {
        return 'Invalid date';
    }

    // Usiamo il metodo formatDate per formattare la data
    return formatDate(dateR, format, 'en-US');
  }
  
  listaRender(text:any):any{
     let ressss = text

      const customizedOptions = this.colProperty.customizedOptions

      if(customizedOptions.options && customizedOptions.options.length>0){
        let valueExp = customizedOptions.valueExp;
        let displayExp = customizedOptions.displayExp;

        let filter = customizedOptions.options.filter((res:any)=>res[valueExp] == text)

        ressss = filter[0][displayExp] 
      }
     return ressss 
  }

  clickTd(event:any) {
    this.showTooltip(event)
    event.value = this.staticData;
    this.emitClick.emit(event)
  }
  // Mostra il tooltip e posizionalo accanto al cursore
  showTooltip(event: MouseEvent): void {
    this.isTooltipVisible = true;
    let img = `<img src="${this.toolTipImg}" alt="Immagine Tooltip" style="heigth:800px" >`
    //alert(img,'Immagine')
    // Posiziona il tooltip rispetto alla posizione del mouse
    this.tooltipStyle = {
      position: 'absolute',
      top: `${event.layerY - 20}px`, // 10px sotto il cursore
      left: `${event.layerX - 20}px`, // 10px a destra del cursore
    };
  }

  restShow(){
    this.isTooltipVisible = true;
  }

  // Nasconde il tooltip
  hideTooltip(): void {
    this.isTooltipVisible = false;
  }
  
  onValueChangeCheckBox(event: { value: any; }) {
    this.staticData = event.value;
    //this.emitClick.emit(event)
  }

  highlightMatches(testo: any):string {
    
    if (!testo) {
      return '';
    }

    if (!this.searchText) {
      //this.
      return this.summaryTextHtml + testo; // Nessun testo di ricerca, restituisci il testo originale
       
    }

   
    const regex = new RegExp(this.searchText, 'gi');

    if(typeof testo == 'string'){
      return testo.replace(regex, match => `<span class="highlight">${match}</span>`);
    }
    return ''
  }
}
