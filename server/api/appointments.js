// Simple test appointments endpoint
module.exports = async (req, res) => {
  console.log('🔵 Appointments endpoint hit!');
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://urban-care-front.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return res.status(200).json({
    success: true,
    message: 'Appointments endpoint working!',
    data: {
      appointments: []
    }
  });
};
