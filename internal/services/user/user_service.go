package serviceuser

import (
	domainauth "anniversary-site/internal/domain/auth"
	domaintenant "anniversary-site/internal/domain/tenant"
	domainuser "anniversary-site/internal/domain/user"
	"anniversary-site/internal/dto"
	interfaceauth "anniversary-site/internal/interfaces/auth"
	interfacepermission "anniversary-site/internal/interfaces/permission"
	interfacerole "anniversary-site/internal/interfaces/role"
	interfacetenant "anniversary-site/internal/interfaces/tenant"
	interfaceuser "anniversary-site/internal/interfaces/user"
	"anniversary-site/pkg/filter"
	"anniversary-site/utils"
	"errors"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type ServiceUser struct {
	UserRepo       interfaceuser.RepoUserInterface
	BlacklistRepo  interfaceauth.RepoAuthInterface
	RoleRepo       interfacerole.RepoRoleInterface
	PermissionRepo interfacepermission.RepoPermissionInterface
	TenantRepo     interfacetenant.RepoTenantInterface
}

func NewUserService(
	userRepo interfaceuser.RepoUserInterface,
	blacklistRepo interfaceauth.RepoAuthInterface,
	roleRepo interfacerole.RepoRoleInterface,
	permissionRepo interfacepermission.RepoPermissionInterface,
	tenantRepo interfacetenant.RepoTenantInterface,
) *ServiceUser {
	return &ServiceUser{
		UserRepo:       userRepo,
		BlacklistRepo:  blacklistRepo,
		RoleRepo:       roleRepo,
		PermissionRepo: permissionRepo,
		TenantRepo:     tenantRepo,
	}
}

func (s *ServiceUser) RegisterUser(req dto.UserRegister) (domainuser.Users, error) {
	phone := utils.NormalizePhoneTo62(req.Phone)
	email := utils.SanitizeEmail(req.Email)

	data, _ := s.UserRepo.GetByEmail(email)
	if data.Id != "" {
		return domainuser.Users{}, errors.New("email already exists")
	}

	phoneData, _ := s.UserRepo.GetByPhone(phone)
	if phoneData.Id != "" {
		return domainuser.Users{}, errors.New("phone number already exists")
	}

	if err := ValidatePasswordStrength(req.Password); err != nil {
		return domainuser.Users{}, err
	}

	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return domainuser.Users{}, err
	}

	// Public registration defaults to tenant owner.
	roleName := utils.RoleTenantOwner
	roleId, ok := findRoleIDByName(s.RoleRepo, roleName)
	if !ok {
		return domainuser.Users{}, errors.New("role tenant_owner is not configured")
	}

	data = domainuser.Users{
		Id:        utils.CreateUUID(),
		Name:      utils.TitleCase(req.Name),
		Phone:     phone,
		Email:     email,
		Password:  string(hashedPwd),
		Role:      roleName,
		RoleId:    roleId,
		CreatedAt: time.Now(),
	}

	if err = s.UserRepo.Store(data); err != nil {
		return domainuser.Users{}, err
	}

	if s.TenantRepo != nil {
		tenantSlug := sanitizeTenantSlug(req.TenantSlug)
		if tenantSlug == "" {
			return domainuser.Users{}, errors.New("invalid tenant slug")
		}

		if _, err := s.TenantRepo.GetBySlug(tenantSlug); err == nil {
			return domainuser.Users{}, errors.New("tenant slug already exists")
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return domainuser.Users{}, err
		}

		now := time.Now()
		tenant := domaintenant.Tenant{
			ID:        utils.CreateUUID(),
			Slug:      tenantSlug,
			Name:      data.Name,
			Status:    "active",
			CreatedAt: now,
			UpdatedAt: &now,
		}
		if err := s.TenantRepo.Store(tenant); err != nil {
			return domainuser.Users{}, err
		}

		member := domaintenant.TenantMember{
			ID:         utils.CreateUUID(),
			TenantID:   tenant.ID,
			UserID:     data.Id,
			MemberType: "owner",
			CreatedAt:  now,
			UpdatedAt:  &now,
		}
		if err := s.TenantRepo.AddOrUpdateMember(member); err != nil {
			return domainuser.Users{}, err
		}
	}

	return data, nil
}

