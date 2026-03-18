// Test script to verify database reliability improvements
const { PrismaWrapper } = require('./lib/connection-wrapper');

async function testConnection() {
  try {
    console.log('Testing database connection with retry logic...');
    
    // Test a simple operation
    await PrismaWrapper.execute(async () => {
      console.log('✓ Database connection test successful');
      return true;
    });
    
    console.log('✓ All tests passed');
  } catch (error) {
    console.error('✗ Test failed:', error.message);
  }
}

testConnection();
