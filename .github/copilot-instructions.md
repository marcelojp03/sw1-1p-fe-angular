# Instrucciones para GitHub Copilot — Frontend Web (Angular)
## Configurable Workflow System · SW1 2026

> Este repositorio contiene la **aplicación web interna** del sistema.
> Para la arquitectura detallada ver `../.github/ANGULAR.md`.

---

## Stack

- Angular 21+ con **standalone components**
- **PrimeNG 20+** + **TailwindCSS 4.x** — NO usar Angular Material
- Diagramador: **JointJS Plus** (`@joint/plus`)
- Tiempo real: `@stomp/stompjs` + `sockjs-client`
- HTTP: `HttpClient` con interceptor OAuth2

## Roles y Rutas

Solo existen 2 roles web internos:

```typescript
// Rutas protegidas
{ path: 'admin',   canActivate: [roleGuard('ADMIN')]  }
{ path: 'officer', canActivate: [roleGuard('OFFICER')] }
```

- `ADMIN`: configura organización, áreas, usuarios, diseña políticas, ve dashboard y reportes
- `OFFICER`: bandeja de tareas, atiende trámites, completa formularios, inicia trámites

El rol `CLIENT` **no tiene acceso a la web** (solo usa Flutter).

## Comunicación

- Angular **solo** consume Spring Boot (`/api/**`)
- **Nunca** llamar directamente a FastAPI
- JWT guardado en `sessionStorage` (no `localStorage`)
- Interceptor HTTP adjunta `Authorization: Bearer <token>` automáticamente

## Diagramador (@joint/plus)

- Shapes de actividad UML con swimlanes por área
- Colaboración en tiempo real vía WebSocket STOMP
  - Topic: `/topic/policy/{policyId}/diagram`
  - Envío: `/app/policy/{policyId}/update`
- Los datos del diagrama se guardan como objeto `diagram` (no como string JSON)

## Formularios Dinámicos

- Los campos vienen de `node.form.fields[]` de la política
- Tipos: `TEXT`, `NUMBER`, `DATE`, `BOOLEAN`, `FILE`, `SELECT`, `TEXTAREA`
- Renderizar dinámicamente con PrimeNG components

## Estructura de Features

```
features/
├── admin/          ← organización, áreas, usuarios, políticas, dashboard
└── officer/        ← bandeja, tareas, trámites
```

## Convenciones

- Standalone components en todos los casos
- Lazy loading por feature
- `environment.ts` para URL base del API
- No hardcodear URLs; usar constantes de `http-constants.ts`
