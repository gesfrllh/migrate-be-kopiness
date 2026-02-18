import { UserRole } from '@prisma/client'

export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT'
export type roastLevel = 'LIGHT' | 'MEDIUM' | 'DARK'
export type strengh = 'LIGHT' | 'NORMAL' | 'STRONG'
export type drinkTypes = 'BREW' | 'MILK'
export type drinkName = 'V60' |
  'KALITA' |
  'CLEVER' |
  'FRENCH_PRESS' |
  'AEROPRESS' |
  'ESPRESSO' |
  'LATTE' |
  'CAPPUCINO' |
  'MOCHA' |
  'FLAT_WHITE'
export type milkType = 'WHOLE' |
  'LOW_FAT' |
  'OAT' |
  'ALMOND' |
  'SOY'
export type syrupType = 'VANILLA' |
  'CARAMEL' |
  'HAZELNUT' |
  'CHOCOLATE'



export interface CoffeAssitantOptions {
  roastLevels: SelectOptions[]
  strengh: SelectOptions[]
  drinkType: SelectOptions[]
  drinkNames: SelectOptions[]
  milkTypes: SelectOptions[]
  syrupTypes: SelectOptions[]
}

export enum RoastLevel {
  LIGHT = 'LIGHT',
  MEDIUM = 'MEDIUM',
  DARK = 'DARK',
}

export enum Strength {
  LIGHT = 'LIGHT',
  NORMAL = 'NORMAL',
  STRONG = 'STRONG',
}

export enum DrinkType {
  BREW = 'BREW',
  MILK = 'MILK',
}

export enum DrinkName {
  V60 = 'V60',
  KALITA = 'KALITA',
  CLEVER = 'CLEVER',
  FRENCH_PRESS = 'FRENCH_PRESS',
  AEROPRESS = 'AEROPRESS',
  ESPRESSO = 'ESPRESSO',
  LATTE = 'LATTE',
  CAPPUCINO = 'CAPPUCINO',
  MOCHA = 'MOCHA',
  FLAT_WHITE = 'FLAT_WHITE',
}

export enum MilkType {
  WHOLE = 'WHOLE',
  LOW_FAT = 'LOW_FAT',
  OAT = 'OAT',
  ALMOND = 'ALMOND',
  SOY = 'SOY',
}

export enum SyrupType {
  VANILLA = 'VANILLA',
  CARAMEL = 'CARAMEL',
  HAZELNUT = 'HAZELNUT',
  CHOCOLATE = 'CHOCOLATE',
}

export interface SelectOptions {
  label: string;
  value: string;
}

export interface JwtPayload {
  sub: string
  email: string
  role: UserRole
}
