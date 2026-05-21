# PROJECT.md - Blueprint de la Plataforma ERP/SAT de Última Generación

## 👁️ Visión del Proyecto (2026)
No construimos un software de gestión pasivo. Creamos un **sistema operativo empresarial proactivo**. El objetivo es reducir las horas de trabajo administrativo un 80% mediante automatizaciones, integraciones nativas y una interfaz hiper-eficiente (Mobile-First para operarios, Command-Center para oficinas).

---

## 🌍 Arquitectura Global Core

### 1. Sistema Multi-idioma (I18n)
- **Soporte nativo:** Catalán y Castellano desde el día 1.
- **Implementación:** Traducciones estructuradas en archivos JSON gestionadas mediante la arquitectura de Next.js y el App Router. Todas las tablas de la base de datos que contengan categorías o estados tendrán un sistema de claves de traducción, nunca texto rígido.

### 2. Arquitectura de Precios Tiers (Free / Plus / Enterprise)
Todo el código se desarrolla inicialmente como accesible (Free), pero el acceso se filtra a través de un **Middleware de Autorización de Funciones (Feature-Gating)**.
- **Plan FREE (El Gancho):** Herramientas esenciales para un autónomo o micro-pyme (1-3 usuarios). Todo el flujo básico cubierto.
- **Plan PLUS (Crecimiento):** Automatizaciones, integraciones de terceros y multi-almacén. Pensado para empresas con equipos pequeños en expansión.
- **Plan ENTERPRISE (Robustez):** Soporte multi-empresa, geolocalización avanzada, seguridad personalizada, auditorías y módulos fiscales regulados de alta responsabilidad.

---

## 🧩 Bloques de Funcionalidades y Hoja de Ruta

### 🛠️ Módulo SAT (Servicio de Asistencia Técnica)
*Optimizado para movilidad absoluta, interfaz limpia y rápida bajo el sol.*
- **[FREE] Órdenes de Trabajo Digitales:** Creación, asignación y cierre de incidencias en tiempo real. Notas y listado de materiales utilizados.
- **[FREE] Firma Biométrica:** Captura de firma en pantalla directamente desde el móvil del cliente con generación de PDF instantánea.
- **[PLUS] Integración de Calendario & Mapas:** Sincronización bidireccional con **Google Calendar**. Enlace directo a Google Maps o Waze para la navegación del técnico con un solo clic.
- **[PLUS] Modo PWA Offline:** Almacenamiento local en la memoria del dispositivo (IndexedDB) para trabajar en sótanos o zonas sin cobertura, con sincronización automática cuando vuelve la conexión.
- **[ENTERPRISE] Optimizador de Rutas:** Cálculo inteligente de la mejor ruta diaria para flotas de técnicos para ahorrar tiempo y combustible según el tráfico y la ubicación.

### 🏢 Módulo ERP & Stocks (Control de Recursos)
- **[FREE] Catálogo Centralizado:** Gestión de productos, servicios, códigos de barras y precios de venta.
- **[FREE] Control de Stock Básico:** Historial de entradas y salidas manuales en un único almacén.
- **[PLUS] Multi-Almacén y Furgonetas:** Trazabilidad del stock dividido por ubicaciones físicas (Nave principal, Almacén B, o el stock dinámico dentro de la furgoneta de cada técnico SAT).
- **[PLUS] Alertas de Reposición:** Notificaciones proactivas cuando un producto baja del umbral mínimo con generación automática de borrador de pedido al proveedor.
- **[ENTERPRISE] Trazabilidad por Lotes y Números de Serie:** Esencial para empresas de maquinaria o alimentación. Sabrás qué pieza exacta se instaló a qué cliente y de qué lote venía.

### 💰 Módulo de Facturación y Módulo Fiscal (Legal 2026 España)
*La joya de la corona del cumplimiento normativo, completamente adaptada a la ley española.*
- **[FREE] Presupuestos y Albaranes:** Creación visual de documentos comerciales y conversión en línea de presupuesto -> albarán -> factura.
- **[PLUS] Facturación Electrónica (Ley Crea y Crece):** Generación de facturas en formato estructural para B2B (FacturaE) y conexión con la plataforma pública de facturación.
- **[ENTERPRISE] Módulo VERI*FACTU Obligatorio:**
  - Generación de registros de facturación encadenados e inalterables (arquitectura *Chaining Block* con hash).
  - Envío en tiempo real a la Agencia Tributaria (AEAT) con firma digital.
  - Generación automática del código QR obligatorio en los PDFs de las facturas para que los clientes finales puedan verificar la validez de la factura en la web de Hacienda.

### 🤝 Módulo CRM (Ventas y Comunicación)
- **[FREE] Ficha de Cliente 360°:** Historial completo de contactos, direcciones de envío, facturas emitidas e historial de reparaciones del SAT.
- **[PLUS] Sincronización de Correo:** Integración vía API (Google Workspace / Outlook) para visualizar todos los correos enviados o recibidos de un cliente directamente en su ficha del CRM sin salir de la app.
- **[PLUS] Tablero de Ventas Kanban:** Embudo de ventas visual para hacer el seguimiento de oportunidades comerciales.

### ⏱️ Módulo Control de Acceso y RRHH
- **[FREE] Fichaje de Jornada:** Cumplimiento de la ley de control horario básico. Registro de clics de entrada, pausas y salidas.
- **[PLUS] Gestión de Ausencias:** Solicitud de vacaciones, bajas médicas y justificantes desde el portal del empleado.
- **[ENTERPRISE] Fichaje por Geolocalización:** Validación de la posición GPS en el momento del fichaje (comprobando que el técnico está realmente en las instalaciones del cliente).

---

## 🔧 Integraciones Globales de Terceros (Módulo Hub)
- **Google Ecosystem (Plus):** Sincronización de Calendar para órdenes de trabajo, y Google Drive para almacenamiento automático de PDFs de facturas y albaranes firmados.
- **Mailing (Plus):** Conexión con servicios SMTP corporativos o proveedores de volumen (Resend / SendGrid) para el envío de facturas o notificaciones a los clientes desde el dominio de la empresa.
