/**
 * Knowledge Graph Types
 * Schema.org structured data types and interfaces
 *
 * Phase 1, Week 1, Day 5 - KG: Schema.org extractor
 */

// ================================================================
// SCHEMA.ORG BASE TYPES
// ================================================================

/**
 * Base Schema.org Thing type
 * https://schema.org/Thing
 */
export interface SchemaThing {
  '@context'?: string | Record<string, string>;
  '@type': string | string[];
  '@id'?: string;
  name?: string;
  description?: string;
  url?: string;
  image?: string | SchemaImageObject | Array<string | SchemaImageObject>;
  sameAs?: string | string[];
  identifier?: string | SchemaPropertyValue | Array<string | SchemaPropertyValue>;
  additionalType?: string | string[];
  alternateName?: string | string[];
  disambiguatingDescription?: string;
  mainEntityOfPage?: string | SchemaWebPage;
  potentialAction?: SchemaAction | SchemaAction[];
  subjectOf?: SchemaCreativeWork | SchemaCreativeWork[];
}

/**
 * Schema.org ImageObject
 * https://schema.org/ImageObject
 */
export interface SchemaImageObject extends SchemaThing {
  '@type': 'ImageObject';
  contentUrl?: string;
  width?: number | SchemaQuantitativeValue;
  height?: number | SchemaQuantitativeValue;
  caption?: string;
  thumbnail?: SchemaImageObject;
}

/**
 * Schema.org PropertyValue
 * https://schema.org/PropertyValue
 */
export interface SchemaPropertyValue extends SchemaThing {
  '@type': 'PropertyValue';
  propertyID?: string;
  value?: string | number | boolean;
  unitCode?: string;
  unitText?: string;
}

/**
 * Schema.org QuantitativeValue
 * https://schema.org/QuantitativeValue
 */
export interface SchemaQuantitativeValue extends SchemaThing {
  '@type': 'QuantitativeValue';
  value?: number;
  minValue?: number;
  maxValue?: number;
  unitCode?: string;
  unitText?: string;
}

/**
 * Schema.org Action
 * https://schema.org/Action
 */
export interface SchemaAction extends SchemaThing {
  '@type': string;
  target?: string | SchemaEntryPoint;
  result?: SchemaThing;
  actionStatus?: string;
}

/**
 * Schema.org EntryPoint
 * https://schema.org/EntryPoint
 */
export interface SchemaEntryPoint extends SchemaThing {
  '@type': 'EntryPoint';
  urlTemplate?: string;
  actionPlatform?: string | string[];
  contentType?: string | string[];
  encodingType?: string | string[];
  httpMethod?: string;
}

/**
 * Schema.org WebPage
 * https://schema.org/WebPage
 */
export interface SchemaWebPage extends SchemaThing {
  '@type': 'WebPage' | 'ItemPage' | 'AboutPage' | 'ContactPage' | 'FAQPage' | 'ProfilePage';
  breadcrumb?: SchemaBreadcrumbList | string;
  lastReviewed?: string;
  mainContentOfPage?: SchemaWebPageElement;
  primaryImageOfPage?: SchemaImageObject;
  relatedLink?: string | string[];
  reviewedBy?: SchemaOrganization | SchemaPerson;
  significantLink?: string | string[];
  speakable?: SchemaSpeakable;
  specialty?: string;
}

/**
 * Schema.org WebPageElement
 * https://schema.org/WebPageElement
 */
export interface SchemaWebPageElement extends SchemaThing {
  '@type': 'WebPageElement' | 'SiteNavigationElement' | 'WPHeader' | 'WPFooter' | 'WPSideBar';
  cssSelector?: string;
  xpath?: string;
}

/**
 * Schema.org SpeakableSpecification
 * https://schema.org/SpeakableSpecification
 */
export interface SchemaSpeakable extends SchemaThing {
  '@type': 'SpeakableSpecification';
  cssSelector?: string | string[];
  xpath?: string | string[];
}

/**
 * Schema.org CreativeWork
 * https://schema.org/CreativeWork
 */
