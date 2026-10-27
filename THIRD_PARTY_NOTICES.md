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
