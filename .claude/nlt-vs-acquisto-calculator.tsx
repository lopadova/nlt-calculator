import React, { useMemo, useState, useCallback, useRef } from "react";

// Calcolatore NLT vs Acquisto – valori iniziali derivati dalla conversazione
// Styling: Tailwind. Nessuna dipendenza esterna necessaria.

// Helpers
const fmtEuro = (n) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(
    isFinite(n) ? n : 0
  );

function rataMensile(importo, tassoAnnuale, mesi) {
  const r = tassoAnnuale / 12;
  if (importo <= 0 || mesi <= 0) return 0;
  if (r === 0) return importo / mesi;
  const a = Math.pow(1 + r, mesi);
  return (importo * r * a) / (a - 1);
}

export default function App() {
  // --- NLT ---
  const [nltCanoneIvato, setNltCanoneIvato] = useState(429); // €/mese IVA inclusa
  const [nltAcconto, setNltAcconto] = useState(0); // Acconto iniziale NLT
  const [aliquotaEff, setAliquotaEff] = useState(0.35); // aliquota effettiva (es. 35% = 0.35)

  // --- Regole fiscali NLT fisse ---
  const IVA_PERC = 0.22;
  const RECUP_IVA_PERC = 0.40; // 40% IVA
  const DED_COSTO_PERC = 0.70; // 70% imponibile

  // --- Acquisto --- (campi usati nel dettaglio precedente)
  const [prezzoListino, setPrezzoListino] = useState(32000);
  const [anticipo, setAnticipo] = useState(8000);
  const [durataMesi, setDurataMesi] = useState(60);
  const [tanAnnuale, setTanAnnuale] = useState(0.075); // ~7,5%
  const [immatricolazione, setImmatricolazione] = useState(400);

  // Assicurazioni (annui)
  const [rcAnnua, setRcAnnua] = useState(1000);
  const [paiAnnua, setPaiAnnua] = useState(40);
  const [furtoIncAnnua, setFurtoIncAnnua] = useState(0);
  const [kaskoAnnua, setKaskoAnnua] = useState(0);

  // Manutenzione (annui + extra)
  const [manutOrdAnnua, setManutOrdAnnua] = useState(400);
  const [extra5, setExtra5] = useState(800);
  const [extra10, setExtra10] = useState(2500);
  const [costoIncidenti5anni, setCostoIncidenti5anni] = useState(0);

  // Pneumatici & percorrenze
  const [kmAnnui, setKmAnnui] = useState(10000);
  const [durataSetKm, setDurataSetKm] = useState(40000);
  const [costoSetPneus, setCostoSetPneus] = useState(500);
  const [foratura10y, setForatura10y] = useState(60);

  // Valori residui (percentuali su listino)
  const [residuo5, setResiduo5] = useState(0.29); // 29%
  const [residuo10, setResiduo10] = useState(0.15); // 15%

  // Derivati acquisto
  const importoFinanziato = useMemo(() => Math.max(0, prezzoListino - anticipo), [prezzoListino, anticipo]);
  const rata = useMemo(() => rataMensile(importoFinanziato, tanAnnuale, durataMesi), [importoFinanziato, tanAnnuale, durataMesi]);

  // Funzioni di costo
  function nltTotale(canoneIvatoMese, accontoIniziale, anni) {
    const imponibile = canoneIvatoMese * 100 / 122; // scorporo IVA 22%
    const iva = canoneIvatoMese - imponibile;
    const recuperoIva = iva * RECUP_IVA_PERC;
    const recuperoDeduzione = imponibile * DED_COSTO_PERC * aliquotaEff;
    const nettoMese = canoneIvatoMese - recuperoIva - recuperoDeduzione;
    
    // Calcolo acconto con stesse deduzioni fiscali
    const imponibileAcconto = accontoIniziale * 100 / 122;
    const ivaAcconto = accontoIniziale - imponibileAcconto;
    const recuperoIvaAcconto = ivaAcconto * RECUP_IVA_PERC;
    const recuperoDeduzioneAcconto = imponibileAcconto * DED_COSTO_PERC * aliquotaEff;
    const nettoAcconto = accontoIniziale - recuperoIvaAcconto - recuperoDeduzioneAcconto;
    
    return nettoMese * 12 * anni + nettoAcconto;
  }

  // Calcolo risparmio fiscale
  function calcolaRisparmioFiscale(canoneIvatoMese, accontoIniziale, anni) {
    const costoLordoCanoni = canoneIvatoMese * 12 * anni;
    const costoLordoTotale = costoLordoCanoni + accontoIniziale;
    const costoNettoTotale = nltTotale(canoneIvatoMese, accontoIniziale, anni);
    return costoLordoTotale - costoNettoTotale;
  }

  function acquistoTotale(anni) {
    const mesiPossesso = anni * 12;
    const mesiRatePagate = Math.min(mesiPossesso, durataMesi);

    // Assicurazioni annue sommate
    const assicurazioneAnnua = rcAnnua + paiAnnua + furtoIncAnnua + kaskoAnnua;

    // Manutenzione
    const manutTot = manutOrdAnnua * anni;
    const extra = anni >= 10 ? extra10 : anni >= 5 ? extra5 : 0;
    
    // Costi incidenti (ogni 5 anni)
    const cicliIncidenti = Math.floor(anni / 5);
    const costoIncidentiTot = costoIncidenti5anni * cicliIncidenti;

    // Pneumatici
    const kmTot = kmAnnui * anni;
    const setNecessari = Math.floor(kmTot / Math.max(1, durataSetKm));
    const pneusTot = setNecessari * costoSetPneus + (anni >= 10 ? foratura10y : 0);

    // Valore residuo
    const residuoPerc = anni === 5 ? residuo5 : residuo10;
    const valoreResiduo = prezzoListino * residuoPerc;

    // Totale periodo: anticipo + rate (mesi pagati) + immatricolazione + assicurazioni + manutenzione + extra + pneumatici + incidenti - valore residuo
    const tot =
      anticipo +
      rata * mesiRatePagate +
      immatricolazione +
      assicurazioneAnnua * anni +
      manutTot +
      extra +
      pneusTot +
      costoIncidentiTot -
      valoreResiduo;

    return tot;
  }

  const [risultati, setRisultati] = useState(null);
  const debounceTimeoutRef = useRef(null);

  const debouncedCalculate = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      const nlt5 = nltTotale(nltCanoneIvato, nltAcconto, 5);
      const nlt10 = nltTotale(nltCanoneIvato, nltAcconto, 10);
      const acq5 = acquistoTotale(5);
      const acq10 = acquistoTotale(10);
      setRisultati({ nlt5, nlt10, acq5, acq10 });
    }, 300); // 300ms debounce
  }, [nltCanoneIvato, nltAcconto, aliquotaEff, prezzoListino, anticipo, durataMesi, tanAnnuale, immatricolazione, rcAnnua, paiAnnua, furtoIncAnnua, kaskoAnnua, manutOrdAnnua, extra5, extra10, costoIncidenti5anni, kmAnnui, durataSetKm, costoSetPneus, foratura10y, residuo5, residuo10]);

  function calcola() {
    const nlt5 = nltTotale(nltCanoneIvato, nltAcconto, 5);
    const nlt10 = nltTotale(nltCanoneIvato, nltAcconto, 10);
    const acq5 = acquistoTotale(5);
    const acq10 = acquistoTotale(10);
    setRisultati({ nlt5, nlt10, acq5, acq10 });
  }

  // Auto-calculate on parameter changes with debouncing
  React.useEffect(() => {
    debouncedCalculate();
  }, [debouncedCalculate]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // UI components
  const Field = ({ label, value, onChange, step = 1, min = 0, suffix = "", className = "" }) => {
    const handleChange = useCallback((e) => {
      const newValue = parseFloat(e.target.value) || 0;
      onChange(newValue);
    }, [onChange]);

    return (
      <label className={`flex flex-col gap-1 ${className}`}>
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <input
          type="number"
          className="rounded-lg border border-gray-300 p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          value={value}
          min={min}
          step={step}
          onChange={handleChange}
        />
        {suffix ? <span className="text-xs text-gray-500 mt-1">{suffix}</span> : null}
      </label>
    );
  };

  return (
    <div className="mx-auto max-w-7xl p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Calcolatore Enterprise NLT vs Acquisto</h1>
        <p className="text-gray-600">Analisi comparativa per veicoli aziendali - parametri di default per Kia Sportage</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* NLT Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <h2 className="text-xl font-semibold text-gray-900">NLT (Noleggio a Lungo Termine)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field 
              label="Canone mensile (IVA inclusa)" 
              value={nltCanoneIvato} 
              onChange={setNltCanoneIvato} 
              step={10} 
              suffix="€/mese"
            />
            <Field 
              label="Acconto iniziale (IVA inclusa)" 
              value={nltAcconto} 
              onChange={setNltAcconto} 
              step={100} 
              suffix="€"
            />
            <Field 
              label="Aliquota fiscale effettiva" 
              value={aliquotaEff} 
              onChange={setAliquotaEff} 
              step={0.01} 
              min={0} 
              max={1}
              suffix="0.35 = 35%" 
            />
          </div>
          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <h3 className="font-medium text-blue-900 mb-2">Parametri fiscali fissi:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• IVA: 22%</li>
              <li>• Recupero IVA: 40%</li>
              <li>• Deducibilità costo: 70%</li>
              <li className="font-bold text-blue-900">
                • Risparmio fiscale in 5 anni: {fmtEuro(calcolaRisparmioFiscale(nltCanoneIvato, nltAcconto, 5))} 
                {" "}e 10 anni: {fmtEuro(calcolaRisparmioFiscale(nltCanoneIvato, nltAcconto, 10))}
              </li>
            </ul>
          </div>
        </div>

        {/* ACQUISTO Section */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <h2 className="text-xl font-semibold text-gray-900">Acquisto con Finanziamento</h2>
          </div>
          
          {/* Finanziamento */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-800 mb-3">Finanziamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Prezzo listino" value={prezzoListino} onChange={setPrezzoListino} step={1000} suffix="€" />
              <Field label="Anticipo (t0)" value={anticipo} onChange={setAnticipo} step={500} suffix="€" />
              <Field label="Durata (mesi)" value={durataMesi} onChange={setDurataMesi} step={6} suffix="mesi" />
              <Field label="TAN/TAEG annuo" value={tanAnnuale} onChange={setTanAnnuale} step={0.001} suffix="0.075 = 7,5%" />
            </div>
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-green-800">
                <strong>Importo finanziato:</strong> {fmtEuro(importoFinanziato)} | 
                <strong> Rata mensile:</strong> {fmtEuro(rata)}
              </div>
            </div>
          </div>

          {/* Altri costi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Assicurazioni */}
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Assicurazioni (annue)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="RC Auto" value={rcAnnua} onChange={setRcAnnua} suffix="€/anno" />
                <Field label="PAI" value={paiAnnua} onChange={setPaiAnnua} suffix="€/anno" />
                <Field label="Furto/Incendio" value={furtoIncAnnua} onChange={setFurtoIncAnnua} suffix="€/anno" />
                <Field label="Kasko" value={kaskoAnnua} onChange={setKaskoAnnua} suffix="€/anno" />
              </div>
            </div>

            {/* Manutenzione */}
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Manutenzione</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Ordinaria (annua)" value={manutOrdAnnua} onChange={setManutOrdAnnua} suffix="€/anno" />
                <Field label="Extra a 5 anni" value={extra5} onChange={setExtra5} suffix="€" />
                <Field label="Extra a 10 anni" value={extra10} onChange={setExtra10} suffix="€" />
                <Field label="Costo incidenti (ogni 5 anni)" value={costoIncidenti5anni} onChange={setCostoIncidenti5anni} suffix="€" />
                <Field label="Immatricolazione" value={immatricolazione} onChange={setImmatricolazione} suffix="€" />
              </div>
            </div>

            {/* Pneumatici */}
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Pneumatici & Percorrenza</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Km annui" value={kmAnnui} onChange={setKmAnnui} step={1000} suffix="km/anno" />
                <Field label="Durata set gomme" value={durataSetKm} onChange={setDurataSetKm} step={5000} suffix="km" />
                <Field label="Costo set gomme" value={costoSetPneus} onChange={setCostoSetPneus} suffix="€" />
                <Field label="Foratura (10 anni)" value={foratura10y} onChange={setForatura10y} suffix="€" />
              </div>
            </div>

            {/* Valori residui */}
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Valori Residui</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Valore residuo 5 anni" value={residuo5} onChange={setResiduo5} step={0.01} suffix="% su listino" />
                <Field label="Valore residuo 10 anni" value={residuo10} onChange={setResiduo10} step={0.01} suffix="% su listino" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risultati */}
      {risultati && (
        <div className="mt-6 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 p-6">
            <h2 className="text-2xl font-bold text-white">Analisi Comparativa dei Costi</h2>
            <p className="text-blue-100 mt-1">Totale netto per periodo di possesso</p>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-4 font-semibold text-gray-900 border-r">Scenario</th>
                    <th className="text-left p-4 font-semibold text-gray-900 border-r">5 anni</th>
                    <th className="text-left p-4 font-semibold text-gray-900 border-r">10 anni</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Differenza</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t hover:bg-blue-50 transition-colors">
                    <td className="p-4 border-r">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="font-medium">NLT</span>
                      </div>
                    </td>
                    <td className="p-4 border-r text-lg font-semibold text-blue-600">{fmtEuro(risultati.nlt5)}</td>
                    <td className="p-4 border-r text-lg font-semibold text-blue-600">{fmtEuro(risultati.nlt10)}</td>
                    <td className="p-4 text-lg font-semibold text-blue-600">{fmtEuro(risultati.nlt10 - risultati.nlt5)}</td>
                  </tr>
                  <tr className="border-t hover:bg-green-50 transition-colors">
                    <td className="p-4 border-r">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="font-medium">Acquisto</span>
                      </div>
                    </td>
                    <td className="p-4 border-r text-lg font-semibold text-green-600">{fmtEuro(risultati.acq5)}</td>
                    <td className="p-4 border-r text-lg font-semibold text-green-600">{fmtEuro(risultati.acq10)}</td>
                    <td className="p-4 text-lg font-semibold text-green-600">{fmtEuro(risultati.acq10 - risultati.acq5)}</td>
                  </tr>
                  <tr className="border-t bg-gray-100 font-bold">
                    <td className="p-4 border-r">Risparmio Acquisto vs NLT</td>
                    <td className={`p-4 border-r text-lg ${risultati.acq5 < risultati.nlt5 ? 'text-green-600' : 'text-red-600'}`}>
                      {fmtEuro(risultati.nlt5 - risultati.acq5)}
                    </td>
                    <td className={`p-4 border-r text-lg ${risultati.acq10 < risultati.nlt10 ? 'text-green-600' : 'text-red-600'}`}>
                      {fmtEuro(risultati.nlt10 - risultati.acq10)}
                    </td>
                    <td className="p-4 text-lg">
                      {risultati.acq5 < risultati.nlt5 && risultati.acq10 < risultati.nlt10 ? 
                        <span className="text-green-600">✓ Acquisto conveniente</span> :
                        <span className="text-red-600">✗ NLT più conveniente</span>
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-medium text-amber-800 mb-2">Note metodologiche:</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• <strong>Acquisto:</strong> Include anticipo, rate, immatricolazione, assicurazioni complete, manutenzioni, pneumatici, costi incidenti. Sottrae valore residuo stimato.</li>
                <li>• <strong>NLT:</strong> Calcolo netto post-deduzioni fiscali (70% imponibile, 40% IVA recuperabile). Include acconto iniziale se previsto.</li>
                <li>• <strong>Incidenti:</strong> Costo applicato ogni 5 anni (1 volta per 5 anni, 2 volte per 10 anni).</li>
                <li>• <strong>Esclusioni:</strong> Bollo auto escluso da entrambi gli scenari come da specifica.</li>
                <li>• <strong>Aggiornamenti:</strong> I calcoli si aggiornano automaticamente al variare dei parametri.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}