export interface SchemaCreativeWork extends SchemaThing {
  '@type': string;
  author?: SchemaOrganization | SchemaPerson | Array<SchemaOrganization | SchemaPerson>;
  dateCreated?: string;
  dateModified?: string;
  datePublished?: string;
  headline?: string;
  keywords?: string | string[];
  publisher?: SchemaOrganization | SchemaPerson;
  text?: string;
  thumbnailUrl?: string;
  inLanguage?: string | SchemaLanguage;
  license?: string | SchemaCreativeWork;
  copyrightHolder?: SchemaOrganization | SchemaPerson;
  copyrightYear?: number;
}

/**
 * Schema.org Language
 * https://schema.org/Language
 */
export interface SchemaLanguage extends SchemaThing {
  '@type': 'Language';
  alternateName?: string;
}

// ================================================================
// ORGANIZATION & PERSON TYPES
// ================================================================

/**
 * Schema.org Organization
 * https://schema.org/Organization
 */
export interface SchemaOrganization extends SchemaThing {
  '@type': 'Organization' | 'Corporation' | 'LocalBusiness' | 'NGO' | 'GovernmentOrganization' | string;
  address?: SchemaPostalAddress | string;
  aggregateRating?: SchemaAggregateRating;
  areaServed?: string | SchemaPlace | SchemaGeoShape;
  brand?: SchemaBrand | SchemaOrganization;
  contactPoint?: SchemaContactPoint | SchemaContactPoint[];
  department?: SchemaOrganization | SchemaOrganization[];
  email?: string;
  employee?: SchemaPerson | SchemaPerson[];
  founder?: SchemaPerson | SchemaPerson[];
  foundingDate?: string;
  foundingLocation?: SchemaPlace | string;
  funder?: SchemaOrganization | SchemaPerson;
  globalLocationNumber?: string;
  hasOfferCatalog?: SchemaOfferCatalog;
  interactionStatistic?: SchemaInteractionCounter;
  isicV4?: string;
  iso6523Code?: string;
  keywords?: string | string[];
  legalName?: string;
  leiCode?: string;
  location?: SchemaPlace | SchemaPostalAddress | string;
  logo?: string | SchemaImageObject;
  makesOffer?: SchemaOffer | SchemaOffer[];
  member?: SchemaOrganization | SchemaPerson | Array<SchemaOrganization | SchemaPerson>;
  naics?: string;
  nonprofitStatus?: string;
  numberOfEmployees?: SchemaQuantitativeValue;
  ownershipFundingInfo?: string | SchemaCreativeWork;
  parentOrganization?: SchemaOrganization;
  publishingPrinciples?: string | SchemaCreativeWork;
  review?: SchemaReview | SchemaReview[];
  seeks?: SchemaDemand | SchemaDemand[];
  slogan?: string;
  sponsor?: SchemaOrganization | SchemaPerson;
  subOrganization?: SchemaOrganization | SchemaOrganization[];
  taxID?: string;
  telephone?: string;
  vatID?: string;
}

/**
 * Schema.org Person
 * https://schema.org/Person
 */
