---
applyTo: "**"
---

# Instrucciones del Agente — Angular Frontend

---

## Fuente de verdad de la API

**Antes de implementar cualquier servicio HTTP**, lee el archivo `.github/API.md` del workspace raíz (o `API.md` en la raíz de este repo si estás en workspace solo).

Verifica:
- La ruta exacta del endpoint
- El método HTTP (GET, POST, PUT, PATCH, DELETE)
- Los roles permitidos (para configurar guards)
- El body del request y la estructura del response

No inventes URLs ni contratos. Si un endpoint no está en `API.md`, no existe todavía — anota la dependencia pendiente.

---

## Sincronización con cambios en la API

Cuando `API.md` sea actualizado por el backend (Spring Boot) — identifica entradas con ⚠️ **Cambio** — debes:

1. Identificar qué endpoints cambiaron (ruta, método, body o response).
2. Actualizar el servicio Angular correspondiente en `src/app/core/services/`.
3. Actualizar los DTOs/interfaces en `src/app/core/models/`.
4. Si cambió la ruta o el método, actualizar todos los componentes que usan ese servicio.

---

## Regla de finalización — OBLIGATORIA

Antes de declarar cualquier tarea como completada:

### 1. Compilar el proyecto

```bash
ng build --configuration development 2>&1 | tail -20
```

- Corrige todos los errores antes de continuar.

### 2. Hacer commit y push a Git

```bash
git add .
git commit -m "feat(frontend): <descripción breve de lo implementado>"
git push
```

---

## Reglas de arquitectura

- Angular 21+ con **standalone components** (sin NgModules).
- **PrimeNG 20+** + **TailwindCSS 4.x** — NO usar Angular Material.
- JWT guardado en `sessionStorage` (nunca `localStorage`).
- Interceptor HTTP en `core/interceptors/jwt.interceptor.ts`.
- Guards por rol en `core/guards/role.guard.ts`.
- **CLIENT** no tiene acceso a la app web — solo `ADMIN` y `OFFICER`.
- Diagramador de políticas usa **JointJS**.
- WebSocket con `@stomp/stompjs` + `sockjs-client`.

---

## Referencias

- Plan general: `.github/PLANNING.md` (workspace raíz)
- Detalles técnicos Angular: `.github/ANGULAR.md` (workspace raíz)
- **Contrato de API (leer siempre):** `.github/API.md` (workspace raíz)
