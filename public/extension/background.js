chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (request.action === 'fetch_html' && request.url) {
      console.log('Received request to fetch:', request.url);

      chrome.tabs.create({ url: request.url, active: true }, (tab) => {
        const tabId = tab.id;

        const listener = (updatedTabId, info) => {
          if (updatedTabId === tabId && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);

            // Wait a bit for JS to execute, then extract
            setTimeout(() => {
              chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                  return new Promise((resolve) => {

                    // ── Helper: deep-search an object for chat messages ──────────
                    function deepFindMessages(obj, found, depth) {
                      if (!obj || depth > 12 || found.length > 500) return;
                      if (Array.isArray(obj)) {
                        obj.forEach(item => deepFindMessages(item, found, depth + 1));
                        return;
                      }
                      if (typeof obj !== 'object') return;

                      // ChatGPT pattern: { author: { role }, content: { parts: [...] } }
                      if (obj.author && obj.author.role && obj.content && Array.isArray(obj.content.parts)) {
                        const role = obj.author.role;
                        if (role === 'user' || role === 'assistant') {
                          const text = obj.content.parts
                            .filter(p => typeof p === 'string' || (p && typeof p.text === 'string'))
                            .map(p => typeof p === 'string' ? p : p.text)
                            .join('\n').trim();
                          if (text) found.push({ role, content: text });
                          return; // don't recurse into message content
                        }
                      }

                      // Alternative ChatGPT: { role, content: { parts } }
                      if (obj.role && obj.content && typeof obj.content === 'object' && Array.isArray(obj.content.parts)) {
                        const role = obj.role;
                        if (role === 'user' || role === 'assistant') {
                          const text = obj.content.parts
                            .filter(p => typeof p === 'string' || (p && typeof p.text === 'string'))
                            .map(p => typeof p === 'string' ? p : p.text)
                            .join('\n').trim();
                          if (text) found.push({ role, content: text });
                          return;
                        }
                      }

                      // Generic { role, content: string }
                      if (typeof obj.role === 'string' && typeof obj.content === 'string') {
                        const role = obj.role;
                        if ((role === 'user' || role === 'assistant') && obj.content.trim()) {
                          found.push({ role, content: obj.content.trim() });
                          return;
                        }
                      }

                      // Claude: { sender: "human"/"assistant", text }
                      if ((obj.sender === 'human' || obj.sender === 'assistant') && typeof obj.text === 'string') {
                        found.push({ role: obj.sender === 'human' ? 'user' : 'assistant', content: obj.text.trim() });
                        return;
                      }

                      Object.values(obj).forEach(v => deepFindMessages(v, found, depth + 1));
                    }

                    // ── 1. Try window.__remixContext (ChatGPT Remix/RSC format) ──
                    function tryRemixContext() {
                      try {
                        const ctx = window.__remixContext;
                        if (!ctx) return null;
                        const loaderData = ctx.state && ctx.state.loaderData;
                        if (!loaderData) return null;

                        let title = document.title || 'Extracted Chat';
                        const msgs = [];

                        // Search all loader routes for conversation data
                        for (const routeKey of Object.keys(loaderData)) {
                          const routeData = loaderData[routeKey];
                          deepFindMessages(routeData, msgs, 0);
                          if (msgs.length > 0) break;
                        }

                        if (msgs.length > 0) return { title, messages: msgs };
                      } catch (e) {}
                      return null;
                    }

                    // ── 2. Try DOM extraction ────────────────────────────────────
                    function tryDomExtraction() {
                      const msgs = [];
                      const title = document.title || 'Extracted Chat';

                      // ChatGPT: [data-message-author-role]
                      const chatgptEls = document.querySelectorAll('[data-message-author-role]');
                      if (chatgptEls.length > 0) {
                        chatgptEls.forEach(el => {
                          const role = el.getAttribute('data-message-author-role');
                          if (role !== 'user' && role !== 'assistant') return;
                          const mdEl = el.querySelector('.markdown, .prose, [class*="prose"]') || el;
                          const content = mdEl.innerText.trim();
                          if (content) msgs.push({ role, content });
                        });
                        if (msgs.length > 0) return { title, messages: msgs };
                      }

                      // Claude: .font-claude-message / .font-user-message
                      const claudeEls = document.querySelectorAll('.font-claude-message, .font-user-message');
                      if (claudeEls.length > 0) {
                        claudeEls.forEach(el => {
                          const role = el.classList.contains('font-user-message') ? 'user' : 'assistant';
                          const content = el.innerText.trim();
                          if (content) msgs.push({ role, content });
                        });
                        if (msgs.length > 0) return { title, messages: msgs };
                      }

                      // Gemini: user-query, model-response
                      const geminiEls = document.querySelectorAll('user-query, model-response');
                      if (geminiEls.length > 0) {
                        geminiEls.forEach(el => {
                          const role = el.tagName.toLowerCase() === 'user-query' ? 'user' : 'assistant';
                          const content = el.innerText.trim();
                          if (content) msgs.push({ role, content });
                        });
                        if (msgs.length > 0) return { title, messages: msgs };
                      }

                      // DeepSeek
                      const dsUser = document.querySelectorAll('[class*="userMessage"], [class*="user-message"]');
                      const dsBot = document.querySelectorAll('[class*="ds-markdown"], [class*="assistantMessage"]');
                      if (dsUser.length > 0 || dsBot.length > 0) {
                        const all = [...document.querySelectorAll('[class*="userMessage"], [class*="user-message"], [class*="ds-markdown"], [class*="assistantMessage"]')];
                        all.forEach(el => {
                          const cls = (el.className || '').toLowerCase();
                          const role = cls.includes('user') ? 'user' : 'assistant';
                          const content = el.innerText.trim();
                          if (content) msgs.push({ role, content });
                        });
                        if (msgs.length > 0) return { title, messages: msgs };
                      }

                      return null;
                    }

                    // ── 3. Try script-tag JSON scanning ─────────────────────────
                    function tryScriptScan() {
                      const title = document.title || 'Extracted Chat';
                      const msgs = [];
                      const scripts = document.querySelectorAll('script');

                      for (const s of scripts) {
                        const text = s.textContent || '';
                        if (!text.includes('role') || text.length > 5000000) continue;

                        // Look for Uint8Array chunks (RSC streaming)
                        if (text.includes('streamController') || text.includes('Uint8Array')) {
                          const re = /new\s+Uint8Array\(\s*\[([\d,\s]+)\]\s*\)/g;
                          let m;
                          while ((m = re.exec(text)) !== null) {
                            try {
                              const bytes = m[1].split(',').map(n => parseInt(n.trim(), 10));
                              const str = new TextDecoder().decode(new Uint8Array(bytes));
                              const json = JSON.parse(str);
                              deepFindMessages(json, msgs, 0);
                            } catch (e) {}
                          }
                          if (msgs.length > 0) return { title, messages: msgs };
                        }

                        // Look for inline JSON assignments
                        if (text.includes('"role"') && (text.includes('"user"') || text.includes('"assistant"'))) {
                          try {
                            // extract JSON objects/arrays
                            const jsonRe = /\{[\s\S]{20,}\}/g;
                            let jm;
                            while ((jm = jsonRe.exec(text)) !== null) {
                              try {
                                const obj = JSON.parse(jm[0]);
                                deepFindMessages(obj, msgs, 0);
                              } catch (e) {}
                              if (msgs.length > 0) break;
                            }
                          } catch (e) {}
                          if (msgs.length > 0) return { title, messages: msgs };
                        }
                      }
                      return null;
                    }

                    // ── Attempt extraction, with a DOM-ready retry ───────────────
                    function attempt() {
                      // Priority 1: __remixContext (available immediately, no render needed)
                      const remix = tryRemixContext();
                      if (remix && remix.messages.length > 0) return remix;

                      // Priority 2: DOM elements
                      const dom = tryDomExtraction();
                      if (dom && dom.messages.length > 0) return dom;

                      // Priority 3: script scanning
                      const script = tryScriptScan();
                      if (script && script.messages.length > 0) return script;

                      return null;
                    }

                    // Try immediately, then poll every 500ms for up to 15s
                    const immediate = attempt();
                    if (immediate) {
                      resolve({
                        structuredMessages: immediate.messages,
                        title: immediate.title,
                        html: document.documentElement.outerHTML,
                      });
                      return;
                    }

                    let ticks = 0;
                    const poll = setInterval(() => {
                      ticks++;
                      const result = attempt();
                      if (result || ticks >= 30) {
                        clearInterval(poll);
                        resolve({
                          structuredMessages: result ? result.messages : [],
                          title: result ? result.title : document.title,
                          html: document.documentElement.outerHTML,
                        });
                      }
                    }, 500);
                  });
                }
              }, (results) => {
                chrome.tabs.remove(tabId);
                let structuredMessages = [];
                let title = '';
                let html = null;

                if (results && results[0] && results[0].result) {
                  const r = results[0].result;
                  structuredMessages = r.structuredMessages || [];
                  title = r.title || '';
                  html = r.html || null;
                }

                console.log(`Extraction done: ${structuredMessages.length} structured msgs, html length: ${html ? html.length : 0}`);
                sendResponse({ html, structuredMessages, title, success: !!html || structuredMessages.length > 0 });
              });
            }, 2000); // 2s initial wait for page JS to execute
          }
        };

        chrome.tabs.onUpdated.addListener(listener);
      });

      return true; // async response
    }
  }
);
