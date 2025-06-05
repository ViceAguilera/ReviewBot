# ReviewBot 

###### **🚧 V1.0 Beta development.🚧🔨**

_ReviewBot es un asistente de Discord que permite a los usuarios registrar, visualizar, editar y eliminar reseñas de restaurantes directamente desde su servidor. Con comandos Slash, podrás:_

• 📌 **/reseña add**: Ingresa el nombre del restaurante, calificación (hasta en medias estrellas), lista de platos y bebidas, texto de reseña y comuna.  
• 🌐 Al crearse la reseña, el bot intentará buscar automáticamente la URL oficial del local mediante un scraping de DuckDuckGo. Si no la encuentra, podrás agregarla más adelante.  
• 👀 **/reseña ver**: Muestra el detalle completo de una reseña (por ID o por nombre), incluyendo calificación en estrellas, lista de comidas, enlace al restaurante y texto.  
• 📑 **/reseña listar**: Liste tus reseñas o las de toda la comunidad, con filtros por comuna, paginado y vista compacta.  
• ✏️ **/reseña editar**: Modifica cualquier campo de tu reseña (restaurante, calificación, comidas, texto, comuna o enlace).  
• 🗑️ **/reseña eliminar**: Borra lógicamente tu reseña cuando ya no sea válida.  
• ⚙️ **/config set-canal_reseñas**: Configura el canal donde el bot publicará todos los embeds de reseñas. Solo administradores pueden hacerlo.


## Construido con 🛠️

- [Node.js](https://nodejs.org/) - Entorno de ejecución para JavaScript
- [Discord.js](https://discord.js.org/) - Librería para crear bots de Discord
- [Mongoose](https://mongoosejs.com/) - ODM para MongoDB
- [MongoDB Atlas](https://www.mongodb.com/atlas) - Base de datos en la nube
- [Cheerio](https://cheerio.js.org/) - Scraping de sitios web
- [Axios](https://axios-http.com/) - Cliente HTTP para peticiones web

## Instalación 🔧

### Prerrequisitos
- [Node.js](https://nodejs.org/) v18 o superior
- Una cuenta de [Discord Developer Portal](https://discord.com/developers/applications)
- Una base de datos [MongoDB Atlas](https://www.mongodb.com/atlas) (gratuita)

### Pasos de instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/ViceAguilera/ReviewBot.git
   cd ReviewBot
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   
   Crea un archivo `.env` en la raíz del proyecto:
   ```env
   DISCORD_TOKEN=tu_token_del_bot
   CLIENT_ID=tu_client_id_de_discord
   GUILD_ID=tu_guild_id_de_prueba
   MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/reviewbot
   ```

4. **Ejecuta el bot**
   ```bash
   npm run start
   ```

### Configuración con Docker 🐳

Si prefieres usar Docker para ejecutar el bot:

1. **Asegúrate de tener Docker instalado**
   - [Docker Desktop](https://www.docker.com/products/docker-desktop) para Windows/Mac
   - [Docker Engine](https://docs.docker.com/engine/install/) para Linux

2. **Construye la imagen Docker**
   ```bash
   docker build -t reviewbot .
   ```

3. **Ejecuta el contenedor**
   ```bash
   docker run -d --name reviewbot-container --env-file .env reviewbot
   ```

4. **Usando Docker Compose (opcional)**
   
   Crea un archivo `docker-compose.yml`:
   ```yaml
   version: '3.8'
   services:
     reviewbot:
       build: .
       container_name: reviewbot
       env_file:
         - .env
       restart: unless-stopped
   ```
   
   Ejecuta con:
   ```bash
   docker-compose up -d
   ```

### Configuración adicional

- **Discord Bot**: Ve al [Discord Developer Portal](https://discord.com/developers/applications), crea una aplicación y un bot
- **MongoDB Atlas**: Crea un cluster gratuito y obtén la cadena de conexión
- **Permisos del Bot**: Asegúrate de que el bot tenga permisos para leer mensajes, enviar mensajes y usar comandos slash

## Licencia 📄

Este proyecto está bajo el _MIT_ - mira el archivo [LICENSE](LICENSE) para detalles

## Autor ✒️
[**Vicente Aguilera Arias**](https://github.com/ViceAguilera)