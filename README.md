# FinanzCoach

Einfache Lernapp für einen 16-jährigen KV-Lernenden im ersten Lehrjahr in Zürich. Neun Lernziele aus dem vom Nutzer bereitgestellten Chat: Lohnabrechnung, Sozialversicherungsbeiträge, Brutto/Netto, private Verschuldung, Privatkonkurs, Schuldenfallen und Leasing.

## Nutzen

- Neun kurze Lektionen mit Beispielen, Merksätzen, freiem Erklären und Kurz-Check
- 45 Fragen, zufällige Übungsrunden, gezielte Fehlerwiederholung
- Probetest mit zwölf Fragen: alle neun Lernziele und drei Rechenaufgaben
- Lohn- und Leasingrechner mit transparenten Annahmen
- Browserlokaler Lernfortschritt; keine Anmeldung innerhalb der App
- Eigenständige HTML-Version für die Offline-Nutzung

## Lokal starten

`python -m http.server 4173 --directory dist`

Die Anwendung hat keinen Build und keine JavaScript-Abhängigkeiten. `node scripts/package-offline.mjs` erzeugt die Offline-Datei aus dem aktuellen Quellstand.

## Inhalt

Schweizer Regeln und Beitragssätze am 27.10.2026 anhand offizieller Quellen geprüft. Quellen sind in der App verlinkt. Beträge und NBU-Sätze in Beispielen sind Annahmen. Mit 16 werden noch keine AHV/IV/EO- und ALV-Beiträge erhoben; Beginn am 1. Januar im Jahr des 18. Geburtstags. Das beschlossene neue Sanierungsverfahren ist noch nicht in Kraft.

Fortschritt liegt in localStorage (`finanzcoach-v1`). Kein konto- oder geräteübergreifender Abgleich. Eine laufende Quizrunde bleibt nur im Arbeitsspeicher der geöffneten Seite. Die Offline-Datei kann je nach Browser einen eigenen Speicherbereich nutzen.