func (s *ServiceUser) AdminCreateUser(req dto.AdminCreateUser, creatorRole string) (domainuser.Users, error) {
	phone := utils.NormalizePhoneTo62(req.Phone)
	email := utils.SanitizeEmail(req.Email)

	data, _ := s.UserRepo.GetByEmail(email)
	if data.Id != "" {
		return domainuser.Users{}, errors.New("email already exists")
	}

	if phone != "" {
		phoneData, _ := s.UserRepo.GetByPhone(phone)
		if phoneData.Id != "" {
			return domainuser.Users{}, errors.New("phone number already exists")
		}
	}

	if err := ValidatePasswordStrength(req.Password); err != nil {
		return domainuser.Users{}, err
	}

	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return domainuser.Users{}, err
	}

	roleName := strings.ToLower(strings.TrimSpace(req.Role))

	// SECURITY: Validate role assignment based on creator's role
	// Only superadmin can create superadmin users
	if roleName == utils.RoleSuperAdmin && creatorRole != utils.RoleSuperAdmin {
		return domainuser.Users{}, errors.New("only superadmin can create superadmin users")
	}

	roleId, ok := findRoleIDByName(s.RoleRepo, roleName)
	if !ok {
		return domainuser.Users{}, errors.New("invalid role: " + roleName)
	}

	data = domainuser.Users{
		Id:        utils.CreateUUID(),
		Name:      utils.TitleCase(req.Name),
		Phone:     phone,
		Email:     email,
		Password:  string(hashedPwd),
		Role:      roleName,
		RoleId:    roleId,
		CreatedAt: time.Now(),
	}

	if err = s.UserRepo.Store(data); err != nil {
		return domainuser.Users{}, err
	}

	return data, nil
}

func (s *ServiceUser) LoginUser(req dto.Login, logId string) (string, error) {
	data, err := s.UserRepo.GetByEmail(utils.SanitizeEmail(req.Email))
	if err != nil {
		return "", err
	}

	if err = bcrypt.CompareHashAndPassword([]byte(data.Password), []byte(req.Password)); err != nil {
		return "", err
	}

	token, err := utils.GenerateJwt(&data, logId)
	if err != nil {
		return "", err
	}

	return token, nil
}

func (s *ServiceUser) LogoutUser(token string) error {
	blacklist := domainauth.Blacklist{
		ID:        utils.CreateUUID(),
		Token:     token,
		CreatedAt: time.Now(),
	}

	err := s.BlacklistRepo.Store(blacklist)
	if err != nil {
		return err
	}

	return nil
}

func (s *ServiceUser) GetUserById(id string) (domainuser.Users, error) {
	return s.UserRepo.GetByID(id)
}

func (s *ServiceUser) GetUserByEmail(email string) (domainuser.Users, error) {
	return s.UserRepo.GetByEmail(email)
}

func (s *ServiceUser) GetUserByAuth(id string) (map[string]interface{}, error) {
	user, err := s.UserRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	role, err := s.RoleRepo.GetByName(user.Role)
	if err != nil {
		return buildUserAuthResponse(user, nil), nil
	}

	permissionIds, err := s.RoleRepo.GetRolePermissions(role.Id)
	if err != nil {
		return buildUserAuthResponse(user, nil), nil
	}

	var permissionNames []string
	for _, permId := range permissionIds {
		perm, err := s.PermissionRepo.GetByID(permId)
		if err == nil {
			permissionNames = append(permissionNames, perm.Name)
		}
	}

	return buildUserAuthResponse(user, permissionNames), nil
}

