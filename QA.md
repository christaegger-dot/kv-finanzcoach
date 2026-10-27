# Prüfung · 27.10.2026

## Bestanden

- Alle neun Lernziele rendern; Abschluss erst nach richtigem Kurz-Check
- Falsche Antworten, Wiederholung und Browserpersistenz
- Lohnbeispiele: CHF 990 mit 16, CHF 926 mit Beitragspflicht; weiteres Beispiel mit 1,5 % NBU
- Leasing: CHF 29’400 insgesamt, CHF 612.50/Monat; Nullwerte ohne NaN
- Vollständiger Test: zwölf Fragen, absichtlich ein Fehler, korrekt 11/12 bzw. 92 %, gezielte Wiederholung
- Acht Screens bei 360, 390, 768, 1024 und 1440 px ohne horizontalen Seitenüberlauf
- Dialoge, Rücksetzen, beschädigte gespeicherte Daten, blockierter localStorage
- Standalone-HTML mit blockierten zusätzlichen Ressourcen: Startseite und Lohnrechner funktionieren ohne externe Dateien
- axe-core: keine WCAG 2 A/AA oder WCAG 2.1 AA Verstösse auf Übersicht, Lernpfad, Lektion 2, Übungsübersicht, Teststart und beiden Rechnern
- Keine JavaScript-Laufzeitfehler während der Prüfungen
- Desktop- und Mobilansicht visuell kontrolliert

## Grenze der Prüfung

Direktes Öffnen von `file://` wird vom verwalteten Browser administrativ blockiert. Die Offline-Datei wurde daher als einzelnes HTML-Dokument über den lokalen Server mit sämtlichen zusätzlichen Ressourcen blockiert geprüft. Die Offline-Version nutzt Systemschriften. Das Speichern bei lokalen Dateien hängt vom Browser ab.

## Ausführen

`node scripts/qa.mjs` im verwendeten Prüfcontainer (Playwright und axe-core werden aus dessen vorhandener Installation geladen).
