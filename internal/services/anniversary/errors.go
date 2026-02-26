package serviceanniversary

import "errors"

var (
	ErrLoadConfig     = errors.New("load config")
	ErrSaveConfig     = errors.New("save config")
	ErrMomentNotFound = errors.New("moment not found")
)
