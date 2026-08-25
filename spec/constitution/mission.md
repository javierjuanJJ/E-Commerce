# Misión

Construir una API de E-Commerce modular, segura y testeable que sirva como
referencia de la metodología **Loop Engineering / Spec Driven Development (SDD)**:
cada endpoint es una feature independiente con su especificación, plan y tareas
antes de escribir una sola línea de código.

## Principios

1. **Spec primero**: ninguna feature se implementa sin su `spec.md` aprobado.
2. **Límites duros de arquitectura**: `app.js` nunca contiene `async` ni `.listen()`.
3. **Validación en el borde**: toda entrada externa pasa por Zod antes del controlador.
4. **Seguridad por defecto**: contraseñas hasheadas, JWT en headers, roles explícitos.
5. **Tests sin estado compartido**: la suite nativa (`node:test`) no depende de base de datos.
