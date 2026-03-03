import { Tables, InsertTables, UpdateTables } from './database.types';

export type Resource = Tables<'resources'>;
export type CreateResource = InsertTables<'resources'>;
export type UpdateResource = UpdateTables<'resources'>;

export type MediaType = 'image' | 'video' | 'file' | 'none';
