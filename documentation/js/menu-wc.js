'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">admin documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AnagraficaWrapperComponent.html" data-type="entity-link" >AnagraficaWrapperComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AppComponent.html" data-type="entity-link" >AppComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AppFormListComponent.html" data-type="entity-link" >AppFormListComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CaptionComponent.html" data-type="entity-link" >CaptionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ContainerComponent.html" data-type="entity-link" >ContainerComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CustomScrollbarComponent.html" data-type="entity-link" >CustomScrollbarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DashboardComponent.html" data-type="entity-link" >DashboardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DataGridComponent.html" data-type="entity-link" >DataGridComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DynamicFileBoxComponent.html" data-type="entity-link" >DynamicFileBoxComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DynamicFormComponent.html" data-type="entity-link" >DynamicFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DynamicSelectBoxComponent.html" data-type="entity-link" >DynamicSelectBoxComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ElementComponent.html" data-type="entity-link" >ElementComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FooterComponent.html" data-type="entity-link" >FooterComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FormBuilderComponent.html" data-type="entity-link" >FormBuilderComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FotoOutfitPage.html" data-type="entity-link" >FotoOutfitPage</a>
                            </li>
                            <li class="link">
                                <a href="components/HeaderComponent.html" data-type="entity-link" >HeaderComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MenuComponent.html" data-type="entity-link" >MenuComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NicaPopupContentComponent.html" data-type="entity-link" >NicaPopupContentComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/OutfitCategoryComponent.html" data-type="entity-link" >OutfitCategoryComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/OutfitFormComponent.html" data-type="entity-link" >OutfitFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/OutfitProductsComponent.html" data-type="entity-link" >OutfitProductsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/OutfitsComponent.html" data-type="entity-link" >OutfitsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/OverlayComponent.html" data-type="entity-link" >OverlayComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PopupWrapperComponent.html" data-type="entity-link" >PopupWrapperComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProductFromFeedComponent.html" data-type="entity-link" >ProductFromFeedComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/StaticMenuComponent.html" data-type="entity-link" >StaticMenuComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/StaticMenuFunctionsComponent.html" data-type="entity-link" >StaticMenuFunctionsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TdItemComponent.html" data-type="entity-link" >TdItemComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ToolbarComponent.html" data-type="entity-link" >ToolbarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/UsersComponent.html" data-type="entity-link" >UsersComponent</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/_tasto.html" data-type="entity-link" >_tasto</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AnagraficaService.html" data-type="entity-link" >AnagraficaService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FormService.html" data-type="entity-link" >FormService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OutfitsService.html" data-type="entity-link" >OutfitsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OverlayService.html" data-type="entity-link" >OverlayService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PopUpService.html" data-type="entity-link" >PopUpService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProdottiOnlineService.html" data-type="entity-link" >ProdottiOnlineService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserService.html" data-type="entity-link" >UserService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/button.html" data-type="entity-link" >button</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CheckBoxOptions.html" data-type="entity-link" >CheckBoxOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CheckBoxOptions-1.html" data-type="entity-link" >CheckBoxOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ColData.html" data-type="entity-link" >ColData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Colonne.html" data-type="entity-link" >Colonne</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/costantValue.html" data-type="entity-link" >costantValue</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/detailOptions.html" data-type="entity-link" >detailOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DynamicFormField.html" data-type="entity-link" >DynamicFormField</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DynamicFormField-1.html" data-type="entity-link" >DynamicFormField</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DynamicOptions.html" data-type="entity-link" >DynamicOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileBoxOptions.html" data-type="entity-link" >FileBoxOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FireBaseConditions.html" data-type="entity-link" >FireBaseConditions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FireBaseOrderBy.html" data-type="entity-link" >FireBaseOrderBy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/infoPopUp.html" data-type="entity-link" >infoPopUp</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Option.html" data-type="entity-link" >Option</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Option-1.html" data-type="entity-link" >Option</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/outfit.html" data-type="entity-link" >outfit</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/outfitCategories.html" data-type="entity-link" >outfitCategories</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SelectOptions.html" data-type="entity-link" >SelectOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SelectOptions-1.html" data-type="entity-link" >SelectOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Tag.html" data-type="entity-link" >Tag</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/tagStyle.html" data-type="entity-link" >tagStyle</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/tasto.html" data-type="entity-link" >tasto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ToolbarButton.html" data-type="entity-link" >ToolbarButton</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserProfile.html" data-type="entity-link" >UserProfile</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Utente.html" data-type="entity-link" >Utente</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ValidationRule.html" data-type="entity-link" >ValidationRule</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/wardrobesItem.html" data-type="entity-link" >wardrobesItem</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});