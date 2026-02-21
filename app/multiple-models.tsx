// Quick fix: fallback to different models when rate limited

const AI_MODELS = [
  "gemini-3-pro-image-preview",     // Nano Banana Pro (best quality)
  "gemini-2.5-flash-image-preview", // Nano Banana Flash (faster, cheaper)  
  "dall-e-3",                       // OpenAI DALL-E 3 (backup)
  "dall-e-2"                        // OpenAI DALL-E 2 (cheapest backup)
];

export async function generateImageWithFallback(prompt, inputImage) {
  for (const model of AI_MODELS) {
    try {
      console.log(`🤖 Trying model: ${model}`);
      
      const result = await window.puter.ai.txt2img(prompt, {
        model: model,
        input_image: inputImage,
        input_image_mime_type: "image/jpeg"
      });
      
      console.log(`✅ Success with ${model}`);
      return result;
      
    } catch (error) {
      console.log(`❌ ${model} failed:`, error.message);
      
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        console.log(`💡 ${model} rate limited, trying next model...`);
        continue;
      } else {
        console.error(`🚨 ${model} hard error:`, error);
        continue;
      }
    }
  }
  
  throw new Error('All AI models failed or rate limited. Try again later.');
}