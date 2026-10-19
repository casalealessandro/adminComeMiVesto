import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { OutfitsComponent } from './outfits.component';
import { OutfitsGridProvider } from './outfits-grid.provider';
import { OutfitsService } from '../../services/outfit.service';
import { FormService } from '../../services/form.service';

describe('OutfitsComponent', () => {
  let component: OutfitsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutfitsComponent],
      providers: [
        { provide: OutfitsGridProvider, useValue: { load: jasmine.createSpy('load'), deleteMany: jasmine.createSpy('deleteMany') } },
        { provide: OutfitsService, useValue: {} },
        { provide: FormService, useValue: { getData: () => Promise.resolve([]) } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    }).overrideComponent(OutfitsComponent, { set: { template: '' } }).compileComponents();

    component = TestBed.createComponent(OutfitsComponent).componentInstance;
  });

  it('exposes the requested outfit columns in order', () => {
    expect(component.columns[0].data.map(column => column.colCaption)).toEqual([
      'Immagine', 'Titolo outfit', 'Stile', 'Occasione', 'Utente',
      'Creazione', 'Stato', 'Azioni', 'Modifica'
    ]);
  });

  it('has the three domain actions in a single menu', () => {
    expect(component.menuActions.map(action => action.nameEvent))
      .toEqual(['approve', 'toggleSuspend', 'deleteOutfit']);
  });
});
