export type PermissionGrant = {
  id: string;
  name: string;
  display_name: string;
  resource: string;
  action: string;
};

export type PermissionAccess = {
  resource: string;
  action: string;
};
