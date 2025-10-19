/**
 * CDP Agent Tester - Database Server
 * Handles Supabase storage and Lighthouse IPFS uploads
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
// Lighthouse API Configuration
const LIGHTHOUSE_ENDPOINT = 'https://upload.lighthouse.storage/api/v0/add';

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 3001;
const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY;
const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-739298578243.us-central1.run.app';
const METRICS_URL = process.env.METRICS_URL || 'https://metricsgen-739298578243.us-central1.run.app';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Validate environment variables
function validateEnv() {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'LIGHTHOUSE_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
}

validateEnv();

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      supabase: !!supabase,
      lighthouse: !!LIGHTHOUSE_API_KEY,
      backend: BACKEND_URL,
      metrics: METRICS_URL
    }
  });
});

/**
 * Validate access token and get user
 */
async function validateAccessToken(accessToken) {
  const { data, error } = await supabase
    .from('users')
    .select('user_id')
    .eq('access_token', accessToken)
    .single();
  
  if (error || !data) {
    throw new Error('Invalid access token');
  }
  
  return data.user_id;
}

/**
 * Upload content to Lighthouse IPFS using direct API
 */
async function uploadToLighthouse(content, name) {
  try {
    console.log(`📤 Uploading to Lighthouse: ${name}`);
    const contentString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    
    const formData = new FormData();
    const blob = new Blob([Buffer.from(contentString)]);
    formData.append('file', blob, name);

    const response = await fetch(LIGHTHOUSE_ENDPOINT, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${LIGHTHOUSE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log(`✅ Uploaded to Lighthouse: ${result.Hash}`);
    return {
      hash: result.Hash,
      name: result.Name,
      size: result.Size
    };
  } catch (error) {
    console.error('❌ Lighthouse upload failed:', error.message);
    throw new Error(`Lighthouse upload failed: ${error.message}`);
  }
}

/**
 * Store test run in Supabase
 */
async function storeTestRun(userId, kgHash, metricsHash) {
  const { data, error } = await supabase
    .from('test_runs')
    .insert([
      {
        user_id: userId,
        kg_hash: kgHash,
        metrics_hash: metricsHash
      }
    ])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to store test run: ${error.message}`);
  }
  
  return data;
}

/**
 * POST /upload-kg
 * Upload Knowledge Graph to Lighthouse and store hash in Supabase
 */
app.post('/upload-kg', async (req, res) => {
  try {
    const { access_token, conversation_id } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ error: 'access_token is required' });
    }
    
    console.log('\n🔍 Processing KG upload request');
    console.log(`   Access Token: ${access_token.substring(0, 8)}...`);
    console.log(`   Conversation ID: ${conversation_id || 'fetching last entry'}`);
    
    // Validate access token
    const userId = await validateAccessToken(access_token);
    console.log(`✅ User validated: ${userId}`);
    
    // Fetch KG from backend
    let kgUrl = `${BACKEND_URL}/rest/kg/last-entry`;
    if (conversation_id) {
      kgUrl = `${BACKEND_URL}/rest/kg/query-conversation`;
    }
    
    console.log(`📡 Fetching KG from: ${kgUrl}`);
    
    let kgData;
    if (conversation_id) {
      const response = await axios.post(kgUrl, { conversation_id });
      kgData = response.data;
    } else {
      const response = await axios.get(kgUrl);
      kgData = response.data;
    }
    
    console.log(`✅ KG data received`);
    
    // Upload to Lighthouse
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const kgName = `kg_${userId}_${timestamp}`;
    const lighthouseResult = await uploadToLighthouse(kgData, kgName);
    
    console.log(`✅ KG uploaded to Lighthouse: ${lighthouseResult.hash}`);
    
    res.json({
      success: true,
      user_id: userId,
      kg_hash: lighthouseResult.hash,
      lighthouse_url: `https://gateway.lighthouse.storage/ipfs/${lighthouseResult.hash}`,
      message: 'KG uploaded successfully. Call /upload-metrics to complete test run.'
    });
    
  } catch (error) {
    console.error('❌ KG upload error:', error.message);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to upload KG'
    });
  }
});