func (s *ServiceUser) GetAllUsers(params filter.BaseParams, currentUserRole string) ([]domainuser.Users, int64, error) {
	users, total, err := s.UserRepo.GetAll(params)
	if err != nil {
		return nil, 0, err
	}

	if currentUserRole != utils.RoleSuperAdmin {
		filteredUsers := make([]domainuser.Users, 0)
		for _, user := range users {
			if user.Role != utils.RoleSuperAdmin {
				filteredUsers = append(filteredUsers, user)
			}
		}
		superadminCount := int64(len(users) - len(filteredUsers))
		return filteredUsers, total - superadminCount, nil
	}

	return users, total, nil
}

func (s *ServiceUser) Update(id, role string, req dto.UserUpdate) (domainuser.Users, error) {
	data, err := s.UserRepo.GetByID(id)
	if err != nil {
		return domainuser.Users{}, err
	}

	if data.Role == utils.RoleSuperAdmin && role != utils.RoleSuperAdmin {
		return domainuser.Users{}, errors.New("cannot modify superadmin users")
	}

	if req.Name != "" {
		data.Name = utils.TitleCase(req.Name)
	}

	if req.Phone != "" {
		phone := utils.NormalizePhoneTo62(req.Phone)
		data.Phone = phone
	}

	if req.Email != "" {
		data.Email = utils.SanitizeEmail(req.Email)
	}

	if reqRole := strings.TrimSpace(req.Role); reqRole != "" && (role == utils.RoleAdmin || role == utils.RoleSuperAdmin) {
		newRoleName := strings.ToLower(reqRole)
		if role == utils.RoleAdmin && newRoleName == utils.RoleSuperAdmin {
			return domainuser.Users{}, errors.New("cannot assign superadmin role")
		}

		data.Role = newRoleName
		if roleID, ok := findRoleIDByName(s.RoleRepo, newRoleName); ok {
			data.RoleId = roleID
		} else {
			data.RoleId = nil
		}
	}

	if err = s.UserRepo.Update(data); err != nil {
		return domainuser.Users{}, err
	}

	return data, nil
}

func (s *ServiceUser) ChangePassword(id string, req dto.ChangePassword) (domainuser.Users, error) {
	if req.CurrentPassword == req.NewPassword {
		return domainuser.Users{}, errors.New("new password must be different from current password")
	}

	if err := ValidatePasswordStrength(req.NewPassword); err != nil {
		return domainuser.Users{}, err
	}

	data, err := s.UserRepo.GetByID(id)
	if err != nil {
		return domainuser.Users{}, err
	}

	if err = bcrypt.CompareHashAndPassword([]byte(data.Password), []byte(req.CurrentPassword)); err != nil {
		return domainuser.Users{}, err
	}

	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return domainuser.Users{}, err
	}

	data.Password = string(hashedPwd)

	if err = s.UserRepo.Update(data); err != nil {
		return domainuser.Users{}, err
	}

	return data, nil
}

func (s *ServiceUser) ForgotPassword(req dto.ForgotPasswordRequest) (string, error) {
	data, err := s.UserRepo.GetByEmail(utils.SanitizeEmail(req.Email))
	if err != nil {
		return "", nil
	}

	token, err := utils.GenerateJwt(&data, "reset_password")
	if err != nil {
		return "", err
	}

	return token, nil
}

func (s *ServiceUser) ResetPassword(req dto.ResetPasswordRequest) error {
	if err := ValidatePasswordStrength(req.NewPassword); err != nil {
		return err
	}

	claims, err := utils.JwtClaim(req.Token)
	if err != nil {
		return errors.New("invalid or expired token")
	}

	userId := claims["user_id"].(string)

	data, err := s.UserRepo.GetByID(userId)
	if err != nil {
		return errors.New("user not found")
	}

	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	data.Password = string(hashedPwd)

	if err = s.UserRepo.Update(data); err != nil {
		return err
	}

	_ = s.LogoutUser(req.Token)

	return nil
}

func (s *ServiceUser) Delete(id string) error {
	return s.UserRepo.Delete(id)
}

var _ interfaceuser.ServiceUserInterface = (*ServiceUser)(nil)
