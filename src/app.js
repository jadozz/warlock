const { App } = require('@slack/bolt');
const OpenAI = require('openai');
const { GoogleSheetsService } = require('./services/googleSheetsService');
const { StartupService } = require('./services/startupService');
require('dotenv').config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Google Sheets service
const googleSheetsService = new GoogleSheetsService();
const startupService = new StartupService(googleSheetsService);

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000
});

// Store conversation context for each user
const userContexts = new Map();

// Add general event logging
app.event(/.+/, async ({ event, client, logger }) => {
  console.log('🎯 Received event:', event.type, event);
});

// Helper function to get or create user context
function getUserContext(userId) {
  if (!userContexts.has(userId)) {
    userContexts.set(userId, {
      messages: [],
      startupData: null
    });
  }
  return userContexts.get(userId);
}

// Listen for messages mentioning the bot
app.message(async ({ message, say, client }) => {
  try {
    console.log('📨 Received message:', {
      text: message.text,
      user: message.user,
      channel: message.channel,
      channel_type: message.channel_type,
      subtype: message.subtype
    });

    // Skip if it's a bot message or doesn't mention the bot
    if (message.subtype === 'bot_message') {
      console.log('⏭️ Skipping bot message');
      return;
    }
    
    const botUserId = await client.auth.test().then(res => res.user_id);
    console.log('🤖 Bot User ID:', botUserId);
    
    const isMentioned = message.text && message.text.includes(`<@${botUserId}>`);
    const isDM = message.channel_type === 'im';
    
    console.log('🔍 Message analysis:', {
      isMentioned,
      isDM,
      shouldRespond: isMentioned || isDM
    });
    
    if (!isMentioned && !isDM) {
      console.log('❌ Message does not mention bot and is not a DM, ignoring');
      return;
    }

    console.log('✅ Processing message...');

    const userId = message.user;
    const userText = message.text.replace(`<@${botUserId}>`, '').trim();
    
    // Get user context
    const context = getUserContext(userId);
    
    // Add user message to context
    context.messages.push({
      role: 'user',
      content: userText
    });
    
    // Keep only last 20 messages to avoid token limits
    if (context.messages.length > 20) {
      context.messages = context.messages.slice(-20);
    }
    
    // Use AI to extract startup name from the message
    let startupResults = [];
    
    try {
      console.log('🤖 Using AI to extract startup name from message...');
      const extractionCompletion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: `You are a startup name extraction assistant. Your job is to identify if a user message is asking about a specific startup company, and if so, extract the startup name.

Rules:
1. If the message is asking about a specific startup/company, respond with just the startup name (no quotes, no extra text)
2. If the message is NOT asking about a specific startup, respond with "NONE"
3. Look for patterns like: "tell me about X", "what is X", "find X", "search for X", "information about X", "X company", "how many founders does X have", etc.
4. Extract the most likely startup name from the query
5. Be flexible - handle typos, partial names, and natural language

Examples:
- "tell me about deeptrust" → "deeptrust"
- "what is OpenAI doing" → "OpenAI"  
- "find information about Tesla" → "Tesla"
- "how's the weather" → "NONE"
- "can you search for airbnb details" → "airbnb"
- "what do you know about stripe?" → "stripe"
- "how many founders does deeptrust have" → "deeptrust"`
        }, {
          role: 'user',
          content: userText
        }],
        max_tokens: 50,
        temperature: 0.1,
      });
      
      const extractedName = extractionCompletion.choices[0].message.content.trim();
      console.log('🎯 AI extracted startup name:', extractedName);
      
      if (extractedName && extractedName !== 'NONE' && extractedName.length > 0) {
        console.log('🔍 Searching for startup:', extractedName);
        startupResults = await startupService.searchStartups(extractedName);
        console.log('📊 Found startup results:', startupResults.length);
        
        if (startupResults.length > 0) {
          // Format the startup data for OpenAI context
          const startup = startupResults[0]; // Use the best match
          console.log('✅ Found startup match:', startup.property, 'with score:', startup.score);
          
          // Add startup data to context for OpenAI
          context.messages.push({
            role: 'system',
            content: `Here is detailed information about ${startup.property}:

**COMPANY BASICS:**
• Startup Name: ${startup.property || 'N/A'}
• Problem: ${startup.problem || 'N/A'}
• Solution: ${startup.solution || 'N/A'}
• Industry: ${startup.category || 'N/A'}
• Stage: ${startup.stage || 'N/A'}
• All the info in their deck: ${startup.future_of_work || 'N/A'}

**FOUNDERS & TEAM & Diversity:**
• Number of Founders: ${startup.number_of_founders || 'N/A'}
• Team Size: ${startup.team_size || 'N/A'}
• Founder 1: ${startup.first_name || 'N/A'} ${startup.last_name || 'N/A'}
• Founder 1 Ethnicity: ${startup.founder_1_ethnicity || 'N/A'}
• Founder 1 Gender: ${startup.founder_1_gender || 'N/A'}
• Founder 1 Disability: ${startup.founder_1_disability || 'N/A'}
• Founder 1 Veteran: ${startup.founder_1_veteran || 'N/A'}
• Founder 2 Ethnicity: ${startup.founder_2_ethnicity || 'N/A'}
• Founder 2 Gender: ${startup.founder_2_gender || 'N/A'}
• Founder 2 Disability: ${startup.founder_2_disability || 'N/A'}
• Founder 2 Veteran: ${startup.founder_2_veteran || 'N/A'}
• Founder 3 Ethnicity: ${startup.founder_3_ethnicity || 'N/A'}
• Founder 3 Gender: ${startup.founder_3_gender || 'N/A'}
• Founder 3 Disability: ${startup.founder_3_disability || 'N/A'}
• Founder 3 Veteran: ${startup.founder_3_veteran || 'N/A'}
• Founder 4 Ethnicity: ${startup.founder_4_ethnicity || 'N/A'}
• Founder 4 Gender: ${startup.founder_4_gender || 'N/A'}
• Founder 4 Disability: ${startup.founder_4_disability || 'N/A'}
• Founder 4 Veteran: ${startup.founder_4_veteran || 'N/A'}
• Why You?: ${startup.why_you || 'N/A'}
• Full Time?: ${startup.full_time || 'N/A'}

**BUSINESS MODEL & TRACTION:**
• Business Model: ${startup.business_model || 'N/A'}
• Monetization: ${startup.monetization || 'N/A'}
• Revenue?: ${startup.revenue || 'N/A'}
• Revenue Traction: ${startup.revenue_traction || 'N/A'}
• MVP?: ${startup.mvp || 'N/A'}
• Customer Acquisition Method: ${startup.customer_acquisition_method || 'N/A'}
• Who's the Customer: ${startup.whos_the_customer || 'N/A'}
• Who's the Buyer: ${startup.whos_the_buyer || 'N/A'}
• Who Needs Product: ${startup.who_needs_product || 'N/A'}
• Customer's Location: ${startup.customers_location || 'N/A'}
• Prior Solution: ${startup.prior_to_your_product_what_did_your_customer_use || 'N/A'}

**COMPETITIVE ADVANTAGE:**
• 10x Advantage: ${startup['10x_advantage'] || 'N/A'}
• Deep Tech Moat: ${startup.deep_tech_moat || 'N/A'}
• Network Effects?: ${startup['network_effects'] || 'N/A'}

**FUNDING & INVESTMENT:**
• Finance Stage: ${startup.finance_stage || 'N/A'}
• Raising Amount: ${startup.raising_amount || 'N/A'}
• Post-Money Valuation: ${startup['post-money_valuation'] || 'N/A'}
• Why are you raising?: ${startup['raising?_why?'] || 'N/A'}
• What Are You Looking For in a VC: ${startup.what_are_you_looking_for || 'N/A'}

**LOCATION & CONTACT:**
• City: ${startup.city || 'N/A'}
• Country: ${startup.country || 'N/A'}
• Located in SV?: ${startup['located_in_sv?'] || 'N/A'}
• Email: ${startup.email || 'N/A'}
• Phone: ${startup.phone || 'N/A'}
• Website?: ${startup['website?'] || 'N/A'}
• Website: ${startup.website || 'N/A'}

**DEAL STATUS:**
• Deal Lead: ${startup.deal_lead || 'N/A'}
• Date: ${startup.date || 'N/A'}
• Status: ${startup.status || 'N/A'}
• Priority: ${startup.priority || 'N/A'}
• Deal Source: ${startup.deal_source || 'N/A'}
• Referral: ${startup.referral || 'N/A'}
• Score: ${startup.score || 'N/A'}

**IMPACT:**
• Social/Climate Impact?: ${startup['s/c_impact?'] || 'N/A'}
• Social/Climate Impact: ${startup['social/climate_impact'] || 'N/A'}
• Impact Measure: ${startup.impact_measure || 'N/A'}

**ADDITIONAL INFO:**
• Created Time: ${startup.created_time || 'N/A'}

Use this data to answer the user's specific question about ${startup.property}. Focus on directly answering what they asked rather than giving a general overview. If they ask about founders, focus on founder information. If they ask about funding, focus on funding details. Be conversational and helpful, but stay focused on their specific question.`
          });
        } else {
          console.log('❌ No startup found matching:', extractedName);
        }
      } else {
        console.log('ℹ️ No startup name detected in message');
      }
    } catch (extractionError) {
      console.error('❌ Error in AI name extraction:', extractionError);
      // Continue with regular processing if extraction fails
    }
    
    // Get startup data if not cached (for general context)
    if (!context.startupData) {
      try {
        console.log('📊 Fetching startup data...');
        context.startupData = await startupService.getAllStartups();
        console.log(`📈 Loaded ${context.startupData.length} startups`);
      } catch (error) {
        console.error('Error fetching startup data:', error);
        context.startupData = [];
      }
    }
    
    // Prepare system message with startup context
    const systemMessage = {
      role: 'system',
      content: `You are Slack Warlock, a helpful assistant with access to a database of startup information. 
      
You have access to data about ${context.startupData.length} startups. 

Guidelines:
- Be helpful and conversational
- When provided with specific startup data in the conversation context, use it to give detailed, insightful responses
- Focus on the most important aspects: problem they're solving, their solution, traction, team, business model, and what makes them unique
- Present information in a clear, engaging way that's easy to read in Slack
- If users ask about specific startups and you don't have the information, suggest they try the /startup command or be more specific
- Keep responses concise but informative
- Use a friendly, professional tone appropriate for Slack`
    };
    
    // Prepare messages for OpenAI
    const messages = [systemMessage, ...context.messages];
    
    console.log('🧠 Calling OpenAI...');
    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });
    
    const aiResponse = completion.choices[0].message.content;
    console.log('💬 AI Response:', aiResponse);
    
    // Add AI response to context
    context.messages.push({
      role: 'assistant',
      content: aiResponse
    });
    
    // Send response
    await say(aiResponse);
    console.log('✅ Response sent!');
    
  } catch (error) {
    console.error('❌ Error handling message:', error);
    await say('Sorry, I encountered an error while processing your message. Please try again.');
  }
});

