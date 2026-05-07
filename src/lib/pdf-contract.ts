import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface ContractPdfData {
  contractId: string;
  generatedAt: string;
  needTitle: string;
  needDescription: string;
  needDeadline: string | null;
  needTimeRange: string | null;
  needLocation: string | null;
  offerType: string;
  offerDescription: string;
  offerValue: number | null;
  terms: {
    startDate?: string | null;
    deadline?: string | null;
    timeRange?: string | null;
    workLocation?: string | null;
    reciprocationLocation?: string | null;
    customTerms?: string | null;
    notes?: string | null;
  };
  partyATerms: string | null;
  partyBTerms: string | null;
  deadlineTerms: string | null;
  completionMethodTerms: string | null;
  additionalTerms: string | null;
  partyAUseMessageTerms: boolean;
  partyBUseMessageTerms: boolean;
  partyA: {
    fullName: string | null;
    email: string;
    locationName: string | null;
    isVerified: boolean;
  };
  partyB: {
    fullName: string | null;
    email: string;
    locationName: string | null;
    isVerified: boolean;
  };
  negotiationMessages: Array<{
    senderName: string | null;
    content: string;
    createdAt: string;
  }>;
  partyASignedAt: string | null;
  partyBSignedAt: string | null;
  partyASignature: string | null;
  partyBSignature: string | null;
}

