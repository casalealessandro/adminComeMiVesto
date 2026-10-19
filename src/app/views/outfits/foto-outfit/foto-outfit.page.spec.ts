import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { PopUpService } from '../../../services/popup.service';
import { FotoOutfitPage } from './foto-outfit.page';

describe('FotoOutfitPage popup lifecycle', () => {
  function setup() {
    TestBed.resetTestingModule();

    const output = new Subject<any>();
    const popup = jasmine.createSpyObj<PopUpService>(
      'PopUpService',
      ['setNewPopUp', 'destroyCurrentOpenPopUpByGuid', 'getOutputComponent'],
      { outputComponent: output }
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: PopUpService, useValue: popup }
      ]
    });

    const component = TestBed.runInInjectionContext(() => new FotoOutfitPage());
    return { component, popup, output };
  }

  function lastGuid(popup: jasmine.SpyObj<PopUpService>): string {
    return popup.setNewPopUp.calls.mostRecent().args[0] as string;
  }

  async function flushPromise(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }

  it('does not close the tag popup on an unrelated functional input event', async () => {
    const { component, popup, output } = setup();
    let settled = false;
    const modalPromise = component.openModal();
    modalPromise.then(() => settled = true);
    const guid = lastGuid(popup);

    output.next({ guid, name: 'functionalInputClick', nomeCampo: 'product' });
    await flushPromise();
    expect(settled).toBeFalse();
    expect(popup.destroyCurrentOpenPopUpByGuid).not.toHaveBeenCalled();
    expect(output.observers.length).toBe(1);

    output.next({ guid, name: 'cancelForm' });
    await expectAsync(modalPromise).toBeResolvedTo(false);
  });

  it('resolves submitForm for the matching tag popup and releases its listener', async () => {
    const { component, popup, output } = setup();

    const modalPromise = component.openModal();
    const guid = lastGuid(popup);
    const formData = { name: 'Giacca', prezzo: 99 };

    output.next({ guid, name: 'submitForm', formData });

    await expectAsync(modalPromise).toBeResolvedTo(formData);
    expect(popup.destroyCurrentOpenPopUpByGuid).toHaveBeenCalledWith(guid);
    expect(output.observers.length).toBe(0);
  });

  it('resolves cancelForm only for the matching tag popup and releases its listener', async () => {
    const { component, popup, output } = setup();

    const modalPromise = component.openModal();
    const guid = lastGuid(popup);

    output.next({ guid: 'other-guid', name: 'cancelForm' });
    await flushPromise();
    expect(popup.destroyCurrentOpenPopUpByGuid).not.toHaveBeenCalled();
    expect(output.observers.length).toBe(1);

    output.next({ guid, name: 'cancelForm' });

    await expectAsync(modalPromise).toBeResolvedTo(false);
    expect(popup.destroyCurrentOpenPopUpByGuid).toHaveBeenCalledWith(guid);
    expect(output.observers.length).toBe(0);
  });

  it('keeps simultaneous tag popup promises isolated and releases only each terminal listener', async () => {
    const { component, popup, output } = setup();

    let settledA = false;
    const promiseA = component.openModal();
    promiseA.then(() => settledA = true);
    const guidA = lastGuid(popup);

    const promiseB = component.openModal();
    const guidB = lastGuid(popup);

    expect(guidB).not.toBe(guidA);
    expect(output.observers.length).toBe(2);

    output.next({ guid: guidB, name: 'submitForm', formData: { name: 'B' } });
    await expectAsync(promiseB).toBeResolvedTo({ name: 'B' });
    expect(settledA).toBeFalse();
    expect(output.observers.length).toBe(1);

    output.next({ guid: guidA, name: 'cancelForm' });
    await expectAsync(promiseA).toBeResolvedTo(false);
    expect(output.observers.length).toBe(0);
  });

  it('links pin selection and product card selection by index', () => {
    const { component } = setup();
    const stopped = jasmine.createSpy('stopPropagation');
    component.selectTag(1, { stopPropagation: stopped } as unknown as Event);
    expect(component.isTagSelected(1)).toBeTrue();
    expect(component.isTagSelected(0)).toBeFalse();
    expect(stopped).toHaveBeenCalled();
    component.selectTag(0);
    expect(component.isTagSelected(0)).toBeTrue();
  });

  it('keeps normalized positions and handles missing positions without inventing pins', () => {
    const { component } = setup();
    const original = { id: 'p', name: 'Maglia', x: .3, y: .7, color: 'blu', outfitCategory: 'TOP' };
    expect(component.hasPinPosition(original)).toBeTrue();
    expect(component.pinPercent(original.y)).toBe(70);
    expect(component.hasPinPosition({ ...original, x: 1.1 })).toBeFalse();
  });

  it('emits the remaining tags when one tag is removed', () => {
    const { component } = setup();
    const original = [
      { id: 'p1', name: 'Maglia', x: .3, y: .4, color: 'blu', outfitCategory: 'TOP' },
      { id: 'p2', name: 'Jeans', x: .4, y: .7, color: 'blu', outfitCategory: 'BOTTOM' }
    ];
    component.tags.set(original);
    component.selectTag(0);
    const emitted = jasmine.createSpy('tagChanged');
    component.eventImageTags.subscribe(emitted);

    component.removeTagAt(0);

    expect(component.tags().map(tag => tag.id)).toEqual(['p2']);
    expect(component.selectedTagIndex).toBeNull();
    expect(emitted).toHaveBeenCalledWith({ tags: [original[1]] });
  });

  it('retains linked catalogProductId and pin position after a tag edit', async () => {
    const { component } = setup();
    const original = {
      id: 'product1', catalogProductId: 'catalog1', name: 'Camicia',
      x: .25, y: .4, color: 'azzurro', outfitCategory: 'TOP',
      images: ['https://example.test/camicia.jpg']
    };
    component.tags.set([original]);
    const emitted = jasmine.createSpy('tagChanged');
    component.eventImageTags.subscribe(emitted);
    spyOn(component, 'openModal').and.resolveTo({ name: 'Camicia celeste', prezzo: 50 });

    await component.editTag(original);

    expect(component.tags()[0]).toEqual(jasmine.objectContaining({
      id: 'product1', catalogProductId: 'catalog1',
      name: 'Camicia celeste', x: .25, y: .4, prezzo: 50
    }));
    expect(component.tags()[0]).not.toBe(original);
    expect(emitted).toHaveBeenCalled();
  });

  it('appends a newly inserted tag without removing existing linked products', async () => {
    const { component } = setup();
    const first = { id: 'existing', name: 'Jeans', x: .5, y: .6, color: 'blu', outfitCategory: 'BOTTOM' };
    component.tags.set([first]);
    component.imageElement = {
      nativeElement: {
        getBoundingClientRect: () => ({ left: 10, top: 20, width: 200, height: 400 })
      }
    } as any;
    spyOn(component, 'openModal').and.resolveTo({
      id: 'new', name: 'Camicia', color: 'bianco', outfitCategory: 'TOP'
    });
    const emitted = jasmine.createSpy('tagChanged');
    component.eventImageTags.subscribe(emitted);

    await component.addTag({ clientX: 110, clientY: 120 });

    expect(component.tags().map(tag => tag.id)).toEqual(['existing', 'new']);
    expect(component.tags()[1].x).toBe(.5);
    expect(component.tags()[1].y).toBe(.25);
    expect(emitted).toHaveBeenCalled();
  });

  it('keeps legacy tags in manual edit mode rather than opening the catalog', () => {
    const { component, popup } = setup();
    component.gender = 'D';
    component.enableCatalogReplacements = true;
    const manual = { id:'manual', name:'Blazer', x:.3,y:.4,color:'N',outfitCategory:'JACKETS' };
    expect(component.canReplaceTag(manual)).toBeFalse();
    component.tags.set([manual]);
    component.showReplacements(0);
    expect(popup.setNewPopUp).not.toHaveBeenCalled();
  });

  it('previews selected replacement without mutating existing tags or the image', async () => {
    const { component, popup } = setup();
    const tag = { id:'old', catalogProductId:'old', name:'Top nero', x:.3,y:.4,color:'N',outfitCategory:'TOP' };
    const product: any = {
      id:'new', name:'Top bianco', brand:'Marca', category:'TOP', genderTargets:['D'],
      images:['https://example.test/new.jpg'], active:true, enabledForApp:true
    };
    component.enableCatalogReplacements = true;
    component.gender = 'D';
    component.image.set('https://example.test/look.jpg');
    component.tags.set([tag]);
    const emitted = jasmine.createSpy('replacements');
    component.eventProductReplacements.subscribe(emitted);
    popup.getOutputComponent.and.resolveTo({name:'selected',product});
    component.showReplacements(0);
    await flushPromise();
    await flushPromise();
    expect(component.shownProductImage(tag,0)).toBe('https://example.test/new.jpg');
    expect(component.tags()[0]).toBe(tag);
    expect(component.image()).toBe('https://example.test/look.jpg');
    expect(emitted).toHaveBeenCalledWith([
      {index:0,expectedId:'old',catalogProductId:'new'}
    ]);
    expect(popup.destroyCurrentOpenPopUpByGuid).toHaveBeenCalled();
  });

  it('keeps remaining replacement selection aligned after another tag is deleted', () => {
    const { component } = setup();
    const first = {id:'one',catalogProductId:'one',name:'Top',x:.4,y:.3,color:'N',outfitCategory:'TOP'};
    const second = {id:'two',catalogProductId:'two',name:'Jeans',x:.5,y:.6,color:'B',outfitCategory:'BOTTOM'};
    component.tags.set([first,second]);
    component.selectedReplacements.set(1,{id:'new',images:[]} as any);
    const emitted = jasmine.createSpy('replacements');
    component.eventProductReplacements.subscribe(emitted);
    component.removeTagAt(0);
    expect(component.selectedReplacements.has(0)).toBeTrue();
    expect(emitted).toHaveBeenCalledWith([{index:0,expectedId:'two',catalogProductId:'new'}]);
  });

  it('renders numbered pins next to selectable product cards', () => {
    const { popup } = setup();
    const fixture = TestBed.createComponent(FotoOutfitPage);
    const component = fixture.componentInstance;
    component.image.set('https://example.test/outfit.jpg');
    component.tags.set([
      { id: 'p1', name: 'Camicia', x: .4, y: .3, color: 'azzurro', outfitCategory: 'TOP' },
      { id: 'p2', name: 'Scarpe', x: .6, y: .85, color: 'marrone', outfitCategory: 'SHOES' }
    ]);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const pins = root.querySelectorAll<HTMLButtonElement>('button.tag-pin');
    const cards = root.querySelectorAll<HTMLButtonElement>('button.product-card__select');
    expect(pins.length).toBe(2);
    expect(cards.length).toBe(2);
    pins[1].click();
    fixture.detectChanges();
    expect(component.selectedTagIndex).toBe(1);
    expect(root.querySelectorAll('.product-card--selected').length).toBe(1);
    cards[0].click();
    fixture.detectChanges();
    expect(component.selectedTagIndex).toBe(0);
    expect(root.querySelectorAll('.tag-pin--selected').length).toBe(1);
  });
});
