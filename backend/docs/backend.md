Gestión de MongoDB en macOS
Esta sección describe los pasos para iniciar, verificar y detener manualmente tu servidor MongoDB en un sistema macOS.

Iniciar el Servidor MongoDB Manualmente
Tienes dos opciones para iniciar el servidor MongoDB, dependiendo de si prefieres que se ejecute en segundo plano o si deseas ver sus registros en tiempo real.

Opción 1: Iniciar en Segundo Plano (Recomendado para uso general)
Este método te permite recuperar el control de tu terminal inmediatamente después de iniciar MongoDB.

Abre una nueva ventana de la Terminal.
Ejecuta el siguiente comando:

mongod --config $(brew --prefix)/etc/mongod.conf --fork

Este comando iniciará el servidor de MongoDB y tu terminal estará disponible para otras tareas.

Opción 2: Iniciar con Registros en Tiempo Real (Para depuración o monitoreo)
Elige esta opción si quieres ver la actividad del servidor directamente en tu terminal.

Abre una nueva ventana de la Terminal.

Ejecuta el siguiente comando:

mongod --config $(brew --prefix)/etc/mongod.conf

Tu terminal mostrará los registros del servidor. Para detener el servidor, simplemente presiona Ctrl + C en esta ventana de la terminal.

Verificar si MongoDB se Está Ejecutando
Después de iniciar el servidor, puedes confirmar su estado conectándote al Shell de MongoDB.

Abre una nueva ventana de la Terminal (o usa una limpia si tu terminal anterior está ocupada).

Ejecuta el comando del Shell de MongoDB:

mongosh

Si ves el prompt test>, significa que el servidor MongoDB está activo y el shell se ha conectado correctamente.

Para salir del shell, escribe exit y presiona Enter.

Para ejecutar el servidor vamos a usar la terminal y entraremos en la carpeta backend y de ahi corremos node .app.js/