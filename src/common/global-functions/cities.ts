const mockCities = [
  'taubate',
  'campinas',
  'florianopolis',
  'santos',
  'guaruja',
  'bertioga',
  'guaratingueta',
  'pindamonhangaba',
  'mogi das cruzes',
  'mogi express',
  'sao jose dos campos',
  'sao jose - sc',
];

const locations = {
  campinas: {
    address: 'Tiradentes, 304 – Vila Itapura – Campinas/SP',
    phone: '+55 (19) 3307-8448',
  },
  florianopolis: {
    address: 'Av. Rio Branco, 213 A – Centro, Florianópolis – SC',
    phone: '+55 (48) 3024-5999',
  },
  'mogi express': {
    address: 'R. Dr. Ricardo Vilela, 321 – Centro, Mogi das Cruzes – SP',
    phone: '+55 (11) 2312-7774',
  },
  'mogi das cruzes': {
    address:
      'Praça Norival Gonçalves Tavares, 281 – Centro, Mogi das Cruzes – SP',
    phone: '+55 (11) 2378-3191',
  },
  'sao jose dos campos': {
    address:
      'Av. Adhemar de Barros, 1.103 – Vila Adyana – São José dos Campos/SP',
    phone: '+55 (12) 3207-0012',
  },
  taubate: {
    address: 'R. XV de Novembro, 885 – Centro, Taubaté – SP',
    phone: '+55 (12) 3413-1747',
  },
  'sao jose - sc': {
    address: 'R. Adhemar da Silva, 739 – Kobrasol, São José – SC',
    phone: '+55 (48) 3372-7881',
  },
  guaratingueta: {
    address: 'Rua Monsenhor Filippo, 246 – Centro',
    phone: '+55 (12) 2103-0533',
  },
  pindamonhangaba: {
    address: 'R. João Gama, 40 – São Benedito, Pindamonhangaba – SP',
    phone: '+55 (12) 3413-1747',
  },
  santos: {
    address: 'Rua Azevedo Sodré, 94, Boqueirão – Santos/SP',
    phone: '+55 (13) 99184-4536',
  },
  'praia grande': {
    address: 'Av. Brasil, 600, sala 1110, Boqueirão, Praia Grande – SP',
    phone: '+55 (13) 99184-4536',
  },
  guaruja: {
    address: 'Rua Oscar Sampaio, 65 – Vicente de Carvalho, Guarujá – SP',
    phone: '+55 (13) 99184-4536',
  },
  bertioga: {
    address: 'R. Rafael Costabile, 593 – Centervalle, Bertioga – SP',
    phone: '+55 (13) 99184-4536',
  },
};

export function getMockedCity() {
  return mockCities[Math.floor(Math.random() * mockCities.length)];
}

export function getLocationInfo(city) {
  return locations[city.toLowerCase()] || null;
}
