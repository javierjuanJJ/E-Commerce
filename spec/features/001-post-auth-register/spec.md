# Feature 001: POST /auth/register

## Descripción
Registra un nuevo usuario con username, email y password. La contraseña se
hashea con bcrypt (10 rounds). El email es único.

## Criterios de aceptación
- **201** con `{ message, user }` (sin password) cuando los datos son válidos.
- **400** con `details[]` si Zod falla: username < 3, email inválido, password < 8.
- **409** si el email ya existe.
- La contraseña NUNCA se devuelve en la respuesta ni se guarda en claro.

## Reglas de validación (Zod)
| Campo | Regla |
|---|---|
| username | string, min 3, max 30 |
| email | string, formato email |
| password | string, min 8, max 64 |

## Fuera de alcance
- Envío de emails de verificación.
- Login automático tras el registro.