export interface SchemaPerson extends SchemaThing {
  '@type': 'Person';
  additionalName?: string;
  address?: SchemaPostalAddress | string;
  affiliation?: SchemaOrganization | SchemaOrganization[];
  alumniOf?: SchemaOrganization | SchemaEducationalOrganization | Array<SchemaOrganization | SchemaEducationalOrganization>;
  award?: string | string[];
  birthDate?: string;
  birthPlace?: SchemaPlace;
  brand?: SchemaBrand | SchemaOrganization;
  callSign?: string;
  children?: SchemaPerson | SchemaPerson[];
  colleague?: SchemaPerson | string | Array<SchemaPerson | string>;
  contactPoint?: SchemaContactPoint | SchemaContactPoint[];
  deathDate?: string;
  deathPlace?: SchemaPlace;
  email?: string;
  familyName?: string;
  faxNumber?: string;
  follows?: SchemaPerson | SchemaPerson[];
  gender?: string;
  givenName?: string;
  globalLocationNumber?: string;
  hasOccupation?: SchemaOccupation | SchemaOccupation[];
  hasOfferCatalog?: SchemaOfferCatalog;
  height?: SchemaQuantitativeValue | string;
  homeLocation?: SchemaContactPoint | SchemaPlace;
  honorificPrefix?: string;
  honorificSuffix?: string;
  interactionStatistic?: SchemaInteractionCounter;
  isicV4?: string;
  jobTitle?: string | string[];
  knows?: SchemaPerson | SchemaPerson[];
  knowsAbout?: string | SchemaThing | Array<string | SchemaThing>;
  knowsLanguage?: string | SchemaLanguage | Array<string | SchemaLanguage>;
  makesOffer?: SchemaOffer | SchemaOffer[];
  memberOf?: SchemaOrganization | SchemaProgramMembership | Array<SchemaOrganization | SchemaProgramMembership>;
  naics?: string;
  nationality?: SchemaCountry;
  netWorth?: SchemaMonetaryAmount | SchemaPriceSpecification;
  owns?: SchemaOwnershipInfo | SchemaProduct | Array<SchemaOwnershipInfo | SchemaProduct>;
  parent?: SchemaPerson | SchemaPerson[];
  performerIn?: SchemaEvent | SchemaEvent[];
  publishingPrinciples?: string | SchemaCreativeWork;
  relatedTo?: SchemaPerson | SchemaPerson[];
  seeks?: SchemaDemand | SchemaDemand[];
  sibling?: SchemaPerson | SchemaPerson[];
  sponsor?: SchemaOrganization | SchemaPerson;
  spouse?: SchemaPerson;
  taxID?: string;
  telephone?: string;
  vatID?: string;
  weight?: SchemaQuantitativeValue;
  workLocation?: SchemaContactPoint | SchemaPlace;
  worksFor?: SchemaOrganization | SchemaOrganization[];
}

// ================================================================
// SUPPORTING TYPES
// ================================================================

export interface SchemaPostalAddress extends SchemaThing {
  '@type': 'PostalAddress';
  addressCountry?: string | SchemaCountry;
  addressLocality?: string;
  addressRegion?: string;
  postOfficeBoxNumber?: string;
  postalCode?: string;
  streetAddress?: string;
}

export interface SchemaCountry extends SchemaThing {
  '@type': 'Country';
}

export interface SchemaPlace extends SchemaThing {
  '@type': 'Place' | string;
  address?: SchemaPostalAddress | string;
  geo?: SchemaGeoCoordinates | SchemaGeoShape;
  telephone?: string;
}

export interface SchemaGeoCoordinates extends SchemaThing {
  '@type': 'GeoCoordinates';
  latitude?: number | string;
  longitude?: number | string;
  elevation?: number | string;
}

export interface SchemaGeoShape extends SchemaThing {
  '@type': 'GeoShape' | 'GeoCircle';
  box?: string;
  circle?: string;
  line?: string;
  polygon?: string;
}

export interface SchemaContactPoint extends SchemaThing {
  '@type': 'ContactPoint';
  areaServed?: string | SchemaPlace | SchemaGeoShape;
  availableLanguage?: string | SchemaLanguage | Array<string | SchemaLanguage>;
  contactOption?: string | string[];
  contactType?: string;
  email?: string;
  faxNumber?: string;
  hoursAvailable?: SchemaOpeningHoursSpecification | SchemaOpeningHoursSpecification[];
  productSupported?: string | SchemaProduct;
  telephone?: string;
}

export interface SchemaOpeningHoursSpecification extends SchemaThing {
  '@type': 'OpeningHoursSpecification';
  closes?: string;
  dayOfWeek?: string | string[];
  opens?: string;
  validFrom?: string;
  validThrough?: string;
}

export interface SchemaBrand extends SchemaThing {
  '@type': 'Brand';
  aggregateRating?: SchemaAggregateRating;
  logo?: string | SchemaImageObject;
  review?: SchemaReview | SchemaReview[];
  slogan?: string;
}

