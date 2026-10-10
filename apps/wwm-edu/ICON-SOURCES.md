# WWM Edu icon design sources

Audit date: 2026-09-13

The v1.6.1 icon system uses locally bundled React SVG paths. Its 24×24 grid, rounded line caps,
consistent stroke weight, and `currentColor` behaviour were informed by the open-source Lucide
icon system: <https://lucide.dev/>.

Lucide is distributed under the ISC License, with some icons derived from Feather under the MIT
License. The complete notice is bundled in `LUCIDE-LICENSE.txt`; the current upstream text is at
<https://github.com/lucide-icons/lucide/blob/main/LICENSE>.

WWM Edu does not install or load the Lucide package. The local component adapts and combines
simple geometric forms for this app's subject, navigation, feedback, and achievement needs. It
adds a low-opacity secondary fill to the existing WWM Edu colour palette while keeping the source
small, scalable, themeable, and available offline.
