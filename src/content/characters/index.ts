/**
 * CHARACTER REGISTRY
 *
 * All characters must be imported and added here.
 * The menu and player initialization reference characters from this registry.
 *
 * To register a new character:
 *   1. Import it from its file
 *   2. Add it to the characterDefs array below
 */

import { CharacterDef } from '../../core/types';
import { Knight } from './knight';
import { Mage } from './mage';

export const characterDefs: CharacterDef[] = [Knight, Mage];

export function getCharacterDef(id: string): CharacterDef {
  const def = characterDefs.find(c => c.id === id);
  if (!def) throw new Error(`Unknown character: ${id}`);
  return def;
}

export function getUnlockedCharacters(): CharacterDef[] {
  return characterDefs.filter(c => c.unlocked);
}

export { Knight, Mage };