export interface SchemaAggregateRating extends SchemaThing {
  '@type': 'AggregateRating';
  bestRating?: number | string;
  ratingCount?: number;
  ratingValue?: number | string;
  reviewCount?: number;
  worstRating?: number | string;
}

export interface SchemaReview extends SchemaCreativeWork {
  '@type': 'Review';
  itemReviewed?: SchemaThing;
  reviewAspect?: string;
  reviewBody?: string;
  reviewRating?: SchemaRating;
}

export interface SchemaRating extends SchemaThing {
  '@type': 'Rating';
  bestRating?: number | string;
  ratingExplanation?: string;
  ratingValue?: number | string;
  worstRating?: number | string;
}

export interface SchemaOffer extends SchemaThing {
  '@type': 'Offer';
  acceptedPaymentMethod?: string | string[];
  availability?: string;
  availabilityEnds?: string;
  availabilityStarts?: string;
  category?: string | SchemaThing;
  deliveryLeadTime?: SchemaQuantitativeValue;
  eligibleRegion?: string | SchemaGeoShape | SchemaPlace;
  gtin?: string;
  gtin12?: string;
  gtin13?: string;
  gtin14?: string;
  gtin8?: string;
  itemCondition?: string;
  itemOffered?: SchemaProduct | SchemaService | SchemaThing;
  mpn?: string;
  offeredBy?: SchemaOrganization | SchemaPerson;
  price?: number | string;
  priceCurrency?: string;
  priceSpecification?: SchemaPriceSpecification | SchemaPriceSpecification[];
  priceValidUntil?: string;
  seller?: SchemaOrganization | SchemaPerson;
  serialNumber?: string;
  sku?: string;
  validFrom?: string;
  validThrough?: string;
  warranty?: SchemaWarrantyPromise;
}

export interface SchemaPriceSpecification extends SchemaThing {
  '@type': 'PriceSpecification' | 'UnitPriceSpecification';
  eligibleQuantity?: SchemaQuantitativeValue;
  eligibleTransactionVolume?: SchemaPriceSpecification;
  maxPrice?: number;
  minPrice?: number;
  price?: number | string;
  priceCurrency?: string;
  validFrom?: string;
  validThrough?: string;
  valueAddedTaxIncluded?: boolean;
}

export interface SchemaProduct extends SchemaThing {
  '@type': 'Product';
  aggregateRating?: SchemaAggregateRating;
  audience?: SchemaAudience;
  award?: string | string[];
  brand?: SchemaBrand | SchemaOrganization;
  category?: string | SchemaThing;
  color?: string;
  gtin?: string;
  gtin12?: string;
  gtin13?: string;
  gtin14?: string;
  gtin8?: string;
  height?: SchemaQuantitativeValue | string;
  isAccessoryOrSparePartFor?: SchemaProduct | SchemaProduct[];
  isConsumableFor?: SchemaProduct | SchemaProduct[];
  isRelatedTo?: SchemaProduct | SchemaService | Array<SchemaProduct | SchemaService>;
  isSimilarTo?: SchemaProduct | SchemaService | Array<SchemaProduct | SchemaService>;
  itemCondition?: string;
  logo?: string | SchemaImageObject;
  manufacturer?: SchemaOrganization;
  material?: string | SchemaProduct;
  model?: string | SchemaProductModel;
  mpn?: string;
  nsn?: string;
  offers?: SchemaOffer | SchemaOffer[];
  productID?: string;
  productionDate?: string;
  purchaseDate?: string;
  releaseDate?: string;
  review?: SchemaReview | SchemaReview[];
  sku?: string;
  slogan?: string;
  weight?: SchemaQuantitativeValue;
  width?: SchemaQuantitativeValue | string;
}

export interface SchemaProductModel extends SchemaThing {
  '@type': 'ProductModel';
  isVariantOf?: SchemaProductModel;
  predecessorOf?: SchemaProductModel;
  successorOf?: SchemaProductModel;
}

