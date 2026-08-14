const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const setupDB = () => {
  beforeAll(async () => {
    jest.setTimeout(60000);
    process.env.JWT_SECRET = 'test_secret_key_for_jest_supertest_999';
    process.env.NODE_ENV = 'test';

    mongoServer = await MongoMemoryServer.create({
      binary: { skipMD5: true }
    });
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);
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
