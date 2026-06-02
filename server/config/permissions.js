// RBAC permission model — derived from PDF Table 3.1 (RBAC Role Hierarchy).
// Effective permissions = userType base + sub-role grants + explicit grants.

export const PERMISSIONS_BY_USERTYPE = {
  student: [
    'profile:manage',
    'internship:view',
    'internship:apply',
    'application:withdraw',
    'application:track',
    'assessment:request',
    'feedback:provide',
    'notification:receive',
  ],
  company: [
    'company:manage',
    'internship:post',
    'internship:edit',
    'internship:withdraw',
    'application:review',
    'application:decide',
    'application:shortlist',
    'supervisor:assign',
    'progress:track',
    'offer:send',
  ],
  university: [
    'student:verify',
    'company:invite',
    'placement:monitor',
    'progress:track',
    'report:generate',
  ],
  admin: [
    'user:manage',
    'entity:verify',
    'audit:view',
    'notification:oversee',
    'report:oversee',
    'report:generate',
  ],
};

// Sub-roles (PDF Table 3.1) layer extra permissions on top of the userType.
export const PERMISSIONS_BY_ROLE = {
  supervisor: ['task:assign', 'task:monitor', 'assessment:submit', 'feedback:provide', 'progress:track'],
  auditor: ['audit:view', 'report:generate'],
  recruiter: ['internship:post', 'internship:edit', 'application:review'],
};

// Compute the effective permission set for a user.
export function effectivePermissions(user) {
  const set = new Set(PERMISSIONS_BY_USERTYPE[user.userType] || []);
  for (const role of user.roles || []) {
    for (const perm of PERMISSIONS_BY_ROLE[role] || []) set.add(perm);
  }
  for (const perm of user.permissions || []) set.add(perm);
  return set;
}
