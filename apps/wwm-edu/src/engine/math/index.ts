import type { Generator } from '../types';
import { extensionQuestion } from './extensions';
import { knowledgeQuestion } from './knowledge';
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
import * as coordinatesRatio from './coordinates-ratio';
import * as data from './data';
import { visualMathQuestion } from './visual';

const BASE_GENERATORS: Generator[] = [
  // Numbers and operations
  wholeNumbers,
  addSub,
  mulDiv,
  money,
  // Further strands
  fractions,
  decimals,
  percentages,
  time,
  measurement,
  shapes,
  coordinatesRatio,
  data,
];

export { wholeNumbers, addSub, mulDiv, money, fractions, decimals, percentages, time, measurement, shapes };

export const MATH_GENERATORS: Generator[] = BASE_GENERATORS.map((generator) => ({
  meta: generator.meta,
  generate: (rng, difficulty) => {
    if (['data', 'time', 'measurement', 'shapes'].includes(generator.meta.id) && rng.chance(0.3)) {
      return visualMathQuestion(generator.meta.id as 'data' | 'time' | 'measurement' | 'shapes', rng, difficulty);
    }
    if (['money', 'shapes', 'measurement'].includes(generator.meta.id) && rng.chance(0.25)) {
      return knowledgeQuestion(generator.meta.id as 'money' | 'shapes' | 'measurement', rng, difficulty);
    }
    return !['coordinates-ratio', 'data'].includes(generator.meta.id) && rng.chance(0.35)
      ? extensionQuestion(generator.meta.id, rng, difficulty)
      : generator.generate(rng, difficulty);
  },
}));
