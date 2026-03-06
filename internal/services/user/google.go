package serviceuser

import (
	domainuser "anniversary-site/internal/domain/user"
	"anniversary-site/internal/dto"
	"anniversary-site/utils"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type googleTokenInfo struct {
	Audience      string `json:"aud"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Subject       string `json:"sub"`
}

func (s *ServiceUser) LoginWithGoogle(req dto.GoogleLogin, logId string) (dto.GoogleLoginResult, error) {
	identity, err := verifyGoogleIDToken(context.Background(), req.IDToken)
	if err != nil {
		return dto.GoogleLoginResult{}, err
	}

	email := utils.SanitizeEmail(identity.Email)
	if email == "" {
		return dto.GoogleLoginResult{}, ErrGoogleEmailMissing
	}

	existing, err := s.UserRepo.GetByEmail(email)
	if err == nil && existing.Id != "" {
		token, tokenErr := utils.GenerateJwt(&existing, logId)
		if tokenErr != nil {
			return dto.GoogleLoginResult{}, tokenErr
		}
		return dto.GoogleLoginResult{Token: token, IsNewUser: false}, nil
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return dto.GoogleLoginResult{}, err
	}

	tenantSlug := sanitizeTenantSlug(req.TenantSlug)
	if tenantSlug == "" {
		return dto.GoogleLoginResult{}, ErrTenantSlugRequired
	}
	if _, err := s.TenantRepo.GetBySlug(tenantSlug); err == nil {
		return dto.GoogleLoginResult{}, errors.New("tenant slug already exists")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return dto.GoogleLoginResult{}, err
	}

	roleName := utils.RoleTenantOwner
	roleId, ok := findRoleIDByName(s.RoleRepo, roleName)
	if !ok {
		return dto.GoogleLoginResult{}, errors.New("role tenant_owner is not configured")
	}

	passwordSeed := fmt.Sprintf("Google-%s-%d!", utils.CreateUUID(), time.Now().UnixNano())
	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(passwordSeed), bcrypt.DefaultCost)
	if err != nil {
		return dto.GoogleLoginResult{}, err
	}

	name := strings.TrimSpace(identity.Name)
	if name == "" {
		name = strings.Split(email, "@")[0]
	}

	user := domainuser.Users{
		Id:        utils.CreateUUID(),
		Name:      utils.TitleCase(name),
		Email:     email,
		Phone:     "",
		Password:  string(hashedPwd),
		Role:      roleName,
		RoleId:    roleId,
		CreatedAt: time.Now(),
	}
	if err := s.UserRepo.StoreWithPhone(user, nil); err != nil {
		return dto.GoogleLoginResult{}, err
	}

	if s.TenantRepo != nil {
		now := time.Now()
		tenant := defaultTenantFromUser(user, tenantSlug, now)
		if err := s.TenantRepo.Store(tenant); err != nil {
			return dto.GoogleLoginResult{}, err
		}

		member := defaultTenantOwnerMember(tenant.ID, user.Id, now)
		if err := s.TenantRepo.AddOrUpdateMember(member); err != nil {
			return dto.GoogleLoginResult{}, err
		}
	}

	token, err := utils.GenerateJwt(&user, logId)
	if err != nil {
		return dto.GoogleLoginResult{}, err
	}

	return dto.GoogleLoginResult{
		Token:     token,
		IsNewUser: true,
	}, nil
}

func verifyGoogleIDToken(ctx context.Context, idToken string) (googleTokenInfo, error) {
	if strings.TrimSpace(idToken) == "" {
		return googleTokenInfo{}, ErrGoogleTokenInvalid
	}

	allowedAudiences := googleAllowedAudiences()
	if len(allowedAudiences) == 0 {
		return googleTokenInfo{}, ErrGoogleNotConfigured
	}

	endpoint := "https://oauth2.googleapis.com/tokeninfo?id_token=" + url.QueryEscape(idToken)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return googleTokenInfo{}, err
	}

	client := &http.Client{Timeout: 10 * time.Second}
	response, err := client.Do(request)
	if err != nil {
		return googleTokenInfo{}, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return googleTokenInfo{}, ErrGoogleTokenInvalid
	}

	var tokenInfo googleTokenInfo
	if err := json.NewDecoder(response.Body).Decode(&tokenInfo); err != nil {
		return googleTokenInfo{}, err
	}

	if _, ok := allowedAudiences[strings.TrimSpace(tokenInfo.Audience)]; !ok {
		return googleTokenInfo{}, ErrGoogleTokenInvalid
	}
	if !strings.EqualFold(strings.TrimSpace(tokenInfo.EmailVerified), "true") {
		return googleTokenInfo{}, ErrGoogleTokenInvalid
	}
	if utils.SanitizeEmail(tokenInfo.Email) == "" {
		return googleTokenInfo{}, ErrGoogleEmailMissing
	}
	if strings.TrimSpace(tokenInfo.Subject) == "" {
		return googleTokenInfo{}, ErrGoogleTokenInvalid
	}

	return tokenInfo, nil
}

func googleAllowedAudiences() map[string]struct{} {
	values := make(map[string]struct{})
	rawList := strings.TrimSpace(utils.GetEnv("GOOGLE_CLIENT_IDS", ""))
	if rawList != "" {
		for _, item := range strings.Split(rawList, ",") {
			normalized := strings.TrimSpace(item)
			if normalized != "" {
				values[normalized] = struct{}{}
			}
		}
	}

	single := strings.TrimSpace(utils.GetEnv("GOOGLE_CLIENT_ID", ""))
	if single != "" {
		values[single] = struct{}{}
	}
	return values
}
