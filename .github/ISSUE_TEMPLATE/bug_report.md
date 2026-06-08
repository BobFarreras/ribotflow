name: 🐛 Bug Report
description: Reporta un error para ayudarnos a mejorar
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: |
        Gracias por reportar un bug. Por favor, rellena toda la información posible.
  - type: textarea
    id: description
    attributes:
      label: Descripción del error
      description: ¿Qué ocurrió? ¿Qué esperabas que ocurriera?
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Pasos para reproducir
      description: |
        1. Ir a '...'
        2. Click en '...'
        3. Scroll hasta '...'
        4. Ver error
    validations:
      required: true
  - type: input
    id: environment
    attributes:
      label: Entorno
      description: |
        - OS: [ej. Windows 11, macOS]
        - Browser: [ej. Chrome 120, Firefox 121]
        - Mode: [cloud / self_hosted]
    validations:
      required: true
  - type: textarea
    id: logs
    attributes:
      label: Logs relevantes
      description: |
        ```
        Pega aquí los logs del error (sin datos sensibles)
        ```
  - type: textarea
    id: additional
    attributes:
      label: Información adicional
      description: Capturas de pantalla, contexto adicional, etc.
