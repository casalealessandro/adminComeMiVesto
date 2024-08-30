export interface detailOptions{
  groupDataField: string;
  costantValue?: costantValue[]
  isRemote: boolean;
  service: string;
  api: string;
  isEditable: boolean;
  queryString: string;
  colonne?:
    {
      dataField: string;
      dataType?: string;
      caption: string;
      allowEditing?: boolean,
      colVisible?: boolean,
      colWidth: number | any
    }[]


}

export interface costantValue {
    key: string;
    value: any;
}

export interface Odata{
    $top?: number;
    $skip?: number;
    $count?: boolean;
    $filter?:string
}

export interface Utente{
    uid: string;
    displayName: string;
    cognome: string;
    name: string;
    nome?: string;
    email: string;
    photoURL?: string;
    bio?: string;
    userType?: any
}

export interface ToolbarButton {
    id: string;             // Identificativo del pulsante
    name: string;           // Nome del pulsante
    text: string;           // Testo visibile nel pulsante
    icon?: string;          // Icona associata al pulsante (opzionale)
    disabled: boolean;      // Se il pulsante è disabilitato
    visible: boolean;       // Se il pulsante è visibile
    widget: string;         // Tipo di widget, ad esempio 'button' o 'textBox'
    width?: number;         // Larghezza del pulsante (opzionale, specifica per alcuni widget)
    position?: 'left' | 'right'; // Posizione del pulsante nella toolbar, se specificata (opzionale)
  }
  

export interface Colonne {
    groupDataField: string;
    caption?: string;      // Testo da visualizzare come intestazione
    colSpan?: number;      // Numero di colonne su cui l'elemento si estende
    itemType?: string;     // Tipo di elemento, ad es. "group"
    class?: string;        // Classe CSS da applicare
    data: ColData[];      // Array di oggetti HColData (dettaglio delle colonne)
  }[]
  
  export  interface ColData {
    labelVisible: boolean;
    colCaption: any;
    allowFiltering: any;
    dataField: string;    // Campo dati associato
    type?: string;         // Tipo di campo, ad es. "button", "data", "campoDesc"
    caption?: string;      // Testo della colonna
    colWidth?: number | string;  // Larghezza della colonna, può essere un numero o una stringa
    width?: number | string;     // Alternativa per la larghezza della colonna
    class?: string;        // Classe CSS per la colonna
    colSpan?: number;      // Numero di colonne su cui l'elemento si estende
    labelAlignment?: string; // Allineamento della label
    colAlignment?: string;  // Allineamento della colonna
    format?: string;       // Formato della colonna (es: numero, data)
    editorType?: string;   // Tipo di editor (es: "text", "number")
    dynamic?: DynamicOptions;  // Opzioni dinamiche per il campo
    lista?: any;           // Opzioni di lista (specifiche dell'implementazione)
    lookup?: any;          // Opzioni di lookup (specifiche dell'implementazione)
    allowEditing?: boolean; // Se l'editing è consentito
    groupIndex?: number;   // Indice di raggruppamento
    showInSummary?: boolean; // Se mostrare nel sommario
    validation?: ValidationRule[];  // Regole di validazione
    min?: number;          // Valore minimo per il campo
    max?: number;          // Valore massimo per il campo
    maxLength?: number;    // Lunghezza massima del campo
    colVisible?: boolean;  // Visibilità della colonna
    button?: any;          // Opzioni specifiche del pulsante
  }
  
  interface DynamicOptions {
    queryString?: string;  // Query dinamica
    // Altri parametri dinamici
  }
  
  interface ValidationRule {
    type: string;          // Tipo di regola di validazione, ad es. "required"
    message?: string;      // Messaggio di errore
    // Altri campi di validazione a seconda delle esigenze
  }
  

  export interface UserProfile {
    uid: string;
    displayName: string;
    cognome: string;
    name: string;
    nome?: string;
    email: string;
    photoURL?: string;
    bio?: string;
    userType?: any;
  }

 