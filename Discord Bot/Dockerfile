# Usar Node.js 18 como imagen base
FROM node:18-alpine3.19

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el resto del código de la aplicación
COPY . .

# Crear directorio para datos persistentes
RUN mkdir -p /app/data

# Crear usuarios no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S discordbot -u 1001

# Cambiar permisos del directorio de la app y datos
RUN chown -R discordbot:nodejs /app
RUN chmod -R 755 /app

# Exponer puerto (aunque Discord bots no necesitan puertos, es buena práctica)
EXPOSE 3000

# Cambiar al usuario no-root
USER discordbot

# Comando para iniciar la aplicación
CMD ["node", "index.js"]