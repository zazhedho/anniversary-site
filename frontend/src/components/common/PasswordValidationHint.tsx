import { useMemo } from "react";
import { useLanguage } from "../../contexts/LocaleContext";
import {
  countPasswordRules,
  getPasswordStrength,
  type PasswordStrength,
  validatePassword,
} from "../../utils/passwordValidation";

type PasswordValidationHintProps = {
  password: string;
  confirmPassword?: string;
  showMatchHint?: boolean;
};

function strengthColor(level: PasswordStrength): string {
  if (level === "weak") return "#dc2626";
  if (level === "fair") return "#d97706";
  if (level === "good") return "#16a34a";
  if (level === "strong") return "#15803d";
  return "#cbd5e1";
}

export default function PasswordValidationHint({
  password,
  confirmPassword = "",
  showMatchHint = false,
}: PasswordValidationHintProps) {
  const { t } = useLanguage();
  const validation = useMemo(() => validatePassword(password), [password]);
  const passed = countPasswordRules(validation);
  const strength = getPasswordStrength(passed);
  const progressWidth = `${(passed / 5) * 100}%`;

  if (!password && !(showMatchHint && confirmPassword)) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#9c4f46]/20 bg-white/60 p-3">
      {password ? (
        <>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#eadad3]">
            <div
              className="h-full transition-all duration-300"
              style={{ width: progressWidth, backgroundColor: strengthColor(strength) }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: strengthColor(strength) }}>
              {t(`password.strength.${strength}`)}
            </p>
            <p className="text-xs text-[#2b2220]/65">{t("password.rulesProgress", { count: passed, total: 5 })}</p>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
            {[
              ["password.rule.minLength", validation.minLength],
              ["password.rule.lowercase", validation.hasLowercase],
              ["password.rule.uppercase", validation.hasUppercase],
              ["password.rule.number", validation.hasNumber],
              ["password.rule.symbol", validation.hasSymbol],
            ].map(([key, ok]) => (
              <p key={String(key)} className={ok ? "text-emerald-700" : "text-[#2b2220]/60"}>
                {ok ? "✓" : "○"} {t(String(key))}
              </p>
            ))}
          </div>
        </>
      ) : null}

      {showMatchHint && confirmPassword ? (
        <p className={`mt-2 text-xs font-semibold ${password === confirmPassword ? "text-emerald-700" : "text-red-700"}`}>
          {password === confirmPassword ? `✓ ${t("password.match")}` : `○ ${t("password.mismatch")}`}
        </p>
      ) : null}
    </div>
  );
}
