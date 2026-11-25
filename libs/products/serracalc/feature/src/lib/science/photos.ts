import type { InstrumentId, PhenomenonId } from '@ah/products/serracalc/domain';

/**
 * A real-life photo for a Science topic or an instrument, from Wikimedia
 * Commons under a free licence, credited where it is shown. The files are in
 * the app's public/science folder (credits also in CREDITS.md there),
 * resized to 640 px (topics) or 400 px (instruments).
 */
export interface SciencePhoto {
  /** Path under the app's public folder. */
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly author: string;
  readonly license: string;
  readonly licenseUrl: string | null;
  /** The file's page on Wikimedia Commons. */
  readonly page: string;
}

export const TOPIC_PHOTOS: Partial<Record<PhenomenonId, SciencePhoto>> = {
  airLeakage: {
    src: 'science/topic-airLeakage.jpg',
    width: 640,
    height: 430,
    author: 'Nigel Chadwick',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Inside_a_polytunnel_-_geograph.org.uk_-_1614227.jpg',
  },
  cogeneration: {
    src: 'science/topic-cogeneration.jpg',
    width: 640,
    height: 480,
    author: 'ChNPP',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    page: 'https://commons.wikimedia.org/wiki/File:BHKW_Bad_Steben_2010-1.JPG',
  },
  coolingEnergy: {
    src: 'science/topic-coolingEnergy.jpg',
    width: 640,
    height: 683,
    author: 'Dwight Sipler',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Greenhouse_Vent_Fan_(2737319720).jpg',
  },
  cropCalendar: {
    src: 'science/topic-cropCalendar.jpg',
    width: 640,
    height: 1085,
    author: 'Mothusi Sekhomba',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Tomato_seedlings_bed.jpg',
  },
  desalination: {
    src: 'science/topic-desalination.jpg',
    width: 640,
    height: 853,
    author: 'James Grellier',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    page: 'https://commons.wikimedia.org/wiki/File:Reverse_osmosis_desalination_plant.JPG',
  },
  dewPoint: {
    src: 'science/topic-dewPoint.jpg',
    width: 640,
    height: 853,
    author: 'Dreamora96x',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Condensation_droplets_on_glass_surface.jpg',
  },
  fertigation: {
    src: 'science/topic-fertigation.jpg',
    width: 640,
    height: 427,
    author: 'Alan.ca',
    license: 'Public domain',
    licenseUrl: null,
    page: 'https://commons.wikimedia.org/wiki/File:Drip_emitter.jpg',
  },
  geometry: {
    src: 'science/topic-geometry.jpg',
    width: 640,
    height: 393,
    author: 'Dave Bushell',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Tomato_Growing_at_Offenham_Cross_-_geograph.org.uk_-_55673.jpg',
  },
  heatLoss: {
    src: 'science/topic-heatLoss.jpg',
    width: 640,
    height: 480,
    author: 'Blumenfischer',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'http://creativecommons.org/licenses/by-sa/3.0/',
    page: 'https://commons.wikimedia.org/wiki/File:Doppellagiger_Energieschirm_2005-12-17.JPG',
  },
  rainHarvest: {
    src: 'science/topic-rainHarvest.jpg',
    width: 640,
    height: 558,
    author: 'بدارين',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Rainwater_tanks_IMG_3554.jpg',
  },
  siteScale: {
    src: 'science/topic-siteScale.jpg',
    width: 640,
    height: 422,
    author: 'NASA',
    license: 'Public domain',
    licenseUrl: null,
    page: 'https://commons.wikimedia.org/wiki/File:NASA_photo_of_plasticulture,_Campo_de_Dal%C3%ADas,_Spain.jpg',
  },
  transpiration: {
    src: 'science/topic-transpiration.jpg',
    width: 640,
    height: 480,
    author: 'ChrisInMilton',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Solanum_lycopersicum_leaf_epidermis_and_stomata_100x.jpg',
  },
  ventilation: {
    src: 'science/topic-ventilation.jpg',
    width: 640,
    height: 843,
    author: 'Dave Croker',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Glasshouse_roof_vents_-_geograph.org.uk_-_8132545.jpg',
  },
};

