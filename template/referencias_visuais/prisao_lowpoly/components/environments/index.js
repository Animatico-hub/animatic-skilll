import { createCell47 } from './PrisonCell.js';
import { createPrisonCorridor } from './PrisonCorridor.js';
import { createCafeteria } from './Cafeteria.js';
import { createSecurityOffice } from './SecurityOffice.js';
import { createShowerRoom } from './ShowerRoom.js';
import { createPrisonYard } from './PrisonYard.js';

/**
 * Environment registry used by viewers and scene definitions.
 * cast: default anchor per character for previews (scenes choose their own).
 */
export const ENVIRONMENTS = {
  cell47: {
    label: 'Cela 13',
    create: createCell47,
    cast: { protagonist: 'protagonist_center', cellmate: 'cellmate_confront', guard: 'guard_corridor', mysterious: 'neighbour_48' },
  },
  corridor: {
    label: 'Corredor',
    create: createPrisonCorridor,
    cast: { protagonist: 'protagonist_walk_start', cellmate: 'bars_46', guard: 'guard_escort', mysterious: 'bars_48' },
  },
  cafeteria: {
    label: 'Refeitório',
    create: createCafeteria,
    cast: { protagonist: 'protagonist_line', cellmate: 'cellmate_table_stand', guard: 'guard_watch', mysterious: 'mysterious_corner' },
  },
  security: {
    label: 'Segurança',
    create: createSecurityOffice,
    cast: { protagonist: 'protagonist_door', guard: 'guard_standing' },
  },
  showers: {
    label: 'Chuveiros',
    create: createShowerRoom,
    cast: { protagonist: 'protagonist_entrance', cellmate: 'sink_1', guard: 'guard_door', mysterious: 'stall_front' },
  },
  yard: {
    label: 'Pátio',
    create: createPrisonYard,
    cast: { protagonist: 'protagonist_exit', cellmate: 'cellmate_court', guard: 'guard_tower', mysterious: 'mysterious_wall' },
  },
};
