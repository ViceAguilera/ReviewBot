// Script de inicialización para MongoDB
db = db.getSiblingDB('reviewbot');

// Crear usuario para la aplicación
db.createUser({
  user: 'reviewbot_user',
  pwd: 'reviewbot_password',
  roles: [
    {
      role: 'readWrite',
      db: 'reviewbot'
    }
  ]
});

// Crear colecciones iniciales si es necesario
db.createCollection('users');
db.createCollection('reviews');
db.createCollection('settings');

print('Base de datos ReviewBot inicializada correctamente'); 