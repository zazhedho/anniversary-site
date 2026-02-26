package anniversary

type TimelineItem struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type MemoryCard struct {
	Title   string `json:"title"`
	Summary string `json:"summary"`
	Note    string `json:"note"`
}

type AnnualMoment struct {
	Year  int    `json:"year"`
	Title string `json:"title"`
	Date  string `json:"date"`
	Note  string `json:"note"`
}

type SiteConfig struct {
	Brand       string         `json:"brand"`
	CoupleNames string         `json:"couple_names"`
	WeddingDate string         `json:"wedding_date"`
	HeroTitle   string         `json:"hero_title"`
	HeroSubtext string         `json:"hero_subtext"`
	Letter      string         `json:"letter"`
	FooterText  string         `json:"footer_text"`
	MusicURL    string         `json:"music_url"`
	Timeline    []TimelineItem `json:"timeline"`
	MemoryCards []MemoryCard   `json:"memory_cards"`
	Moments     []AnnualMoment `json:"annual_moments"`
}

type Countdown struct {
	Days    int64 `json:"days"`
	Hours   int64 `json:"hours"`
	Minutes int64 `json:"minutes"`
	Seconds int64 `json:"seconds"`
}

type NextAnniversary struct {
	Number     int       `json:"number"`
	Label      string    `json:"label"`
	Date       string    `json:"date"`
	TargetTime string    `json:"target_time"`
	IsToday    bool      `json:"is_today"`
	Countdown  Countdown `json:"countdown"`
}

type AnnualMomentView struct {
	Year   int    `json:"year"`
	Title  string `json:"title"`
	Date   string `json:"date"`
	Note   string `json:"note"`
	Status string `json:"status"`
}

type PublicPayload struct {
	Config     SiteConfig         `json:"config"`
	Next       NextAnniversary    `json:"next_anniversary"`
	Moments    []AnnualMomentView `json:"moments"`
	ServerTime string             `json:"server_time"`
	Timezone   string             `json:"timezone"`
}
