
module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './weather.db'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    }
  }
};
