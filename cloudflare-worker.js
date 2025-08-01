/* 
 * Cloudflare Worker for L'Oréal Routine Builder with Web Search
 * This worker handles OpenAI API calls with web search capabilities
 * and manages CORS for the frontend application
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Only handle POST requests to /api/chat
    if (request.method === 'POST' && new URL(request.url).pathname === '/api/chat') {
      try {
        // Get the request body with user message and context
        const body = await request.json();
        const { message, context, products, faceArea, concern } = body;

        // Build enhanced system message for L'Oréal advisor
        let systemMessage = `You are a helpful L'Oréal beauty advisor with access to current web information. ${context || ''}`;
        
        if (products && products.length > 0) {
          systemMessage += ` Selected products: ${products.join(', ')}.`;
        }
        
        if (faceArea) {
          systemMessage += ` User is focusing on: ${faceArea}.`;
        }
        
        if (concern) {
          systemMessage += ` User's main concern: ${concern}.`;
        }

        systemMessage += `
        
        Please:
        1. Provide helpful advice about L'Oréal products and skincare routines
        2. Include current information about new products, reviews, or trends when relevant
        3. Cite your sources when you use web information
        4. Focus on official L'Oréal information and reputable beauty sources
        5. Format your response with clear sections and bullet points for easy reading`;

        // Prepare OpenAI API request with web search
        const openaiRequest = {
          model: "gpt-4o-with-web-search",
          messages: [
            {
              role: "system",
              content: systemMessage,
            },
            {
              role: "user",
              content: message,
            },
          ],
          max_tokens: 800,
          temperature: 0.7,
          tools: [
            {
              type: "web_search",
              web_search: {
                max_results: 5
              }
            }
          ]
        };

        // Make request to OpenAI API
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify(openaiRequest),
        });

        // Handle API response
        if (!openaiResponse.ok) {
          console.log('Web search model not available, falling back to regular model');
          
          // Fallback to regular model
          const fallbackRequest = {
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: systemMessage,
              },
              {
                role: "user",
                content: message,
              },
            ],
            max_tokens: 500,
            temperature: 0.7,
          };

          const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify(fallbackRequest),
          });

          const fallbackData = await fallbackResponse.json();
          
          return new Response(JSON.stringify({
            response: fallbackData.choices[0].message.content,
            hasWebSearch: false
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }

        const data = await openaiResponse.json();
        
        // Return response with web search results if available
        return new Response(JSON.stringify({
          response: data.choices[0].message.content,
          webSearchResults: data.web_search_results || null,
          hasWebSearch: true
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });

      } catch (error) {
        console.error('Error in Cloudflare Worker:', error);
        
        return new Response(JSON.stringify({
          error: 'Sorry, I encountered an error. Please try again.',
          details: error.message
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // Return 404 for other requests
    return new Response('Not Found', { status: 404 });
  },
};
