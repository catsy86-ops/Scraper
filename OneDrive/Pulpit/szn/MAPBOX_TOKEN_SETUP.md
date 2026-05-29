# 🔑 Mapbox Token Setup — Instrukcja dla Mapy

## ⚠️ Problem: Mapa jest szara?

Jeśli mapa pokazuje szare/kolorowe tło zamiast prawdziwej mapy Szczecina, to znaczy że **brakuje Mapbox tokenu**.

**Rozwiązanie**: Dodaj darmowy token Mapbox w 2 minuty!

---

## 📋 Krok po Kroku

### Krok 1️⃣: Idź do Mapbox
Otwórz: https://account.mapbox.com/tokens

### Krok 2️⃣: Zaloguj się
- Jeśli masz konto → zaloguj się
- Jeśli nie masz → utwórz (darmowe)

### Krok 3️⃣: Skopiuj Token
1. Znajdź **"Default public token"**
2. Kliknij ikonę kopii
3. Token skopiowany! (zaczyna się od `pk.eyJ...`)

### Krok 4️⃣: Wklej w Aplikacji
1. Otwórz mapę: https://szn-theta.vercel.app
2. Zobaczysz okno **"🗺️ Konfiguracja Mapbox"**
3. Wklej token w pole
4. Kliknij **"✅ Zapisz Token"**
5. Strona się przeładuje
6. **BOOM! 🗺️ Mapa pojawia się!**

---

## 🎯 Alternatywny Sposób (Konsola)

Jeśli okno się nie pojawi, użyj konsoli przeglądarki:

**Otwórz Konsolę**: Naciśnij `F12` lub `Ctrl+Shift+I` → Console

**Wklej komendę**:
```javascript
localStorage.setItem('mapboxToken', 'pk.eyJ1IjoiYWxhbWEifQ...')
```

**Zastąp** `pk.eyJ1IjoiYWxhbWEifQ...` Twoim tokenem!

**Naciśnij Enter** i przeładuj stronę.

---

## ✅ Jak Wiedzieć Że Działa?

Po dodaniu tokenu:
- ✅ Mapa pokazuje ulice Szczecina
- ✅ Widzisz budynki 3D
- ✅ Można zoomować i obracać
- ✅ Pojawiają się markery POI
- ✅ Pełna funkcjonalność mapy

---

## ❓ Problemy?

### Token nie działa?
- Sprawdź czy naprawdę skopiałeś **Public Token**
- Nie ma problemów - spróbuj inny token
- Upewnij się że nie ma spacji na początku/końcu

### Mapa wciąż szara?
- Oczyść cache przeglądarki (Ctrl+Shift+Delete)
- Przeładuj stronę (Ctrl+R)
- Spróbuj innej przeglądarki

### Token nie wklejam się?
- Upewnij się że pole jest aktywne
- Spróbuj `Ctrl+V` zamiast prawego przycisku
- Odśwież stronę i spróbuj ponownie

---

## 🎨 Co się Dzieje Bez Tokenu?

Jeśli nie dodasz tokenu, aplikacja:
- ✅ Działa normalnie
- ✅ Pokazuje kolorowe tło zamiast mapy
- ✅ Wszystkie sekcje (Places, Routes, etc.) działają
- ❌ Brak interaktywnej mapy 3D
- ❌ Brak zoom/rotate mapy
- ❌ Brak markersów na mapie

---

## 💡 Czy Jest Darmowe?

**TAK!** 🎉

- Mapbox Public Token jest **100% darmowy**
- Pierwszych 50,000 map views miesięcznie = bez opłat
- Dla osobistych projektów = zawsze darmowe
- Bez karty kredytowej (chyba że chcesz więcej żądań)

---

## 🔄 Alternatywne Opcje (Bez Mapbox)

Jeśli nie chcesz zakładać konta Mapbox:

### Opcja 1: Kolorowe Tło
- Mapa pokazuje dynamiczne tło
- Wszystko inne działa normal
- Kliknij "🔑 Dodaj Token" aby włączyć mapę

### Opcja 2: Openstreetmap
- Możemy zmienić na darmową alternatywę
- Mniej szczegółów 3D
- Całkowicie darmowa

---

## 🚀 Szybkie Linki

- **Mapbox**: https://account.mapbox.com/tokens
- **Mapbox Dokumentacja**: https://docs.mapbox.com/mapbox-gl-js/
- **Bezpieczeństwo**: Token jest bezpieczny (public token tylko do czytu)

---

## 📱 W Aplikacji

Po dodaniu tokenu, będziesz mieć dostęp do:

### 🗺️ Mapa
- 3D budynki i teren
- Zoom do poziom 22
- Obrót i pitch
- 3 style (Standard, Satellite, Street)
- Interaktywne markery POI

### 🧭 Kontrolki
- 3D/2D toggle
- Satelita view
- Lokalizacja GPS
- Animacja lotu
- Google Street View

### 📍 Markery
- 12 POI (Miejsca Interesów)
- Kolorowe kategorie
- Popup informacji
- Kliknięcie = details

---

## 🎯 Podsumowanie

| Krok | Opis | Czas |
|------|------|------|
| 1 | Idź do Mapbox | 10 sec |
| 2 | Zaloguj się | 30 sec |
| 3 | Skopiuj token | 10 sec |
| 4 | Wklej w app | 20 sec |
| 5 | Reload strony | 10 sec |
| **Razem** | **~90 sekund** | ⏱️ |

---

## ✨ I to wszystko!

Teraz masz **pełną, interaktywną mapę 3D Szczecina** z:
- 🏢 3D budynkami
- 🗺️ Ulicami i parkami
- 📍 12 místami POI
- 🚶 3 trasami spacerowe
- 🧭 Google Street View
- 🎭 Interaktywną kaczką Pogoni! 🦆

**Miłej zabawy!** 🚀

---

**Status**: ✅ Live & Working  
**Last Updated**: May 29, 2026  
**Version**: 1.0
