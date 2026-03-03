import { Tables, InsertTables, UpdateTables } from './database.types';

export type Broadcast = Tables<'broadcasts'>;
export type CreateBroadcast = InsertTables<'broadcasts'>;
export type UpdateBroadcast = UpdateTables<'broadcasts'>;

export type BroadcastStatus = 'pending' | 'sending' | 'completed' | 'failed';
