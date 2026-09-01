const { Sequelize } = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    dialectOptions: {
      ssl: (process.env.DB_SSL === 'true' || (config.db.host && !['127.0.0.1', 'localhost'].includes(config.db.host))) ? {
        require: true,
        rejectUnauthorized: false,
      } : undefined,
    },
    logging: config.nodeEnv === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);


const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Database connection established successfully via Sequelize.');
  } catch (error) {
    console.error('Unable to connect to the MySQL database:', error.message);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectDB,
};
