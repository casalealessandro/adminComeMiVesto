import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { DynamicFormComponent } from '../../../../core/forms/dynamic-form/dynamic-form.component';
import { FORM_DEFINITION_REPOSITORY } from '../../../../core/forms/contracts/form-definition-repository';
import { AffiliateCatalogService, AffiliateMappingRule } from '../../services/affiliate-catalog.service';
import { AffiliateMappingRuleFormRepository, mappingRuleFormId } from './affiliate-mapping-rule-form.repository';
import { mappingRuleFormData, mappingRuleFromForm } from './affiliate-mapping-rules.component';

export interface AffiliateMappingRuleFormContext {
  mode: 'create' | 'edit';
  rule: AffiliateMappingRule;
}

export interface AffiliateMappingRuleFormResult {
  name: 'saved' | 'cancelled';
  rule?: AffiliateMappingRule;
}

@Component({
  selector: 'app-affiliate-mapping-rule-form-host',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent],
  providers: [{ provide: FORM_DEFINITION_REPOSITORY, useClass: AffiliateMappingRuleFormRepository }],
  templateUrl: './affiliate-mapping-rule-form-host.component.html',
})
export class AffiliateMappingRuleFormHostComponent {
  private readonly api = inject(AffiliateCatalogService);

  itemData!: AffiliateMappingRuleFormContext;
  @Output() result = new EventEmitter<AffiliateMappingRuleFormResult>();

  saving = false;
  error = '';

  get formId(): string {
    return mappingRuleFormId(this.itemData.rule.type, this.itemData.mode === 'edit');
  }

  formData: Record<string, unknown> = {};

  ngOnInit(): void {
    this.formData = mappingRuleFormData(this.itemData.rule);
  }

  handleForm(event: { name: string; formData?: Record<string, unknown> }): void {
    if (event.name === 'cancelForm') {
      if (!this.saving) this.result.emit({ name: 'cancelled' });
      return;
    }
    if (event.name !== 'submitForm' || !event.formData || this.saving) return;

    let rule: AffiliateMappingRule;
    try {
      rule = mappingRuleFromForm(this.itemData.rule, event.formData, this.itemData.mode === 'edit');
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Regola non valida.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.api.saveMappingRule(rule).pipe(finalize(() => this.saving = false)).subscribe({
      next: saved => this.result.emit({ name: 'saved', rule: saved }),
      error: () => this.error = 'Salvataggio non riuscito. Verifica i campi e riprova.',
    });
  }
}
