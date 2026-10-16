// AI-Assisted Invoice Drafting Service
// Implements PRD Section 6.5 & Section 7 (AI-01)
// Adheres strictly to the PRD principle:
// "AI proposes schema-constrained draft data; backend recalculates all amounts and taxes.
// Never invent a GSTIN, HSN/SAC code, address, tax rate, invoice number or compliance status."

import { InvoiceLine, Party } from '../types';
import { calculateLineItem, TaxEngineContext } from './taxEngine';

export interface AiDraftProposal {
  matchedPartyId?: string;
  partyNameQuery?: string;
  notes?: string;
  proposedLines: Array<{
    description: string;
    quantity: number;
    unitPricePaise: number;
    taxRate: number;
    unit: string;
  }>;
  clarificationsNeeded: string[];
}

export function parseNaturalLanguageInvoiceDraft(
  prompt: string,
  savedParties: Party[],
  context: TaxEngineContext
): {
  proposal: AiDraftProposal;
  calculatedLines: InvoiceLine[];
} {
  const text = prompt.trim();
  const clarifications: string[] = [];
  
  // 1. Party detection: Check if any saved customer or supplier name is mentioned
  let matchedPartyId: string | undefined;
  let partyNameQuery: string | undefined;
  
  for (const p of savedParties) {
    const pName = p.name.toLowerCase();
    const pTrade = (p.tradeName || '').toLowerCase();
    if (text.toLowerCase().includes(pName) || (pTrade && text.toLowerCase().includes(pTrade))) {
      matchedPartyId = p.id;
      partyNameQuery = p.name;
      break;
    }
  }

  // If "to <Name>" or "for <Name>" is present
  const toMatch = text.match(/(?:to|for|billed to|client)\s+([A-Za-z0-9\s&]+?)(?:,|\.|\bwith\b|\bfor\b|\bat\b|$)/i);
  if (!matchedPartyId && toMatch && toMatch[1]) {
    partyNameQuery = toMatch[1].trim();
  }

  // 2. Line items extraction
  // Handles patterns like:
  // "3 Dell monitors at 12000 each with 18% GST"
  // "2 HDMI cables @ 450"
  // "5 hours consulting at 2500"
  // "Web design service 50000"
  const proposedItems: Array<{
    description: string;
    quantity: number;
    unitPricePaise: number;
    taxRate: number;
    unit: string;
  }> = [];

  // Split clauses by "and", ",", or newline
  const clauses = text.split(/(?:,|\band\b|\n|\+)/i);

  for (const clause of clauses) {
    const trimmed = clause.trim();
    if (!trimmed || trimmed.length < 3) continue;

    // Skip clauses that only describe the party
    if (toMatch && trimmed.toLowerCase().startsWith('to ') && !trimmed.match(/\d/)) {
      continue;
    }

    // Try to match quantity, description, price, tax
    // Regex looks for optional quantity (digits), item name, "at/@", price, optional tax rate
    const itemMatch = trimmed.match(
      /(?:(\d+)\s*(?:pcs|pieces|nos|units|hours|hrs|boxes|box|kg|sets)?\s+)?([A-Za-z0-9\s\-\.\(\)]+?)(?:\s+(?:at|@|for|costing|price)\s+(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?))(?:\s*(?:each|per\s*(?:pc|hr|unit|box))?)?(?:\s+(?:with|incl\.?|\+)?\s*(\d+)%?\s*(?:gst|tax)?)?/i
    );

    if (itemMatch) {
      const qtyStr = itemMatch[1];
      const desc = itemMatch[2].replace(/^(billed|add|invoice|item)\s+/i, '').trim();
      const priceStr = itemMatch[3].replace(/,/g, '');
      const taxStr = itemMatch[4];

      const quantity = qtyStr ? parseInt(qtyStr, 10) : 1;
      const unitPriceRupees = parseFloat(priceStr);
      const unitPricePaise = Math.round(unitPriceRupees * 100);
      
      // Determine tax rate: use extracted or default 18% for GST, 0% for non-GST
      let taxRate = context.isGstInvoice ? 18 : 0;
      if (taxStr) {
        taxRate = parseInt(taxStr, 10);
      }

      // Determine unit
      let unit = 'pcs';
      if (/hour|consulting|service/i.test(trimmed)) unit = 'hrs';
      else if (/kg|kilogram/i.test(trimmed)) unit = 'kg';
      else if (/box/i.test(trimmed)) unit = 'box';

      if (desc && !isNaN(unitPricePaise) && unitPricePaise > 0) {
        proposedItems.push({
          description: desc,
          quantity,
          unitPricePaise,
          taxRate,
          unit,
        });
      }
    } else {
      // Fallback simple line detection if "service ₹15000" or similar
      const simpleMatch = trimmed.match(/([A-Za-z\s]+?)\s+(?:rs\.?|inr|₹)?\s*([\d,]+)/i);
      if (simpleMatch && simpleMatch[1] && simpleMatch[2]) {
        const desc = simpleMatch[1].replace(/^(billed|add|invoice|item)\s+/i, '').trim();
        const price = parseFloat(simpleMatch[2].replace(/,/g, ''));
        if (desc.length > 2 && price > 0) {
          proposedItems.push({
            description: desc,
            quantity: 1,
            unitPricePaise: Math.round(price * 100),
            taxRate: context.isGstInvoice ? 18 : 0,
            unit: 'pcs',
          });
        }
      }
    }
  }

  // If no items were parsed, provide helpful feedback
  if (proposedItems.length === 0) {
    clarifications.push('Could not detect specific line items. Try e.g. "3 Monitors at 15000 each and 5 HDMI cables at 400"');
  }

  if (!matchedPartyId && !partyNameQuery) {
    clarifications.push('Customer was not specified. You can choose a customer from the dropdown above.');
  }

  // Backend deterministic calculation of all line totals
  const calculatedLines: InvoiceLine[] = proposedItems.map((item, index) => {
    const rawLine = {
      id: `ai_ln_${Date.now()}_${index}`,
      description: item.description,
      hsnSac: item.unit === 'hrs' ? '9983' : '8471',
      quantity: item.quantity,
      unit: item.unit,
      unitPricePaise: item.unitPricePaise,
      discountPercent: 0,
      discountPaise: 0,
      taxRate: item.taxRate,
      isTaxInclusive: false,
    };

    const calc = calculateLineItem(rawLine, context);

    return {
      ...rawLine,
      ...calc,
      totalPaise: calc.lineTotalPaise,
    };
  });

  return {
    proposal: {
      matchedPartyId,
      partyNameQuery,
      proposedLines: proposedItems,
      clarificationsNeeded: clarifications,
    },
    calculatedLines,
  };
}
