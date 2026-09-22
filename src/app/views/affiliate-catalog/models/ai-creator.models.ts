export type AiCreatorGender = 'U' | 'D';
export type AiCreatorStyle = 'C' | 'B' | 'SP' | 'SC' | 'E' | 'AT' | 'FES' | 'CL' | 'TR' | 'SE';

export interface AiCreator {
  uid: string;
  email: string;
  displayName: string;
  nome: string;
  cognome: string;
  bio: string;
  photoURL: string;
  gender: AiCreatorGender;
  styleAffinity: AiCreatorStyle[];
  personaPrompt: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AiCreatorCreateInput {
  email: string;
  displayName: string;
  nome: string;
  cognome: string;
  bio: string;
  photoURL?: string;
  gender: AiCreatorGender;
  styleAffinity: AiCreatorStyle[];
  personaPrompt: string;
  active: boolean;
}

export type AiCreatorUpdateInput = Partial<Omit<AiCreatorCreateInput, 'email'>>;
