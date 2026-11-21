import { Hall } from '../types';

export const CANONICAL_HALLS: Array<Pick<Hall, 'id' | 'code' | 'name' | 'capacity' | 'baseRent' | 'locationFloor' | 'status'>> = [
  {
    id: '1',
    code: 'HL-01',
    name: 'Grand Crystal Ballroom',
    capacity: 600,
    baseRent: 350000,
    locationFloor: 'Ground Floor',
    status: 'Active',
  },
  {
    id: '2',
    code: 'HL-02',
    name: 'Royal Emerald Hall',
    capacity: 450,
    baseRent: 250000,
    locationFloor: '1st Floor',
    status: 'Active',
  },
  {
    id: '3',
    code: 'HL-03',
    name: 'Sapphire Banquet',
    capacity: 300,
    baseRent: 180000,
    locationFloor: '2nd Floor',
    status: 'Active',
  },
  {
    id: '4',
    code: 'HL-04',
    name: 'Imperial Courtyard Lawn',
    capacity: 800,
    baseRent: 450000,
    locationFloor: 'Outdoor Courtyard',
    status: 'Active',
  },
];

