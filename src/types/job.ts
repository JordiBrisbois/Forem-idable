export interface Job {
  id: string;
  title: string;
  company?: string;
  location: string;
  contractType: string;
  /** Raw upstream label, shown when the normalized bucket is AUTRE. */
  contractTypeRaw?: string;
  publicationDate: string;
  url: string;
  description?: string;
  source: 'forem' | 'linkedin' | 'indeed' | 'adzuna';
  pdfUrl?: string;
}
