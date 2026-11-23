import {
  checkAbsence,
  checkEmail,
  checkGreenhouse,
  checkPersonName,
  checkTarget,
  checkTeamName,
  checkWorker,
  nextBadgeCode,
  parseAmount,
} from './setup';

describe('parseAmount', () => {
  it('reads French and English decimals, and nothing as NaN', () => {
    expect(parseAmount('2,55')).toBe(2.55);
    expect(parseAmount(' 40 000 ')).toBe(40000);
    expect(parseAmount('')).toBeNaN();
    expect(parseAmount('abc')).toBeNaN();
  });
});

describe('nextBadgeCode', () => {
  it('follows the highest numbered badge', () => {
    expect(
      nextBadgeCode([
        { badgeCode: 'GH-0009' },
        { badgeCode: 'gh-0122' },
        { badgeCode: 'VISITOR' },
      ]),
    ).toBe('GH-0123');
  });

  it('starts at 0001 on an empty farm', () => {
    expect(nextBadgeCode([])).toBe('GH-0001');
  });
});

describe('checkGreenhouse', () => {
  const ok = { name: ' A5 ', area: '40 000', crop: 'tomato', kgPerCrate: '7' };

  it('cleans a valid greenhouse', () => {
    expect(checkGreenhouse(ok, ['A1'])).toEqual({
      ok: true,
      value: { name: 'A5', areaM2: 40000, crop: 'tomato', kgPerCrate: 7 },
    });
  });

  it('marks each wrong box', () => {
    expect(
      checkGreenhouse(
        { name: 'a1', area: '0', crop: 'banana', kgPerCrate: '' },
        ['A1'],
      ),
    ).toEqual({
      ok: false,
      errors: {
        name: 'taken',
        area: 'invalid',
        crop: 'required',
        kgPerCrate: 'required',
      },
    });
  });
});

describe('checkTeamName', () => {
  it('refuses an empty or taken name', () => {
    expect(checkTeamName('  ', [])).toEqual({
      ok: false,
      errors: { name: 'required' },
    });
    expect(checkTeamName('équipe a1', ['Équipe A1'])).toEqual({
      ok: false,
      errors: { name: 'taken' },
    });
    expect(checkTeamName(' Équipe  C ', [])).toEqual({
      ok: true,
      value: 'Équipe C',
    });
  });
});

describe('checkWorker', () => {
  it('normalizes the badge and reads the pay', () => {
    expect(
      checkWorker(
        {
          fullName: 'Amira  Gharbi',
          badgeCode: ' gh-0200 ',
          hourlyRate: '2,7',
        },
        ['GH-0001'],
      ),
    ).toEqual({
      ok: true,
      value: {
        fullName: 'Amira Gharbi',
        badgeCode: 'GH-0200',
        hourlyRate: 2.7,
      },
    });
  });

  it('leaves pay unset when empty, and refuses a taken badge', () => {
    const result = checkWorker(
      { fullName: 'Bilel', badgeCode: 'gh-0001', hourlyRate: '' },
      ['GH-0001'],
    );
    expect(result).toEqual({ ok: false, errors: { badgeCode: 'taken' } });
    expect(
      checkWorker({ fullName: 'Bilel', badgeCode: 'GH 9', hourlyRate: '' }, []),
    ).toEqual({
      ok: true,
      value: { fullName: 'Bilel', badgeCode: 'GH9', hourlyRate: null },
    });
  });

  it('refuses odd badge characters and negative pay', () => {
    expect(
      checkWorker({ fullName: 'X', badgeCode: 'GH/é', hourlyRate: '-1' }, []),
    ).toEqual({
      ok: false,
      errors: { badgeCode: 'invalid', hourlyRate: 'invalid' },
    });
  });
});

describe('checkAbsence', () => {
  it('makes a single day when only the first is given', () => {
    expect(
      checkAbsence({ workerId: 'w-1', from: '2026-11-27', to: '' }),
    ).toEqual({
      ok: true,
      value: { workerId: 'w-1', from: '2026-11-27', to: '2026-11-27' },
    });
  });

  it('refuses an end before the start', () => {
    expect(
      checkAbsence({ workerId: '', from: '2026-11-27', to: '2026-11-26' }),
    ).toEqual({ ok: false, errors: { workerId: 'required', to: 'order' } });
  });
});

describe('checkEmail', () => {
  it('lower-cases a plausible email and refuses the rest', () => {
    expect(checkEmail(' Lina@Farm.TN ')).toBe('lina@farm.tn');
    expect(checkEmail('lina@farm')).toBeNull();
  });
});

describe('checkTarget', () => {
  it('reads millimes and whole kg, French commas included', () => {
    expect(checkTarget({ costPerKg: '0,0754', kgPerWeek: '169 400' })).toEqual({
      ok: true,
      value: { costPerKgTarget: 0.075, kgTarget: 169400 },
    });
  });

  it('wants a cost above zero and kg at zero or more', () => {
    expect(checkTarget({ costPerKg: '0', kgPerWeek: '' })).toEqual({
      ok: false,
      errors: { costPerKg: 'invalid', kgPerWeek: 'required' },
    });
    expect(checkTarget({ costPerKg: '', kgPerWeek: '-5' })).toEqual({
      ok: false,
      errors: { costPerKg: 'required', kgPerWeek: 'invalid' },
    });
  });
});

describe('checkPersonName', () => {
  it('tidies spaces and wants 1 to 120 characters', () => {
    expect(checkPersonName('  Lina   Ben Salah ')).toEqual({
      ok: true,
      value: 'Lina Ben Salah',
    });
    expect(checkPersonName(' ')).toEqual({
      ok: false,
      errors: { name: 'required' },
    });
    expect(checkPersonName('x'.repeat(121))).toEqual({
      ok: false,
      errors: { name: 'invalid' },
    });
  });
});
