# REPLIKA AI — beta para iPhone

Aplicación móvil para recrear una foto usando una foto de identidad y otra foto objetivo.

## Motor de edición
Integra el Space público `kulkas2pintu/QWEN_EDIT_IMAGE` de Hugging Face mediante `@gradio/client`, con Qwen Image Edit 2511, preservación de identidad y referencia de pose/escena.

## Límites y privacidad
- El uso del Space público puede ser gratuito, pero depende de disponibilidad de GPU y colas; no se garantiza uso ilimitado ni disponibilidad continua.
- Las fotografías se envían al Space externo únicamente cuando el usuario acepta y pulsa Generar. No se guardan en esta aplicación.
- La preservación del rostro es aproximada; ningún modelo garantiza identidad matemáticamente idéntica.
- No subir fotos privadas o de terceros sin autorización.

## Publicación
GitHub Pages sirve la carpeta `replika/`. Abrir en Safari y usar Compartir → Añadir a pantalla de inicio.
