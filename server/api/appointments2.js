// Simple Appointments2 endpoint without database
module.exports = async (req, res) => {
  console.log('🔵 Appointments2 endpoint hit!');
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://urban-care-front.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return res.status(200).json({
    success: true,
    message: 'Appointments2 endpoint working!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
};
