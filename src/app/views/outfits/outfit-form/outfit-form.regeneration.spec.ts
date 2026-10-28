import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { FormService } from '../../../services/form.service';
import { outfit, OutfitsService } from '../../../services/outfit.service';
import { OutfitFormComponent } from './outfit-form.component';

describe('OutfitForm manual published image regeneration', () => {
  let component: OutfitFormComponent;
  let service: jasmine.SpyObj<OutfitsService>;
  let router: jasmine.SpyObj<Router>;
  const makeOutfit = (): outfit => ({
    id: 'look1', userName: 'Creator', title: 'Office look', userId: 'creator1',
    imageUrl: 'https://example.test/old.png', gender: 'U', style: 'B', season: 'A',
    status: 'approved', tags: [{id:'p1',catalogProductId:'p1',name:'Shirt',
      x:.4,y:.5,color:'N',outfitCategory:'TOP'}],
    updatedAt: 100, aiGenerated: true, aiOutfitDraftId: 'draft1',
    imageMayNotMatchProducts: true,
  });

  beforeEach(async () => {
    service = jasmine.createSpyObj('OutfitsService',
      ['updateAdminOutfit','getAdminOutfitById','regeneratePublishedOutfitImage','createAdminOutfit','prepareOutfitImagesForSave']);
    router = jasmine.createSpyObj('Router',['navigate']);
    router.navigate.and.resolveTo(true);
    await TestBed.configureTestingModule({
      imports: [OutfitFormComponent],
      providers: [
        {provide:OutfitsService,useValue:service},
        {provide:Router,useValue:router},
        {provide:ActivatedRoute,useValue:{paramMap:of(null)}},
        {provide:UserService,useValue:{getUsers:()=>of([])}},
        {provide:AuthService,useValue:{isAdmin:()=>true}},
        {provide:FormService,useValue:{getFormFields:()=>of([])}},
      ],
    }).overrideComponent(OutfitFormComponent,{set:{template:''}}).compileComponents();
    component = TestBed.createComponent(OutfitFormComponent).componentInstance;
    component.outfitId = 'look1';
    component.outfitData.set(makeOutfit());
    component.imageUrl.set('https://example.test/old.png');
    service.prepareOutfitImagesForSave.and.callFake(async payload => payload);
    service.updateAdminOutfit.and.resolveTo(true);
    service.getAdminOutfitById.and.resolveTo([makeOutfit()]);
  });

  it('never offers paid AI regeneration for legacy/UGC or unsaved replacements', () => {
    expect(component.canRegenerateImage()).toBeTrue();
    component.catalogReplacements = [{index:0,expectedId:'p1',catalogProductId:'p2'}];
    expect(component.canRegenerateImage()).toBeFalse();
    component.catalogReplacements = [];
    component.outfitData.set({...makeOutfit(),aiGenerated:false});
    expect(component.canRegenerateImage()).toBeFalse();
    component.outfitData.set({...makeOutfit(),imageMayNotMatchProducts:false});
    expect(component.canRegenerateImage()).toBeFalse();
  });

  it('keeps the editor open after saving a replacement', async () => {
    component.catalogReplacements = [{index:0,expectedId:'p1',catalogProductId:'p2'}];
    const updated = {...makeOutfit(),tags:[{...makeOutfit().tags[0],id:'p2',catalogProductId:'p2'}],updatedAt:200};
    service.getAdminOutfitById.and.resolveTo([updated]);
    await component.submitFormOutfit({name:'submitForm',formData:{title:'Office look',gender:'U',season:'A',style:'B'}});
    expect(service.updateAdminOutfit).toHaveBeenCalledWith('look1',
      jasmine.objectContaining({catalogReplacements:[{index:0,expectedId:'p1',catalogProductId:'p2'}]}));
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.outfitData()?.updatedAt).toBe(200);
    expect(component.catalogReplacements.length).toBe(0);
  });

  it('asks confirmation and only then calls paid regenerate endpoint', async () => {
    const confirm = spyOn(window,'confirm').and.returnValue(false);
    await component.regenerateImage();
    expect(service.regeneratePublishedOutfitImage).not.toHaveBeenCalled();
    confirm.and.returnValue(true);
    service.regeneratePublishedOutfitImage.and.resolveTo({
      ...makeOutfit(),imageUrl:'https://example.test/new.png',
      imageMayNotMatchProducts:false,imageRegenerationStatus:'completed',
    });
    await component.regenerateImage();
    expect(service.regeneratePublishedOutfitImage).toHaveBeenCalledOnceWith('look1');
    expect(component.imageUrl()).toBe('https://example.test/new.png');
    expect(component.outfitData()?.imageMayNotMatchProducts).toBeFalse();
  });

  it('retains the warning after generation failure', async () => {
    spyOn(window,'confirm').and.returnValue(true);
    service.regeneratePublishedOutfitImage.and.rejectWith({status:502});
    await component.regenerateImage();
    expect(component.outfitData()?.imageUrl).toBe('https://example.test/old.png');
    expect(component.canRegenerateImage()).toBeTrue();
    expect(component.regenerationError()).toContain('Rigenerazione non riuscita');
  });
});
