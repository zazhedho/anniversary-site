package dto

import (
	"encoding/json"
	"strings"
)

type LocalizedText struct {
	ID string `json:"id,omitempty"`
	EN string `json:"en,omitempty"`
}

func NewLocalizedText(value string) LocalizedText {
	trimmed := strings.TrimSpace(value)
	return LocalizedText{
		ID: trimmed,
		EN: trimmed,
	}
}

func (l LocalizedText) Normalize() LocalizedText {
	id := strings.TrimSpace(l.ID)
	en := strings.TrimSpace(l.EN)

	if id == "" && en == "" {
		return LocalizedText{}
	}
	if id == "" {
		id = en
	}
	if en == "" {
		en = id
	}

	return LocalizedText{
		ID: id,
		EN: en,
	}
}

func (l LocalizedText) IsEmpty() bool {
	normalized := l.Normalize()
	return normalized.ID == "" && normalized.EN == ""
}

func (l LocalizedText) Value(language string) string {
	normalized := l.Normalize()
	if strings.EqualFold(language, "en") && normalized.EN != "" {
		return normalized.EN
	}
	if normalized.ID != "" {
		return normalized.ID
	}
	return normalized.EN
}

func (l *LocalizedText) UnmarshalJSON(data []byte) error {
	raw := strings.TrimSpace(string(data))
	if raw == "" || raw == "null" {
		*l = LocalizedText{}
		return nil
	}

	if strings.HasPrefix(raw, "\"") {
		var value string
		if err := json.Unmarshal(data, &value); err != nil {
			return err
		}
		*l = NewLocalizedText(value)
		return nil
	}

	var payload struct {
		ID    string `json:"id"`
		EN    string `json:"en"`
		Value string `json:"value"`
	}
	if err := json.Unmarshal(data, &payload); err != nil {
		return err
	}

	if payload.ID == "" && payload.EN == "" && payload.Value != "" {
		*l = NewLocalizedText(payload.Value)
		return nil
	}

	*l = LocalizedText{
		ID: payload.ID,
		EN: payload.EN,
	}.Normalize()

	return nil
}

func (l LocalizedText) MarshalJSON() ([]byte, error) {
	normalized := l.Normalize()
	if normalized.IsEmpty() {
		return json.Marshal("")
	}
	if normalized.ID == normalized.EN {
		return json.Marshal(normalized.ID)
	}

	return json.Marshal(struct {
		ID string `json:"id"`
		EN string `json:"en"`
	}{
		ID: normalized.ID,
		EN: normalized.EN,
	})
}

type AnniversaryTimelineItem struct {
	Title       LocalizedText `json:"title"`
	Description LocalizedText `json:"description"`
}

type AnniversaryMemoryCard struct {
	Title   LocalizedText `json:"title"`
	Summary LocalizedText `json:"summary"`
	Note    LocalizedText `json:"note"`
}

type AnniversaryGalleryPhoto struct {
	ID       string        `json:"id,omitempty"`
	Title    LocalizedText `json:"title"`
	Caption  LocalizedText `json:"caption"`
	ImageURL string        `json:"image_url"`
}

type AnniversaryGalleryVideo struct {
	ID          string        `json:"id,omitempty"`
	Title       LocalizedText `json:"title"`
	Description LocalizedText `json:"description"`
	VideoURL    string        `json:"video_url"`
	PosterURL   string        `json:"poster_url,omitempty"`
}

type AnniversaryMoment struct {
	Year  int           `json:"year"`
	Title LocalizedText `json:"title"`
	Date  string        `json:"date"`
	Note  LocalizedText `json:"note"`
}

type AnniversaryPublicMoment struct {
	Year  int    `json:"year"`
	Title string `json:"title"`
	Date  string `json:"date"`
	Note  string `json:"note"`
}

type AnniversaryPublicTimelineItem struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type AnniversaryPublicMemoryCard struct {
	Title   string `json:"title"`
	Summary string `json:"summary"`
	Note    string `json:"note"`
}

