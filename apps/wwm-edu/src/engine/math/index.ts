import type { Generator } from '../types';
import * as wholeNumbers from './whole-numbers';
import * as addSub from './add-sub';
import * as mulDiv from './mul-div';
import * as money from './money';

export const MATH_GENERATORS: Generator[] = [wholeNumbers, addSub, mulDiv, money];

export { wholeNumbers, addSub, mulDiv, money };
