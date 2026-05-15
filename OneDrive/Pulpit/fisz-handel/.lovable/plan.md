Aplikacja "u Fisza" jest już bardzo rozbudowana (oferty, obserwowanie, statystyki, zapisane wyszukiwania, powiadomienia realtime, eksport raportów). Poniżej propozycje podzielone na trzy kategorie. Daj znać które wdrożyć — mogę zająć się jedną grupą lub wybranymi punktami.

## Co warto naprawić (priorytet)

1. **Brak system roli admina** — obecnie nie ma tabeli `user_roles`. Bez tego nie da się moderować ogłoszeń, banować użytkowników ani usuwać spamu.
2. **Bezpieczeństwo `listing_views`** — każdy może wstawić dowolny wpis (inflacja statystyk). Dodać deduplikację (unique per viewer+listing+dzień) i rate-limiting.
3. **Brak walidacji ofert** — można złożyć ofertę 0 zł lub ujemną. Dodać trigger walidujący `amount > 0` i status z enum.
4. **Powiadomienia bez paginacji/limitów** — przy dużej liczbie powiadomień UI się zatka. Dodać paginację + auto-czyszczenie starszych niż 30 dni.
5. **Brak indeksów** na kolumnach `listings(category, location, price, created_at)`, `notifications(recipient_id, is_read)`, `messages(conversation_id, created_at)` — zapytania będą wolne przy większym ruchu.

## Co warto rozbudować (nowe funkcje)

1. **System recenzji po transakcji** — obecnie reviews istnieją, ale brak workflow: oznaczenie oferty jako "sfinalizowana" → prompt do oceny kupującego/sprzedawcy.
2. **Wishlisty publiczne** — użytkownik tworzy listy ("Prezenty świąteczne") z ulubionymi przedmiotami, możliwość udostępnienia linkiem.
3. **Porównywarka ogłoszeń** — zaznaczenie 2-4 produktów i widok side-by-side (cena, stan, lokalizacja, sprzedawca).
4. **Wyszukiwanie obrazem (AI)** — upload zdjęcia → Lovable AI (Gemini Vision) generuje opis i wyszukuje podobne ogłoszenia.
5. **Inteligentne sugestie cenowe przy dodawaniu ogłoszenia** — AI analizuje tytuł/kategorię/stan i sugeruje przedział cenowy na podstawie podobnych aktywnych ogłoszeń.
6. **Tryb "negocjacje na żywo"** — chat w ramach oferty z licznikiem ostatecznej decyzji (24h timeout).
7. **Profil sprzedawcy z odznakami** — "Szybki w odpowiedzi", "Sprawdzony", "Top sprzedawca" wyliczane automatycznie z metryk.
8. **Mapa ogłoszeń** — widok wyników jako pinezki na mapie Polski (już macie `PolandMap.tsx`).
9. **Historia obejrzanych** — zakładka "Ostatnio oglądane" w profilu.
10. **PWA + push notifications** — instalacja jako aplikacja na telefonie + powiadomienia push (nie tylko in-app).

## Co warto upiększyć (UX/UI)

1. **Pusty stan (empty states)** — wiele list (oferty, obserwowani, zapisane wyszukiwania) pokazuje surowy "Brak danych". Dodać ilustracje + CTA.
2. **Onboarding po rejestracji** — 3-krokowy tour pokazujący kluczowe funkcje (ulubione, oferty, obserwowanie).
3. **Skeleton loaders w więcej miejsc** — np. ProductDetail, Profile (zgodne z core memory).
4. **Floating action button na mobile** — szybkie "Dodaj ogłoszenie" zamiast szukania w nawigacji.
5. **Command palette (Cmd+K)** — szybka nawigacja, wyszukiwanie ogłoszeń, skróty.
6. **Dark mode toggle widoczny w UI** — hook `useTheme` istnieje, ale brak wyraźnego przełącznika.
7. **Animowane transitions między kategoriami** — Framer Motion już jest w stacku.

## Sugerowany pierwszy krok

Proponuję zacząć od **paczki "fundamenty"**: role admina + indeksy DB + walidacja ofert + paginacja powiadomień. To zabezpiecza aplikację przed problemami przy wzroście liczby użytkowników. Następnie wybierzemy 2-3 funkcje z sekcji rozbudowy.

Powiedz które obszary Cię interesują — mogę też zaproponować konkretny roadmap na 3-4 iteracje.