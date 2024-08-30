import { Component, inject, OnInit } from '@angular/core';
import { PopUpService } from '../../../services/popup.service';
import { CommonModule } from '@angular/common';
import { NicaPopupContentComponent } from '../modal-popup-content/modal-popup-content.component';



@Component({
  selector: 'app-modal-popup-wrapper',
  templateUrl: './modal-popup-wrapper.component.html',
  imports:[CommonModule,NicaPopupContentComponent],
  standalone:true,
  styleUrls: ['./modal-popup-wrapper.component.css']
})
export class PopupWrapperComponent implements OnInit {
  popups:any[]=[];
  classe!: string;
  classSlideCenter:string = 'slide-center'
  classFadeIn:string = "fade-in-fwd";
  popUpService=inject(PopUpService)
  

  ngOnInit() {

      this.popUpService.popupsSet.subscribe(currentSetPopups => {
        currentSetPopups.forEach((res,i)=>{
          
          if(res.action == 'added'){
            res.action = 'setted';
            res.class = this.classSlideCenter;
          
            this.popups.push(res)
          }

          if(res.action == 'update'){
            res.action = 'setted';
            
            res.class = "fade-out-bck";
            this.popups.splice(i,1); 
            res.class = this.classSlideCenter;
            setTimeout(() => {
                            
              this.popups.push(res)
              
             
            
            }, 500);
            
           
            
          }

          if(res.action == 'remove'){
          
            
            res.class = "fade-out-bck";
            
            setTimeout(() => {
              this.popups.splice(i,1); 
              
            }, 300);

              
          }
          
        })
      
        //this.popUpService.setPopUps(this.popups)
    })
   

  }

}
