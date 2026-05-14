chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (request.action === 'fetch_html' && request.url) {
      console.log('Received request to fetch:', request.url);

      chrome.tabs.create({ url: request.url, active: false }, (tab) => {
        const tabId = tab.id;

        const listener = (updatedTabId, info) => {
          if (updatedTabId === tabId && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);

            // Wait for page scripts to settle, then scroll-to-load all content, then extract
            setTimeout(() => {
              chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                  return new Promise((resolve) => {

                    // ── Step 1: scroll the page to force lazy-loading all messages ──
                    function scrollToBottom() {
                      return new Promise((done) => {
                        let lastHeight = 0;
                        let attempts = 0;
                        const scroll = setInterval(() => {
                          window.scrollTo(0, document.body.scrollHeight);
                          const newHeight = document.body.scrollHeight;
                          if (newHeight === lastHeight || attempts >= 20) {
                            clearInterval(scroll);
                            window.scrollTo(0, 0); // scroll back to top
                            setTimeout(done, 500);
                          }
                          lastHeight = newHeight;
                          attempts++;
                        }, 400);
                      });
                    }

                    // ── Step 2: extract clean innerHTML per message element ─────
                    function extractFromDom() {
                      const msgs = [];
                      const title = document.title || '';

                      // ChatGPT: articles with [data-message-author-role]
                      const articles = document.querySelectorAll('article[data-testid*="conversation-turn"]');
                      if (articles.length > 0) {
                        articles.forEach(article => {
                          const roleEl = article.querySelector('[data-message-author-role]');
                          const role = roleEl ? roleEl.getAttribute('data-message-author-role') : null;
                          if (role !== 'user' && role !== 'assistant') return;

                          // Clone and clean the content element
                          const contentEl = roleEl || article;
                          const clone = contentEl.cloneNode(true);

                          // Remove UI chrome (buttons, copy icons, thumbs, etc.)
                          const noise = clone.querySelectorAll(
                            'button, [aria-label], .sr-only, svg, [data-testid*="button"], ' +
                            '[class*="action"], [class*="toolbar"], [class*="footer-button"], ' +
                            'cite, [class*="citation"], [class*="source"]'
                          );
                          noise.forEach(el => el.remove());
                          // Remove "Show more" / "Show less" expand-collapse UI text nodes
                          clone.querySelectorAll('*').forEach(el => {
                            const t = (el.textContent || '').trim().toLowerCase();
                            if (t === 'show more' || t === 'show less' || t === 'show moreshow less') {
                              el.remove();
                            }
                          });

                          const htmlContent = clone.innerHTML.trim();
                          if (htmlContent) msgs.push({ role, htmlContent });
                        });
                        if (msgs.length > 0) return { title, msgs };
                      }

                      // Fallback: [data-message-author-role] directly
                      const roleEls = document.querySelectorAll('[data-message-author-role]');
                      if (roleEls.length > 0) {
                        roleEls.forEach(el => {
                          const role = el.getAttribute('data-message-author-role');
                          if (role !== 'user' && role !== 'assistant') return;
                          const clone = el.cloneNode(true);
                          clone.querySelectorAll('button, svg, .sr-only, [aria-label]').forEach(n => n.remove());
                          const htmlContent = clone.innerHTML.trim();
                          if (htmlContent) msgs.push({ role, htmlContent });
                        });
                        if (msgs.length > 0) return { title, msgs };
                      }

                      // Claude: .font-user-message / .font-claude-message
                      const claudeUser = document.querySelectorAll('.font-user-message');
                      const claudeBot = document.querySelectorAll('.font-claude-message');
                      if (claudeUser.length > 0 || claudeBot.length > 0) {
                        // Merge in DOM order
                        const all = [...document.querySelectorAll('.font-user-message, .font-claude-message')];
                        all.forEach(el => {
                          const role = el.classList.contains('font-user-message') ? 'user' : 'assistant';
                          const clone = el.cloneNode(true);
                          clone.querySelectorAll('button, svg').forEach(n => n.remove());
                          const htmlContent = clone.innerHTML.trim();
                          if (htmlContent) msgs.push({ role, htmlContent });
                        });
                        if (msgs.length > 0) return { title, msgs };
                      }

                      // Gemini: user-query / model-response
                      const geminiEls = document.querySelectorAll('user-query, model-response');
                      if (geminiEls.length > 0) {
                        geminiEls.forEach(el => {
                          const role = el.tagName.toLowerCase() === 'user-query' ? 'user' : 'assistant';
                          const clone = el.cloneNode(true);
                          clone.querySelectorAll('button, svg').forEach(n => n.remove());
                          const htmlContent = clone.innerHTML.trim();
                          if (htmlContent) msgs.push({ role, htmlContent });
                        });
                        if (msgs.length > 0) return { title, msgs };
                      }

                      // DeepSeek
                      const dsEls = document.querySelectorAll('[class*="userMessage"], [class*="user-message"], [class*="ds-markdown"], [class*="assistantMessage"]');
                      if (dsEls.length > 0) {
                        dsEls.forEach(el => {
                          const cls = (el.className || '').toLowerCase();
                          const role = cls.includes('user') ? 'user' : 'assistant';
                          const clone = el.cloneNode(true);
                          clone.querySelectorAll('button, svg').forEach(n => n.remove());
                          const htmlContent = clone.innerHTML.trim();
                          if (htmlContent) msgs.push({ role, htmlContent });
                        });
                        if (msgs.length > 0) return { title, msgs };
                      }

                      return null;
                    }

                    // ── Step 3: poll until DOM messages are found ──────────────
                    scrollToBottom().then(() => {
                      let ticks = 0;
                      const poll = setInterval(() => {
                        ticks++;
                        const result = extractFromDom();
                        if (result && result.msgs.length > 0) {
                          clearInterval(poll);
                          resolve({
                            success: true,
                            title: result.title,
                            htmlMessages: result.msgs,
                            // Also send full page HTML as backup
                            html: document.documentElement.outerHTML,
                          });
                        } else if (ticks >= 30) { // 15s timeout
                          clearInterval(poll);
                          // Last resort: just send full HTML
                          resolve({
                            success: true,
                            title: document.title || '',
                            htmlMessages: [],
                            html: document.documentElement.outerHTML,
                          });
                        }
                      }, 500);
                    });
                  });
                }
              }, (results) => {
                chrome.tabs.remove(tabId);
                const r = results && results[0] && results[0].result;
                if (r) {
                  console.log(`Extracted ${r.htmlMessages ? r.htmlMessages.length : 0} HTML messages, html length: ${r.html ? r.html.length : 0}`);
                  sendResponse({
                    success: r.success,
                    title: r.title,
                    htmlMessages: r.htmlMessages || [],
                    html: r.html || null,
                    // Legacy fields for backward compat
                    structuredMessages: [],
                    structuredTitle: r.title,
                  });
                } else {
                  sendResponse({ success: false, htmlMessages: [], structuredMessages: [], html: null });
                }
              });
            }, 2000);
          }
        };

        chrome.tabs.onUpdated.addListener(listener);
      });

      return true;
    }
  }
);
