import { compareShared, describeBuild, formatVital } from './inspector-data';

describe('compareShared', () => {
  const shell = {
    name: 'shell',
    shared: [
      { packageName: '@angular/core', version: '22.2.3' },
      { packageName: 'rxjs', version: '7.8.2' },
      { packageName: 'three', version: '0.186.1' },
    ],
  };

  it('lines packages up per remote and flags versions that differ', () => {
    const rows = compareShared(shell, [
      {
        name: 'lab-a',
        shared: [
          { packageName: '@angular/core', version: '22.2.3' },
          { packageName: 'rxjs', version: '7.8.1' },
        ],
      },
      { name: 'lab-b', shared: [{ packageName: 'three', version: '0.186.1' }] },
    ]);

    expect(rows).toEqual([
      {
        packageName: '@angular/core',
        shell: '22.2.3',
        versions: { 'lab-a': '22.2.3', 'lab-b': null },
        skew: false,
      },
      {
        packageName: 'rxjs',
        shell: '7.8.2',
        versions: { 'lab-a': '7.8.1', 'lab-b': null },
        skew: true,
      },
      {
        packageName: 'three',
        shell: '0.186.1',
        versions: { 'lab-a': null, 'lab-b': '0.186.1' },
        skew: false,
      },
    ]);
  });

  it('lists packages only a remote shares, without calling them skew', () => {
    const [row] = compareShared({ name: 'shell', shared: [] }, [
      {
        name: 'lab-a',
        shared: [{ packageName: 'satellite.js', version: '7.1.0' }],
      },
    ]);

    expect(row).toMatchObject({ shell: null, skew: false });
  });
});

describe('formatting', () => {
  it('shortens the SHA and shows when the build ran', () => {
    expect(
      describeBuild({
        app: 'shell',
        sha: 'a4edb97c0ffee',
        builtAt: '2026-10-27T09:12:00Z',
      }),
    ).toMatch(/^a4edb97 · 27 Oct/);
  });

  it('shows CLS without a unit and timings in milliseconds', () => {
    expect(formatVital({ name: 'CLS', value: 0.0123, rating: 'good' })).toBe(
      '0.012',
    );
    expect(formatVital({ name: 'LCP', value: 812.4, rating: 'good' })).toBe(
      '812 ms',
    );
  });
});