/**
 * POST /upload-metrics
 * Upload Metrics to Lighthouse and store both hashes in Supabase
 */
app.post('/upload-metrics', async (req, res) => {
  try {
    const { access_token, kg_hash, conversation_id } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ error: 'access_token is required' });
    }
    
    if (!kg_hash) {
      return res.status(400).json({ error: 'kg_hash is required (from previous /upload-kg call)' });
    }
    
    console.log('\n📊 Processing Metrics upload request');
    console.log(`   Access Token: ${access_token.substring(0, 8)}...`);
    console.log(`   KG Hash: ${kg_hash}`);
    console.log(`   Conversation ID: ${conversation_id || 'fetching last'}`);
    
    // Validate access token
    const userId = await validateAccessToken(access_token);
    console.log(`✅ User validated: ${userId}`);
    
    // Fetch Metrics from metrics service
    const metricsUrl = `${METRICS_URL}/metrics/last`;
    console.log(`📡 Fetching Metrics from: ${metricsUrl}`);
    
    const metricsResponse = await axios.get(metricsUrl);
    const metricsData = metricsResponse.data;
    
    console.log(`✅ Metrics data received`);
    
    // Upload to Lighthouse
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const metricsName = `metrics_${userId}_${timestamp}`;
    const lighthouseResult = await uploadToLighthouse(metricsData, metricsName);
    
    console.log(`✅ Metrics uploaded to Lighthouse: ${lighthouseResult.hash}`);
    
    // Store test run in Supabase
    const testRun = await storeTestRun(userId, kg_hash, lighthouseResult.hash);
    
    console.log(`✅ Test run stored in Supabase: ${testRun.run_id}`);
    
    res.json({
      success: true,
      run_id: testRun.run_id,
      user_id: userId,
      kg_hash: kg_hash,
      metrics_hash: lighthouseResult.hash,
      kg_url: `https://gateway.lighthouse.storage/ipfs/${kg_hash}`,
      metrics_url: `https://gateway.lighthouse.storage/ipfs/${lighthouseResult.hash}`,
      message: 'Test run completed and stored successfully'
    });
    
  } catch (error) {
    console.error('❌ Metrics upload error:', error.message);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to upload metrics and complete test run'
    });
  }
});

/**
 * POST /upload-complete
 * Combined endpoint - uploads both KG and Metrics in one call
 */
app.post('/upload-complete', async (req, res) => {
  try {
    const { access_token, conversation_id } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ error: 'access_token is required' });
    }
    
    console.log('\n🚀 Processing complete upload request');
    console.log(`   Access Token: ${access_token.substring(0, 8)}...`);
    
    // Validate access token
    const userId = await validateAccessToken(access_token);
    console.log(`✅ User validated: ${userId}`);
    
    // Fetch KG
    console.log(`📡 Fetching KG from backend...`);
    const kgUrl = `${BACKEND_URL}/rest/kg/last-entry`;
    const kgResponse = await axios.get(kgUrl);
    const kgData = kgResponse.data;
    console.log(`✅ KG data received`);
    
    // Fetch Metrics
    console.log(`📡 Fetching Metrics...`);
    const metricsUrl = `${METRICS_URL}/metrics/last`;
    const metricsResponse = await axios.get(metricsUrl);
    const metricsData = metricsResponse.data;
    console.log(`✅ Metrics data received`);
    
    // Upload both to Lighthouse
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    console.log(`📤 Uploading KG to Lighthouse...`);
    const kgName = `kg_${userId}_${timestamp}`;
    const kgLighthouse = await uploadToLighthouse(kgData, kgName);
    
    console.log(`📤 Uploading Metrics to Lighthouse...`);
    const metricsName = `metrics_${userId}_${timestamp}`;
    const metricsLighthouse = await uploadToLighthouse(metricsData, metricsName);
    
    // Store test run in Supabase
    const testRun = await storeTestRun(userId, kgLighthouse.hash, metricsLighthouse.hash);
    
    console.log(`✅ Complete test run stored: ${testRun.run_id}`);
    
    res.json({
      success: true,
      run_id: testRun.run_id,
      user_id: userId,
      kg: {
        hash: kgLighthouse.hash,
        url: `https://gateway.lighthouse.storage/ipfs/${kgLighthouse.hash}`
      },
      metrics: {
        hash: metricsLighthouse.hash,
        url: `https://gateway.lighthouse.storage/ipfs/${metricsLighthouse.hash}`
      },
      message: 'Test run completed and stored successfully'
    });
    
  } catch (error) {
    console.error('❌ Complete upload error:', error.message);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to complete upload process'
    });
  }
});

