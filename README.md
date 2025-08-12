# Calcolatore Enterprise NLT vs Acquisto di veicoli

Applicazione web per l'analisi comparativa tra **Noleggio a Lungo Termine (NLT)** e **Acquisto con Finanziamento** di veicoli per privato o con piva.

## 🚀 Tecnologie

- **Runtime**: Bun
- **Deploy**: Cloudflare Workers
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Tailwind CSS
- **Architettura**: Single Page Application (SPA)

## 📋 Funzionalità

### NLT (Noleggio a Lungo Termine)
- Canone mensile IVA inclusa
- Acconto iniziale opzionale
- Calcoli fiscali automatici (IVA 22%, recupero 40%, deducibilità 70%)
- Risparmio fiscale in base all'aliquota aziendale

### Acquisto con Finanziamento
- Prezzo listino e anticipo
- Calcolo rata mensile (TAN/TAEG)
- Assicurazioni complete (RC, PAI, Furto/Incendio, Kasko)
- Manutenzioni ordinarie e straordinarie
- Gestione pneumatici e percorrenza
- Valori residui a 5 e 10 anni
- Costi incidenti periodici

### Analisi Comparativa
- Confronto costi totali a 5 e 10 anni
- Calcolo risparmio/extra costo
- Raccomandazione automatica
- Aggiornamento real-time dei calcoli

## 🛠️ Setup Locale

### Prerequisiti
- Bun >= 1.0.0
- Account Cloudflare (per deploy)

### Installazione
```bash
# Clone/Download del progetto
cd ntl-calculator

# Installa dipendenze
bun install

# Avvia sviluppo locale
bun run dev
# oppure
bun run preview

# L'applicazione sarà disponibile su http://localhost:8787
```

### Build
```bash
# Build per produzione
bun run build
```

## 🌐 Deploy su Cloudflare Workers

### Primo Deploy
```bash
# Login Cloudflare (se non già fatto)
bunx wrangler login

# Deploy su staging
bunx wrangler deploy --env staging

# Deploy su produzione
bunx wrangler deploy --env production
```

### Configurazione Domini (Opzionale)
Modifica `wrangler.toml` per configurare domini personalizzati:
```toml
[[env.production.routes]]
pattern = "calculator.tuodominio.com/*"
```

## 📊 Parametri di Default

L'applicazione è preconfigurata con valori realistici per una **Kia Sportage**:

### NLT
- Canone mensile: €429 (IVA inclusa)
- Acconto iniziale: €0
- Aliquota fiscale: 35%

### Acquisto
- Prezzo listino: €32.000
- Anticipo: €8.000
- Durata finanziamento: 60 mesi
- TAN: 7,5%
- Immatricolazione: €400

### Costi Operativi
- RC Auto: €1.000/anno
- PAI: €40/anno
- Manutenzione ordinaria: €400/anno
- Km annui: 10.000
- Set gomme: €500 (durata 40.000 km)

## 🏗️ Struttura Progetto

```
ntl-calculator/
├── src/
│   ├── index.js              # Cloudflare Worker handler
│   └── html-content.js       # HTML inline per prestazioni
├── public/
│   └── index.html            # Versione standalone (dev)
├── package.json              # Configurazione Bun
├── wrangler.toml             # Configurazione Cloudflare
└── README.md
```

## 🔧 API Endpoints

### `GET /`
Serve l'applicazione principale

### `POST /api/calculate`
Calcolo server-side (opzionale)
```json
{
  "nltCanoneIvato": 429,
  "aliquotaEff": 0.35,
  "prezzoListino": 32000,
  // ... altri parametri
}
```

### `POST /api/validate`
Validazione parametri
```json
{
  "valid": true,
  "errors": [],
  "warnings": ["Il valore residuo a 5 anni dovrebbe essere maggiore..."]
}
```

### `GET /health`
Health check endpoint

## 💡 Metodologia di Calcolo

### NLT
1. Scorporo IVA dal canone (22%)
2. Recupero IVA (40% dell'IVA)
3. Deduzione fiscale (70% dell'imponibile × aliquota)
4. Calcolo costo netto mensile
5. Moltiplicazione per durata + acconto iniziale

### Acquisto
1. Calcolo rata mensile con formula finanziaria standard
2. Somma di: anticipo + rate + immatricolazione + assicurazioni + manutenzioni + pneumatici + incidenti
3. Sottrazione valore residuo stimato

## 📱 Responsive Design

L'applicazione è completamente responsive:
- **Desktop**: Layout a 3 colonne
- **Tablet**: Layout adattivo
- **Mobile**: Layout verticale ottimizzato

## 🔒 Sicurezza

- Validazione input lato client e server
- Sanitizzazione parametri
- Headers di sicurezza CORS
- Rate limiting integrato Cloudflare

## 📈 Performance

- **HTML inline**: Caricamento istantaneo
- **CDN Cloudflare**: Distribuzione globale
- **Debounced updates**: Calcoli ottimizzati
- **Zero dependencies**: Bundle minimo

## 🤝 Contribuire

1. Fork del progetto
2. Feature branch: `git checkout -b feature/nuova-funzionalita`
3. Commit: `git commit -m 'Aggiunge nuova funzionalità'`
4. Push: `git push origin feature/nuova-funzionalita`
5. Pull Request

## 📄 Licenza

MIT License - vedi file LICENSE per dettagli

## 🆘 Supporto

Per problemi o domande:
1. Verifica la [documentazione Cloudflare Workers](https://developers.cloudflare.com/workers/)
2. Controlla la [documentazione Bun](https://bun.sh/docs)
3. Apri una issue su GitHub