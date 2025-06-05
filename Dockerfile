# Usar imagen oficial de Node.js con Alpine Linux (más ligera)
FROM node:18-alpine

# Instalar dependencias del sistema necesarias para better-sqlite3
RUN apk add --no-cache python3 make g++ sqlite

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el código de la aplicación
COPY . .

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S reviewbot -u 1001

# Cambiar permisos del directorio de trabajo
RUN chown -R reviewbot:nodejs /app
USER reviewbot

# Exponer puerto (aunque el bot no use HTTP, es buena práctica)
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["npm", "start"] 