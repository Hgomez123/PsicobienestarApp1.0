/**
 * Datos estructurados schema.org de la consulta.
 *
 * Por qué existe: Google necesita algo más que el <title> para entender que
 * esto es una psicóloga con consultorio en zona 10 y no un directorio más.
 * El JSON-LD es lo que alimenta el panel de negocio local y las búsquedas
 * del tipo "psicóloga cerca de mí".
 *
 * Regla al editarlo: todo lo que va acá tiene que estar también visible en
 * la página. Google penaliza el structured data que afirma cosas que el
 * usuario no puede ver.
 */

const SITE = "https://psicobienestarguatemala.com";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Psychologist",
  "@id": `${SITE}/#consulta`,
  name: "Psicobienestar",
  alternateName: "Psicobienestar Guatemala",
  url: SITE,
  description:
    "Terapia psicológica personalizada en Zona 10, Ciudad de Guatemala. " +
    "Neuropsicología y salud mental para adultos con la Lic. María Eugenia " +
    "Castillo García. Modalidad presencial y en línea.",
  logo: `${SITE}/icon.svg`,
  image: `${SITE}/apple-icon.png`,
  telephone: "+50243123394",
  email: "gt.psicobienestar@gmail.com",
  priceRange: "Q300",
  currenciesAccepted: "GTQ",
  address: {
    "@type": "PostalAddress",
    streetAddress: "2da calle 6-24, Edificio RENOVATI, Zona 10",
    addressLocality: "Ciudad de Guatemala",
    addressCountry: "GT",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
  ],
  areaServed: [
    { "@type": "City", name: "Ciudad de Guatemala" },
    { "@type": "Country", name: "Guatemala" },
  ],
  availableLanguage: { "@type": "Language", name: "Spanish", alternateName: "es" },
  sameAs: [
    "https://www.instagram.com/gt.psicobienestar",
    "https://www.facebook.com/profile.php?id=61572835898177",
  ],
  founder: {
    "@type": "Person",
    name: "María Eugenia Castillo García",
    honorificPrefix: "Lic.",
    jobTitle: "Psicóloga clínica",
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Universidad Mariano Gálvez de Guatemala",
    },
    memberOf: {
      "@type": "Organization",
      name: "Colegio de Psicólogos de Guatemala",
    },
  },
  medicalSpecialty: "Psychiatric",
  availableService: [
    {
      "@type": "MedicalTherapy",
      name: "Terapia individual presencial",
      description:
        "Sesiones de psicoterapia individual para adultos en el consultorio de Zona 10.",
    },
    {
      "@type": "MedicalTherapy",
      name: "Terapia individual en línea",
      description:
        "Sesiones de psicoterapia individual por videollamada, con la misma estructura que la modalidad presencial.",
    },
    {
      "@type": "MedicalTherapy",
      name: "Evaluación neuropsicológica",
      description:
        "Valoración de funciones cognitivas con formación especializada en neuropsicología.",
    },
  ],
};

export default function StructuredData() {
  return (
    <script
      type="application/ld+json"
      // El contenido es una constante del propio módulo, no entra nada del
      // usuario: no hay superficie de inyección acá.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
