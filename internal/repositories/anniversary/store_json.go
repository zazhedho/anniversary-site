package repositoryanniversary

import (
	"anniversary-site/internal/dto"
	interfaceanniversary "anniversary-site/internal/interfaces/anniversary"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"
)

const dateLayout = "2006-01-02"

type repo struct {
	path string
	loc  *time.Location
	mu   sync.RWMutex
}

func NewAnniversaryRepo(path string, loc *time.Location) interfaceanniversary.RepoAnniversaryInterface {
	if strings.TrimSpace(path) == "" {
		path = "./data/anniversary.json"
	}
	if loc == nil {
		loc = time.FixedZone("WIB", 7*60*60)
	}

	return &repo{
		path: path,
		loc:  loc,
	}
}

func (r *repo) Load() (dto.AnniversarySiteConfig, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	cfg := dto.AnniversarySiteConfig{}
	if _, err := os.Stat(r.path); os.IsNotExist(err) {
		cfg = defaultConfig()
		cfg, err = sanitizeConfig(cfg, r.loc)
		if err != nil {
			return dto.AnniversarySiteConfig{}, err
		}

		if err := r.write(cfg); err != nil {
			return dto.AnniversarySiteConfig{}, err
		}

		return cfg, nil
	}

	raw, err := os.ReadFile(r.path)
	if err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	if err := json.Unmarshal(raw, &cfg); err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	cfg, err = sanitizeConfig(cfg, r.loc)
	if err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	return cfg, nil
}

func (r *repo) Save(cfg dto.AnniversarySiteConfig) (dto.AnniversarySiteConfig, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	normalized, err := sanitizeConfig(cfg, r.loc)
	if err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	if err := r.write(normalized); err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	return normalized, nil
}

func (r *repo) write(cfg dto.AnniversarySiteConfig) error {
	if err := os.MkdirAll(filepath.Dir(r.path), 0o755); err != nil {
		return err
	}

	content, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(r.path, content, 0o644)
}

func sanitizeConfig(cfg dto.AnniversarySiteConfig, loc *time.Location) (dto.AnniversarySiteConfig, error) {
	def := defaultConfig()

	cfg.Brand = fallbackText(cfg.Brand, def.Brand)
	cfg.CoupleNames = fallbackText(cfg.CoupleNames, def.CoupleNames)
	cfg.WeddingDate = strings.TrimSpace(cfg.WeddingDate)
	if cfg.WeddingDate == "" {
		cfg.WeddingDate = def.WeddingDate
	}

	weddingDate, err := time.ParseInLocation(dateLayout, cfg.WeddingDate, loc)
	if err != nil {
		return dto.AnniversarySiteConfig{}, fmt.Errorf("invalid wedding_date format, use YYYY-MM-DD: %w", err)
	}

	cfg.HeroTitle = fallbackText(cfg.HeroTitle, def.HeroTitle)
	cfg.HeroSubtext = fallbackText(cfg.HeroSubtext, def.HeroSubtext)
	cfg.Letter = fallbackText(cfg.Letter, def.Letter)
	cfg.FooterText = fallbackText(cfg.FooterText, def.FooterText)
	cfg.MusicURL = strings.TrimSpace(cfg.MusicURL)

	if len(cfg.Timeline) == 0 {
		cfg.Timeline = def.Timeline
	}
	for idx := range cfg.Timeline {
		cfg.Timeline[idx].Title = strings.TrimSpace(cfg.Timeline[idx].Title)
		cfg.Timeline[idx].Description = strings.TrimSpace(cfg.Timeline[idx].Description)
		if cfg.Timeline[idx].Title == "" {
			cfg.Timeline[idx].Title = fmt.Sprintf("Momen %d", idx+1)
		}
	}

	if len(cfg.MemoryCards) == 0 {
		cfg.MemoryCards = def.MemoryCards
	}
	for idx := range cfg.MemoryCards {
		cfg.MemoryCards[idx].Title = strings.TrimSpace(cfg.MemoryCards[idx].Title)
		cfg.MemoryCards[idx].Summary = strings.TrimSpace(cfg.MemoryCards[idx].Summary)
		cfg.MemoryCards[idx].Note = strings.TrimSpace(cfg.MemoryCards[idx].Note)
		if cfg.MemoryCards[idx].Title == "" {
			cfg.MemoryCards[idx].Title = fmt.Sprintf("Kenangan %d", idx+1)
		}
	}

	if len(cfg.Moments) == 0 {
		cfg.Moments = def.Moments
	}
	for idx := range cfg.Moments {
		if cfg.Moments[idx].Year <= 0 {
			cfg.Moments[idx].Year = idx + 1
		}

		cfg.Moments[idx].Title = strings.TrimSpace(cfg.Moments[idx].Title)
		cfg.Moments[idx].Note = strings.TrimSpace(cfg.Moments[idx].Note)
		cfg.Moments[idx].Date = strings.TrimSpace(cfg.Moments[idx].Date)

		if cfg.Moments[idx].Date == "" {
			cfg.Moments[idx].Date = anniversaryDateForYear(weddingDate, cfg.Moments[idx].Year, loc)
		}

		if _, err := time.ParseInLocation(dateLayout, cfg.Moments[idx].Date, loc); err != nil {
			return dto.AnniversarySiteConfig{}, fmt.Errorf("invalid annual_moments[%d].date format, use YYYY-MM-DD", idx)
		}

		if cfg.Moments[idx].Title == "" {
			cfg.Moments[idx].Title = fmt.Sprintf("Anniversary ke-%d", cfg.Moments[idx].Year)
		}
	}

	sort.Slice(cfg.Moments, func(i, j int) bool {
		return cfg.Moments[i].Year < cfg.Moments[j].Year
	})

	return cfg, nil
}

