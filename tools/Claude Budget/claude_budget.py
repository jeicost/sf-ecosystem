#!/usr/bin/env python3
import rumps
import json
import os
import subprocess
from datetime import datetime

CONFIG_PATH = os.path.expanduser("~/.claude_budget.json")

DEFAULT_CONFIG = {
    "loaded_credit": 0.0,
    "current_usage": 0.0,
    "last_updated": None,
    "alert_sent": False,
    "session_started": None,
    "session_hours": 5,
    "week_reset_day": 1,
    "weekly_usage": 0.0,
    "weekly_limit": 0.0,
    "api_usage": 0.0,
    "api_budget": 0.0,
}

DAY_NAMES = {1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 7: "Dom"}


def load_config():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH) as f:
            return {**DEFAULT_CONFIG, **json.load(f)}
    return DEFAULT_CONFIG.copy()


def save_config(cfg):
    with open(CONFIG_PATH, "w") as f:
        json.dump(cfg, f, indent=2)


def days_until(reset_day):
    today = datetime.now().isoweekday()
    diff = (reset_day - today) % 7
    return diff if diff > 0 else 7


def ask(title, message, default=""):
    d = str(default).replace("\\", "\\\\").replace('"', '\\"')
    m = message.replace("\\", "\\\\").replace('"', '\\"')
    t = title.replace("\\", "\\\\").replace('"', '\\"')
    script = (
        f'tell application "System Events"\n'
        f'  display dialog "{m}" default answer "{d}" '
        f'with title "{t}" buttons {{"Cancelar", "OK"}} default button "OK"\n'
        f'end tell'
    )
    r = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
    if r.returncode == 0 and "text returned:" in r.stdout:
        return r.stdout.strip().split("text returned:")[-1].strip()
    return None


