const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

jest.setTimeout(60000);

const setupDB = () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_secret_key_for_jest_supertest_999';
    process.env.NODE_ENV = 'test';

    try {
      mongoServer = await MongoMemoryServer.create({
        binary: { checkMD5: false }
      });
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
    } catch (err) {
      console.warn('MongoMemoryServer initialization fallback:', err.message);
    }
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });
};

module.exports = { setupDB };
