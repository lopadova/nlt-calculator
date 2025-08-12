/**
 * Calcolatore Enterprise NLT vs Acquisto
 * Cloudflare Worker per servire l'applicazione e fornire API di calcolo
 */

// HTML content inlined per prestazioni ottimali
import htmlContent from './html-content.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route principale - serve l'applicazione HTML
      if (pathname === '/' || pathname === '/index.html') {
        return new Response(htmlContent, {
          headers: {
            'Content-Type': 'text/html; charset=UTF-8',
            ...corsHeaders,
          },
        });
      }

      // API endpoint per calcoli server-side (opzionale)
      if (pathname === '/api/calculate' && request.method === 'POST') {
        const params = await request.json();
        const result = calculateComparison(params);
        
        return new Response(JSON.stringify(result), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // API endpoint per validazione parametri
      if (pathname === '/api/validate' && request.method === 'POST') {
        const params = await request.json();
        const validation = validateParams(params);
        
        return new Response(JSON.stringify(validation), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // Health check endpoint
      if (pathname === '/health') {
        return new Response(JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          service: 'NLT Calculator' 
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // 404 per route non trovate
      return new Response('Not Found', { 
        status: 404,
        headers: corsHeaders,
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  },
};

// Funzioni di calcolo (identiche al frontend per consistenza)
function rataMensile(importo, tassoAnnuale, mesi) {
  const r = tassoAnnuale / 12;
  if (importo <= 0 || mesi <= 0) return 0;
  if (r === 0) return importo / mesi;
  const a = Math.pow(1 + r, mesi);
  return (importo * r * a) / (a - 1);
}

function nltTotale(canoneIvatoMese, accontoIniziale, anni, aliquotaEff) {
  const IVA_PERC = 0.22;
  const RECUP_IVA_PERC = 0.40;
  const DED_COSTO_PERC = 0.70;

  const imponibile = canoneIvatoMese * 100 / 122;
  const iva = canoneIvatoMese - imponibile;
  const recuperoIva = iva * RECUP_IVA_PERC;
  const recuperoDeduzione = imponibile * DED_COSTO_PERC * aliquotaEff;
  const nettoMese = canoneIvatoMese - recuperoIva - recuperoDeduzione;
  
  const imponibileAcconto = accontoIniziale * 100 / 122;
  const ivaAcconto = accontoIniziale - imponibileAcconto;
  const recuperoIvaAcconto = ivaAcconto * RECUP_IVA_PERC;
  const recuperoDeduzioneAcconto = imponibileAcconto * DED_COSTO_PERC * aliquotaEff;
  const nettoAcconto = accontoIniziale - recuperoIvaAcconto - recuperoDeduzioneAcconto;
  
  return nettoMese * 12 * anni + nettoAcconto;
}

function acquistoTotale(anni, params) {
  const mesiPossesso = anni * 12;
  const mesiRatePagate = Math.min(mesiPossesso, params.durataMesi);
  
  const assicurazioneAnnua = params.rcAnnua + params.paiAnnua + params.furtoIncAnnua + params.kaskoAnnua;
  const manutTot = params.manutOrdAnnua * anni;
  const extra = anni >= 10 ? params.extra10 : anni >= 5 ? params.extra5 : 0;
  
  const cicliIncidenti = Math.floor(anni / 5);
  const costoIncidentiTot = params.costoIncidenti5anni * cicliIncidenti;
  
  const kmTot = params.kmAnnui * anni;
  const setNecessari = Math.floor(kmTot / Math.max(1, params.durataSetKm));
  const pneusTot = setNecessari * params.costoSetPneus + (anni >= 10 ? params.foratura10y : 0);
  
  const residuoPerc = anni === 5 ? params.residuo5 : params.residuo10;
  const valoreResiduo = params.prezzoListino * residuoPerc;
  
  const importoFinanziato = Math.max(0, params.prezzoListino - params.anticipo);
  const rata = rataMensile(importoFinanziato, params.tanAnnuale, params.durataMesi);
  
  return params.anticipo + 
         rata * mesiRatePagate + 
         params.immatricolazione + 
         assicurazioneAnnua * anni + 
         manutTot + 
         extra + 
         pneusTot + 
         costoIncidentiTot - 
         valoreResiduo;
}

function calculateComparison(params) {
  try {
    const nlt5 = nltTotale(params.nltCanoneIvato, params.nltAcconto, 5, params.aliquotaEff);
    const nlt10 = nltTotale(params.nltCanoneIvato, params.nltAcconto, 10, params.aliquotaEff);
    const acq5 = acquistoTotale(5, params);
    const acq10 = acquistoTotale(10, params);

    // Calcolo risparmio fiscale
    const costoLordo5 = params.nltCanoneIvato * 12 * 5 + params.nltAcconto;
    const costoLordo10 = params.nltCanoneIvato * 12 * 10 + params.nltAcconto;
    const risparmioFiscale5 = costoLordo5 - nlt5;
    const risparmioFiscale10 = costoLordo10 - nlt10;

    return {
      success: true,
      data: {
        nlt: { anni5: nlt5, anni10: nlt10 },
        acquisto: { anni5: acq5, anni10: acq10 },
        risparmio: {
          anni5: nlt5 - acq5,
          anni10: nlt10 - acq10,
          fiscale5: risparmioFiscale5,
          fiscale10: risparmioFiscale10
        },
        raccomandazione: {
          anni5: acq5 < nlt5 ? 'acquisto' : 'nlt',
          anni10: acq10 < nlt10 ? 'acquisto' : 'nlt',
          generale: (acq5 < nlt5 && acq10 < nlt10) ? 'acquisto' : 'nlt'
        }
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

function validateParams(params) {
  const errors = [];
  const warnings = [];

  // Validazioni NLT
  if (!params.nltCanoneIvato || params.nltCanoneIvato <= 0) {
    errors.push('Canone mensile NLT deve essere maggiore di 0');
  }
  if (params.nltAcconto < 0) {
    errors.push('Acconto NLT non può essere negativo');
  }
  if (!params.aliquotaEff || params.aliquotaEff <= 0 || params.aliquotaEff > 1) {
    errors.push('Aliquota fiscale deve essere tra 0 e 1');
  }

  // Validazioni Acquisto
  if (!params.prezzoListino || params.prezzoListino <= 0) {
    errors.push('Prezzo di listino deve essere maggiore di 0');
  }
  if (params.anticipo < 0) {
    errors.push('Anticipo non può essere negativo');
  }
  if (params.anticipo >= params.prezzoListino) {
    warnings.push('Anticipo uguale o superiore al prezzo di listino');
  }
  if (!params.durataMesi || params.durataMesi <= 0) {
    errors.push('Durata finanziamento deve essere maggiore di 0');
  }
  if (params.tanAnnuale < 0 || params.tanAnnuale > 1) {
    errors.push('TAN deve essere tra 0 e 1');
  }

  // Validazioni logiche
  if (params.residuo5 <= params.residuo10) {
    warnings.push('Il valore residuo a 5 anni dovrebbe essere maggiore di quello a 10 anni');
  }
  if (params.kmAnnui <= 0) {
    errors.push('Km annui deve essere maggiore di 0');
  }
  if (params.durataSetKm <= 0) {
    errors.push('Durata set gomme deve essere maggiore di 0');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    timestamp: new Date().toISOString()
  };
}