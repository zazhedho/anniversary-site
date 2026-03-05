CREATE TABLE IF NOT EXISTS anniversary_site_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    payload JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_anniversary_site_configs_config_key
    ON anniversary_site_configs(config_key);

INSERT INTO anniversary_site_configs (id, config_key, payload, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'default',
    $json$
{
  "brand": "My another Z • I'm YourZ",
  "letter": {
    "en": "For Zaqia Khana Meriza, thank you for being my safest home. On our first anniversary, I still choose you every day. My another Z, I'm YourZ, today and always.",
    "id": "Untuk Zaqia Khana Meriza, terima kasih sudah menjadi rumah terbaikku. Di anniversary pertama ini, aku tetap memilihmu setiap hari. My another Z, I'm YourZ, hari ini dan seterusnya."
  },
  "timeline": [
    {
      "title": {
        "en": "The Beginning as One",
        "id": "Awal Menjadi Satu"
      },
      "description": {
        "en": "The day we said our vows and started the most personal journey of our lives.",
        "id": "Hari di mana janji diucapkan, sekaligus titik awal petualangan paling personal dalam hidup kita."
      }
    },
    {
      "title": {
        "en": "Growing Together",
        "id": "Belajar Bersama"
      },
      "description": {
        "en": "From little things to big decisions, we support each other and grow as a team.",
        "id": "Dari hal kecil sampai keputusan besar, kita saling menguatkan dan bertumbuh sebagai tim."
      }
    },
    {
      "title": {
        "en": "Choosing Each Other Every Day",
        "id": "Tetap Memilih Satu Sama Lain"
      },
      "description": {
        "en": "In every situation, the best home is still found in our togetherness.",
        "id": "Di setiap kondisi, rumah terbaik tetap ada pada kebersamaan kita berdua."
      }
    }
  ],
  "cover_cta": {
    "en": "Start The Journey",
    "id": "Mulai Perjalanan"
  },
  "music_url": "https://image2url.com/r2/default/audio/1772528386754-8843de09-d7af-4507-819e-25b5e428694c.mp3",
  "hero_title": {
    "en": "Happy 1st Anniversary, My Another Z",
    "id": "Selamat Anniversary Pertama, My Another Z"
  },
  "map_points": [
    {
      "lat": -5.4256121,
      "lng": 105.2385326,
      "note": {
        "en": "Here, I knew I wanted to walk this journey with you until we grow old.",
        "id": "Di sini, aku yakin perjalanan ini ingin aku jalani bersamamu sampai tua."
      },
      "title": {
        "en": "Where We Promised Forever",
        "id": "Tempat Janji Kita"
      }
    },
    {
      "lat": -6.2441557,
      "lng": 106.7974447,
      "note": {
        "en": "A simple place that always makes our hearts feel calm.",
        "id": "Tempat sederhana yang selalu berhasil bikin hati kita tenang."
      },
      "title": {
        "en": "Our Favorite Corner",
        "id": "Sudut Favorit Kita"
      }
    },
    {
      "lat": -6.2618394,
      "lng": 106.7925383,
      "note": {
        "en": "From this point, we started planning many little dreams together.",
        "id": "Dari titik ini, kita mulai merancang banyak mimpi kecil bersama."
      },
      "title": {
        "en": "Where New Dreams Began",
        "id": "Rencana Mimpi Baru"
      }
    }
  ],
  "cover_badge": "My another Z • I'm YourZ",
  "cover_title": {
    "en": "For My another Z",
    "id": "Untuk My another Z"
  },
  "cover_subtext": {
    "en": "I prepared a little journey for you. No need to rush, just start and follow the flow.",
    "id": "Aku sudah menyiapkan perjalanan kecil untukmu. Tidak perlu buru-buru, cukup klik mulai dan ikuti alurnya."
  },
  "footer_text": {
    "en": "Made by Zaidus Zhuhur for Zaqia Khana Meriza, on our first anniversary.",
    "id": "Dibuat oleh Zaidus Zhuhur untuk Zaqia Khana Meriza, di anniversary pertama kita."
  },
  "couple_names": "Zaidus Zhuhur & Zaqia Khana Meriza",
  "hero_subtext": {
    "en": "This first anniversary is the first chapter of our official journey as husband and wife. Since April 27, 2025, every step has felt more meaningful because we walk it together.",
    "id": "First anniversary ini jadi bab pertama perjalanan resmi kita sebagai suami istri. Dari 27 April 2025 sampai hari ini, setiap langkah kita selalu terasa lebih berarti karena dijalani berdua."
  },
  "memory_cards": [
    {
      "note": {
        "en": "Thank you for always being the reason I smile on ordinary days.",
        "id": "Terima kasih selalu jadi alasan aku tersenyum di hari-hari biasa."
      },
      "title": "Morning Coffee",
      "summary": {
        "en": "A tiny moment that always feels warm.",
        "id": "Momen kecil yang bikin hangat."
      }
    },
    {
      "note": {
        "en": "We may be tired, but we always end the night with calmer hearts.",
        "id": "Kita mungkin capek, tapi selalu pulang dengan hati yang lebih tenang."
      },
      "title": "Late Night Talks",
      "summary": {
        "en": "Long conversations before sleep.",
        "id": "Cerita panjang sebelum tidur."
      }
    },
    {
      "note": {
        "en": "May we explore many more new journeys together as a couple.",
        "id": "Semoga banyak perjalanan baru yang kita jelajahi sebagai pasangan."
      },
      "title": "Weekend Escape",
      "summary": {
        "en": "A fun spontaneous plan.",
        "id": "Rencana spontan yang seru."
      }
    }
  ],
  "wedding_date": "2025-04-27",
  "annual_moments": [
    {
      "date": "2026-04-27",
      "note": {
        "en": "Our very first year together: My another Z, I'm YourZ.",
        "id": "Satu tahun pertama bersama: My another Z, I'm YourZ."
      },
      "year": 1,
      "title": {
        "en": "First Anniversary",
        "id": "Anniversary Pertama"
      }
    },
    {
      "date": "2027-04-27",
      "note": {
        "en": "Time to add new stories and celebrate how we grow as a team.",
        "id": "Saatnya menambah cerita baru dan merayakan pertumbuhan kita sebagai tim."
      },
      "year": 2,
      "title": {
        "en": "Second Anniversary",
        "id": "Anniversary Kedua"
      }
    },
    {
      "date": "2028-04-27",
      "note": {
        "en": "Keep growing, keep choosing each other, and keep coming home to the same love.",
        "id": "Tetap bertumbuh, tetap saling memilih, dan tetap pulang pada cinta yang sama."
      },
      "year": 3,
      "title": {
        "en": "Third Anniversary",
        "id": "Anniversary Ketiga"
      }
    }
  ],
  "gallery_photos": [],
  "gallery_videos": [],
  "voice_note_url": ""
}
    $json$::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM anniversary_site_configs);
