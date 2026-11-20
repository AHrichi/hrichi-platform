import { SYSTEM_DESIGN_APP, SYSTEM_DESIGN_TITLE } from './app';

describe('system design app identity', () => {
  it('uses the portfolio key and a display name', () => {
    expect(SYSTEM_DESIGN_APP).toBe('system-design');
    expect(SYSTEM_DESIGN_TITLE).toBe('System Design');
  });
});
