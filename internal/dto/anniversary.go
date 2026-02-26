package dto

type AnniversaryTimelineItem struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type AnniversaryMemoryCard struct {
	Title   string `json:"title"`
	Summary string `json:"summary"`
	Note    string `json:"note"`
}

type AnniversaryMoment struct {
	Year  int    `json:"year"`
	Title string `json:"title"`
	Date  string `json:"date"`
	Note  string `json:"note"`
}

type AnniversarySiteConfig struct {
	Brand       string                    `json:"brand"`
	CoupleNames string                    `json:"couple_names"`
	WeddingDate string                    `json:"wedding_date"`
	HeroTitle   string                    `json:"hero_title"`
	HeroSubtext string                    `json:"hero_subtext"`
	Letter      string                    `json:"letter"`
	FooterText  string                    `json:"footer_text"`
	MusicURL    string                    `json:"music_url"`
	Timeline    []AnniversaryTimelineItem `json:"timeline"`
	MemoryCards []AnniversaryMemoryCard   `json:"memory_cards"`
	Moments     []AnniversaryMoment       `json:"annual_moments"`
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
	Config     AnniversarySiteConfig   `json:"config"`
	Next       AnniversaryNext         `json:"next_anniversary"`
	Moments    []AnniversaryMomentView `json:"moments"`
	ServerTime string                  `json:"server_time"`
	Timezone   string                  `json:"timezone"`
}
