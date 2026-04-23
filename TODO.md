# TODO

Observaciones y pendientes detectados durante la auditoría de seguridad. Se van agregando por fase cuando encontramos cosas que no corresponden al scope del fix actual pero que no queremos perder.

### Storage — observaciones menores detectadas durante Fase 1

- La comparación `r.file_path = name` en la policy `"Paciente accede a sus archivos"` (`lib/supabase/schema.sql`) **sí funciona** con las rutas `patients/{id}/{timestamp}.{ext}`: tanto `app/api/upload-resource/route.ts:101` como `lib/supabase/db.ts:272` generan exactamente ese formato, y `storage.objects.name` guarda esa misma key interna del bucket. No hay inconsistencia real en la comparación.

- `lib/supabase/db.ts:270-285` (`uploadFile`) llama `getPublicUrl` sobre un bucket **privado** — la URL devuelta nunca va a resolver. El flujo en producción usa `/api/upload-resource` + `/api/resource-url` (URL firmada), por lo que `uploadFile` de `db.ts` huele a código muerto o legacy. **Planeado para eliminar en Fase 5 (fix C5) como parte del cleanup de `lib/supabase/db.ts`** — no duplicar trabajo acá.

- La policy de storage depende de que quien llame a `createResource` guarde `path` (no `url`) en el campo `file_path`. Si alguna vez se guarda la URL ahí por error, la policy falla en silencio para esa fila. Tema de testing, no de schema.

### Storage — optimización de resource-url/upload-resource

- `ensureBucket()` se llama en cada request y hace `listBuckets` + `createBucket?`.
  Mover a cache de módulo (una sola verificación por cold start). Una vez
  aplicado, revisar si el rate limit de `/api/resource-url` necesita ajuste.

### API routes

_(pendiente — se llenará en fases siguientes)_

### Frontend

_(pendiente — se llenará en fases siguientes)_
