export const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "identification", label: "Identification" },
  { value: "qualification", label: "Qualification" },
  { value: "license", label: "License" },
  { value: "certification", label: "Certification" },
  { value: "ticket", label: "Ticket / Permit" },
  { value: "resume", label: "Resume / CV" },
  { value: "insurance", label: "Insurance" },
  { value: "wwcc", label: "Working With Children Check (WWCC)" },
  { value: "criminal_history", label: "Criminal History Check" },
  { value: "business_registration", label: "Business Registration (ABN/ACN)" },
  { value: "other", label: "Other" },
];

export const ID_SUBTYPES = [
  { value: "drivers_licence", label: "Driver's Licence" },
  { value: "passport", label: "Passport" },
  { value: "photo_id", label: "Photo ID Card" },
  { value: "proof_of_age", label: "Proof of Age Card" },
  { value: "medicare", label: "Medicare Card" },
  { value: "other", label: "Other ID" },
];

export interface FieldConfig {
  titleLabel: string;
  titlePlaceholder: string;
  titleRequired: boolean;
  showDescription: boolean;
  docNumLabel: string;
  docNumPlaceholder: string;
  showDocNum: boolean;
  issuedByLabel: string;
  issuedByPlaceholder: string;
  showIssuedBy: boolean;
  showIssuedAt: boolean;
  showExpiresAt: boolean;
  expiresLabel: string;
  fileRequired: boolean;
  showBackFile: boolean;
  forcePrivate: boolean;
}

