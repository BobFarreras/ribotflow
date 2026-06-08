name: ✨ Feature Request
description: Sugiere una nueva funcionalidad o mejora
labels: ["enhancement"]
body:
  - type: markdown
    attributes:
      value: |
        Gracias por sugerir una mejora. Por favor, describe el problema que intentas resolver.
  - type: textarea
    id: problem
    attributes:
      label: Problema relacionado
      description: ¿Tu feature resuelve un problema? Descríbelo.
      placeholder: "Siempre me frustra cuando..."
  - type: textarea
    id: solution
    attributes:
      label: Solución propuesta
      description: Describe qué te gustaría que ocurriera.
    validations:
      required: true
  - type: dropdown
    id: module
    attributes:
      label: Módulo afectado
      options:
        - SAT
        - ERP
        - Facturación
        - CRM
        - Control de Acceso
        - Configuración
        - Global / Core
    validations:
      required: true
  - type: dropdown
    id: tier
    attributes:
      label: Plan objetivo
      options:
        - FREE
        - PLUS
        - ENTERPRISE
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternativas consideradas
      description: ¿Has pensado en otras formas de resolverlo?
  - type: textarea
    id: additional
    attributes:
      label: Información adicional
      description: Capturas, mockups, referencias, etc.
