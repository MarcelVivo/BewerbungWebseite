import type { Lang } from '@/app/LanguageContext';

export type BlogSection = { heading: string; paragraphs: string[] };

export type BlogPostTranslation = {
  title: string;
  subtitle: string;
  metaDesc: string;
  readingTime: string;
  intro: string;
  sections: BlogSection[];
  ctaEyebrow: string;
  ctaTitle: string;
  ctaText: string;
  ctaLabel: string;
};

export type BlogPost = {
  slug: string;
  date: string; // ISO, für Sortierung und JSON-LD
  color: string;
  ctaHref: string;
  de: BlogPostTranslation;
  en: BlogPostTranslation;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'ki-automatisierung-kmu-schweiz',
    date: '2026-08-15',
    color: '#8ebef2',
    ctaHref: '/leistungen/automatisierung-ki-agenten',
    de: {
      title: 'KI-Automatisierung für KMU: Wo sie sich lohnt – und wo nicht',
      subtitle: 'Eine ehrliche Einordnung statt Hype. Wie du erkennst, welche Aufgaben sich wirklich automatisieren lassen.',
      metaDesc: 'Wo KI-Automatisierung für Schweizer KMU tatsächlich Zeit spart und wo sie nichts bringt. Eine praxisnahe Einordnung von Marcel Spahr.',
      readingTime: '6 Min. Lesezeit',
      intro: 'Kaum ein Thema wird KMU aktuell so oft verkauft wie KI. Die Realität ist nüchterner: Ein Teil der Aufgaben in einem Unternehmen eignet sich sehr gut für Automatisierung, ein anderer Teil gar nicht. Der Unterschied liegt selten in der Technik, sondern darin, wie klar eine Aufgabe beschrieben werden kann.',
      sections: [
        {
          heading: 'Woran du erkennst, ob sich eine Aufgabe eignet',
          paragraphs: [
            'Gut geeignet sind Aufgaben, die sich wiederholen, nach erkennbaren Mustern ablaufen und deren Ergebnis sich prüfen lässt: eine eingehende E-Mail einer Kategorie zuordnen, einen ersten Antwortentwurf vorbereiten, Angaben aus einem Formular in ein System übertragen, einen Datensatz vervollständigen.',
            'Schlecht geeignet sind Aufgaben, die von Fall zu Fall echtes Urteilsvermögen brauchen, bei denen Kontext aus Erfahrung entscheidet oder bei denen ein Fehler grossen Schaden anrichten würde, ohne dass er auffällt. Genau hier passiert der teuerste Fehler: Unternehmen automatisieren die Entscheidung selbst, statt nur die Vorarbeit dazu.',
          ],
        },
        {
          heading: 'Der Unterschied zwischen Vorbereitung und Entscheidung',
          paragraphs: [
            'Die Lösung, die in der Praxis funktioniert, trennt beides sauber: Die KI übernimmt die Vorbereitung. Sie liest, ordnet, fasst zusammen, schlägt vor. Der Mensch trifft die Entscheidung und trägt die Verantwortung dafür. Diese Trennung ist kein Kompromiss, sondern der Grund, warum eine Automatisierung im Alltag überhaupt vertraut wird.',
            'Ein Beispiel: Eine eingehende Kundenanfrage wird automatisch klassifiziert, im CRM erfasst und ein Antwortentwurf vorbereitet. Ein Mitarbeitender liest den Entwurf, passt ihn bei Bedarf an und sendet ihn ab. Die Zeitersparnis entsteht beim Lesen, Einordnen und Formulieren – nicht bei der eigentlichen Entscheidung, was gesagt wird.',
          ],
        },
        {
          heading: 'Warum die Reihenfolge über den Erfolg entscheidet',
          paragraphs: [
            'Der häufigste Fehler ist, zuerst ein Werkzeug auszuwählen und danach eine Aufgabe dafür zu suchen. Sinnvoller ist der umgekehrte Weg: zuerst die tatsächlichen Zeitfresser im Alltag benennen, dann prüfen, ob und wie sich jeder einzelne davon automatisieren lässt, und erst danach das passende Werkzeug wählen. Manchmal ist die Antwort: ein einfacherer Prozess reicht, keine KI nötig.',
            'Diese Reihenfolge ist auch der Grund, warum ich bei jedem Projekt zuerst den Nutzen prüfe, bevor ich etwas baue. Nicht jede Aufgabe braucht KI – aber die, die sich eignet, kann echten Unterschied machen.',
          ],
        },
      ],
      ctaEyebrow: 'NÄCHSTER SCHRITT',
      ctaTitle: 'Willst du wissen, wo KI in deinem Unternehmen wirklich helfen würde?',
      ctaText: 'Der kostenlose KI-Check dauert drei Minuten und gibt dir eine persönliche, ehrliche Einschätzung – ohne Verkaufsgespräch.',
      ctaLabel: 'KI-Check starten',
    },
    en: {
      title: 'AI Automation for SMEs: Where It Pays Off – and Where It Doesn’t',
      subtitle: 'An honest assessment instead of hype. How to recognise which tasks are genuinely worth automating.',
      metaDesc: 'Where AI automation actually saves Swiss SMEs time, and where it doesn’t. A practical assessment by Marcel Spahr.',
      readingTime: '6 min read',
      intro: 'Few topics get pitched to SMEs as heavily as AI right now. The reality is more sober: some tasks in a business are very well suited to automation, others not at all. The difference rarely lies in the technology itself, but in how clearly a task can be described.',
      sections: [
        {
          heading: 'How to tell if a task is a good fit',
          paragraphs: [
            'Good candidates are tasks that repeat, follow recognisable patterns, and whose result can be checked: sorting an incoming email into a category, preparing a first draft reply, transferring form data into a system, completing a record.',
            'Poor candidates are tasks that need genuine judgement case by case, where context built from experience matters, or where a mistake would cause real damage without being noticed. This is exactly where the most expensive error happens: businesses automate the decision itself instead of just the preparation for it.',
          ],
        },
        {
          heading: 'The difference between preparation and decision',
          paragraphs: [
            'The solutions that actually work in practice keep these two cleanly separated. The AI handles preparation: it reads, sorts, summarises, suggests. A person makes the decision and carries responsibility for it. That separation isn’t a compromise — it’s the reason people actually trust an automated process in daily use.',
            'One example: an incoming customer enquiry gets classified automatically, logged in the CRM, and a draft reply is prepared. An employee reads the draft, adjusts it if needed, and sends it. The time saved comes from reading, sorting and drafting — not from the actual decision about what gets said.',
          ],
        },
        {
          heading: 'Why the order of operations decides success',
          paragraphs: [
            'The most common mistake is picking a tool first and looking for a task to justify it afterwards. The better approach runs in reverse: name the actual time-consuming tasks in daily work first, then check whether and how each one can realistically be automated, and only then choose the right tool. Sometimes the answer is: a simpler process is enough, no AI required.',
            'That order is also why I check the actual benefit before building anything on every project. Not every task needs AI — but the ones that fit can make a real difference.',
          ],
        },
      ],
      ctaEyebrow: 'NEXT STEP',
      ctaTitle: 'Want to know where AI would genuinely help in your business?',
      ctaText: 'The free AI check takes three minutes and gives you a personal, honest assessment — no sales call.',
      ctaLabel: 'Start the AI check',
    },
  },
  {
    slug: 'website-verkaufssystem-kmu',
    date: '2026-08-10',
    color: '#4d7fbf',
    ctaHref: '/leistungen/2d-3d-websites',
    de: {
      title: 'Warum deine Website mehr sein sollte als ein digitales Aushängeschild',
      subtitle: 'Design allein bringt keine Anfragen. Was eine Website leisten muss, um wirklich als Verkaufssystem zu funktionieren.',
      metaDesc: 'Warum eine gute Website für Schweizer KMU mehr sein muss als hübsches Design – und wie sie strukturiert Anfragen statt nur Besuche bringt.',
      readingTime: '5 Min. Lesezeit',
      intro: 'Viele Unternehmen investieren in eine neue Website und erwarten danach mehr Anfragen. Häufig verändert sich aber nur die Optik, nicht das Ergebnis. Der Grund: Eine Website, die keinen klaren Weg vom ersten Besuch bis zur Anfrage vorgibt, bleibt ein hübsches Schaufenster – unabhängig vom Design.',
      sections: [
        {
          heading: 'Design beginnt zu arbeiten, wenn Struktur dahintersteht',
          paragraphs: [
            'Eine Website mit starkem Design, aber unklarer Struktur, verwirrt eher, als dass sie überzeugt. Besucher, die nicht sofort verstehen, was angeboten wird und wie sie den nächsten Schritt machen, verlassen die Seite wieder. Gestaltung und Struktur müssen deshalb gemeinsam geplant werden, nicht nacheinander.',
            'Die Frage ist nicht "Sieht die Website gut aus?", sondern "Weiss jemand nach fünf Sekunden, was wir anbieten und was der nächste Schritt ist?" Wenn diese Frage nicht klar mit Ja beantwortet werden kann, hilft auch das schönste Design nicht weiter.',
          ],
        },
        {
          heading: 'Der Weg von der Suche bis zur Anfrage',
          paragraphs: [
            'Jeder Kontakt beginnt mit einem konkreten Bedarf: eine Google-Suche, eine Empfehlung, ein Social-Media-Beitrag. Die Website muss diesen Bedarf sofort erkennen lassen und zu einem einzigen, klaren nächsten Schritt führen – einem Formular, einem Anruf, einer Terminbuchung. Zu viele gleichwertige Handlungsmöglichkeiten wirken wie keine.',
            'Danach zählt, was mit der Anfrage passiert. Landet sie strukturiert in einem System, oder geht sie zwischen E-Mails unter? Genau an dieser Stelle hört die klassische Website auf zu arbeiten und ein Verkaufssystem beginnt: mit einer sauberen Übergabe der Anfrage in ein CRM, statt in ein volles Postfach.',
          ],
        },
        {
          heading: 'Gefunden werden, wo Entscheidungen beginnen',
          paragraphs: [
            'Sichtbarkeit entscheidet zunehmend nicht nur bei Google, sondern auch dort, wo Menschen KI-Systeme nach Anbietern fragen. Technische SEO, eine klare Informationsarchitektur und strukturierte Daten machen ein Angebot für Menschen und Maschinen gleichermassen verständlich. Das ist kein Ersatz für gute Inhalte, aber ohne diese Grundlage bleiben auch gute Inhalte unsichtbar.',
          ],
        },
      ],
      ctaEyebrow: 'NÄCHSTER SCHRITT',
      ctaTitle: 'Führt deine Website Besucher wirklich zur Anfrage?',
      ctaText: 'Ich schaue mir deine aktuelle Website an und zeige dir konkret, wo Besucher aussteigen und was ein klarer nächster Schritt für dein Unternehmen wäre.',
      ctaLabel: 'Projekt besprechen',
    },
    en: {
      title: 'Why Your Website Should Be More Than a Digital Business Card',
      subtitle: 'Design alone doesn’t bring enquiries. What a website actually needs to work as a sales system.',
      metaDesc: 'Why a good website for Swiss SMEs needs to be more than attractive design — and how it turns visits into structured enquiries.',
      readingTime: '5 min read',
      intro: 'Many businesses invest in a new website and expect more enquiries afterwards. Often only the look changes, not the result. The reason: a website that doesn’t give visitors a clear path from first visit to enquiry stays a nice-looking shop window — regardless of the design.',
      sections: [
        {
          heading: 'Design starts working once structure stands behind it',
          paragraphs: [
            'A website with strong visuals but unclear structure tends to confuse rather than convince. Visitors who don’t immediately understand what’s on offer and how to take the next step simply leave. Design and structure need to be planned together, not one after the other.',
            'The question isn’t "does the website look good?" but "does someone know within five seconds what we offer and what the next step is?" If that question can’t be answered with a clear yes, even the best design won’t help.',
          ],
        },
        {
          heading: 'The path from search to enquiry',
          paragraphs: [
            'Every contact starts with a concrete need: a Google search, a referral, a social media post. The website has to recognise that need instantly and lead to one single, clear next step — a form, a call, a booked meeting. Too many equally weighted options feel like no option at all.',
            'What happens to the enquiry next is what matters after that. Does it land in a structured system, or does it get lost among emails? This is exactly where a classic website stops working and a sales system begins: with a clean handover of the enquiry into a CRM instead of a crowded inbox.',
          ],
        },
        {
          heading: 'Being found where decisions begin',
          paragraphs: [
            'Visibility increasingly matters not just on Google, but also wherever people ask AI systems for recommendations. Technical SEO, a clear information architecture and structured data make an offer understandable to people and machines alike. That’s no substitute for good content — but without this foundation, even good content stays invisible.',
          ],
        },
      ],
      ctaEyebrow: 'NEXT STEP',
      ctaTitle: 'Does your website actually lead visitors to an enquiry?',
      ctaText: 'I’ll look at your current website and show you concretely where visitors drop off and what a clear next step would look like for your business.',
      ctaLabel: 'Discuss your project',
    },
  },
  {
    slug: 'crm-fuer-kmu-wann-lohnt-es-sich',
    date: '2026-08-05',
    color: '#a6425c',
    ctaHref: '/leistungen/crm-loesungen',
    de: {
      title: 'CRM oder Excel-Liste? Wann sich ein eigenes System für dein KMU lohnt',
      subtitle: 'Excel ist kein Fehler – aber irgendwann ein Engpass. Woran du erkennst, dass der Wechsel sich lohnt.',
      metaDesc: 'Woran Schweizer KMU erkennen, dass Excel und E-Mail für die Kundenverwaltung nicht mehr reichen – und worauf es bei einem eigenen CRM ankommt.',
      readingTime: '5 Min. Lesezeit',
      intro: 'Excel-Listen und E-Mail-Postfächer sind für viele KMU der Startpunkt der Kundenverwaltung – und das ist am Anfang völlig richtig. Das Problem entsteht nicht durch Excel selbst, sondern dadurch, dass niemand merkt, wann die Liste zum Engpass geworden ist.',
      sections: [
        {
          heading: 'Drei Anzeichen, dass Excel nicht mehr reicht',
          paragraphs: [
            'Erstens: Zwei Personen bearbeiten dieselbe Anfrage, ohne es zu wissen, weil der Stand nicht aktuell ist. Zweitens: Eine Anfrage geht unter, weil sie in einer E-Mail steckt, die niemand mehr findet. Drittens: Eine neue Mitarbeiterin braucht Tage, um zu verstehen, wo welche Information zu welchem Kunden steht.',
            'Keines dieser Probleme liegt an mangelnder Sorgfalt. Sie entstehen, weil Excel und E-Mail nicht dafür gebaut sind, dass mehrere Personen gleichzeitig strukturiert auf denselben Datensatz zugreifen und nachvollziehen können, was zuletzt passiert ist.',
          ],
        },
        {
          heading: 'Was ein CRM tatsächlich leisten muss',
          paragraphs: [
            'Ein CRM muss nicht viel können, aber das Richtige: Kontakte, Anfragen, Aufgaben und Dokumente an einem Ort, ein klarer Status pro Kontakt und Erinnerungen, die nichts vergessen lassen. Alles, was darüber hinausgeht, ist meistens nicht Nutzen, sondern Ablenkung.',
            'Der häufigste Fehler ist, eine grosse Standardlösung zu kaufen, die für Konzerne gebaut wurde, und danach den eigenen Arbeitsablauf an die Software anzupassen. Sinnvoller ist der umgekehrte Weg: den tatsächlichen Ablauf zuerst verstehen, dann ein System bauen oder auswählen, das genau dazu passt – nicht mehr und nicht weniger.',
          ],
        },
        {
          heading: 'Der Übergang muss sich lohnen, nicht nur modern wirken',
          paragraphs: [
            'Ein CRM-Wechsel lohnt sich, wenn die tägliche Suche nach Informationen mehr Zeit kostet als die Umstellung selbst. Er lohnt sich nicht, wenn ein Team klein ist, Anfragen überschaubar bleiben und alle Beteiligten den Überblick ohnehin behalten. Diese Einschätzung sollte am Anfang jedes Projekts stehen, nicht danach.',
          ],
        },
      ],
      ctaEyebrow: 'NÄCHSTER SCHRITT',
      ctaTitle: 'Unsicher, ob sich ein CRM für dein Unternehmen lohnt?',
      ctaText: 'Ich schaue mir deinen aktuellen Ablauf an und sage dir ehrlich, ob sich der Aufwand für dein Unternehmen aktuell lohnt.',
      ctaLabel: 'Projekt besprechen',
    },
    en: {
      title: 'CRM or Spreadsheet? When a Dedicated System Is Worth It for Your SME',
      subtitle: 'Spreadsheets aren’t a mistake — but eventually they become a bottleneck. How to tell when switching pays off.',
      metaDesc: 'How Swiss SMEs can tell that spreadsheets and email are no longer enough for customer management — and what actually matters in a CRM.',
      readingTime: '5 min read',
      intro: 'Spreadsheets and email inboxes are the starting point of customer management for many SMEs — and that’s entirely reasonable at first. The problem isn’t the spreadsheet itself; it’s that nobody notices the moment it turns into a bottleneck.',
      sections: [
        {
          heading: 'Three signs a spreadsheet isn’t enough anymore',
          paragraphs: [
            'First: two people work on the same enquiry without knowing it, because the status isn’t current. Second: an enquiry gets lost because it’s buried in an email nobody can find anymore. Third: a new employee needs days to figure out where which information about which customer lives.',
            'None of these problems come from carelessness. They happen because spreadsheets and email were never built for several people to access the same record in a structured way and see what happened last.',
          ],
        },
        {
          heading: 'What a CRM actually needs to do',
          paragraphs: [
            'A CRM doesn’t need to do much, just the right things: contacts, enquiries, tasks and documents in one place, a clear status per contact, and reminders that make sure nothing gets forgotten. Anything beyond that is usually distraction, not value.',
            'The most common mistake is buying a large standard solution built for enterprises and then adapting your own workflow to fit the software. The better approach runs in reverse: understand the actual workflow first, then build or choose a system that fits it exactly — no more, no less.',
          ],
        },
        {
          heading: 'The switch should pay off, not just look modern',
          paragraphs: [
            'Switching to a CRM is worth it once the daily hunt for information costs more time than the switch itself would. It’s not worth it when a team is small, enquiries stay manageable, and everyone involved keeps a clear overview anyway. That assessment should come at the start of a project, not after it.',
          ],
        },
      ],
      ctaEyebrow: 'NEXT STEP',
      ctaTitle: 'Not sure whether a CRM is worth it for your business?',
      ctaText: 'I’ll look at your current workflow and tell you honestly whether the effort is worth it for your business right now.',
      ctaLabel: 'Discuss your project',
    },
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getBlogPostTranslation(post: BlogPost, lang: Lang): BlogPostTranslation {
  return lang === 'en' ? post.en : post.de;
}
