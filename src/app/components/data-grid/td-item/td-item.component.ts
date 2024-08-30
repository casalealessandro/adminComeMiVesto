import { Component, EventEmitter, inject, Input, Output, } from '@angular/core';
import { CommonModule, getLocaleNumberFormat, registerLocaleData } from '@angular/common'
import { formatCurrency, formatDate, formatNumber, formatPercent, } from '@angular/common';
import localeFit from '@angular/common/locales/it'
import { AnagraficaService } from '../../../services/anagrafica.service';


registerLocaleData(localeFit);
@Component({
  selector: 'app-td-item',
  templateUrl: './td-item.component.html',
  standalone:true,
  imports:[CommonModule],
  styleUrls: ['./td-item.component.css']
})
export class TdItemComponent  {

  @Input() colProperty: any;
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
 

  ngOnInit() {

    const colPropertyAlign =  !this.colProperty.align ? 'left' : this.colProperty.align

    this.styleData = {
      'text-align': colPropertyAlign,
    }

    if (this.colProperty.customizedOptions) {
      const customizedOption = this.colProperty.customizedOptions;
      this.renderDataColumn(this.value, customizedOption);

    } else {
      this.staticData = this.renderHtmlColumn(this.value, this.colProperty.format);
    }

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
  clickTd(event:any) {
    event.value = this.staticData
    this.emitClick.emit(event)
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
