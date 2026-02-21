// Debug Street Reimagined in browser console
// Ga naar https://street-reimagined.vercel.app
// Open F12 → Console 
// Plak deze code:

console.log("🔍 Street Reimagined Debug Mode");

// Check Puter.js status
if (window.puter) {
  console.log("✅ Puter.js loaded:", window.puter);
} else {
  console.log("❌ Puter.js not loaded");
}

// Check local analytics data
const analyticsData = localStorage.getItem('street-reimagined-analytics');
if (analyticsData) {
  const data = JSON.parse(analyticsData);
  console.log("📊 Local Analytics:", data);
  console.log(`📈 Total transformations: ${data.length}`);
  
  // Analyze categories
  const categories = {};
  data.forEach(item => {
    item.categories.forEach(cat => {
      categories[cat] = (categories[cat] || 0) + 1;
    });
  });
  console.log("📋 Category breakdown:", categories);
} else {
  console.log("📊 No analytics data found");
}

// Monitor API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log("🌐 API Call:", args[0]);
  return originalFetch.apply(this, arguments)
    .then(response => {
      console.log("✅ API Response:", response.status, response.statusText);
      return response;
    })
    .catch(error => {
      console.error("❌ API Error:", error);
      throw error;
    });
};

// Test Puter.js availability
async function testPuter() {
  if (!window.puter) return;
  
  try {
    // This would normally cost tokens, so just check if API is reachable
    console.log("🧪 Testing Puter.js API availability...");
    console.log("ℹ️ User-pays model active - users pay for their own usage");
  } catch (error) {
    console.error("❌ Puter.js test failed:", error);
  }
}

testPuter();