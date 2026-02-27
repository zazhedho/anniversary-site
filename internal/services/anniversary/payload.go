package serviceanniversary

import (
	"anniversary-site/internal/dto"
	"fmt"
	"sort"
	"strings"
	"time"
)

const dateLayout = "2006-01-02"

func BuildPublicPayload(cfg dto.AnniversarySiteConfig, now time.Time, loc *time.Location, language string) (dto.AnniversaryPublicPayload, error) {
	if loc == nil {
		loc = time.FixedZone("WIB", 7*60*60)
	}
	language = normalizeLanguage(language)

	weddingDate, err := time.ParseInLocation(dateLayout, cfg.WeddingDate, loc)
	if err != nil {
		return dto.AnniversaryPublicPayload{}, fmt.Errorf("failed parsing wedding date: %w", err)
	}

	now = now.In(loc)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

	nextDate := time.Date(now.Year(), weddingDate.Month(), weddingDate.Day(), 0, 0, 0, 0, loc)
	isToday := now.Month() == weddingDate.Month() && now.Day() == weddingDate.Day()
	if !isToday && !nextDate.After(today) {
		nextDate = nextDate.AddDate(1, 0, 0)
	}

	nextNumber := nextDate.Year() - weddingDate.Year()
	if nextNumber < 1 {
		nextNumber = 1
	}

	countdown := dto.AnniversaryCountdown{}
	if !isToday {
		diff := nextDate.Sub(now)
		if diff < 0 {
			diff = 0
		}
		countdown = breakdownDuration(diff)
	}

	momentViews := make([]dto.AnniversaryMomentView, 0, len(cfg.Moments))
	for _, moment := range cfg.Moments {
		// Progressive reveal: hide future annual moments beyond the current anniversary phase.
		if moment.Year > nextNumber {
			continue
		}

		momentDate, err := time.ParseInLocation(dateLayout, moment.Date, loc)
		if err != nil {
			continue
		}

		status := "upcoming"
		if momentDate.Before(today) {
			status = "done"
		}
		if momentDate.Equal(today) {
			status = "today"
		}

		momentViews = append(momentViews, dto.AnniversaryMomentView{
			Year:   moment.Year,
			Title:  moment.Title.Value(language),
			Date:   moment.Date,
			Note:   moment.Note.Value(language),
			Status: status,
		})
	}

	sort.Slice(momentViews, func(i, j int) bool {
		return momentViews[i].Year < momentViews[j].Year
	})

	publicConfig := dto.AnniversaryPublicSiteConfig{
		Brand:        cfg.Brand.Value(language),
		CoupleNames:  cfg.CoupleNames.Value(language),
		WeddingDate:  cfg.WeddingDate,
		CoverBadge:   cfg.CoverBadge.Value(language),
		CoverTitle:   cfg.CoverTitle.Value(language),
		CoverSubtext: cfg.CoverSubtext.Value(language),
		CoverCTA:     cfg.CoverCTA.Value(language),
		HeroTitle:    cfg.HeroTitle.Value(language),
		HeroSubtext:  cfg.HeroSubtext.Value(language),
		Letter:       cfg.Letter.Value(language),
		FooterText:   cfg.FooterText.Value(language),
		MusicURL:     cfg.MusicURL,
		Timeline:     make([]dto.AnniversaryPublicTimelineItem, 0, len(cfg.Timeline)),
		MemoryCards:  make([]dto.AnniversaryPublicMemoryCard, 0, len(cfg.MemoryCards)),
		Moments:      make([]dto.AnniversaryPublicMoment, 0, len(cfg.Moments)),
	}

	for _, item := range cfg.Timeline {
		publicConfig.Timeline = append(publicConfig.Timeline, dto.AnniversaryPublicTimelineItem{
			Title:       item.Title.Value(language),
			Description: item.Description.Value(language),
		})
	}

	for _, item := range cfg.MemoryCards {
		publicConfig.MemoryCards = append(publicConfig.MemoryCards, dto.AnniversaryPublicMemoryCard{
			Title:   item.Title.Value(language),
			Summary: item.Summary.Value(language),
			Note:    item.Note.Value(language),
		})
	}

	for _, item := range cfg.Moments {
		publicConfig.Moments = append(publicConfig.Moments, dto.AnniversaryPublicMoment{
			Year:  item.Year,
			Title: item.Title.Value(language),
			Date:  item.Date,
			Note:  item.Note.Value(language),
		})
	}

	payload := dto.AnniversaryPublicPayload{
		Config: publicConfig,
		Next: dto.AnniversaryNext{
			Number:     nextNumber,
			Label:      anniversaryLabel(nextNumber, language),
			Date:       nextDate.Format(dateLayout),
			TargetTime: nextDate.Format(time.RFC3339),
			IsToday:    isToday,
			Countdown:  countdown,
		},
		Moments:    momentViews,
		ServerTime: now.Format(time.RFC3339),
		Timezone:   loc.String(),
	}

	return payload, nil
}

func breakdownDuration(duration time.Duration) dto.AnniversaryCountdown {
	totalSeconds := int64(duration.Seconds())
	if totalSeconds < 0 {
		totalSeconds = 0
	}

	days := totalSeconds / (24 * 60 * 60)
	remaining := totalSeconds % (24 * 60 * 60)
	hours := remaining / (60 * 60)
	remaining = remaining % (60 * 60)
	minutes := remaining / 60
	seconds := remaining % 60

	return dto.AnniversaryCountdown{
		Days:    days,
		Hours:   hours,
		Minutes: minutes,
		Seconds: seconds,
	}
}

func normalizeLanguage(value string) string {
	if strings.EqualFold(strings.TrimSpace(value), "en") {
		return "en"
	}
	return "id"
}

func anniversaryLabel(number int, language string) string {
	if normalizeLanguage(language) == "en" {
		return fmt.Sprintf("Anniversary #%d", number)
	}
	return fmt.Sprintf("Anniversary ke-%d", number)
}
