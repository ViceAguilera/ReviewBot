# ReviewBot

Bot de Discord para registrar, consultar, editar y eliminar reseñas de restaurantes dentro de un servidor, mediante comandos slash.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=nodedotjs&logoColor=white)
![discord.js](https://img.shields.io/badge/discord.js-14-5865F2?style=flat&logo=discord&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat&logo=mongodb&logoColor=white)
![Estado](https://img.shields.io/badge/estado-activo-brightgreen?style=flat)
![Licencia](https://img.shields.io/badge/licencia-MIT-blue?style=flat)
![Último commit](https://img.shields.io/github/last-commit/ViceAguilera/ReviewBot?style=flat)

[Invitar al servidor](https://discord.com/oauth2/authorize?client_id=1379237068995166248)

<!-- Demo: agrega una captura o GIF en docs/demo.gif y descomenta la línea siguiente -->
<!-- <p align="center"><img src="docs/demo.gif" alt="Demostración de ReviewBot en Discord" width="800"></p> -->

## Tabla de contenidos

- [Descripción](#descripción)
- [Estado del proyecto](#estado-del-proyecto)
- [Características](#características)
- [Comandos](#comandos)
- [Tecnologías](#tecnologías)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Uso](#uso)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Licencia](#licencia)
- [Autor](#autor)

## Descripción

ReviewBot permite a una comunidad de Discord llevar un registro compartido de reseñas de restaurantes: calificación, platos y bebidas consumidos, texto de la reseña y comuna. Las reseñas se publican como embeds en un canal configurable y los usuarios pueden reaccionar a ellas con botones. El proyecto se encuentra en versión 1.0 (beta).

## Estado del proyecto

**Activo.** El bot se encuentra en versión 1.0 (beta) y sigue en desarrollo.

## Características

- Creación de reseñas con restaurante, calificación (admite medias estrellas), comidas, texto y comuna.
- Búsqueda automática de la URL del local mediante scraping de DuckDuckGo al crear la reseña; si no se encuentra, puede agregarse después al editar.
- Consulta del detalle de una reseña por ID.
- Listado de reseñas propias o de la comunidad, con filtro por comuna y paginación.
- Edición de cualquier campo de la reseña y eliminación lógica.
- Botones de reacción (like / dislike) en cada reseña.
- Asignación de roles según la cantidad de reseñas de cada usuario (Regalón, Guatón y Otakin, con umbrales de 10, 20 y 30), si los roles existen en el servidor.
- Configuración del canal de publicación, restringida a administradores.

## Comandos

| Comando | Descripción |
| --- | --- |
| `/reseña add` | Crea una reseña. |
| `/reseña ver` | Muestra el detalle de una reseña. |
| `/reseña listar` | Lista reseñas con filtros y paginación. |
| `/reseña editar` | Modifica los campos de una reseña. |
| `/reseña eliminar` | Elimina (lógicamente) una reseña. |
| `/config set-canal_reseñas` | Define el canal donde se publican las reseñas. |

## Tecnologías

- Node.js (módulos ES) y [discord.js](https://discord.js.org/) 14
- [Mongoose](https://mongoosejs.com/) / MongoDB
- [Cheerio](https://cheerio.js.org/) y [Axios](https://axios-http.com/) para el scraping
- [Day.js](https://day.js.org/)
- Docker y Docker Compose

## Requisitos

- Node.js 18 o superior
- Una aplicación y un bot creados en el [Discord Developer Portal](https://discord.com/developers/applications)
- Una instancia de MongoDB (local, Docker o Atlas)

## Instalación

```bash
git clone https://github.com/ViceAguilera/ReviewBot.git
cd ReviewBot
npm install
```

### Configuración

Copia `.env.example` a `.env` y completa las variables:

| Variable | Descripción |
| --- | --- |
| `DISCORD_TOKEN` | Token del bot de Discord. |
| `CLIENT_ID` | ID de la aplicación de Discord. |
| `GUILD_ID` | ID del servidor donde se registran los comandos. |
| `MONGODB_URI` | Cadena de conexión a MongoDB. |
| `NODE_ENV` | Entorno de ejecución (`production` en el ejemplo). |

## Uso

```bash
npm start
```

Al iniciar, el bot se conecta a MongoDB y registra los comandos slash en el servidor indicado por `GUILD_ID`.

### Docker

El repositorio incluye `Dockerfile` y `docker-compose.yml` (bot, MongoDB y mongo-express). Antes de usarlos, revisa y cambia las credenciales de ejemplo definidas en `docker-compose.yml`.

```bash
docker compose up -d
```

## Estructura del proyecto

```
index.js              Punto de entrada: conexión a la base de datos, registro de comandos y eventos
commands/             Comandos slash (/reseña y /config)
handlers/             Manejo de botones de reacción
services/             Base de datos, embeds, niveles de usuario y búsqueda en DuckDuckGo
utils/                Validaciones
mongo-init.js         Script de inicialización de MongoDB
Dockerfile            Imagen del bot
docker-compose.yml    Bot + MongoDB + mongo-express
```

## Licencia

Distribuido bajo la licencia MIT. Ver [LICENSE](LICENSE).

## Autor

**Vicente Aguilera Arias** — [Portafolio](https://portfolio.iamsirius.cl) · [GitHub](https://github.com/ViceAguilera) · [LinkedIn](https://www.linkedin.com/in/vicenteaguilera/)
