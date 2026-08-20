import type { LocalizationMap } from 'discord.js';
import { enUS, type MessageKey } from './en-US';
import { ptBR } from './pt-BR';

type Describable = {
  setDescription(description: string): unknown;
  setDescriptionLocalizations(localizations: LocalizationMap): unknown;
};

/** Discord falls back to the en-US text for every client that is not pt-BR. */
export function describe<T extends Describable>(builder: T, key: MessageKey) {
  builder.setDescription(enUS[key]);
  builder.setDescriptionLocalizations({ 'pt-BR': ptBR[key] });
  return builder;
}

export function localized(key: MessageKey): LocalizationMap {
  return { 'pt-BR': ptBR[key] };
}
