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

## Sincronización con cambios en la API — OBLIGATORIA

**Al inicio de cada tarea**, antes de escribir cualquier código:

1. Lee `.github/API.md` completo (está un nivel arriba de este repositorio: `../../.github/API.md`).
2. Busca todas las entradas que contengan `⚠️ **Cambio:**`.
3. Para cada cambio encontrado, verifica si el servicio Angular, modelo TypeScript o componente afectado ya fue actualizado.
4. Si no fue actualizado, **corrígelo primero** antes de continuar con la tarea principal.

Cambios que más comúnmente requieren acción Angular:
- Renombrado de campos en request/response → actualizar interfaz TypeScript y usos
- Nuevos campos requeridos en request body → actualizar formularios y DTOs
- Rutas o métodos HTTP cambiados → actualizar llamadas en el servicio
- Nuevos endpoints → agregar método al servicio correspondiente

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

### 3. Actualizar PLANNING.md

Después del commit, marca como completadas (`- [x]`) las tareas que hayas terminado en `.github/PLANNING.md` (está en `../../.github/PLANNING.md` relativo a este repo).

- Solo marca las tareas que efectivamente completaste en esta sesión.
- No marques tareas que no tocaste.
- No crees ni elimines secciones — solo cambia `[ ]` por `[x]`.

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

### Separación de template y lógica — OBLIGATORIA

**Nunca uses `template: \`...\`` inline en un componente.**

Cada componente debe tener su propio archivo `.html`:

```
organizacion.component.ts    ← lógica, signals, inyección
organizacion.component.html  ← template HTML
```

En el decorador `@Component`, usa siempre:

```typescript
@Component({
  selector: 'app-nombre',
  standalone: true,
  templateUrl: './nombre.component.html',
  // styleUrl: './nombre.component.css'  ← solo si necesitas CSS específico
  imports: [...],
})
```

**Reglas:**
- `templateUrl` siempre apunta a un archivo `.html` del mismo directorio.
- No uses `styleUrl` si TailwindCSS cubre todos los estilos (clases inline en el HTML).
- Si el HTML supera 10 líneas, es obligatorio separarlo. No hay excepciones.
- Los archivos `.html` y `.ts` deben tener el mismo nombre base: `foo.component.ts` + `foo.component.html`.
- Esto aplica también a componentes en `shared/components/`.

---

### Estrategia Smart / Dumb Components

- **Smart (container):** gestiona datos, inyecta servicios, maneja estado. Corresponde a los componentes de página (los que están en la ruta).
- **Dumb (presentational):** recibe datos por `@Input()`, emite eventos por `@Output()`. No inyecta servicios HTTP. Vive en `shared/components/` o en una subcarpeta `components/` dentro del feature.

---

### Detección de cambios

- Usa `ChangeDetectionStrategy.OnPush` en todos los componentes nuevos.
- Con `OnPush`, el template solo se actualiza cuando cambia una señal (`signal`) o un `@Input()`. Compatible con `signal()` de Angular 17+.

```typescript
@Component({
  ...,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

---

- Plan general: `.github/PLANNING.md` (workspace raíz)
- Detalles técnicos Angular: `.github/ANGULAR.md` (workspace raíz)
- **Contrato de API (leer siempre):** `.github/API.md` (workspace raíz)
