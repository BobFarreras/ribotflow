# PROJECT.md - Blueprint de la Plataforma ERP/SAT d'Última Generació

## 👁️ Visió del Projecte (2026)
No construïm un programari de gestió passiu. Creem un **sistema operatiu empresarial proactiu**. L'objectiu és reduir les hores de treball administratiu un 80% mitjançant automatitzacions, integracions natives i una interfície hiper-eficient (Mobile-First per a operaris, Command-Center per a oficines).

---

## 🌍 Arquitectura Global Core

### 1. Sistema Multi-idioma (I18n)
- **Suport natiu:** Català i Castellà des del dia 1.
- **Implementació:** Traduccions estructurades en arxius JSON gestionades mitjançant l'arquitectura de Next.js i l'App Router. Totes les taules de la base de dades que continguin categories o estats tindran un sistema de claus de traducció, mai text rígid.

### 2. Arquitectura de Preus Tiers (Free / Plus / Enterprise)
Tot el codi es desenvolupa inicialment com a accessible (Free), però l'accés es filtra a través d'un **Middleware d'Autorització de Funcions (Feature-Gating)**.
- **Pla FREE (El Ganxo):** Eines essencials per a un autònom o micro-pime (1-3 usuaris). Tot el flux bàsic cobert.
- **Pla PLUS (Creixement):** Automatitzacions, integracions de tercers i multi-magatzem. Pensat per a empreses amb equips petits en expansió.
- **Pla ENTERPRISE (Robustesa):** Suport multi-empresa, geolocalització avançada, seguretat personalitzada, auditories i mòduls fiscals regulats d'alta responsabilitat.

---

## 🧩 Blocs de Funcionalitats i Full de Ruta

### 🛠️ Mòdul SAT (Servei d'Assistència Tècnica)
*Optimitzat per a mobilitat absoluta, interfície neta i ràpida sota el sol.*
- **[FREE] Ordres de Treball Digitals:** Creació, assignació i tancament d'incidències en temps real. Notes i llistat de materials utilitzats.
- **[FREE] Signatura Biomètrica:** Captura de signatura en pantalla directament des del mòbil del client amb generació de PDF instantània.
- **[PLUS] Integració de Calendari & Mapes:** Sincronització bidireccional amb **Google Calendar**. Enllaç directe a Google Maps o Waze per a la navegació del tècnic amb un sol clic.
- **[PLUS] Mode PWA Offline:** Emmagatzematge local a la memòria del dispositiu (IndexedDB) per treballar en soterranis o zones sense cobertura, amb sincronització automàtica quan torna la connexió.
- **[ENTERPRISE] Optimitzador de Rutes:** Càlcul intel·ligent de la millor ruta diària per a flotes de tècnics per estalviar temps i combustible segons el trànsit i la ubicació.

### 🏢 Mòdul ERP & Estocs (Control de Recursos)
- **[FREE] Catàleg Centralitzat:** Gestió de productes, serveis, codis de barres i preus de venda.
- **[FREE] Control d'Estoc Bàsic:** Historial d'entrades i sortides manuals en un únic magatzem.
- **[PLUS] Multi-Magatzem i Furgonetes:** Traçabilitat de l'estoc dividit per ubicacions físiques (Nau principal, Magatzem B, o l'estoc dinàmic dins de la furgoneta de cada tècnic SAT).
- **[PLUS] Alertes de Reposició:** Notificacions proactives quan un producte baixa del llindar mínim amb generació automàtica d'esborrany de comanda al proveïdor.
- **[ENTERPRISE] Traçabilitat per Lots i Números de Sèrie:** Essencial per a empreses de maquinària o alimentació. Sabràs quina peça exacta es va instal·lar a quin client i de quin lot venia.

### 💰 Mòdul de Facturació i Mòdul Fiscal (Legal 2026 Espanya)
*La joia de la corona del compliment normatiu, completament adaptada a la llei espanyola.*
- **[FREE] Pressupostos i Albarans:** Creació visual de documents comercials i conversió en línia de pressupost -> albarà -> factura.
- **[PLUS] Facturació Electrònica (Llei Crea y Crece):** Generació de factures en format estructural per a B2B (FacturaE) i connexió amb la plataforma pública de facturació.
- **[ENTERPRISE] Mòdul VERI\*FACTU Obligatori:** 
  - Generació de registres de facturació encadenats i inalterables (arquitectura *Chaining Block* amb hash).
  - Enviament en temps real a l'Agència Tributària (AEAT) amb signatura digital.
  - Generació automàtica del codi QR obligatori en els PDFs de les factures perquè els clients final puguin verificar la validesa de la factura a la web de Facenda.

### 🤝 Mòdul CRM (Vendes i Comunicació)
- **[FREE] Fitxa de Client 360°:** Historial complet de contactes, adreces d'enviament, factures emeses i historial de reparacions del SAT.
- **[PLUS] Sincronització de Correu:** Integració via API (Google Workspace / Outlook) per visualitzar tots els correus enviats o rebuts d'un client directament a la seva fitxa del CRM sense sortir de l'app.
- **[PLUS] Tauler de Vendes Kanban:** Embut de vendes visual per fer el seguiment d'oportunitats comercials.

### ⏱️ Mòdul Control d'Accés i RRHH
- **[FREE] Fitxatge de Jornada:** Compliment de la llei de control horari bàsic. Registre de clics d'entrada, pauses i sortides.
- **[PLUS] Gestió d'Absències:** Sol·licitud de vacances, baixes mèdiques i justificants des del portal de l'empleat.
- **[ENTERPRISE] Fitxatge per Geolocalització:** Validació de la posició GPS en el moment del fitxatge (comprovant que el tècnic està realment a les instal·lacions del client).

---

## 🔧 Integracions Globals de Tercers (Mòdul Hub)
- **Google Ecosystem (Plus):** Sincronització de Calendar per a ordres de treball, i Google Drive per a emmagatzematge automàtic de PDFs de factures i albarans signats.
- **Mailing (Plus):** Connexió amb serveis SMTP corporatius o proveïdors de volum (Resend / SendGrid) per a l'enviament de factures o notificacions als clients des del domini de l'empresa.