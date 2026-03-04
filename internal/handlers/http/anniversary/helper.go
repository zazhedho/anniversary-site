package anniversary

import (
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"slices"
	"strings"
)

func normalizeUploadType(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "video":
		return "video"
	case "audio":
		return "audio"
	case "poster":
		return "poster"
	default:
		return "photo"
	}
}

func validateUploadFile(fileHeader *multipart.FileHeader, mediaType string) (string, string, error) {
	src, err := fileHeader.Open()
	if err != nil {
		return "", "", errors.New("failed opening upload file")
	}
	defer src.Close()

	header := make([]byte, 512)
	n, _ := io.ReadFull(src, header)
	detectedType := http.DetectContentType(header[:n])
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if ext == ".jpeg" {
		ext = ".jpg"
	}

	if mediaType == "video" {
		allowedVideoExt := []string{".mp4", ".webm", ".mov", ".m4v"}
		if !strings.HasPrefix(detectedType, "video/") && detectedType != "application/octet-stream" {
			return "", "", errors.New("video file type is not supported")
		}

		if ext == "" {
			ext = ".mp4"
		}
		if !slices.Contains(allowedVideoExt, ext) {
			return "", "", errors.New("video extension is not supported")
		}

		return detectedType, ext, nil
	}

	if mediaType == "audio" {
		allowedAudioExt := []string{".mp3", ".wav", ".ogg", ".m4a", ".aac"}
		if !strings.HasPrefix(detectedType, "audio/") && detectedType != "application/octet-stream" {
			return "", "", errors.New("audio file type is not supported")
		}

		if ext == "" {
			ext = ".mp3"
		}
		if !slices.Contains(allowedAudioExt, ext) {
			return "", "", errors.New("audio extension is not supported")
		}

		return detectedType, ext, nil
	}

	allowedImageExt := []string{".jpg", ".jpeg", ".png", ".webp", ".gif"}
	if !strings.HasPrefix(detectedType, "image/") && detectedType != "application/octet-stream" {
		return "", "", errors.New("image file type is not supported")
	}

	if ext == ".jpeg" {
		ext = ".jpg"
	}
	if ext == "" {
		ext = ".jpg"
	}
	if !slices.Contains(allowedImageExt, ext) {
		return "", "", errors.New("image extension is not supported")
	}

	return detectedType, ext, nil
}

func sanitizePathSegment(value string) string {
	normalized := strings.TrimSpace(strings.ToLower(value))
	if normalized == "" {
		return "default"
	}

	builder := strings.Builder{}
	builder.Grow(len(normalized))
	for _, char := range normalized {
		if (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char == '-' {
			builder.WriteRune(char)
		}
	}

	cleaned := strings.Trim(builder.String(), "-")
	if cleaned == "" {
		return "default"
	}

	for strings.Contains(cleaned, "--") {
		cleaned = strings.ReplaceAll(cleaned, "--", "-")
	}

	return cleaned
}
