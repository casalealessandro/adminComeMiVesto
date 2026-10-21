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

  it('exposes a disabled delete action in the page toolbar before any outfit is selected', () => {
    expect(component.bulkDeleteToolbarButtons).toEqual([
      jasmine.objectContaining({
        name: 'bulkDeleteOutfits',
        text: 'Elimina selezionati (0)',
        disabled: true,
        visible: true,
      }),
    ]);
  });

  it('routes bulk deletion to the existing grid confirmation for loaded selected rows', () => {
    const grid = {
      isLoading: false,
      getSelectedRows: jasmine.createSpy('getSelectedRows').and.returnValue([{ id: 'outfit1' }, { id: 'outfit2' }]),
      confirmDeleteSelectedRows: jasmine.createSpy('confirmDeleteSelectedRows'),
      renderGrid: jasmine.createSpy('renderGrid'),
    };
    component.outfitsGridView(grid as any);
    const action = component.bulkDeleteToolbarButtons[0];
    expect(action.text).toBe('Elimina selezionati (2)');
    expect(action.disabled).toBeFalse();
    component.eventToolbarOutfit({ name: 'bulkDeleteOutfits' });
    expect(grid.confirmDeleteSelectedRows).toHaveBeenCalledTimes(1);
  });

  it('does not submit a bulk delete beyond the backend 100-ID limit', () => {
    const grid = {
      isLoading: false,
      getSelectedRows: jasmine.createSpy('getSelectedRows').and.returnValue(
        Array.from({ length: 101 }, (_, index) => ({ id: `outfit${index}` }))
      ),
      confirmDeleteSelectedRows: jasmine.createSpy('confirmDeleteSelectedRows'),
      renderGrid: jasmine.createSpy('renderGrid'),
    };
    component.outfitsGridView(grid as any);
    expect(component.bulkDeleteToolbarButtons[0].disabled).toBeTrue();
    component.eventToolbarOutfit({ id: 'bulkDeleteOutfits' });
    expect(grid.confirmDeleteSelectedRows).not.toHaveBeenCalled();
    expect(component.error).toContain('100');
  });

  it('has the three domain actions in a single menu', () => {
    expect(component.menuActions.map(action => action.nameEvent))
      .toEqual(['approve', 'toggleSuspend', 'deleteOutfit']);
  });
});