class ClaudeBudgetApp(rumps.App):
    def __init__(self):
        super().__init__("Claude $", quit_button=None)
        self.cfg = load_config()

        self._mi_balance = rumps.MenuItem("  Configura tu saldo")
        self._mi_session = rumps.MenuItem("  Sin sesión activa")
        self._mi_weekly  = rumps.MenuItem("  —")
        self._mi_api     = rumps.MenuItem("  Sin datos")
        self._mi_footer  = rumps.MenuItem("  Sin actualizar aún")

        self.menu = [
            rumps.MenuItem("SALDO PROPIO"),
            self._mi_balance,
            rumps.MenuItem("  Actualizar gasto...",   callback=self._update_usage),
            rumps.MenuItem("  Cambiar saldo...",       callback=self._set_credit),
            None,
            rumps.MenuItem("SESIÓN"),
            self._mi_session,
            rumps.MenuItem("  Marcar inicio ahora",   callback=self._mark_session),
            rumps.MenuItem("  Config horas...",        callback=self._config_session),
            None,
            rumps.MenuItem("SEMANA"),
            self._mi_weekly,
            rumps.MenuItem("  Actualizar semanal...", callback=self._update_weekly),
            rumps.MenuItem("  Config semana...",       callback=self._config_weekly),
            None,
            rumps.MenuItem("API ANTHROPIC"),
            self._mi_api,
            rumps.MenuItem("  Actualizar uso API...", callback=self._update_api),
            rumps.MenuItem("  Config presupuesto...", callback=self._config_api),
            None,
            self._mi_footer,
            None,
            rumps.MenuItem("Salir", callback=rumps.quit_application),
        ]

        self._refresh()
        self._timer = rumps.Timer(self._tick, 60)
        self._timer.start()

    def _tick(self, _):
        self._refresh()

    def _refresh(self):
        self._refresh_title()
        self._refresh_balance()
        self._refresh_session()
        self._refresh_weekly()
        self._refresh_api()
        self._refresh_footer()
        self._check_alert()

    def _refresh_title(self):
        loaded = self.cfg["loaded_credit"]
        used   = self.cfg["current_usage"]
        if loaded > 0:
            rem = max(0.0, loaded - used)
            pct = round((1.0 - min(1.0, used / loaded)) * 100)
            self.title = f"${rem:.2f} ({pct}%)"
        else:
            self.title = "Claude $"

    def _refresh_balance(self):
        loaded = self.cfg["loaded_credit"]
        used   = self.cfg["current_usage"]
        if loaded > 0:
            pct = round(min(1.0, used / loaded) * 100)
            rem = max(0.0, loaded - used)
            self._mi_balance.title = f"  ${used:.2f} gastado / ${rem:.2f} restantes ({pct}%)"
        else:
            self._mi_balance.title = "  Configura tu saldo →"

    def _refresh_session(self):
        if not self.cfg["session_started"]:
            self._mi_session.title = "  Sin sesión activa"
            return
        start     = datetime.fromisoformat(self.cfg["session_started"])
        total_min = self.cfg["session_hours"] * 60
        elapsed   = (datetime.now() - start).total_seconds() / 60
        if elapsed >= total_min:
            self._mi_session.title = "  ✓ Sesión expirada — ventana libre"
            return
        rem    = total_min - elapsed
        rh, rm = int(rem // 60), int(rem % 60)
        pct    = round(elapsed / total_min * 100)
        self._mi_session.title = f"  {rh}h {rm:02d}m restantes ({pct}% usado)"

    def _refresh_weekly(self):
        used  = self.cfg["weekly_usage"]
        limit = self.cfg["weekly_limit"]
        rd    = self.cfg["week_reset_day"]
        dl    = days_until(rd)
        day   = DAY_NAMES.get(rd, "—")
        if limit > 0:
            pct = round(min(1.0, used / limit) * 100)
            self._mi_weekly.title = f"  ${used:.2f} / ${limit:.2f} ({pct}%)  — reset {day} en {dl}d"
        else:
            self._mi_weekly.title = f"  Reset: {day} (en {dl} días)"

    def _refresh_api(self):
        used   = self.cfg["api_usage"]
        budget = self.cfg["api_budget"]
        if used == 0 and budget == 0:
            self._mi_api.title = "  Sin datos configurados"
        elif budget > 0:
            rem = max(0.0, budget - used)
            pct = round(min(1.0, used / budget) * 100)
            self._mi_api.title = f"  ${used:.2f} / ${budget:.2f} ({pct}%)  — quedan ${rem:.2f}"
        else:
            self._mi_api.title = f"  ${used:.2f} este mes"

    def _refresh_footer(self):
        if self.cfg["last_updated"]:
            dt   = datetime.fromisoformat(self.cfg["last_updated"])
            mins = round((datetime.now() - dt).total_seconds() / 60)
            ago  = f"{mins}m" if mins < 60 else f"{mins // 60}h {mins % 60}m"
            self._mi_footer.title = f"  Actualizado hace {ago}"
        else:
            self._mi_footer.title = "  Sin actualizar aún"

    def _check_alert(self):
        loaded = self.cfg["loaded_credit"]
        if loaded <= 0:
            return
        ratio_left = 1.0 - min(1.0, self.cfg["current_usage"] / loaded)
        if ratio_left < 0.20 and not self.cfg.get("alert_sent"):
            rem = max(0.0, loaded - self.cfg["current_usage"])
            rumps.notification(
                "Claude Budget — Saldo bajo",
                f"Te quedan ${rem:.2f} de ${loaded:.2f}",
                f"Has usado el {round((1 - ratio_left) * 100)}% del saldo cargado.",
            )
            self.cfg["alert_sent"] = True
            save_config(self.cfg)
        elif ratio_left >= 0.20 and self.cfg.get("alert_sent"):
            self.cfg["alert_sent"] = False
            save_config(self.cfg)

    # ── Balance ─────────────────────────────────────────────────────

    def _update_usage(self, _):
        v = ask("Gasto actual",
                "Gasto acumulado este mes (USD)\nVer en: claude.ai/settings/usage",
                f"{self.cfg['current_usage']:.2f}")
        if v is not None:
            try:
                self.cfg["current_usage"] = float(v)
                self.cfg["last_updated"]   = datetime.now().isoformat()
                save_config(self.cfg)
                self._refresh()
            except ValueError:
                rumps.alert("Error", "Valor inválido. Ej: 43.18")

    def _set_credit(self, _):
        v = ask("Saldo cargado",
                "¿Cuánto saldo has cargado este mes? (USD)",
                f"{self.cfg['loaded_credit']:.2f}")
        if v is not None:
            try:
                self.cfg["loaded_credit"] = float(v)
                self.cfg["alert_sent"]     = False
                save_config(self.cfg)
                self._refresh()
            except ValueError:
                rumps.alert("Error", "Valor inválido. Ej: 45.00")

    # ── Session ─────────────────────────────────────────────────────

    def _mark_session(self, _):
        self.cfg["session_started"] = datetime.now().isoformat()
        save_config(self.cfg)
        self._refresh()

    def _config_session(self, _):
        v = ask("Duración sesión",
                "Horas por ventana (Claude Pro usa 5h):",
                str(self.cfg["session_hours"]))
        if v is not None:
            try:
                h = float(v)
                if 0 < h <= 24:
                    self.cfg["session_hours"] = h
                    save_config(self.cfg)
                    self._refresh()
            except ValueError:
                pass

    # ── Weekly ──────────────────────────────────────────────────────

    def _update_weekly(self, _):
        v = ask("Uso semanal",
                "Uso semanal acumulado (USD)\nVer en: claude.ai/settings/usage",
                f"{self.cfg['weekly_usage']:.2f}")
        if v is not None:
            try:
                self.cfg["weekly_usage"] = float(v)
                save_config(self.cfg)
                self._refresh()
            except ValueError:
                rumps.alert("Error", "Valor inválido")

    def _config_weekly(self, _):
        v = ask("Config semana",
                "Límite semanal y día de reset (coma)\n"
                "Días: 1=Lun 2=Mar 3=Mié 4=Jue 5=Vie 6=Sáb 7=Dom\n"
                "Ej: 20, 1",
                f"{self.cfg['weekly_limit']:.2f}, {self.cfg['week_reset_day']}")
        if v is not None:
            try:
                parts = v.split(",")
                self.cfg["weekly_limit"]   = float(parts[0].strip())
                self.cfg["week_reset_day"] = int(parts[1].strip()) if len(parts) > 1 else 1
                save_config(self.cfg)
                self._refresh()
            except (ValueError, IndexError):
                rumps.alert("Error", "Formato: 20, 1")

    # ── API ─────────────────────────────────────────────────────────

    def _update_api(self, _):
        v = ask("Uso API",
                "Uso API Anthropic este mes (USD)\nVer en: console.anthropic.com → Usage",
                f"{self.cfg['api_usage']:.2f}")
        if v is not None:
            try:
                self.cfg["api_usage"] = float(v)
                save_config(self.cfg)
                self._refresh()
            except ValueError:
                rumps.alert("Error", "Valor inválido")

    def _config_api(self, _):
        v = ask("Presupuesto API",
                "Presupuesto mensual API Anthropic (USD)\n(0 = sin límite)",
                f"{self.cfg['api_budget']:.2f}")
        if v is not None:
            try:
                self.cfg["api_budget"] = float(v)
                save_config(self.cfg)
                self._refresh()
            except ValueError:
                rumps.alert("Error", "Valor inválido")


if __name__ == "__main__":
    ClaudeBudgetApp().run()