export const INSTRUMENT_PHOTOS: Partial<Record<InstrumentId, SciencePhoto>> = {
  anemometer: {
    src: 'science/instrument-anemometer.jpg',
    width: 400,
    height: 444,
    author: 'Stefan Kühn',
    license: 'CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0',
    page: 'https://commons.wikimedia.org/wiki/File:Anemometer.jpg',
  },
  co2Sensor: {
    src: 'science/instrument-co2Sensor.jpg',
    width: 400,
    height: 560,
    author: 'DaxBichler',
    license: 'CC0',
    licenseUrl: 'http://creativecommons.org/publicdomain/zero/1.0/deed.en',
    page: 'https://commons.wikimedia.org/wiki/File:Infrared_carbon_dioxide_sensor_module_MH-Z14A.jpg',
  },
  ecMeter: {
    src: 'science/instrument-ecMeter.jpg',
    width: 400,
    height: 300,
    author: 'Nuno Nogueira (Nmnogueira)',
    license: 'CC BY-SA 2.5',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.5',
    page: 'https://commons.wikimedia.org/wiki/File:Electrical_conductivity_meter.jpg',
  },
  flowMeter: {
    src: 'science/instrument-flowMeter.jpg',
    width: 400,
    height: 531,
    author: 'Nizil Shah',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Water_meters_in_india.jpg',
  },
  hygrometer: {
    src: 'science/instrument-hygrometer.jpg',
    width: 400,
    height: 302,
    author: 'CambridgeBayWeather',
    license: 'Public domain',
    licenseUrl: null,
    page: 'https://commons.wikimedia.org/wiki/File:Sling_psychrometer.JPG',
  },
  infrared: {
    src: 'science/instrument-infrared.jpg',
    width: 400,
    height: 534,
    author: 'Jobsarayutw',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    page: 'https://commons.wikimedia.org/wiki/File:An_infrared_thermometer.JPG',
  },
  meters: {
    src: 'science/instrument-meters.jpg',
    width: 400,
    height: 534,
    author: 'GautamSudhanshu',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Electricity_meter_in_India.jpg',
  },
  pressureGauge: {
    src: 'science/instrument-pressureGauge.jpg',
    width: 400,
    height: 534,
    author: 'In Transit',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Pressure_Gauge.jpg',
  },
  pyranometer: {
    src: 'science/instrument-pyranometer.jpg',
    width: 400,
    height: 398,
    author: 'Arthurcala',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    page: 'https://commons.wikimedia.org/wiki/File:Thermopile_pyranometer_as_part_of_MeteoStation.jpg',
  },
  tape: {
    src: 'science/instrument-tape.jpg',
    width: 400,
    height: 270,
    author: 'Krzysztof Maria Różański',
    license: 'CC BY 2.5',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.5',
    page: 'https://commons.wikimedia.org/wiki/File:Handheld_laser_distance_meter.jpg',
  },
  thermometer: {
    src: 'science/instrument-thermometer.jpg',
    width: 324,
    height: 1024,
    author: 'Kursant504',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    page: 'https://commons.wikimedia.org/wiki/File:PsiChroAssm2.jpg',
  },
  weatherStation: {
    src: 'science/instrument-weatherStation.jpg',
    width: 400,
    height: 534,
    author: 'Delince',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    page: 'https://commons.wikimedia.org/wiki/File:AWS(Automatic_Weather_station).JPG',
  },
};

/**
 * The photo's address, next to this bundle: inside the portfolio SerraCalc
 * is served from its own origin, so a path relative to the page would miss.
 */
export function photoUrl(photo: SciencePhoto): string {
  return new URL(photo.src, import.meta.url).href;
}
