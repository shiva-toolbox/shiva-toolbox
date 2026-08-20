export const MODULE_IDS = [
  'autorole',
  'join',
  'leave',
  'youtube',
  'twitch',
  'reaction-roles',
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  shortName: string;
  description: string;
  category: 'moderation' | 'engagement' | 'alerts';
}

export const MODULES: Record<ModuleId, ModuleDefinition> = {
  autorole: {
    id: 'autorole',
    name: 'Auto Cargo',
    shortName: 'Cargos',
    description: 'Atribui cargos automaticamente quando um membro entra no servidor.',
    category: 'moderation',
  },
  join: {
    id: 'join',
    name: 'Join',
    shortName: 'Join',
    description: 'Envia um alerta configurável quando alguém entra no servidor.',
    category: 'engagement',
  },
  leave: {
    id: 'leave',
    name: 'Saída',
    shortName: 'Saída',
    description: 'Envia um alerta configurável quando alguém sai do servidor.',
    category: 'engagement',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube Live',
    shortName: 'YouTube',
    description: 'Avisa o servidor quando um canal do YouTube entra ao vivo.',
    category: 'alerts',
  },
  twitch: {
    id: 'twitch',
    name: 'Twitch Live',
    shortName: 'Twitch',
    description: 'Avisa o servidor quando um canal da Twitch entra ao vivo.',
    category: 'alerts',
  },
  'reaction-roles': {
    id: 'reaction-roles',
    name: 'Cargos por reação',
    shortName: 'Reações',
    description: 'Atribui cargos quando alguém reage a uma mensagem.',
    category: 'moderation',
  },
};

export const MODULE_LIST = MODULE_IDS.map((id) => MODULES[id]);
