import LegalLayout, { type LegalSection } from '@/components/LegalLayout';

const sections: LegalSection[] = [
  {
    id: 'postanowienia',
    title: 'Postanowienia ogólne',
    paragraphs: [
      'Niniejszy regulamin („Regulamin") określa zasady korzystania z serwisu internetowego uFisza dostępnego pod adresem ufisza.pl („Serwis"), prowadzonego przez zespół uFisza („Operator").',
      'Korzystanie z Serwisu oznacza akceptację postanowień Regulaminu w aktualnie obowiązującej wersji. Użytkownik, który nie akceptuje Regulaminu, nie może korzystać z Serwisu.',
    ],
  },
  {
    id: 'definicje',
    title: 'Definicje',
    list: [
      'Użytkownik — osoba fizyczna posiadająca pełną zdolność do czynności prawnych, która korzysta z Serwisu.',
      'Konto — zbiór danych powiązanych z Użytkownikiem, umożliwiający korzystanie z funkcji Serwisu.',
      'Ogłoszenie — oferta sprzedaży przedmiotu publikowana przez Użytkownika w Serwisie.',
      'Sprzedający / Kupujący — Użytkownik publikujący Ogłoszenie odpowiednio jako oferent lub odbiorca.',
    ],
  },
  {
    id: 'rejestracja',
    title: 'Rejestracja i konto',
    paragraphs: [
      'Rejestracja w Serwisie jest bezpłatna i wymaga podania prawidłowego adresu e-mail oraz potwierdzenia go. Alternatywnie możliwe jest logowanie przez Google.',
      'Użytkownik zobowiązuje się do podawania prawdziwych danych oraz ich aktualizacji w przypadku zmiany. Konto jest osobiste i nie może być udostępniane osobom trzecim.',
      'Operator zastrzega sobie prawo do zawieszenia lub usunięcia Konta w przypadku rażącego naruszenia Regulaminu.',
    ],
  },
  {
    id: 'ogloszenia',
    title: 'Zasady publikowania ogłoszeń',
    paragraphs: ['Każde Ogłoszenie musi zawierać rzetelny opis przedmiotu, jego stan oraz cenę wyrażoną w złotych polskich.'],
    list: [
      'Zabronione jest publikowanie treści niezgodnych z prawem polskim oraz dobrymi obyczajami.',
      'Zabroniona jest sprzedaż przedmiotów objętych zakazem obrotu (broń, narkotyki, podróbki, dane osobowe itp.).',
      'Zdjęcia muszą przedstawiać faktycznie oferowany przedmiot — nie zdjęcia stockowe ani z internetu.',
      'Operator może w każdej chwili usunąć Ogłoszenie naruszające Regulamin, bez konieczności uzasadniania decyzji.',
    ],
  },
  {
    id: 'transakcje',
    title: 'Transakcje między użytkownikami',
    paragraphs: [
      'uFisza pełni wyłącznie rolę pośrednika w nawiązywaniu kontaktu między Sprzedającym a Kupującym. Operator nie jest stroną transakcji.',
      'Operator nie ponosi odpowiedzialności za jakość, legalność, bezpieczeństwo ani realizację transakcji zawieranych między Użytkownikami.',
      'Zalecamy korzystanie z bezpiecznych metod płatności oraz spotkań w miejscach publicznych przy odbiorach osobistych.',
    ],
  },
  {
    id: 'promowanie',
    title: 'Promowanie ogłoszeń',
    paragraphs: [
      'Użytkownik może wyróżnić swoje Ogłoszenie poprzez funkcję promowania. Wyróżnione Ogłoszenia są wyświetlane na górze list wyników wyszukiwania i oznaczone specjalnym badge\'em.',
      'Szczegółowy cennik oraz czas trwania promocji dostępny jest w panelu publikacji Ogłoszenia.',
    ],
  },
  {
    id: 'odpowiedzialnosc',
    title: 'Odpowiedzialność operatora',
    paragraphs: [
      'Operator dokłada wszelkich starań, aby zapewnić ciągłość działania Serwisu, jednak nie gwarantuje nieprzerwanego dostępu i nie ponosi odpowiedzialności za przerwy techniczne.',
      'Operator nie odpowiada za treść Ogłoszeń ani za zachowania Użytkowników, w tym za ewentualne szkody powstałe w wyniku transakcji.',
    ],
  },
  {
    id: 'reklamacje',
    title: 'Reklamacje',
    paragraphs: [
      'Reklamacje dotyczące funkcjonowania Serwisu można zgłaszać na adres e-mail kontakt@ufisza.pl. Reklamacja powinna zawierać dane Użytkownika oraz opis problemu.',
      'Operator rozpatrzy reklamację w terminie 14 dni od jej otrzymania.',
    ],
  },
  {
    id: 'usuniecie',
    title: 'Usunięcie konta',
    paragraphs: [
      'Użytkownik ma prawo w każdej chwili usunąć swoje Konto z poziomu profilu. Usunięcie Konta skutkuje trwałym usunięciem wszystkich Ogłoszeń, wiadomości oraz danych powiązanych z Kontem.',
      'Niektóre dane mogą być przechowywane przez czas wymagany przepisami prawa (np. dane do faktur).',
    ],
  },
  {
    id: 'zmiany',
    title: 'Zmiany regulaminu',
    paragraphs: [
      'Operator zastrzega sobie prawo do zmiany Regulaminu w dowolnym czasie. O istotnych zmianach Użytkownicy zostaną poinformowani drogą mailową lub poprzez powiadomienie w Serwisie.',
      'Dalsze korzystanie z Serwisu po wejściu w życie zmian oznacza ich akceptację.',
    ],
  },
  {
    id: 'koncowe',
    title: 'Postanowienia końcowe',
    paragraphs: [
      'W sprawach nieuregulowanych Regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeks cywilny oraz ustawa o świadczeniu usług drogą elektroniczną.',
      'Sądem właściwym do rozstrzygania sporów jest sąd powszechny właściwy miejscowo dla Operatora.',
    ],
  },
];

const Terms = () => (
  <LegalLayout
    kind="terms"
    title="Regulamin serwisu"
    subtitle="Zasady korzystania z platformy uFisza — przeczytaj uważnie przed założeniem konta."
    updatedAt="3 maja 2026"
    sections={sections}
    intro={
      <p>
        Niniejszy dokument reguluje prawa i obowiązki Użytkowników korzystających z serwisu uFisza.
        Korzystając z Serwisu, akceptujesz poniższe warunki w całości.
      </p>
    }
  />
);

export default Terms;