/**
 * GET /user/:access_token/test-runs
 * Get all test runs for a user
 */
app.get('/user/:access_token/test-runs', async (req, res) => {
  try {
    const { access_token } = req.params;
    
    // Validate access token
    const userId = await validateAccessToken(access_token);
    
    // Fetch test runs
    const { data, error } = await supabase
      .from('test_runs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch test runs: ${error.message}`);
    }
    
    res.json({
      success: true,
      user_id: userId,
      count: data.length,
      test_runs: data.map(run => ({
        ...run,
        kg_url: `https://gateway.lighthouse.storage/ipfs/${run.kg_hash}`,
        metrics_url: `https://gateway.lighthouse.storage/ipfs/${run.metrics_hash}`
      }))
    });
    
  } catch (error) {
    console.error('❌ Fetch test runs error:', error.message);
    res.status(500).json({ 
      error: error.message 
    });
  }
});

/**
 * POST /create-user
 * Create a new user with auto-generated access token
 */
// app.post('/create-user', async (req, res) => {
//   try {
//     const { email, name } = req.body;
    
//     // Build insert object
//     const insertData = {};
//     if (email) insertData.email = email;
//     if (name) insertData.name = name;
//     // access_token will be auto-generated by database
    
//     const { data, error } = await supabase
//       .from('users')
//       .insert([insertData])
//       .select()
//       .single();
    
//     if (error) {
//       if (error.code === '23505') { // Unique violation
//         return res.status(409).json({ error: 'User with this email already exists' });
//       }
//       throw error;
//     }
    
//     console.log(`✅ New user created: ${data.user_id}`);
//     console.log(`   Access Token: ${data.access_token}`);
//     console.log(`   Email: ${data.email || 'not provided'}`);
    
//     res.json({
//       success: true,
//       user_id: data.user_id,
//       access_token: data.access_token,
//       email: data.email,
//       name: data.name,
//       created_at: data.created_at,
//       message: 'User created successfully. Save your access_token - you will need it to use the CDP Agent Tester!'
//     });
    
//   } catch (error) {
//     console.error('❌ Create user error:', error.message);
//     res.status(500).json({ 
//       error: error.message 
//     });
//   }
// });

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 CDP Agent Tester - Database Server');
  console.log('=====================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Supabase connected: ${process.env.SUPABASE_URL}`);
  console.log(`✅ Lighthouse API key configured`);
  console.log(`\n📡 Backend: ${BACKEND_URL}`);
  console.log(`📊 Metrics: ${METRICS_URL}`);
  console.log('\n🔗 Available endpoints:');
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   POST http://localhost:${PORT}/upload-kg`);
  console.log(`   POST http://localhost:${PORT}/upload-metrics`);
  console.log(`   POST http://localhost:${PORT}/upload-complete`);
  console.log(`   POST http://localhost:${PORT}/create-user`);
  console.log(`   GET  http://localhost:${PORT}/user/:access_token/test-runs`);
  console.log('\n💡 Ready to store test results!\n');
});

module.exports = app;