export async function generateContractPdf(data: ContractPdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();

  let y = height - 50;
  const margin = 50;
  const contentWidth = width - margin * 2;

  function drawText(text: string, options: { x?: number; y?: number; size?: number; bold?: boolean; color?: ReturnType<typeof rgb> }) {
    const font = options.bold ? helveticaBold : helvetica;
    const size = options.size || 10;
    const color = options.color || rgb(0.1, 0.1, 0.1);
    page.drawText(text, { x: options.x ?? margin, y: options.y ?? y, size, font, color });
  }

  function wrapText(text: string, maxWidth: number, size: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? currentLine + " " + word : word;
      const lineWidth = helvetica.widthOfTextAtSize(testLine, size);
      if (lineWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  function newPageIfNeeded(requiredSpace: number) {
    if (y - requiredSpace < 60) {
      page = pdfDoc.addPage([612, 792]);
      y = height - 50;
    }
  }

  // Header
  drawText("ANTIDOSIS", { size: 24, bold: true, color: rgb(0.15, 0.15, 0.15) });
  y -= 18;
  drawText("Binding Exchange Contract", { size: 12, color: rgb(0.4, 0.4, 0.4) });
  y -= 30;

  // Contract metadata
  drawText(`Contract ID: ${data.contractId.slice(0, 8)}`, { size: 9, color: rgb(0.4, 0.4, 0.4) });
  y -= 14;
  drawText(`Generated: ${new Date(data.generatedAt).toLocaleString("en-AU")}`, { size: 9, color: rgb(0.4, 0.4, 0.4) });
  y -= 30;

  // Horizontal line
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  y -= 20;

  // Section 1: Need Details
  drawText("1. NEED DETAILS", { size: 13, bold: true, color: rgb(0.2, 0.2, 0.2) });
  y -= 18;
  drawText("Title:", { size: 9, bold: true, color: rgb(0.4, 0.4, 0.4) });
  y -= 12;
  drawText(data.needTitle, { size: 11 });
  y -= 16;

  drawText("Description:", { size: 9, bold: true, color: rgb(0.4, 0.4, 0.4) });
  y -= 12;
  const descLines = wrapText(data.needDescription, contentWidth, 10);
  for (const line of descLines) {
    newPageIfNeeded(14);
    drawText(line, { size: 10 });
    y -= 14;
  }
  y -= 6;

  if (data.needDeadline || data.needTimeRange || data.needLocation) {
    const metaItems = [];
    if (data.needDeadline) metaItems.push(`Deadline: ${new Date(data.needDeadline).toLocaleDateString("en-AU")}`);
    if (data.needTimeRange) metaItems.push(`Time estimate: ${data.needTimeRange}`);
    if (data.needLocation) metaItems.push(`Location: ${data.needLocation}`);
    drawText(metaItems.join("  |  "), { size: 9, color: rgb(0.4, 0.4, 0.4) });
    y -= 16;
  }

  y -= 10;
  newPageIfNeeded(100);

  // Section 2: Offer Details
  drawText("2. OFFER IN EXCHANGE", { size: 13, bold: true, color: rgb(0.2, 0.2, 0.2) });
  y -= 18;
  drawText(`Type: ${data.offerType.toUpperCase()}`, { size: 10 });
  y -= 14;
  const offerLines = wrapText(data.offerDescription, contentWidth, 10);
  for (const line of offerLines) {
    newPageIfNeeded(14);
    drawText(line, { size: 10 });
    y -= 14;
  }
  if (data.offerValue) {
    y -= 6;
    drawText(`Estimated value: $${data.offerValue.toLocaleString()}`, { size: 10, color: rgb(0.4, 0.4, 0.4) });
    y -= 14;
  }
  y -= 10;
  newPageIfNeeded(100);

  // Section 3: Unified Agreed Terms
  drawText("3. AGREED TERMS", { size: 13, bold: true, color: rgb(0.2, 0.2, 0.2) });
  y -= 18;

  // Unified statement
  drawText("Both parties have reviewed and agreed to the following terms:", { size: 10, color: rgb(0.4, 0.4, 0.4) });
  y -= 16;

  // Party A contributions
  const hasPartyATerms = data.partyATerms || data.partyAUseMessageTerms;
  const hasPartyBTerms = data.partyBTerms || data.partyBUseMessageTerms;

  if (hasPartyATerms || hasPartyBTerms) {
    drawText("Terms proposed by Party A (Need Poster):", { size: 10, bold: true, color: rgb(0.3, 0.3, 0.3) });
    y -= 12;
    if (data.partyAUseMessageTerms) {
      drawText("Terms derived from message thread (see Section 5)", { size: 10, color: rgb(0.4, 0.4, 0.4) });
      y -= 14;
    } else if (data.partyATerms) {
      const lines = wrapText(data.partyATerms, contentWidth, 10);
      for (const line of lines) {
        newPageIfNeeded(14);
        drawText(line, { size: 10 });
        y -= 14;
      }
    } else {
      drawText("No specific terms provided.", { size: 10, color: rgb(0.4, 0.4, 0.4) });
      y -= 14;
    }
    y -= 10;

    drawText("Terms proposed by Party B (Fulfiller):", { size: 10, bold: true, color: rgb(0.3, 0.3, 0.3) });
    y -= 12;
    if (data.partyBUseMessageTerms) {
      drawText("Terms derived from message thread (see Section 5)", { size: 10, color: rgb(0.4, 0.4, 0.4) });
      y -= 14;
    } else if (data.partyBTerms) {
      const lines = wrapText(data.partyBTerms, contentWidth, 10);
      for (const line of lines) {
        newPageIfNeeded(14);
        drawText(line, { size: 10 });
        y -= 14;
      }
    } else {
      drawText("No specific terms provided.", { size: 10, color: rgb(0.4, 0.4, 0.4) });
      y -= 14;
    }
    y -= 10;
  }

  // Shared optional terms
  const sharedTermFields = [
    { label: "Deadline terms", value: data.deadlineTerms },
    { label: "Completion method", value: data.completionMethodTerms },
    { label: "Additional terms", value: data.additionalTerms },
  ];

  let hasSharedTerms = false;
  for (const field of sharedTermFields) {
    if (field.value) {
      if (!hasSharedTerms) {
        drawText("Shared terms and conditions:", { size: 10, bold: true, color: rgb(0.3, 0.3, 0.3) });
        y -= 12;
        hasSharedTerms = true;
      }
      newPageIfNeeded(40);
      drawText(`${field.label}:`, { size: 9, bold: true, color: rgb(0.4, 0.4, 0.4) });
      y -= 12;
      const lines = wrapText(String(field.value), contentWidth, 10);
      for (const line of lines) {
        newPageIfNeeded(14);
        drawText(line, { size: 10 });
        y -= 14;
      }
      y -= 4;
    }
  }

  if (!hasPartyATerms && !hasPartyBTerms && !hasSharedTerms) {
    drawText("No specific terms were recorded. Both parties agree to complete the exchange in good faith.", { size: 10, color: rgb(0.4, 0.4, 0.4) });
    y -= 14;
  }

  y -= 10;
  newPageIfNeeded(100);

  // Legacy terms (backward compatibility)
  const termFields = [
    { label: "Start date", value: data.terms.startDate },
    { label: "Deadline", value: data.terms.deadline },
    { label: "Time range", value: data.terms.timeRange },
    { label: "Work location", value: data.terms.workLocation },
    { label: "Reciprocation location", value: data.terms.reciprocationLocation },
    { label: "Custom terms", value: data.terms.customTerms },
    { label: "Notes", value: data.terms.notes },
  ];

  for (const field of termFields) {
    if (field.value) {
      newPageIfNeeded(40);
      drawText(`${field.label}:`, { size: 9, bold: true, color: rgb(0.4, 0.4, 0.4) });
      y -= 12;
      const lines = wrapText(String(field.value), contentWidth, 10);
      for (const line of lines) {
        newPageIfNeeded(14);
        drawText(line, { size: 10 });
        y -= 14;
      }
      y -= 4;
    }
  }
  y -= 10;
  newPageIfNeeded(100);

  // Section 4: Parties
  drawText("4. PARTIES", { size: 13, bold: true, color: rgb(0.2, 0.2, 0.2) });
  y -= 18;

  drawText("Party A (Need Poster):", { size: 10, bold: true });
  y -= 14;
  drawText(`Name: ${data.partyA.fullName || "N/A"}  |  Email: ${data.partyA.email}${data.partyA.isVerified ? "  |  ✓ Verified" : ""}`, { size: 9 });
  if (data.partyA.locationName) {
    y -= 14;
    drawText(`Location: ${data.partyA.locationName}`, { size: 9, color: rgb(0.4, 0.4, 0.4) });
  }
  y -= 20;

  drawText("Party B (Fulfiller):", { size: 10, bold: true });
  y -= 14;
  drawText(`Name: ${data.partyB.fullName || "N/A"}  |  Email: ${data.partyB.email}${data.partyB.isVerified ? "  |  ✓ Verified" : ""}`, { size: 9 });
  if (data.partyB.locationName) {
    y -= 14;
    drawText(`Location: ${data.partyB.locationName}`, { size: 9, color: rgb(0.4, 0.4, 0.4) });
  }
  y -= 20;
  newPageIfNeeded(100);

  // Section 5: Negotiation Transcript
  if (data.negotiationMessages.length > 0) {
    drawText("5. NEGOTIATION TRANSCRIPT", { size: 13, bold: true, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
    for (const msg of data.negotiationMessages) {
      newPageIfNeeded(40);
      const sender = msg.senderName || "Anonymous";
      const time = new Date(msg.createdAt).toLocaleString("en-AU");
      drawText(`${sender}  —  ${time}`, { size: 8, color: rgb(0.5, 0.5, 0.5) });
      y -= 12;
      const msgLines = wrapText(msg.content, contentWidth, 9);
      for (const line of msgLines) {
        newPageIfNeeded(12);
        drawText(line, { size: 9 });
        y -= 12;
      }
      y -= 8;
    }
    y -= 10;
    newPageIfNeeded(100);
  }

  // Section 6: Signatures
  drawText("6. DIGITAL SIGNATURES", { size: 13, bold: true, color: rgb(0.2, 0.2, 0.2) });
  y -= 18;

  drawText("By signing below, both parties acknowledge they have read, understood, and agree to be bound by the terms of this contract.", { size: 9, color: rgb(0.4, 0.4, 0.4) });
  y -= 20;

  if (data.partyASignedAt) {
    drawText(`Party A: ${data.partyA.fullName || "N/A"}`, { size: 10, bold: true });
    y -= 14;
    if (data.partyASignature) {
      drawText(`Signature: ${data.partyASignature}`, { size: 11, color: rgb(0.1, 0.1, 0.1) });
      y -= 14;
    }
    drawText(`Signed: ${new Date(data.partyASignedAt).toLocaleString("en-AU")}`, { size: 9, color: rgb(0.2, 0.5, 0.2) });
  } else {
    drawText("Party A: ________________________________  Date: _______________", { size: 10, color: rgb(0.4, 0.4, 0.4) });
  }
  y -= 36;

  if (data.partyBSignedAt) {
    drawText(`Party B: ${data.partyB.fullName || "N/A"}`, { size: 10, bold: true });
    y -= 14;
    if (data.partyBSignature) {
      drawText(`Signature: ${data.partyBSignature}`, { size: 11, color: rgb(0.1, 0.1, 0.1) });
      y -= 14;
    }
    drawText(`Signed: ${new Date(data.partyBSignedAt).toLocaleString("en-AU")}`, { size: 9, color: rgb(0.2, 0.5, 0.2) });
  } else {
    drawText("Party B: ________________________________  Date: _______________", { size: 10, color: rgb(0.4, 0.4, 0.4) });
  }
  y -= 30;

  // Footer
  newPageIfNeeded(30);
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  y -= 14;
  drawText("This contract was generated by antidosis.com", { size: 8, color: rgb(0.5, 0.5, 0.5) });
  y -= 12;
  drawText("Both parties agree to fulfil the terms outlined above. Disputes should be resolved through direct communication.", { size: 8, color: rgb(0.5, 0.5, 0.5) });

  return await pdfDoc.save();
}
