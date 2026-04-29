import { invoke } from '@tauri-apps/api/core'
import { defaultDataset } from './namingEngine'
import type { NameDataset } from '../types'

export async function loadDataset(): Promise<NameDataset> {
  if (!isTauriRuntime()) return defaultDataset

  try {
    return await invoke<NameDataset>('load_name_dataset')
  } catch (error) {
    console.warn('Tauri SQLite dataset load failed. Falling back to bundled seed.', error)
    return defaultDataset
  }
}

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}
