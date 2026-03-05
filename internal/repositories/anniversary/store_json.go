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

const (
	maxBrandLength          = 120
	maxCoupleNamesLength    = 160
	maxCoverBadgeLength     = 120
	maxCoverTitleLength     = 160
	maxCoverSubtextLength   = 600
	maxCoverCTALength       = 80
	maxHeroTitleLength      = 160
	maxHeroSubtextLength    = 1200
	maxLetterLength         = 5000
	maxFooterTextLength     = 300
	maxURLLength            = 500
	maxTimelineTitleLength  = 120
	maxTimelineDescLength   = 700
	maxMemoryTitleLength    = 120
	maxMemorySummaryLength  = 200
	maxMemoryNoteLength     = 700
	maxMapTitleLength       = 120
	maxMapNoteLength        = 500
	maxGalleryIDLength      = 80
	maxGalleryTitleLength   = 120
	maxGalleryCaptionLength = 240
	maxGalleryDescLength    = 700
	maxMomentTitleLength    = 120
	maxMomentNoteLength     = 700
)

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

func (r *repo) LoadByTenantSlug(_ string) (dto.AnniversarySiteConfig, error) {
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

func (r *repo) SaveByTenantSlug(_ string, cfg dto.AnniversarySiteConfig) (dto.AnniversarySiteConfig, error) {
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

	cfg.Brand = truncateLocalized(fallbackLocalized(cfg.Brand, def.Brand), maxBrandLength)
	cfg.CoupleNames = truncateLocalized(fallbackLocalized(cfg.CoupleNames, def.CoupleNames), maxCoupleNamesLength)
	cfg.WeddingDate = strings.TrimSpace(cfg.WeddingDate)
	if cfg.WeddingDate == "" {
		cfg.WeddingDate = def.WeddingDate
	}
	cfg.CoverBadge = truncateLocalized(fallbackLocalized(cfg.CoverBadge, def.CoverBadge), maxCoverBadgeLength)
	cfg.CoverTitle = truncateLocalized(fallbackLocalized(cfg.CoverTitle, def.CoverTitle), maxCoverTitleLength)
	cfg.CoverSubtext = truncateLocalized(fallbackLocalized(cfg.CoverSubtext, def.CoverSubtext), maxCoverSubtextLength)
	cfg.CoverCTA = truncateLocalized(fallbackLocalized(cfg.CoverCTA, def.CoverCTA), maxCoverCTALength)

	weddingDate, err := time.ParseInLocation(dateLayout, cfg.WeddingDate, loc)
	if err != nil {
		return dto.AnniversarySiteConfig{}, fmt.Errorf("invalid wedding_date format, use YYYY-MM-DD: %w", err)
	}

	cfg.HeroTitle = truncateLocalized(fallbackLocalized(cfg.HeroTitle, def.HeroTitle), maxHeroTitleLength)
	cfg.HeroSubtext = truncateLocalized(fallbackLocalized(cfg.HeroSubtext, def.HeroSubtext), maxHeroSubtextLength)
	cfg.Letter = truncateLocalized(fallbackLocalized(cfg.Letter, def.Letter), maxLetterLength)
	cfg.FooterText = truncateLocalized(fallbackLocalized(cfg.FooterText, def.FooterText), maxFooterTextLength)
	cfg.MusicURL = truncateString(cfg.MusicURL, maxURLLength)
	cfg.VoiceNoteURL = truncateString(cfg.VoiceNoteURL, maxURLLength)

	if len(cfg.Timeline) == 0 {
		cfg.Timeline = def.Timeline
	}
	for idx := range cfg.Timeline {
		titleFallback := dto.NewLocalizedText(fmt.Sprintf("Momen %d", idx+1))
		descriptionFallback := dto.NewLocalizedText("")
		if idx < len(def.Timeline) {
			titleFallback = def.Timeline[idx].Title
			descriptionFallback = def.Timeline[idx].Description
		}
		cfg.Timeline[idx].Title = truncateLocalized(fallbackLocalized(cfg.Timeline[idx].Title, titleFallback), maxTimelineTitleLength)
		cfg.Timeline[idx].Description = truncateLocalized(fallbackLocalized(cfg.Timeline[idx].Description, descriptionFallback), maxTimelineDescLength)
	}

	if len(cfg.MemoryCards) == 0 {
		cfg.MemoryCards = def.MemoryCards
	}
	for idx := range cfg.MemoryCards {
		titleFallback := dto.NewLocalizedText(fmt.Sprintf("Kenangan %d", idx+1))
		summaryFallback := dto.NewLocalizedText("")
		noteFallback := dto.NewLocalizedText("")
		if idx < len(def.MemoryCards) {
			titleFallback = def.MemoryCards[idx].Title
			summaryFallback = def.MemoryCards[idx].Summary
			noteFallback = def.MemoryCards[idx].Note
		}
		cfg.MemoryCards[idx].Title = truncateLocalized(fallbackLocalized(cfg.MemoryCards[idx].Title, titleFallback), maxMemoryTitleLength)
		cfg.MemoryCards[idx].Summary = truncateLocalized(fallbackLocalized(cfg.MemoryCards[idx].Summary, summaryFallback), maxMemorySummaryLength)
		cfg.MemoryCards[idx].Note = truncateLocalized(fallbackLocalized(cfg.MemoryCards[idx].Note, noteFallback), maxMemoryNoteLength)
	}

	if len(cfg.MapPoints) == 0 {
		cfg.MapPoints = def.MapPoints
	}
	for idx := range cfg.MapPoints {
		titleFallback := dto.NewLocalizedText(fmt.Sprintf("Titik %d", idx+1))
		noteFallback := dto.NewLocalizedText("")
		latFallback := 0.0
		lngFallback := 0.0
		if idx < len(def.MapPoints) {
			titleFallback = def.MapPoints[idx].Title
			noteFallback = def.MapPoints[idx].Note
			latFallback = def.MapPoints[idx].Lat
			lngFallback = def.MapPoints[idx].Lng
		}
		cfg.MapPoints[idx].Title = truncateLocalized(fallbackLocalized(cfg.MapPoints[idx].Title, titleFallback), maxMapTitleLength)
		cfg.MapPoints[idx].Note = truncateLocalized(fallbackLocalized(cfg.MapPoints[idx].Note, noteFallback), maxMapNoteLength)
		if cfg.MapPoints[idx].Lat == 0 && cfg.MapPoints[idx].Lng == 0 {
			cfg.MapPoints[idx].Lat = latFallback
			cfg.MapPoints[idx].Lng = lngFallback
		}
		if cfg.MapPoints[idx].Lat < -90 || cfg.MapPoints[idx].Lat > 90 {
			cfg.MapPoints[idx].Lat = latFallback
		}
		if cfg.MapPoints[idx].Lng < -180 || cfg.MapPoints[idx].Lng > 180 {
			cfg.MapPoints[idx].Lng = lngFallback
		}
	}

	if cfg.GalleryPhotos == nil {
		cfg.GalleryPhotos = make([]dto.AnniversaryGalleryPhoto, 0)
	}
	sanitizedPhotos := make([]dto.AnniversaryGalleryPhoto, 0, len(cfg.GalleryPhotos))
	for idx := range cfg.GalleryPhotos {
		cfg.GalleryPhotos[idx].ID = truncateString(cfg.GalleryPhotos[idx].ID, maxGalleryIDLength)
		cfg.GalleryPhotos[idx].ImageURL = truncateString(cfg.GalleryPhotos[idx].ImageURL, maxURLLength)
		if cfg.GalleryPhotos[idx].ImageURL == "" {
			continue
		}

		titleFallback := dto.NewLocalizedText(fmt.Sprintf("Foto %d", idx+1))
		captionFallback := dto.NewLocalizedText("")
		cfg.GalleryPhotos[idx].Title = truncateLocalized(fallbackLocalized(cfg.GalleryPhotos[idx].Title, titleFallback), maxGalleryTitleLength)
		cfg.GalleryPhotos[idx].Caption = truncateLocalized(fallbackLocalized(cfg.GalleryPhotos[idx].Caption, captionFallback), maxGalleryCaptionLength)

		sanitizedPhotos = append(sanitizedPhotos, cfg.GalleryPhotos[idx])
	}
	cfg.GalleryPhotos = sanitizedPhotos

	if cfg.GalleryVideos == nil {
		cfg.GalleryVideos = make([]dto.AnniversaryGalleryVideo, 0)
	}
	sanitizedVideos := make([]dto.AnniversaryGalleryVideo, 0, len(cfg.GalleryVideos))
	for idx := range cfg.GalleryVideos {
		cfg.GalleryVideos[idx].ID = truncateString(cfg.GalleryVideos[idx].ID, maxGalleryIDLength)
		cfg.GalleryVideos[idx].VideoURL = truncateString(cfg.GalleryVideos[idx].VideoURL, maxURLLength)
		cfg.GalleryVideos[idx].PosterURL = truncateString(cfg.GalleryVideos[idx].PosterURL, maxURLLength)
		if cfg.GalleryVideos[idx].VideoURL == "" {
			continue
		}

		titleFallback := dto.NewLocalizedText(fmt.Sprintf("Video %d", idx+1))
		descriptionFallback := dto.NewLocalizedText("")
		cfg.GalleryVideos[idx].Title = truncateLocalized(fallbackLocalized(cfg.GalleryVideos[idx].Title, titleFallback), maxGalleryTitleLength)
		cfg.GalleryVideos[idx].Description = truncateLocalized(fallbackLocalized(cfg.GalleryVideos[idx].Description, descriptionFallback), maxGalleryDescLength)

		sanitizedVideos = append(sanitizedVideos, cfg.GalleryVideos[idx])
	}
	cfg.GalleryVideos = sanitizedVideos

	if len(cfg.Moments) == 0 {
		cfg.Moments = def.Moments
	}
	for idx := range cfg.Moments {
		if cfg.Moments[idx].Year <= 0 {
			cfg.Moments[idx].Year = idx + 1
		}

		cfg.Moments[idx].Date = strings.TrimSpace(cfg.Moments[idx].Date)

		if cfg.Moments[idx].Date == "" {
			cfg.Moments[idx].Date = anniversaryDateForYear(weddingDate, cfg.Moments[idx].Year, loc)
		}

		if _, err := time.ParseInLocation(dateLayout, cfg.Moments[idx].Date, loc); err != nil {
			return dto.AnniversarySiteConfig{}, fmt.Errorf("invalid annual_moments[%d].date format, use YYYY-MM-DD", idx)
		}

		titleFallback := dto.NewLocalizedText(fmt.Sprintf("Anniversary ke-%d", cfg.Moments[idx].Year))
		noteFallback := dto.NewLocalizedText("")
		if idx < len(def.Moments) {
			titleFallback = def.Moments[idx].Title
			noteFallback = def.Moments[idx].Note
		}

		cfg.Moments[idx].Title = truncateLocalized(fallbackLocalized(cfg.Moments[idx].Title, titleFallback), maxMomentTitleLength)
		cfg.Moments[idx].Note = truncateLocalized(fallbackLocalized(cfg.Moments[idx].Note, noteFallback), maxMomentNoteLength)
	}

	sort.Slice(cfg.Moments, func(i, j int) bool {
		return cfg.Moments[i].Year < cfg.Moments[j].Year
	})

	return cfg, nil
}

func defaultConfig() dto.AnniversarySiteConfig {
	return dto.AnniversarySiteConfig{
		Brand:       dto.NewLocalizedText("My another Z • I'm YourZ"),
		CoupleNames: dto.NewLocalizedText("Zaidus Zhuhur & Zaqia Khana Meriza"),
		WeddingDate: "2025-04-27",
		CoverBadge:  dto.NewLocalizedText("My another Z • I'm YourZ"),
		CoverTitle: dto.LocalizedText{
			ID: "Untuk My another Z",
			EN: "For My another Z",
		}.Normalize(),
		CoverSubtext: dto.LocalizedText{
			ID: "Aku sudah menyiapkan perjalanan kecil untukmu. Tidak perlu buru-buru, cukup klik mulai dan ikuti alurnya.",
			EN: "I prepared a little journey for you. No need to rush, just start and follow the flow.",
		}.Normalize(),
		CoverCTA: dto.LocalizedText{
			ID: "Mulai Perjalanan",
			EN: "Start The Journey",
		}.Normalize(),
		HeroTitle: dto.LocalizedText{
			ID: "Selamat Anniversary Pertama, My Another Z",
			EN: "Happy 1st Anniversary, My Another Z",
		}.Normalize(),
		HeroSubtext: dto.LocalizedText{
			ID: "First anniversary ini jadi bab pertama perjalanan resmi kita sebagai suami istri. Dari 27 April 2025 sampai hari ini, setiap langkah kita selalu terasa lebih berarti karena dijalani berdua.",
			EN: "This first anniversary is the first chapter of our official journey as husband and wife. Since April 27, 2025, every step has felt more meaningful because we walk it together.",
		}.Normalize(),
		Letter: dto.LocalizedText{
			ID: "Untuk Zaqia Khana Meriza, terima kasih sudah menjadi rumah terbaikku. Di anniversary pertama ini, aku tetap memilihmu setiap hari. My another Z, I'm YourZ, hari ini dan seterusnya.",
			EN: "For Zaqia Khana Meriza, thank you for being my safest home. On our first anniversary, I still choose you every day. My another Z, I'm YourZ, today and always.",
		}.Normalize(),
		FooterText: dto.LocalizedText{
			ID: "Dibuat oleh Zaidus Zhuhur untuk Zaqia Khana Meriza, di anniversary pertama kita.",
			EN: "Made by Zaidus Zhuhur for Zaqia Khana Meriza, on our first anniversary.",
		}.Normalize(),
		MusicURL:     "https://image2url.com/r2/default/audio/1772528386754-8843de09-d7af-4507-819e-25b5e428694c.mp3",
		VoiceNoteURL: "",
		Timeline: []dto.AnniversaryTimelineItem{
			{
				Title: dto.LocalizedText{ID: "Awal Menjadi Satu", EN: "The Beginning as One"}.Normalize(),
				Description: dto.LocalizedText{
					ID: "Hari di mana janji diucapkan, sekaligus titik awal petualangan paling personal dalam hidup kita.",
					EN: "The day we said our vows and started the most personal journey of our lives.",
				}.Normalize(),
			},
			{
				Title: dto.LocalizedText{ID: "Belajar Bersama", EN: "Growing Together"}.Normalize(),
				Description: dto.LocalizedText{
					ID: "Dari hal kecil sampai keputusan besar, kita saling menguatkan dan bertumbuh sebagai tim.",
					EN: "From little things to big decisions, we support each other and grow as a team.",
				}.Normalize(),
			},
			{
				Title: dto.LocalizedText{ID: "Tetap Memilih Satu Sama Lain", EN: "Choosing Each Other Every Day"}.Normalize(),
				Description: dto.LocalizedText{
					ID: "Di setiap kondisi, rumah terbaik tetap ada pada kebersamaan kita berdua.",
					EN: "In every situation, the best home is still found in our togetherness.",
				}.Normalize(),
			},
		},
		MemoryCards: []dto.AnniversaryMemoryCard{
			{
				Title:   dto.NewLocalizedText("Morning Coffee"),
				Summary: dto.LocalizedText{ID: "Momen kecil yang bikin hangat.", EN: "A tiny moment that always feels warm."}.Normalize(),
				Note: dto.LocalizedText{
					ID: "Terima kasih selalu jadi alasan aku tersenyum di hari-hari biasa.",
					EN: "Thank you for always being the reason I smile on ordinary days.",
				}.Normalize(),
			},
			{
				Title:   dto.NewLocalizedText("Late Night Talks"),
				Summary: dto.LocalizedText{ID: "Cerita panjang sebelum tidur.", EN: "Long conversations before sleep."}.Normalize(),
				Note: dto.LocalizedText{
					ID: "Kita mungkin capek, tapi selalu pulang dengan hati yang lebih tenang.",
					EN: "We may be tired, but we always end the night with calmer hearts.",
				}.Normalize(),
			},
			{
				Title:   dto.NewLocalizedText("Weekend Escape"),
				Summary: dto.LocalizedText{ID: "Rencana spontan yang seru.", EN: "A fun spontaneous plan."}.Normalize(),
				Note: dto.LocalizedText{
					ID: "Semoga banyak perjalanan baru yang kita jelajahi sebagai pasangan.",
					EN: "May we explore many more new journeys together as a couple.",
				}.Normalize(),
			},
		},
		MapPoints: []dto.AnniversaryMapPoint{
			{
				Title: dto.LocalizedText{ID: "Tempat Janji Kita", EN: "Where We Promised Forever"}.Normalize(),
				Note: dto.LocalizedText{
					ID: "Di sini, aku yakin perjalanan ini ingin aku jalani bersamamu sampai tua.",
					EN: "Here, I knew I wanted to walk this journey with you until we grow old.",
				}.Normalize(),
				Lat: -5.4256121,
				Lng: 105.2385326,
			},
			{
				Title: dto.LocalizedText{ID: "Sudut Favorit Kita", EN: "Our Favorite Corner"}.Normalize(),
				Note: dto.LocalizedText{
					ID: "Tempat sederhana yang selalu berhasil bikin hati kita tenang.",
					EN: "A simple place that always makes our hearts feel calm.",
				}.Normalize(),
				Lat: -6.2441557,
				Lng: 106.7974447,
			},
			{
				Title: dto.LocalizedText{ID: "Rencana Mimpi Baru", EN: "Where New Dreams Began"}.Normalize(),
				Note: dto.LocalizedText{
					ID: "Dari titik ini, kita mulai merancang banyak mimpi kecil bersama.",
					EN: "From this point, we started planning many little dreams together.",
				}.Normalize(),
				Lat: -6.2618394,
				Lng: 106.7925383,
			},
		},
		GalleryPhotos: []dto.AnniversaryGalleryPhoto{},
		GalleryVideos: []dto.AnniversaryGalleryVideo{},
		Moments: []dto.AnniversaryMoment{
			{
				Year: 1,
				Title: dto.LocalizedText{
					ID: "Anniversary Pertama",
					EN: "First Anniversary",
				}.Normalize(),
				Date: "2026-04-27",
				Note: dto.LocalizedText{
					ID: "Satu tahun pertama bersama: My another Z, I'm YourZ.",
					EN: "Our very first year together: My another Z, I'm YourZ.",
				}.Normalize(),
			},
			{
				Year: 2,
				Title: dto.LocalizedText{
					ID: "Anniversary Kedua",
					EN: "Second Anniversary",
				}.Normalize(),
				Date: "2027-04-27",
				Note: dto.LocalizedText{
					ID: "Saatnya menambah cerita baru dan merayakan pertumbuhan kita sebagai tim.",
					EN: "Time to add new stories and celebrate how we grow as a team.",
				}.Normalize(),
			},
			{
				Year: 3,
				Title: dto.LocalizedText{
					ID: "Anniversary Ketiga",
					EN: "Third Anniversary",
				}.Normalize(),
				Date: "2028-04-27",
				Note: dto.LocalizedText{
					ID: "Tetap bertumbuh, tetap saling memilih, dan tetap pulang pada cinta yang sama.",
					EN: "Keep growing, keep choosing each other, and keep coming home to the same love.",
				}.Normalize(),
			},
		},
	}
}

func anniversaryDateForYear(weddingDate time.Time, yearNumber int, loc *time.Location) string {
	year := weddingDate.Year() + yearNumber
	anniversary := time.Date(year, weddingDate.Month(), weddingDate.Day(), 0, 0, 0, 0, loc)
	return anniversary.Format(dateLayout)
}

func fallbackLocalized(value, fallback dto.LocalizedText) dto.LocalizedText {
	normalized := value.Normalize()
	if normalized.IsEmpty() {
		return fallback.Normalize()
	}
	return normalized
}

func truncateString(value string, max int) string {
	trimmed := strings.TrimSpace(value)
	if max <= 0 || trimmed == "" {
		return trimmed
	}

	runes := []rune(trimmed)
	if len(runes) <= max {
		return trimmed
	}
	return strings.TrimSpace(string(runes[:max]))
}

func truncateLocalized(value dto.LocalizedText, max int) dto.LocalizedText {
	normalized := value.Normalize()
	normalized.ID = truncateString(normalized.ID, max)
	normalized.EN = truncateString(normalized.EN, max)
	return normalized.Normalize()
}

var _ interfaceanniversary.RepoAnniversaryInterface = (*repo)(nil)