export interface SchemaService extends SchemaThing {
  '@type': 'Service' | string;
  aggregateRating?: SchemaAggregateRating;
  areaServed?: string | SchemaPlace | SchemaGeoShape;
  audience?: SchemaAudience;
  availableChannel?: SchemaServiceChannel;
  award?: string | string[];
  brand?: SchemaBrand | SchemaOrganization;
  broker?: SchemaOrganization | SchemaPerson;
  category?: string | SchemaThing;
  hasOfferCatalog?: SchemaOfferCatalog;
  hoursAvailable?: SchemaOpeningHoursSpecification | SchemaOpeningHoursSpecification[];
  isRelatedTo?: SchemaProduct | SchemaService | Array<SchemaProduct | SchemaService>;
  isSimilarTo?: SchemaProduct | SchemaService | Array<SchemaProduct | SchemaService>;
  logo?: string | SchemaImageObject;
  offers?: SchemaOffer | SchemaOffer[];
  provider?: SchemaOrganization | SchemaPerson;
  providerMobility?: string;
  review?: SchemaReview | SchemaReview[];
  serviceOutput?: SchemaThing;
  serviceType?: string;
  slogan?: string;
  termsOfService?: string;
}

export interface SchemaServiceChannel extends SchemaThing {
  '@type': 'ServiceChannel';
  availableLanguage?: string | SchemaLanguage | Array<string | SchemaLanguage>;
  processingTime?: string;
  providesService?: SchemaService;
  serviceLocation?: SchemaPlace;
  servicePhone?: SchemaContactPoint;
  servicePostalAddress?: SchemaPostalAddress;
  serviceSmsNumber?: SchemaContactPoint;
  serviceUrl?: string;
}

export interface SchemaAudience extends SchemaThing {
  '@type': 'Audience' | 'BusinessAudience' | 'PeopleAudience';
  audienceType?: string;
  geographicArea?: SchemaPlace;
}

export interface SchemaOfferCatalog extends SchemaThing {
  '@type': 'OfferCatalog';
  itemListElement?: SchemaOffer | SchemaOffer[];
  numberOfItems?: number;
}

export interface SchemaDemand extends SchemaThing {
  '@type': 'Demand';
  acceptedPaymentMethod?: string | string[];
  areaServed?: string | SchemaPlace | SchemaGeoShape;
  availability?: string;
  businessFunction?: string;
  deliveryLeadTime?: SchemaQuantitativeValue;
  eligibleRegion?: string | SchemaGeoShape | SchemaPlace;
  itemOffered?: SchemaProduct | SchemaService | SchemaThing;
  priceSpecification?: SchemaPriceSpecification | SchemaPriceSpecification[];
  seller?: SchemaOrganization | SchemaPerson;
}

export interface SchemaOccupation extends SchemaThing {
  '@type': 'Occupation';
  educationRequirements?: string | SchemaEducationalOccupationalCredential;
  estimatedSalary?: SchemaMonetaryAmount | SchemaMonetaryAmountDistribution | number;
  experienceRequirements?: string | SchemaOccupationalExperienceRequirements;
  occupationLocation?: SchemaPlace | SchemaPlace[];
  occupationalCategory?: string;
  qualifications?: string | SchemaEducationalOccupationalCredential;
  responsibilities?: string;
  skills?: string | string[];
}

export interface SchemaEducationalOccupationalCredential extends SchemaThing {
  '@type': 'EducationalOccupationalCredential';
  competencyRequired?: string | string[];
  credentialCategory?: string;
  educationalLevel?: string;
  recognizedBy?: SchemaOrganization;
  validFor?: string;
  validIn?: SchemaPlace;
}

export interface SchemaOccupationalExperienceRequirements extends SchemaThing {
  '@type': 'OccupationalExperienceRequirements';
  monthsOfExperience?: number;
}

export interface SchemaMonetaryAmount extends SchemaThing {
  '@type': 'MonetaryAmount';
  currency?: string;
  maxValue?: number;
  minValue?: number;
  validFrom?: string;
  validThrough?: string;
  value?: number | string;
}

