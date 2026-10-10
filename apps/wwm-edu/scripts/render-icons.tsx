import { writeFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Icon from '../src/components/Icon';
import { ICON_NAMES } from '../src/engine/types';

const columns = 6;
const tileWidth = 108;
const tileHeight = 96;
const rows = Math.ceil(ICON_NAMES.length / columns);
const icons = ICON_NAMES.map((name, index) => {
  const x = (index % columns) * tileWidth;
  const y = Math.floor(index / columns) * tileHeight;
  const shape = renderToStaticMarkup(<Icon name={name} />)
    .replace(/^<svg[^>]*>/, '')
    .replace('</svg>', '');
  return `<g data-name="${name}"><rect x="${x + 8}" y="${y + 8}" width="92" height="80" rx="22" fill="#fff" stroke="#e4def1" stroke-width="2"/><g transform="translate(${x + 22} ${y + 16}) scale(2.6667)" fill="none" stroke="#6754e8" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${shape}</g></g>`;
}).join('');

const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${columns * tileWidth}" height="${rows * tileHeight}" viewBox="0 0 ${columns * tileWidth} ${rows * tileHeight}"><rect width="100%" height="100%" fill="#fff8e9"/><style>.edu-icon__soft{fill:#6754e8;stroke:none;opacity:.14}.edu-icon__dot{fill:#6754e8;stroke:none}</style>${icons}</svg>`;
writeFileSync(process.argv[2] ?? '/tmp/wwm-edu-icon-sheet.svg', sheet);
