const { Sequelize } = require('sequelize');
const config = require('./config');

const getSslConfig = () => {
  const isRemoteHost = config.db.host && !['127.0.0.1', 'localhost'].includes(config.db.host);
  if (process.env.DB_SSL === 'true' || isRemoteHost) {
    const ssl = {
      require: true,
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : (process.env.DB_CA_CERT ? true : false),
    };
    if (process.env.DB_CA_CERT) {
      ssl.ca = process.env.DB_CA_CERT;
    }
    return ssl;
  }
  return undefined;
};

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    dialectOptions: {
      ssl: getSslConfig(),
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