func defaultConfig() dto.AnniversarySiteConfig {
	return dto.AnniversarySiteConfig{
		Brand:       "My another Z • I'm YourZ",
		CoupleNames: "Zaidus Zhuhur & Zaqia Khana Meriza",
		WeddingDate: "2025-04-27",
		HeroTitle:   "My another Z, I'm YourZ",
		HeroSubtext: "First anniversary ini jadi bab pertama perjalanan resmi kita sebagai suami istri. Dari 27 April 2025 sampai hari ini, setiap langkah kita selalu terasa lebih berarti karena dijalani berdua.",
		Letter:      "Untuk Zaqia Khana Meriza, terima kasih sudah menjadi rumah terbaikku. Di anniversary pertama ini, aku tetap memilihmu setiap hari. My another Z, I'm YourZ, hari ini dan seterusnya.",
		FooterText:  "Dibuat oleh Zaidus Zhuhur untuk Zaqia Khana Meriza, di anniversary pertama kita.",
		MusicURL:    "/our-song.mp3",
		Timeline: []dto.AnniversaryTimelineItem{
			{Title: "Awal Menjadi Satu", Description: "Hari di mana janji diucapkan, sekaligus titik awal petualangan paling personal dalam hidup kita."},
			{Title: "Belajar Bersama", Description: "Dari hal kecil sampai keputusan besar, kita saling menguatkan dan bertumbuh sebagai tim."},
			{Title: "Tetap Memilih Satu Sama Lain", Description: "Di setiap kondisi, rumah terbaik tetap ada pada kebersamaan kita berdua."},
		},
		MemoryCards: []dto.AnniversaryMemoryCard{
			{Title: "Morning Coffee", Summary: "Momen kecil yang bikin hangat.", Note: "Terima kasih selalu jadi alasan aku tersenyum di hari-hari biasa."},
			{Title: "Late Night Talks", Summary: "Cerita panjang sebelum tidur.", Note: "Kita mungkin capek, tapi selalu pulang dengan hati yang lebih tenang."},
			{Title: "Weekend Escape", Summary: "Rencana spontan yang seru.", Note: "Semoga banyak perjalanan baru yang kita jelajahi sebagai pasangan."},
		},
		Moments: []dto.AnniversaryMoment{
			{Year: 1, Title: "First Anniversary", Date: "2026-04-27", Note: "Satu tahun pertama bersama: My another Z, I'm YourZ."},
			{Year: 2, Title: "Second Anniversary", Date: "2027-04-27", Note: "Saatnya menambah cerita baru dan merayakan pertumbuhan kita sebagai tim."},
			{Year: 3, Title: "Third Anniversary", Date: "2028-04-27", Note: "Tetap bertumbuh, tetap saling memilih, dan tetap pulang pada cinta yang sama."},
		},
	}
}

func anniversaryDateForYear(weddingDate time.Time, yearNumber int, loc *time.Location) string {
	year := weddingDate.Year() + yearNumber
	anniversary := time.Date(year, weddingDate.Month(), weddingDate.Day(), 0, 0, 0, 0, loc)
	return anniversary.Format(dateLayout)
}

func fallbackText(value, fallback string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return fallback
	}
	return trimmed
}

var _ interfaceanniversary.RepoAnniversaryInterface = (*repo)(nil)
