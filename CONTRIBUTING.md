# Guía de Contribución

¡Gracias por tu interés en contribuir a nuestro proyecto! A continuación, encontrarás los pasos y reglas para enviar tus contribuciones de manera efectiva.

## Proceso de Contribución

1. **Fork del Repositorio**
   - Haz un fork del repositorio a tu cuenta personal de GitHub
   - Esto creará una copia del proyecto en tu cuenta

2. **Clonar el Fork**
   ```bash
   git clone https://github.com/TU-USUARIO/NOMBRE-REPO.git
   cd NOMBRE-REPO
   ```

3. **Crear una Nueva Rama**
   - Para nuevas funcionalidades:
     ```bash
     git checkout -b feature/nombre-funcionalidad
     ```
   - Para correcciones:
     ```bash
     git checkout -b fix/nombre-correccion
     ```

4. **Realizar Cambios**
   - Implementa tus cambios
   - Asegúrate de seguir las guías de estilo del proyecto
   - Realiza pruebas para verificar que todo funciona correctamente

5. **Commit de los Cambios**
   Seguimos la convención de [Conventional Commits](https://www.conventionalcommits.org/). Los tipos de commit más comunes son:

   - `feat`: Nueva funcionalidad
   - `fix`: Corrección de errores
   - `docs`: Cambios en documentación
   - `style`: Cambios de formato
   - `refactor`: Refactorización de código
   - `test`: Añadir o modificar tests
   - `chore`: Tareas de mantenimiento

   Ejemplo:
   ```bash
   git commit -m "fix: corregir validación de formulario de login"
   ```

6. **Push y Pull Request**
   ```bash
   git push origin feature/nombre-funcionalidad
   ```
   - Ve a GitHub y crea un Pull Request hacia la rama `develop`

## Reglas Importantes

1. **Ramas Destino**
   - ✅ Los Pull Requests SIEMPRE deben ir dirigidos a la rama `develop`
   - ❌ NO se aceptarán Pull Requests dirigidos a `main`

2. **Alcance de los Cambios**
   - Mantén los cambios enfocados y relacionados
   - No modifiques archivos que no estén relacionados con tu contribución
   - Un Pull Request = Una funcionalidad o corrección

3. **Nomenclatura de Ramas**
   - Usa nombres descriptivos que reflejen el propósito del cambio
   - Formato: `tipo/descripcion-breve`
   - Ejemplos:
     - `feature/autenticacion-google`
     - `fix/error-404-perfil`
     - `docs/actualizar-readme`

4. **Mensajes de Commit**
   - Sigue el formato de Conventional Commits
   - Escribe mensajes claros y descriptivos
   - Incluye el contexto necesario en el cuerpo del mensaje

## Proceso de Revisión

1. Los mantenedores revisarán tu Pull Request
2. Pueden solicitar cambios o mejoras
3. Una vez aprobado, se realizará el merge a `develop`

## Ayuda

Si tienes dudas o necesitas ayuda, no dudes en:
- Abrir un Issue
- Comentar en el Pull Request
- Contactar a los mantenedores

¡Gracias por contribuir! 🚀