// Slash command for startup autocomplete
app.command('/startup', async ({ command, ack, respond, client }) => {
  await ack();
  
  try {
    const query = command.text.trim().toLowerCase();
    
    if (!query) {
      await respond({
        text: 'Please provide a search term after the command. Example: `/startup air`',
        response_type: 'ephemeral'
      });
      return;
    }
    
    // Get startup data
    const startups = await startupService.searchStartups(query);
    
    if (startups.length === 0) {
      await respond({
        text: `No startups found matching "${query}"`,
        response_type: 'ephemeral'
      });
      return;
    }
    
    // Format response with up to 10 matches
    const limitedStartups = startups.slice(0, 10);
    const formattedStartups = limitedStartups.map((startup, index) => {
      return `${index + 1}. *${startup.name}* ${startup.description ? `- ${startup.description}` : ''}`;
    }).join('\n');
    
    await respond({
      text: `Found ${startups.length} startup(s) matching "${query}":\n\n${formattedStartups}${startups.length > 10 ? `\n\n... and ${startups.length - 10} more` : ''}`,
      response_type: 'ephemeral'
    });
    
  } catch (error) {
    console.error('Error handling startup command:', error);
    await respond({
      text: 'Sorry, I encountered an error while searching for startups. Please try again.',
      response_type: 'ephemeral'
    });
  }
});

