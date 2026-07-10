import type { Generator } from '../types';
import * as wholeNumbers from './whole-numbers';
import * as addSub from './add-sub';
import * as mulDiv from './mul-div';
import * as money from './money';
import * as fractions from './fractions';
import * as decimals from './decimals';
import * as percentages from './percentages';
import * as time from './time';
import * as measurement from './measurement';
import * as shapes from './shapes';

export const MATH_GENERATORS: Generator[] = [
  // Term 1 (first half year)
  wholeNumbers,
  addSub,
  mulDiv,
  money,
  // Term 2 (second half year)
  fractions,
  decimals,
  percentages,
  time,
  measurement,
  shapes,
];

export { wholeNumbers, addSub, mulDiv, money, fractions, decimals, percentages, time, measurement, shapes };
