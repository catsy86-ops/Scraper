import LegalLayout, { type LegalSection } from '@/components/LegalLayout';

const sections: LegalSection[] = [
  {
    id: 'administrator',
    title: 'Administrator danych',
    paragraphs: [
      'Administratorem Twoich danych osobowych w rozumieniu Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. („RODO") jest zespół uFisza („Administrator").',
      'Kontakt z Administratorem w sprawach związanych z przetwarzaniem danych: kontakt@ufisza.pl.',
    ],
  },
  {
    id: 'zakres',
    title: 'Zakres zbieranych danych',
    paragraphs: ['W zależności od sposobu korzystania z Serwisu, możemy przetwarzać następujące kategorie danych:'],
    list: [
      'Dane konta: adres e-mail, nazwa wyświetlana, hasło (w postaci zaszyfrowanej).',
      'Dane profilu: zdjęcie, opis, lokalizacja (opcjonalnie).',
      'Treść Ogłoszeń, wiadomości oraz opinii.',
      'Dane techniczne: adres IP, identyfikator urządzenia, typ przeglądarki, dane logowania.',
      'Dane z plików cookies — zgodnie z Twoimi preferencjami w bannerze cookies.',
    ],
  },
  {
    id: 'cele',
    title: 'Cele i podstawy przetwarzania',
    list: [
      'Świadczenie usług Serwisu — art. 6 ust. 1 lit. b RODO (wykonanie umowy).',
      'Komunikacja między Użytkownikami — art. 6 ust. 1 lit. b RODO.',
      'Zapewnienie bezpieczeństwa i przeciwdziałanie nadużyciom — art. 6 ust. 1 lit. f RODO (uzasadniony interes).',
      'Marketing i analityka — art. 6 ust. 1 lit. a RODO (zgoda wyrażona w bannerze cookies).',
      'Realizacja obowiązków prawnych — art. 6 ust. 1 lit. c RODO.',
    ],
  },
  {
    id: 'okres',
    title: 'Okres przechowywania',
    paragraphs: [
      'Dane Konta przechowujemy przez okres jego aktywności oraz przez 30 dni po usunięciu Konta (na potrzeby ewentualnej reaktywacji).',
      'Dane wymagane przepisami prawa (np. księgowe) przechowujemy przez okres wymagany odpowiednimi przepisami.',
      'Dane przetwarzane na podstawie zgody — do czasu jej wycofania.',
    ],
  },
  {
    id: 'odbiorcy',
    title: 'Odbiorcy danych',
    paragraphs: ['Twoje dane mogą być przekazywane następującym kategoriom odbiorców:'],
    list: [
      'Dostawcy infrastruktury IT (hosting, baza danych) — w ramach umów powierzenia przetwarzania.',
      'Dostawcy usług analitycznych — wyłącznie po wyrażeniu zgody.',
      'Organy państwowe — na podstawie obowiązujących przepisów prawa.',
    ],
  },
  {
    id: 'prawa',
    title: 'Twoje prawa',
    paragraphs: ['Zgodnie z RODO przysługują Ci następujące prawa:'],
    list: [
      'Prawo dostępu do danych (art. 15 RODO).',
      'Prawo do sprostowania danych (art. 16 RODO).',
      'Prawo do usunięcia danych — „prawo do bycia zapomnianym" (art. 17 RODO).',
      'Prawo do ograniczenia przetwarzania (art. 18 RODO).',
      'Prawo do przenoszenia danych (art. 20 RODO).',
      'Prawo do sprzeciwu wobec przetwarzania (art. 21 RODO).',
      'Prawo do wycofania zgody w dowolnym momencie (art. 7 ust. 3 RODO).',
      'Prawo wniesienia skargi do Prezesa UODO (uodo.gov.pl).',
    ],
  },
  {
    id: 'cookies',
    title: 'Pliki cookies',
    paragraphs: [
      'Serwis wykorzystuje pliki cookies oraz podobne technologie w celu zapewnienia prawidłowego działania, analizy ruchu oraz personalizacji treści.',
      'Wyróżniamy cztery kategorie cookies: niezbędne (zawsze aktywne), preferencji, analityczne i marketingowe. Możesz zarządzać swoimi zgodami w każdej chwili poprzez link „Ustawienia cookies" w stopce.',
    ],
  },
  {
    id: 'bezpieczenstwo',
    title: 'Bezpieczeństwo',
    paragraphs: [
      'Stosujemy adekwatne środki techniczne i organizacyjne zapewniające ochronę danych osobowych przed nieautoryzowanym dostępem, utratą lub zniszczeniem.',
      'Dane są szyfrowane w transporcie (TLS) oraz przechowywane na serwerach w Europejskim Obszarze Gospodarczym.',
    ],
  },
  {
    id: 'transfer',
    title: 'Przekazywanie danych poza EOG',
    paragraphs: [
      'Co do zasady nie przekazujemy danych poza Europejski Obszar Gospodarczy. Jeśli takie przekazanie miałoby nastąpić, odbędzie się wyłącznie na podstawie standardowych klauzul umownych zatwierdzonych przez Komisję Europejską.',
    ],
  },
  {
    id: 'profilowanie',
    title: 'Profilowanie',
    paragraphs: [
      'Nie podejmujemy wobec Ciebie decyzji opartych wyłącznie na zautomatyzowanym przetwarzaniu, w tym profilowaniu, które wywoływałyby skutki prawne.',
    ],
  },
  {
    id: 'zmiany',
    title: 'Zmiany polityki',
    paragraphs: [
      'Polityka prywatności może być aktualizowana w razie zmian prawnych lub technicznych. O istotnych zmianach poinformujemy mailowo lub poprzez powiadomienie w Serwisie.',
    ],
  },
];

const Privacy = () => (
  <LegalLayout
    kind="privacy"
    title="Polityka prywatności"
    subtitle="Twoje dane są bezpieczne. Wyjaśniamy jak je przetwarzamy zgodnie z RODO."
    updatedAt="3 maja 2026"
    sections={sections}
    intro={
      <p>
        Dbamy o Twoją prywatność. Poniżej znajdziesz wszystkie informacje na temat tego, jakie dane zbieramy,
        w jakim celu i jakie masz prawa zgodnie z RODO.
      </p>
    }
  />
);

export default Privacy;