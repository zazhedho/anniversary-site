package anniversary

import (
	"fmt"
	"sort"
	"time"
)

func BuildPublicPayload(cfg SiteConfig, now time.Time, loc *time.Location) (PublicPayload, error) {
	if loc == nil {
		loc = time.FixedZone("WIB", 7*60*60)
	}

	weddingDate, err := time.ParseInLocation(dateLayout, cfg.WeddingDate, loc)
	if err != nil {
		return PublicPayload{}, fmt.Errorf("failed parsing wedding date: %w", err)
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

	countdown := Countdown{}
	if !isToday {
		diff := nextDate.Sub(now)
		if diff < 0 {
			diff = 0
		}
		countdown = breakdownDuration(diff)
	}

	momentViews := make([]AnnualMomentView, 0, len(cfg.Moments))
	for _, moment := range cfg.Moments {
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

		momentViews = append(momentViews, AnnualMomentView{
			Year:   moment.Year,
			Title:  moment.Title,
			Date:   moment.Date,
			Note:   moment.Note,
			Status: status,
		})
	}

	sort.Slice(momentViews, func(i, j int) bool {
		return momentViews[i].Year < momentViews[j].Year
	})

	payload := PublicPayload{
		Config: cfg,
		Next: NextAnniversary{
			Number:     nextNumber,
			Label:      fmt.Sprintf("Anniversary ke-%d", nextNumber),
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

func breakdownDuration(duration time.Duration) Countdown {
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

	return Countdown{Days: days, Hours: hours, Minutes: minutes, Seconds: seconds}
}
