chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (request.action === 'fetch_html' && request.url) {
      console.log('Received request to fetch:', request.url);
      
      // Open tab in background
      chrome.tabs.create({ url: request.url, active: false }, (tab) => {
        const tabId = tab.id;
        
        const listener = (updatedTabId, info) => {
          if (updatedTabId === tabId && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            
            // Inject script to poll for content to render instead of blind wait
            chrome.scripting.executeScript({
              target: { tabId: tabId },
              func: () => {
                return new Promise((resolve) => {
                  let checks = 0;
                  const maxChecks = 30; // 15 seconds (500ms * 30)
                  
                  const interval = setInterval(() => {
                    checks++;
                    // Typical ChatGPT message selectors or Remix context
                    const hasMessages = document.querySelectorAll('article, [data-message-author-role], .prose, .markdown, .font-claude-message, user-query, model-response').length > 0;
                    const hasRemix = document.documentElement.innerHTML.includes('__remixContext');
                    
                    // If content seems to be rendered, or we timed out
                    if ((hasMessages || hasRemix) && checks > 2) { // Wait at least 1s after finding it
                      clearInterval(interval);
                      setTimeout(() => {
                        // --- Structured DOM extraction ---
                        function extractMessages() {
                          const msgs = [];

                          // ChatGPT: [data-message-author-role]
                          const chatgptEls = document.querySelectorAll('[data-message-author-role]');
                          if (chatgptEls.length > 0) {
                            chatgptEls.forEach(el => {
                              const role = el.getAttribute('data-message-author-role');
                              if (role !== 'user' && role !== 'assistant') return;
                              // Prefer the markdown/prose container for clean text
                              const mdEl = el.querySelector('.markdown, .prose, [class*="prose"]') || el;
                              const content = mdEl.innerText.trim();
                              if (content) msgs.push({ role, content });
                            });
                            if (msgs.length > 0) return msgs;
                          }

                          // Claude: .font-claude-message / .font-user-message
                          const claudeEls = document.querySelectorAll('.font-claude-message, .font-user-message');
                          if (claudeEls.length > 0) {
                            claudeEls.forEach(el => {
                              const role = el.classList.contains('font-user-message') ? 'user' : 'assistant';
                              const content = el.innerText.trim();
                              if (content) msgs.push({ role, content });
                            });
                            if (msgs.length > 0) return msgs;
                          }

                          // Gemini: user-query, model-response
                          const geminiEls = document.querySelectorAll('user-query, model-response');
                          if (geminiEls.length > 0) {
                            geminiEls.forEach(el => {
                              const role = el.tagName.toLowerCase() === 'user-query' ? 'user' : 'assistant';
                              const content = el.innerText.trim();
                              if (content) msgs.push({ role, content });
                            });
                            if (msgs.length > 0) return msgs;
                          }

                          // DeepSeek: [class*="user-message"], [class*="ds-markdown"]
                          const deepseekUser = document.querySelectorAll('[class*="userMessage"], [class*="user-message"]');
                          const deepseekBot = document.querySelectorAll('[class*="ds-markdown"], [class*="assistantMessage"], [class*="assistant-message"]');
                          if (deepseekUser.length > 0 || deepseekBot.length > 0) {
                            // interleave by DOM order
                            const allNodes = document.querySelectorAll('[class*="userMessage"], [class*="user-message"], [class*="ds-markdown"], [class*="assistantMessage"], [class*="assistant-message"]');
                            allNodes.forEach(el => {
                              const cls = (el.className || '').toLowerCase();
                              const role = (cls.includes('user')) ? 'user' : 'assistant';
                              const content = el.innerText.trim();
                              if (content) msgs.push({ role, content });
                            });
                            if (msgs.length > 0) return msgs;
                          }

                          // Grok: [data-testid="message"]
                          const grokEls = document.querySelectorAll('[data-testid="message"]');
                          if (grokEls.length > 0) {
                            grokEls.forEach((el, idx) => {
                              const role = idx % 2 === 0 ? 'user' : 'assistant';
                              const content = el.innerText.trim();
                              if (content) msgs.push({ role, content });
                            });
                            if (msgs.length > 0) return msgs;
                          }

                          return [];
                        }

                        const structuredMessages = extractMessages();
                        const title = document.title;
                        const html = document.documentElement.outerHTML;

                        resolve({ html, structuredMessages, title });
                      }, 1000);
                    } else if (checks >= maxChecks) {
                      clearInterval(interval);
                      resolve({ html: document.documentElement.outerHTML, structuredMessages: [], title: document.title });
                    }
                  }, 500);
                });
              }
            }, (results) => {
              let html = null;
              let structuredMessages = [];
              let title = '';
              if (results && results[0] && results[0].result) {
                const result = results[0].result;
                html = result.html || null;
                structuredMessages = result.structuredMessages || [];
                title = result.title || '';
              }
              
              chrome.tabs.remove(tabId);
              sendResponse({ html, structuredMessages, title, success: !!html });
            });
          }
        };
        
        chrome.tabs.onUpdated.addListener(listener);
      });
      
      // Return true to indicate we will send a response asynchronously
      return true;
    }
  }
);