export function getFieldConfig(type: string, subType?: string | null): FieldConfig {
  switch (type) {
    case "identification":
      switch (subType) {
        case "drivers_licence":
          return {
            titleLabel: "ID Type",
            titlePlaceholder: "Driver's Licence",
            titleRequired: false,
            showDescription: false,
            docNumLabel: "Licence Number",
            docNumPlaceholder: "e.g. 12345678",
            showDocNum: true,
            issuedByLabel: "State / Territory",
            issuedByPlaceholder: "e.g. NSW, VIC, QLD",
            showIssuedBy: true,
            showIssuedAt: false,
            showExpiresAt: true,
            expiresLabel: "Expiry Date",
            fileRequired: true,
            showBackFile: true,
            forcePrivate: true,
          };
        case "passport":
          return {
            titleLabel: "ID Type",
            titlePlaceholder: "Passport",
            titleRequired: false,
            showDescription: false,
            docNumLabel: "Passport Number",
            docNumPlaceholder: "e.g. PA1234567",
            showDocNum: true,
            issuedByLabel: "Country",
            issuedByPlaceholder: "e.g. Australia",
            showIssuedBy: true,
            showIssuedAt: false,
            showExpiresAt: true,
            expiresLabel: "Expiry Date",
            fileRequired: true,
            showBackFile: false,
            forcePrivate: true,
          };
        case "photo_id":
        case "proof_of_age":
        case "medicare":
        default:
          return {
            titleLabel: "ID Type",
            titlePlaceholder:
              subType === "photo_id"
                ? "Photo ID Card"
                : subType === "proof_of_age"
                  ? "Proof of Age Card"
                  : subType === "medicare"
                    ? "Medicare Card"
                    : "Identification",
            titleRequired: false,
            showDescription: false,
            docNumLabel: "Card Number",
            docNumPlaceholder: "e.g. 1234 5678 9012",
            showDocNum: true,
            issuedByLabel: "Issuing State / Organisation",
            issuedByPlaceholder: "e.g. NSW, Services Australia",
            showIssuedBy: true,
            showIssuedAt: false,
            showExpiresAt: true,
            expiresLabel: "Expiry Date",
            fileRequired: true,
            showBackFile: subType === "drivers_licence" || subType === "medicare",
            forcePrivate: true,
          };
      }
    case "qualification":
      return {
        titleLabel: "Qualification Name",
        titlePlaceholder: "e.g. Bachelor of Nursing",
        titleRequired: true,
        showDescription: true,
        docNumLabel: "Document Number",
        docNumPlaceholder: "Transcript or certificate number",
        showDocNum: false,
        issuedByLabel: "Institution",
        issuedByPlaceholder: "e.g. University of Sydney",
        showIssuedBy: true,
        showIssuedAt: true,
        showExpiresAt: false,
        expiresLabel: "Expiry Date",
        fileRequired: false,
        showBackFile: false,
        forcePrivate: false,
      };
    case "license":
      return {
        titleLabel: "Licence Name",
        titlePlaceholder: "e.g. Builder's Licence",
        titleRequired: true,
        showDescription: false,
        docNumLabel: "Licence Number",
        docNumPlaceholder: "e.g. BL-123456",
        showDocNum: true,
        issuedByLabel: "Issuing Authority",
        issuedByPlaceholder: "e.g. NSW Fair Trading",
        showIssuedBy: true,
        showIssuedAt: false,
        showExpiresAt: true,
        expiresLabel: "Expiry Date",
        fileRequired: false,
        showBackFile: true,
        forcePrivate: false,
      };
    case "certification":
      return {
        titleLabel: "Certification Name",
        titlePlaceholder: "e.g. First Aid Certificate",
        titleRequired: true,
        showDescription: true,
        docNumLabel: "Certificate Number",
        docNumPlaceholder: "e.g. FA-2024-001",
        showDocNum: false,
        issuedByLabel: "Issuing Organisation",
        issuedByPlaceholder: "e.g. St John Ambulance",
        showIssuedBy: true,
        showIssuedAt: false,
        showExpiresAt: true,
        expiresLabel: "Expiry Date",
        fileRequired: false,
        showBackFile: false,
        forcePrivate: false,
      };
    case "ticket":
      return {
        titleLabel: "Ticket Name",
        titlePlaceholder: "e.g. White Card",
        titleRequired: true,
        showDescription: false,
        docNumLabel: "Ticket Number",
        docNumPlaceholder: "e.g. WC-123456",
        showDocNum: true,
        issuedByLabel: "Registered Training Organisation",
        issuedByPlaceholder: "e.g. TAFE NSW",
        showIssuedBy: true,
        showIssuedAt: false,
        showExpiresAt: true,
        expiresLabel: "Expiry Date",
        fileRequired: false,
        showBackFile: false,
        forcePrivate: false,
      };
    case "resume":
      return {
        titleLabel: "Resume Title",
        titlePlaceholder: "e.g. Professional Resume 2024",
        titleRequired: true,
        showDescription: true,
        docNumLabel: "Document Number",
        docNumPlaceholder: "",
        showDocNum: false,
        issuedByLabel: "",
        issuedByPlaceholder: "",
        showIssuedBy: false,
        showIssuedAt: false,
        showExpiresAt: false,
        expiresLabel: "Expiry Date",
        fileRequired: true,
        showBackFile: false,
        forcePrivate: false,
      };
    case "insurance":
      return {
        titleLabel: "Insurance Type",
        titlePlaceholder: "e.g. Public Liability Insurance",
        titleRequired: true,
        showDescription: true,
        docNumLabel: "Policy Number",
        docNumPlaceholder: "e.g. PLI-123456",
        showDocNum: true,
        issuedByLabel: "Insurer",
        issuedByPlaceholder: "e.g. NRMA Business Insurance",
        showIssuedBy: true,
        showIssuedAt: false,
        showExpiresAt: true,
        expiresLabel: "Policy Expiry",
        fileRequired: false,
        showBackFile: false,
        forcePrivate: false,
      };
    case "wwcc":
      return {
        titleLabel: "WWCC Number",
        titlePlaceholder: "e.g. WWC123456789",
        titleRequired: true,
        showDescription: false,
        docNumLabel: "WWCC Number",
        docNumPlaceholder: "e.g. WWC123456789",
        showDocNum: true,
        issuedByLabel: "State",
        issuedByPlaceholder: "e.g. NSW",
        showIssuedBy: true,
        showIssuedAt: false,
        showExpiresAt: true,
        expiresLabel: "Expiry Date",
        fileRequired: false,
        showBackFile: false,
        forcePrivate: true,
      };
    case "criminal_history":
      return {
        titleLabel: "Check Reference",
        titlePlaceholder: "e.g. Police Check 2024",
        titleRequired: true,
        showDescription: false,
        docNumLabel: "Reference Number",
        docNumPlaceholder: "e.g. PC-123456",
        showDocNum: true,
        issuedByLabel: "Issuing Authority",
        issuedByPlaceholder: "e.g. Australian Federal Police",
        showIssuedBy: true,
        showIssuedAt: false,
        showExpiresAt: true,
        expiresLabel: "Date of Issue",
        fileRequired: false,
        showBackFile: false,
        forcePrivate: true,
      };
    case "business_registration":
      return {
        titleLabel: "Registration Number",
        titlePlaceholder: "e.g. ABN 12 345 678 901",
        titleRequired: true,
        showDescription: true,
        docNumLabel: "ABN / ACN",
        docNumPlaceholder: "e.g. 12 345 678 901",
        showDocNum: true,
        issuedByLabel: "Registered With",
        issuedByPlaceholder: "e.g. ASIC / ABR",
        showIssuedBy: true,
        showIssuedAt: false,
        showExpiresAt: false,
        expiresLabel: "Expiry Date",
        fileRequired: false,
        showBackFile: false,
        forcePrivate: false,
      };
    case "other":
    default:
      return {
        titleLabel: "Credential Name",
        titlePlaceholder: "e.g. Membership Certificate",
        titleRequired: true,
        showDescription: true,
        docNumLabel: "Document Number",
        docNumPlaceholder: "e.g. MEM-123456",
        showDocNum: false,
        issuedByLabel: "Issuing Organisation",
        issuedByPlaceholder: "e.g. Professional Body",
        showIssuedBy: true,
        showIssuedAt: false,
        showExpiresAt: false,
        expiresLabel: "Expiry Date",
        fileRequired: false,
        showBackFile: false,
        forcePrivate: false,
      };
  }
}
