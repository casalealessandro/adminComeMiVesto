import { EventEmitter, Injectable, Output, Type, } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { entryComponents } from './entryComponents';




@Injectable({
  providedIn: 'root'
})



export class PopUpService {

  @Output() dataFromComponent: EventEmitter<any> = new EventEmitter<any>();



  private _popupsSet = new BehaviorSubject<any[]>([])
  popupsSet = this._popupsSet.asObservable();
  currentPopupsSet: any[] = [];

  private _outputComponent = new BehaviorSubject<any>([]);
  outputComponent = this._outputComponent.asObservable();
  //setOutputComponent




  getComponentByName(componenName: any): Type<any> {

    const component = entryComponents.find((c: { name: any; }) => c.name === componenName);

    return component!.component || null;
  }

  isComponentExistByName(componenName: any): boolean {

    const component = entryComponents.find((c: { name: any; }) => c.name === componenName);

    if (component!.name) {
      return true
    }

    return false
  }


  /**********Gestione PopUp **********/

  setNewPopUp(id: string, componentName: any, data: any, popUpWidth: any = '800', accessoringData?: any, instancedData?: any, showCaptionFooter = false, showCaptionHeader = false, title = '', position = 'center', isClosablePopUp = false) {

    if (!id) {
      id = Math.random().toString().replace("0.", "")
    }

    if (typeof componentName == 'undefined' || !id) {
      return
    }


    let index = this.currentPopupsSet.findIndex(rrrr => rrrr.id == id && rrrr.componentName == componentName)

    if (index < 0) {
      let dataPoUp = {
        componentName: componentName,
        dataToSend: data,
        instancedData: instancedData,
        popUpWidth: popUpWidth,
        showCaptionFooter: showCaptionFooter,
        showCaptionHeader: showCaptionHeader,
        accessoringData: accessoringData,
        action: 'added',
        title: title,
        position: position,
        id: id,
        isClosablePopUp: isClosablePopUp
      }
      this.currentPopupsSet.push(dataPoUp)
      this._popupsSet.next(this.currentPopupsSet);

    } else {

      // dataPoUp.action = 'update'

      this.currentPopupsSet[index]['dataToSend'] = data;
      this.currentPopupsSet[index]['action'] = 'update';

      // this.currentPopupsSet[index]['id'] = id;
      this.currentPopupsSet[index]['showCaptionFooter'] = showCaptionFooter;
      this.currentPopupsSet[index]['showCaptionHeader'] = showCaptionHeader;


      this._popupsSet.next(this.currentPopupsSet);
    }



  }

  setPopUps(popUps: any[]) {

    this.currentPopupsSet = popUps

    //this._popupsSet.next(this.currentPopupsSet);
  }

  destroyCurrentOpenPopUp(componentName: any) {

    let index = this.currentPopupsSet.findIndex(rrrr => rrrr.componentName == componentName)

    if (index >= 0) {


      this.currentPopupsSet[index].action = 'remove';

      try {

        // document.getElementsByClassName('modal')!.item(index).classList.remove('slide-center');
        //document.getElementsByClassName('modal')!.item(index).classList.add('fade-out-bck');


      } catch (ex) {
        console.warn(ex);
      }

      setTimeout(
        () => {

          this._popupsSet.next(this.currentPopupsSet);
          this._outputComponent.next([]);


          this.currentPopupsSet.splice(index, 1)
        }, 500
      )

    }


  }

  destroyCurrentOpenPopUpByGuid(id: any) {

    let index = this.currentPopupsSet.findIndex(rrrr => rrrr.id == id || rrrr.componentName == id)

    if (index >= 0) {

      this.currentPopupsSet[index].action = 'remove';

      try {

        //document.getElementsByClassName('modal').item(index).classList.remove('slide-center');
        //document.getElementsByClassName('modal').item(index).classList.add('fade-out-bck');

        this._popupsSet.next(this.currentPopupsSet);
        //this._outputComponent.next([]);
        this.currentPopupsSet.splice(index, 1)
        return true;

      } catch (ex) {
        console.warn(ex);
        return false
      }





    }
    return false

  }

  destroyOutputComponent() {

    this._outputComponent.next([]);

  }

  destroyCurrentOpenPopUps() {
    this.currentPopupsSet = []
    this._popupsSet.next([]);
  }

  setOutputComponent(eventFromComponent: any) {
    this._outputComponent.next(eventFromComponent)
  }

  async getOutputComponent(guid: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.outputComponent.subscribe(async resulOutputComponent => {
        if (resulOutputComponent.guid === guid) {
         
          
          if (resulOutputComponent.guid == guid ) {
            const resolveC = resulOutputComponent;
            resolve(resolveC); // Risolvi la Promise con i dati del form
          }
          

        }
      });
    });
  }

  onSubScribe(){
    this._popupsSet.unsubscribe()
  }
}