export interface SchemaMonetaryAmountDistribution extends SchemaThing {
  '@type': 'MonetaryAmountDistribution';
  currency?: string;
  duration?: string;
  median?: number;
  percentile10?: number;
  percentile25?: number;
  percentile75?: number;
  percentile90?: number;
}

export interface SchemaProgramMembership extends SchemaThing {
  '@type': 'ProgramMembership';
  hostingOrganization?: SchemaOrganization;
  member?: SchemaOrganization | SchemaPerson;
  membershipNumber?: string;
  membershipPointsEarned?: number | SchemaQuantitativeValue;
  programName?: string;
}

export interface SchemaOwnershipInfo extends SchemaThing {
  '@type': 'OwnershipInfo';
  acquiredFrom?: SchemaOrganization | SchemaPerson;
  ownedFrom?: string;
  ownedThrough?: string;
  typeOfGood?: SchemaProduct | SchemaService;
}

export interface SchemaWarrantyPromise extends SchemaThing {
  '@type': 'WarrantyPromise';
  durationOfWarranty?: SchemaQuantitativeValue;
  warrantyScope?: string;
}

export interface SchemaInteractionCounter extends SchemaThing {
  '@type': 'InteractionCounter';
  endTime?: string;
  interactionService?: SchemaThing;
  interactionType?: string;
  startTime?: string;
  userInteractionCount?: number;
}

export interface SchemaEvent extends SchemaThing {
  '@type': 'Event' | string;
  about?: SchemaThing;
  actor?: SchemaPerson | SchemaPerson[];
  aggregateRating?: SchemaAggregateRating;
  attendee?: SchemaOrganization | SchemaPerson | Array<SchemaOrganization | SchemaPerson>;
  audience?: SchemaAudience;
  composer?: SchemaOrganization | SchemaPerson;
  contributor?: SchemaOrganization | SchemaPerson | Array<SchemaOrganization | SchemaPerson>;
  director?: SchemaPerson;
  doorTime?: string;
  duration?: string;
  endDate?: string;
  eventAttendanceMode?: string;
  eventSchedule?: SchemaSchedule;
  eventStatus?: string;
  funder?: SchemaOrganization | SchemaPerson;
  inLanguage?: string | SchemaLanguage;
  isAccessibleForFree?: boolean;
  keywords?: string | string[];
  location?: SchemaPlace | SchemaPostalAddress | string;
  maximumAttendeeCapacity?: number;
  maximumPhysicalAttendeeCapacity?: number;
  maximumVirtualAttendeeCapacity?: number;
  offers?: SchemaOffer | SchemaOffer[];
  organizer?: SchemaOrganization | SchemaPerson;
  performer?: SchemaOrganization | SchemaPerson | Array<SchemaOrganization | SchemaPerson>;
  previousStartDate?: string;
  remainingAttendeeCapacity?: number;
  review?: SchemaReview | SchemaReview[];
  sponsor?: SchemaOrganization | SchemaPerson;
  startDate?: string;
  subEvent?: SchemaEvent | SchemaEvent[];
  superEvent?: SchemaEvent;
  translator?: SchemaOrganization | SchemaPerson;
  typicalAgeRange?: string;
  workFeatured?: SchemaCreativeWork;
  workPerformed?: SchemaCreativeWork;
}

export interface SchemaSchedule extends SchemaThing {
  '@type': 'Schedule';
  byDay?: string | string[];
  byMonth?: number | number[];
  byMonthDay?: number | number[];
  byMonthWeek?: number | number[];
  duration?: string;
  endDate?: string;
  endTime?: string;
  exceptDate?: string | string[];
  repeatCount?: number;
  repeatFrequency?: string;
  scheduleTimezone?: string;
  startDate?: string;
  startTime?: string;
}

export interface SchemaEducationalOrganization extends SchemaOrganization {
  '@type': 'EducationalOrganization' | 'CollegeOrUniversity' | 'HighSchool' | 'MiddleSchool' | 'Preschool' | 'School';
  alumni?: SchemaPerson | SchemaPerson[];
}

