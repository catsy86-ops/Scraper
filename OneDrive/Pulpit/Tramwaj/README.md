# 🦆 KaczTransit — Szczecin Tram Buddy

Aplikacja PWA do sprawdzania rozkładów jazdy tramwajów i autobusów ZDiTM Szczecin w czasie rzeczywistym.

## Funkcje

- 📍 Wyszukiwanie połączeń (bezpośrednich i z przesiadką)
- 🚊 Lista wszystkich linii tramwajowych i autobusowych
- 🗺️ Mapa na żywo z pojazdami (GTFS-RT)
- ⏱️ Dane czasu rzeczywistego: opóźnienia, alerty, pojazdy
- ⭐ Ulubione linie z powiadomieniami
- 🌙 Tryb ciemny
- 📱 Mobile-first UI z bottom nawigacją

## Tech stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Framer Motion
- Leaflet (mapy)
- GTFS + GTFS-RT (ZDiTM Szczecin)

## Uruchomienie

```bash
npm install
npm run dev
```

Aplikacja uruchomi się na `http://localhost:8080`.

## Dane

Źródło: [ZDiTM Szczecin (GTFS)](https://www.zditm.szczecin.pl/pl/zditm/dla-programistow/gtfs) · Licencja CC0 1.0

## Repozytorium

[github.com/catsy86-ops/szczecin-tram-buddy](https://github.com/catsy86-ops/szczecin-tram-buddy)
