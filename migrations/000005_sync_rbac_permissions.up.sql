-- Sync permission seeds so resource/action pairs used by backend/frontend
-- are always present and consistent.
WITH required_permissions (name, display_name, description, resource, action) AS (
    VALUES
        -- Dashboard
        ('view_dashboard', 'View Dashboard', 'Allow access to dashboard page', 'dashboard', 'view'),

        -- Users
        ('list_users', 'List Users', 'Allow listing users', 'users', 'list'),
        ('view_users', 'View Users', 'Allow viewing user detail', 'users', 'view'),
        ('create_users', 'Create Users', 'Allow creating users', 'users', 'create'),
        ('update_users', 'Update Users', 'Allow updating users', 'users', 'update'),
        ('update_password_users', 'Update Password Users', 'Allow updating user password', 'users', 'update_password'),
        ('delete_users', 'Delete Users', 'Allow deleting users', 'users', 'delete'),

        -- Roles
        ('list_roles', 'List Roles', 'Allow listing roles', 'roles', 'list'),
        ('view_roles', 'View Roles', 'Allow viewing role detail', 'roles', 'view'),
        ('create_roles', 'Create Roles', 'Allow creating roles', 'roles', 'create'),
        ('update_roles', 'Update Roles', 'Allow updating roles', 'roles', 'update'),
        ('delete_roles', 'Delete Roles', 'Allow deleting roles', 'roles', 'delete'),
        ('assign_permissions', 'Assign Permissions', 'Allow assigning permissions to role', 'roles', 'assign_permissions'),
        ('assign_menus', 'Assign Menus', 'Allow assigning menus to role', 'roles', 'assign_menus'),

        -- Menus
        ('list_menus', 'List Menus', 'Allow listing menus', 'menus', 'list'),
        ('view_menu', 'View Menu', 'Allow viewing menu detail', 'menus', 'view'),
        ('create_menu', 'Create Menu', 'Allow creating menu', 'menus', 'create'),
        ('update_menu', 'Update Menu', 'Allow updating menu', 'menus', 'update'),
        ('delete_menu', 'Delete Menu', 'Allow deleting menu', 'menus', 'delete'),

        -- Permissions
        ('list_permissions', 'List Permissions', 'Allow listing permissions', 'permissions', 'list'),
        ('view_permissions', 'View Permissions', 'Allow viewing permission detail', 'permissions', 'view'),
        ('create_permissions', 'Create Permissions', 'Allow creating permissions', 'permissions', 'create'),
        ('update_permissions', 'Update Permissions', 'Allow updating permissions', 'permissions', 'update'),
        ('delete_permissions', 'Delete Permissions', 'Allow deleting permissions', 'permissions', 'delete'),

        -- Profile
        ('view_profile', 'View Profile', 'Allow viewing own profile', 'profile', 'view'),
        ('update_profile', 'Update Profile', 'Allow updating own profile', 'profile', 'update'),
        ('update_password_profile', 'Update Password Profile', 'Allow changing own password', 'profile', 'update_password'),
        ('delete_profile', 'Delete Profile', 'Allow deleting own profile', 'profile', 'delete')
)
INSERT INTO permissions (id, name, display_name, description, resource, action, created_at, updated_at)
SELECT gen_random_uuid(), rp.name, rp.display_name, rp.description, rp.resource, rp.action, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM required_permissions rp
ON CONFLICT (name) DO UPDATE
SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    updated_at = CURRENT_TIMESTAMP;

-- Admin and superadmin should always receive all current permissions.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.deleted_at IS NULL
WHERE r.name IN ('admin', 'superadmin')
ON CONFLICT DO NOTHING;

-- Staff baseline permissions.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'view_dashboard',
    'view_profile',
    'update_profile',
    'update_password_profile'
)
WHERE r.name = 'staff'
ON CONFLICT DO NOTHING;

-- Viewer baseline permissions.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'view_dashboard',
    'view_profile',
    'update_password_profile'
)
WHERE r.name = 'viewer'
ON CONFLICT DO NOTHING;
