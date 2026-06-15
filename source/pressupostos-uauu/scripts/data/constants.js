export const MONTHS_CA = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];
export const DAYS_CA = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];
export const DAYS_SHORT = ['Dg', 'Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds'];

export const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQJRPzbjDctU5oo8z1Q-ssJvgMiiCcFFICdBvlti5pYhUJW38GqDnNTMuzZMsN7pInxal1kBhNcLh3/pub?output=xlsx';

export const VENUES = [
  { id: 'mas-vivencs', name: 'Mas Vivencs', logo: 'assets/logo-mas-vivencs.png', type: 'Mas Rural' },
  { id: 'castell-de-tous', name: 'Castell de Tous', logo: 'assets/logo-castell-de-tous.png', type: 'Castell Històric' },
  { id: 'can-macia', name: 'Can Macià', logo: 'assets/logo-can-macia.png', type: 'Masia Rural' },
  { id: 'ca-nalzina', name: "Ca n'Alzina", logo: 'assets/logo-ca-nalzina.png', type: 'Masia Rural' },
];

export const SPREADSHEET_COLUMNS = {
  name: ['nom servei', 'servei', 'nom'],
  nameCa: ['nom servei', 'nomca', 'nom cat', 'nomcatala', 'nom català', 'nom catala'],
  nameEs: ['nomcast', 'nom cast', 'nom castellà', 'nom castella', 'nomcastellano', 'nom castella'],
  nameEn: ['nomeng', 'nom eng', 'nom anglès', 'nom angles', 'nom angles', 'name'],
  venue: ['masia', 'finca', 'venue'],
  year: ['any', 'curs'],
  price: ['PREU/P'],
  unit: ['estil d\'unitat', 'unitat', 'unit style'],
  quantity: ['quantityBased'],
  optional: ['si es opcional', 'opcional', 'optional'],
  extraType: ['extres', 'extra type', 'tipus extres', 'tipus'],
  dropdown: ['desplegable', 'opcions desplegable', 'opciones desplegable'],
  extrasList: ['extresllista', 'extres llista', 'extraslist', 'extra list'],
  thresholdMain: ['llinda principal', 'llinda inici', 'llinda principi', 'llindar principal', 'umbral principal', 'llinda primer', 'llinda primera'],
  thresholdFinal: ['llinda final', 'llindar final', 'umbral final', 'llinda maxim', 'llinda màxim', 'llinda max', 'llinda màx'],
  thresholdPriceBelow: ['llinda preu x<0', 'llinda preu x < 0', 'preu llinda inferior', 'precio llinda inferior'],
  thresholdPriceAbove: ['llinda preu x>0', 'llinda preu x > 0', 'preu llinda superior', 'precio llinda superior', 'preu llinda max', 'preu llinda maxim', 'preu llinda màxim'],
  extraUnitValue: ['extraunitat'],
  extraExtresKind: ['extraextres', 'extra extres'],
  extraSwitch: ['extraswitch', 'extra switch', 'extralista switch', 'extraextresswitch', 'exrta switch'],
  menuMinGuests: ['MÍN'],
  menuPricePerPerson: ['PREU/P'],
  menuPenaltyPerPerson: ['PreuComp'],
  menuDays: ['Dia'],
  menuMonths: ['Mes'],
  menuExceptions: ['excepte', 'exceptions', 'excepcions'],
};
