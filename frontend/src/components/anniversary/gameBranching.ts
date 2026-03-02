export type RomanticBranch = "instant" | "playful" | "dramatic";

export function resolveRomanticBranch(noCount: number): RomanticBranch {
  if (noCount >= 6) return "dramatic";
  if (noCount >= 1) return "playful";
  return "instant";
}

export function romanticTagKey(branch: RomanticBranch): string {
  if (branch === "dramatic") return "showcase.game.romanticTagDramatic";
  if (branch === "playful") return "showcase.game.romanticTagPlayful";
  return "showcase.game.romanticTagInstant";
}

export function romanticLineKeys(branch: RomanticBranch): string[] {
  if (branch === "dramatic") {
    return [
      "showcase.game.romanticDramaticLine1",
      "showcase.game.romanticDramaticLine2",
      "showcase.game.romanticDramaticLine3",
    ];
  }

  if (branch === "playful") {
    return [
      "showcase.game.romanticPlayfulLine1",
      "showcase.game.romanticPlayfulLine2",
      "showcase.game.romanticPlayfulLine3",
    ];
  }

  return [
    "showcase.game.romanticInstantLine1",
    "showcase.game.romanticInstantLine2",
    "showcase.game.romanticInstantLine3",
  ];
}