export interface SchemaBreadcrumbList extends SchemaThing {
  '@type': 'BreadcrumbList';
  itemListElement: SchemaListItem[];
}

export interface SchemaListItem extends SchemaThing {
  '@type': 'ListItem';
  item?: string | SchemaThing;
  name?: string;
  nextItem?: SchemaListItem;
  position?: number;
  previousItem?: SchemaListItem;
}

// ================================================================
// EXTRACTION RESULT TYPES
// ================================================================

/**
 * Result of Schema.org extraction from a URL
 */
export interface SchemaExtractionResult {
  /** Source URL */
  url: string;
  /** Extraction timestamp */
  extractedAt: Date;
  /** Whether extraction was successful */
  success: boolean;
  /** All extracted Schema.org objects */
  schemas: ExtractedSchema[];
  /** Validation errors */
  errors: SchemaValidationError[];
  /** Summary statistics */
  summary: ExtractionSummary;
}

/**
 * Individual extracted schema with metadata
 */
export interface ExtractedSchema {
  /** Unique ID for this extraction */
  id: string;
  /** The Schema.org type(s) */
  type: string | string[];
  /** The raw JSON-LD data */
  raw: Record<string, unknown>;
  /** Parsed/typed schema object */
  parsed: SchemaThing;
  /** Source in the HTML (json-ld, microdata, rdfa) */
  source: SchemaSource;
  /** Validation status */
  valid: boolean;
  /** Warnings (non-breaking issues) */
  warnings: string[];
}

/**
 * Source format of the schema
 */
export type SchemaSource = 'json-ld' | 'microdata' | 'rdfa';

/**
 * Schema validation error
 */
export interface SchemaValidationError {
  schemaId: string;
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Summary of extraction results
 */
export interface ExtractionSummary {
  /** Total schemas found */
  totalSchemas: number;
  /** Schemas by type */
  schemasByType: Record<string, number>;
  /** Sources found */
  sourcesFound: SchemaSource[];
  /** Has Organization schema */
  hasOrganization: boolean;
  /** Has WebSite schema */
  hasWebSite: boolean;
  /** Has WebPage schema */
  hasWebPage: boolean;
  /** Has Product schema */
  hasProduct: boolean;
  /** Has BreadcrumbList */
  hasBreadcrumbs: boolean;
  /** Has FAQ schema */
  hasFAQ: boolean;
  /** Has Review/AggregateRating */
  hasReviews: boolean;
  /** Has LocalBusiness */
  hasLocalBusiness: boolean;
  /** Has Article/BlogPosting */
  hasArticle: boolean;
  /** Has Event */
  hasEvent: boolean;
  /** Overall quality score (0-100) */
  qualityScore: number;
}

// ================================================================
// CONFIGURATION TYPES
// ================================================================

/**
 * Configuration for schema extraction
 */
export interface SchemaExtractorConfig {
  /** Timeout for fetching URL (ms) */
  fetchTimeoutMs: number;
  /** Maximum HTML size to process (bytes) */
  maxHtmlSize: number;
  /** Whether to validate schemas against Schema.org spec */
  validateSchemas: boolean;
  /** Whether to extract microdata (slower) */
  extractMicrodata: boolean;
  /** Whether to extract RDFa (slower) */
  extractRdfa: boolean;
  /** Custom user agent */
  userAgent: string;
  /** Whether to follow redirects */
  followRedirects: boolean;
  /** Maximum redirects to follow */
  maxRedirects: number;
}

/**
 * Default extraction configuration
 */
export const DEFAULT_EXTRACTOR_CONFIG: SchemaExtractorConfig = {
  fetchTimeoutMs: 10000,
  maxHtmlSize: 5 * 1024 * 1024, // 5MB
  validateSchemas: true,
  extractMicrodata: false, // Slower, opt-in
  extractRdfa: false, // Slower, opt-in
  userAgent: 'AIPerception/1.0 SchemaExtractor',
  followRedirects: true,
  maxRedirects: 5,
};
