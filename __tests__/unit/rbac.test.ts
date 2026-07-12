describe('RBAC Access Control Rules', () => {
  const roles = {
    OWNER: ['read', 'write', 'admin', 'billing'],
    ADMIN: ['read', 'write', 'admin'],
    MEMBER: ['read', 'write'],
    VIEWER: ['read'],
  };

  it('allows read and write to OWNER, ADMIN, and MEMBER', () => {
    expect(roles.OWNER.includes('write')).toBe(true);
    expect(roles.ADMIN.includes('write')).toBe(true);
    expect(roles.MEMBER.includes('write')).toBe(true);
    expect(roles.VIEWER.includes('write')).toBe(false);
  });

  it('restricts admin access only to ADMIN and OWNER roles', () => {
    expect(roles.OWNER.includes('admin')).toBe(true);
    expect(roles.ADMIN.includes('admin')).toBe(true);
    expect(roles.MEMBER.includes('admin')).toBe(false);
  });
});