type AnniversaryPublicGalleryPhoto struct {
	ID       string `json:"id,omitempty"`
	Title    string `json:"title"`
	Caption  string `json:"caption"`
	ImageURL string `json:"image_url"`
}

type AnniversaryPublicGalleryVideo struct {
	ID          string `json:"id,omitempty"`
	Title       string `json:"title"`
	Description string `json:"description"`
	VideoURL    string `json:"video_url"`
	PosterURL   string `json:"poster_url,omitempty"`
}

type AnniversarySiteConfig struct {
	Brand         LocalizedText             `json:"brand"`
	CoupleNames   LocalizedText             `json:"couple_names"`
	WeddingDate   string                    `json:"wedding_date"`
	CoverBadge    LocalizedText             `json:"cover_badge"`
	CoverTitle    LocalizedText             `json:"cover_title"`
	CoverSubtext  LocalizedText             `json:"cover_subtext"`
	CoverCTA      LocalizedText             `json:"cover_cta"`
	HeroTitle     LocalizedText             `json:"hero_title"`
	HeroSubtext   LocalizedText             `json:"hero_subtext"`
	Letter        LocalizedText             `json:"letter"`
	FooterText    LocalizedText             `json:"footer_text"`
	MusicURL      string                    `json:"music_url"`
	Timeline      []AnniversaryTimelineItem `json:"timeline"`
	MemoryCards   []AnniversaryMemoryCard   `json:"memory_cards"`
	GalleryPhotos []AnniversaryGalleryPhoto `json:"gallery_photos"`
	GalleryVideos []AnniversaryGalleryVideo `json:"gallery_videos"`
	Moments       []AnniversaryMoment       `json:"annual_moments"`
}

type AnniversaryPublicSiteConfig struct {
	Brand         string                          `json:"brand"`
	CoupleNames   string                          `json:"couple_names"`
	WeddingDate   string                          `json:"wedding_date"`
	CoverBadge    string                          `json:"cover_badge"`
	CoverTitle    string                          `json:"cover_title"`
	CoverSubtext  string                          `json:"cover_subtext"`
	CoverCTA      string                          `json:"cover_cta"`
	HeroTitle     string                          `json:"hero_title"`
	HeroSubtext   string                          `json:"hero_subtext"`
	Letter        string                          `json:"letter"`
	FooterText    string                          `json:"footer_text"`
	MusicURL      string                          `json:"music_url"`
	Timeline      []AnniversaryPublicTimelineItem `json:"timeline"`
	MemoryCards   []AnniversaryPublicMemoryCard   `json:"memory_cards"`
	GalleryPhotos []AnniversaryPublicGalleryPhoto `json:"gallery_photos"`
	GalleryVideos []AnniversaryPublicGalleryVideo `json:"gallery_videos"`
	Moments       []AnniversaryPublicMoment       `json:"annual_moments"`
}

type AnniversaryCountdown struct {
	Days    int64 `json:"days"`
	Hours   int64 `json:"hours"`
	Minutes int64 `json:"minutes"`
	Seconds int64 `json:"seconds"`
}

type AnniversaryNext struct {
	Number     int                  `json:"number"`
	Label      string               `json:"label"`
	Date       string               `json:"date"`
	TargetTime string               `json:"target_time"`
	IsToday    bool                 `json:"is_today"`
	Countdown  AnniversaryCountdown `json:"countdown"`
}

type AnniversaryMomentView struct {
	Year   int    `json:"year"`
	Title  string `json:"title"`
	Date   string `json:"date"`
	Note   string `json:"note"`
	Status string `json:"status"`
}

type AnniversaryPublicPayload struct {
	Config     AnniversaryPublicSiteConfig `json:"config"`
	Next       AnniversaryNext             `json:"next_anniversary"`
	Moments    []AnniversaryMomentView     `json:"moments"`
	ServerTime string                      `json:"server_time"`
	Timezone   string                      `json:"timezone"`
}