// Global shortcut for startup search (alternative to slash command)
app.shortcut('startup_search', async ({ shortcut, ack, client }) => {
  await ack();
  
  try {
    await client.views.open({
      trigger_id: shortcut.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'startup_search_modal',
        title: {
          type: 'plain_text',
          text: 'Search Startups'
        },
        submit: {
          type: 'plain_text',
          text: 'Search'
        },
        close: {
          type: 'plain_text',
          text: 'Cancel'
        },
        blocks: [
          {
            type: 'input',
            block_id: 'search_input',
            element: {
              type: 'plain_text_input',
              action_id: 'search_query',
              placeholder: {
                type: 'plain_text',
                text: 'Type startup name or keywords...'
              }
            },
            label: {
              type: 'plain_text',
              text: 'Search Query'
            }
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error opening startup search modal:', error);
  }
});

// Handle modal submission
app.view('startup_search_modal', async ({ ack, body, view, client }) => {
  await ack();
  
  try {
    const searchQuery = view.state.values.search_input.search_query.value;
    const startups = await startupService.searchStartups(searchQuery.toLowerCase());
    
    if (startups.length === 0) {
      await client.chat.postEphemeral({
        channel: body.user.id,
        user: body.user.id,
        text: `No startups found matching "${searchQuery}"`
      });
      return;
    }
    
    const limitedStartups = startups.slice(0, 10);
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Found ${startups.length} startup(s) matching "${searchQuery}":*`
        }
      },
      {
        type: 'divider'
      }
    ];
    
    limitedStartups.forEach((startup, index) => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${index + 1}. ${startup.name}*\n${startup.description || 'No description available'}`
        }
      });
    });
    
    if (startups.length > 10) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `... and ${startups.length - 10} more results`
          }
        ]
      });
    }
    
    await client.chat.postEphemeral({
      channel: body.user.id,
      user: body.user.id,
      blocks: blocks
    });
    
  } catch (error) {
    console.error('Error handling startup search modal:', error);
  }
});

// Error handling
app.error((error) => {
  console.error('Slack app error:', error);
});

// Start the app
(async () => {
  try {
    await app.start();
    console.log('⚡️ Slack Warlock bot is running!');
    
    // Initialize Google Sheets connection
    await googleSheetsService.initialize();
    console.log('📊 Google Sheets connection established!');
    
  } catch (error) {
    console.error('Failed to start the app:', error);
    process.exit(1);
  }
})(); 