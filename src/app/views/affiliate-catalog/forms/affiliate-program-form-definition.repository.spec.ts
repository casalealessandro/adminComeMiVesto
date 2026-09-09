import { firstValueFrom } from 'rxjs';
import {
  AFFILIATE_PROGRAM_CREATE_FORM,
  AFFILIATE_PROGRAM_EDIT_FORM,
  AffiliateProgramFormDefinitionRepository,
} from './affiliate-program-form-definition.repository';

describe('AffiliateProgramFormDefinitionRepository', () => {
  const repository = new AffiliateProgramFormDefinitionRepository();

  it('defines create-only affiliate identity fields', async () => {
    const fields = await firstValueFrom(repository.getFormFields(AFFILIATE_PROGRAM_CREATE_FORM));
    const names = fields.map((field) => field.name);

    expect(names).toContain('network');
    expect(names).toContain('networkProgramId');
    expect(names).toContain('name');
    expect(names).toContain('enabled');
  });

  it('keeps immutable identity fields out of the edit definition', async () => {
    const fields = await firstValueFrom(repository.getFormFields(AFFILIATE_PROGRAM_EDIT_FORM));
    const names = fields.map((field) => field.name);

    expect(names).not.toContain('network');
    expect(names).not.toContain('networkProgramId');
    expect(names).toContain('name');
    expect(names).toContain('priceSegment');
  });

  it('preserves boolean values for the enabled select', async () => {
    const fields = await firstValueFrom(repository.getFormFields(AFFILIATE_PROGRAM_CREATE_FORM));
    const enabled = fields.find((field) => field.name === 'enabled');
    const values = enabled?.selectOptions?.options?.map((option) => option.value);

    expect(values).toEqual([true, false]);
  });
});
