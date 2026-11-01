# Third-party notices

Data and code from other projects that this repository redistributes outside of its npm dependencies (whose licences ship with each build in `3rdpartylicenses.txt`).

## d3-celestial data

The Sky lab's star catalogue, constellation figures and names (`libs/three/scenes/sky/src/generated`, `libs/labs/sky/domain/src/generated`) are derived by `tools/scripts/sky-catalog.mjs` from [d3-celestial](https://github.com/ofrohn/d3-celestial) at commit `7e720a3`. Its stars come from XHIP, "An Extended Hipparcos Compilation" (Anderson & Francis, 2012).

```text
Copyright (c) 2015, Olaf Frohn
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

## Meteor showers

`libs/labs/sky/domain/src/lib/meteor-showers.json` lists dates, radiants and rates from the [International Meteor Organization's meteor shower calendar](https://www.imo.net/resources/calendar/).

## Natural Earth

The globe's coastlines are Natural Earth's land outlines (public domain), via the `world-atlas` package.

## LuxPath material photos

The Materials screen's photos (`libs/products/lighting/feature/src/lib/diagrams/material-art/material-photos.generated.ts`) are fetched from the Wikimedia Commons API by `tools/scripts/material-photos.mjs`, scaled to fit 320 × 240 px by Commons, and shown with their credit and licence:

- [20160207 xl P1020443-LED-Strassenlampen Landhausstrasse Strausberg Vorstadt](https://commons.wikimedia.org/wiki/File:20160207_xl_P1020443-LED-Strassenlampen_Landhausstrasse_Strausberg_Vorstadt.JPG) by Molgreen, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- [20160206 xl P1020432-LED-Strassenlampen Gustav-Kurtze-Wohnpark Strausberg Vorstadt](https://commons.wikimedia.org/wiki/File:20160206_xl_P1020432-LED-Strassenlampen_Gustav-Kurtze-Wohnpark_Strausberg_Vorstadt.JPG) by Molgreen, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- [Solar power for streetlights along part of Paradise Trail (3937798321)](<https://commons.wikimedia.org/wiki/File:Solar_power_for_streetlights_along_part_of_Paradise_Trail_(3937798321).jpg>) by Robert Ashworth from Bellingham, WA., USA, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0)
- [Brooklands Road, Hall Green - new lamppost installation - new lamp (7949223938)](<https://commons.wikimedia.org/wiki/File:Brooklands_Road,_Hall_Green_-_new_lamppost_installation_-_new_lamp_(7949223938).jpg>) by Elliott Brown from Birmingham, United Kingdom, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0)
- [BP Solar 12V solar panel](https://commons.wikimedia.org/wiki/File:BP_Solar_12V_solar_panel.jpg) by JayCubby, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0)
- [12V 200Ah lithium iron phosphate battery](https://commons.wikimedia.org/wiki/File:12V_200Ah_lithium_iron_phosphate_battery.jpg) by HasanAbuarja, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- [AnchorBolt Moku 01](https://commons.wikimedia.org/wiki/File:AnchorBolt_Moku_01.jpg) by ほーるだうん, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)
- [3.core.cable](https://commons.wikimedia.org/wiki/File:3.core.cable.JPG) by Hafiz n, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0)
