chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (request.action === 'fetch_html' && request.url) {
      console.log('Received request to fetch:', request.url);

      // Open in background (hidden) - do NOT make active so user isn't interrupted
      chrome.tabs.create({ url: request.url, active: false }, (tab) => {
        const tabId = tab.id;

        const listener = (updatedTabId, info) => {
          if (updatedTabId === tabId && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);

            // Give inline scripts time to run (window.__remixContext is set by inline scripts)
            // then poll until we get data or timeout
            let pollCount = 0;
            const maxPolls = 40; // up to 20 seconds (40 x 500ms)

            const tryExtract = () => {
              chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                  // ── Helper: deep-search an object for chat messages ──────────
                  function deepFindMessages(obj, found, depth) {
                    if (!obj || depth > 14 || found.length > 1000) return;
                    if (Array.isArray(obj)) {
                      obj.forEach(item => deepFindMessages(item, found, depth + 1));
                      return;
                    }
                    if (typeof obj !== 'object') return;

                    // ChatGPT: { author: { role }, content: { parts: [...] } }
                    if (obj.author && obj.author.role && obj.content && Array.isArray(obj.content.parts)) {
                      const role = obj.author.role;
                      if (role === 'user' || role === 'assistant') {
                        const text = obj.content.parts
                          .filter(p => typeof p === 'string' || (p && typeof p.text === 'string'))
                          .map(p => typeof p === 'string' ? p : p.text)
                          .join('\n').trim();
                        if (text) found.push({ role, content: text });
                        return;
                      }
                    }

                    // Alternative: { role, content: { parts } }
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

                  // ── 1. window.__remixContext (ChatGPT RSC/Remix) ─────────────
                  function tryRemixContext() {
                    try {
                      const ctx = window.__remixContext;
                      if (!ctx) return null;
                      const loaderData = ctx.state && ctx.state.loaderData;
                      if (!loaderData) return null;
                      const msgs = [];
                      for (const key of Object.keys(loaderData)) {
                        deepFindMessages(loaderData[key], msgs, 0);
                        if (msgs.length > 0) break;
                      }
                      if (msgs.length > 0) return { title: document.title, messages: msgs };
                    } catch (e) {}
                    return null;
                  }

                  // ── 2. DOM extraction ────────────────────────────────────────
                  function tryDom() {
                    const msgs = [];
                    const title = document.title;

                    // ChatGPT
                    const els = document.querySelectorAll('[data-message-author-role]');
                    if (els.length > 0) {
                      els.forEach(el => {
                        const role = el.getAttribute('data-message-author-role');
                        if (role !== 'user' && role !== 'assistant') return;
                        const inner = el.querySelector('.markdown, .prose, [class*="prose"]') || el;
                        const text = inner.innerText.trim();
                        if (text) msgs.push({ role, content: text });
                      });
                      if (msgs.length > 0) return { title, messages: msgs };
                    }

                    // Claude
                    const claudeEls = document.querySelectorAll('.font-claude-message, .font-user-message');
                    if (claudeEls.length > 0) {
                      claudeEls.forEach(el => {
                        const role = el.classList.contains('font-user-message') ? 'user' : 'assistant';
                        const text = el.innerText.trim();
                        if (text) msgs.push({ role, content: text });
                      });
                      if (msgs.length > 0) return { title, messages: msgs };
                    }

                    // Gemini
                    const geminiEls = document.querySelectorAll('user-query, model-response');
                    if (geminiEls.length > 0) {
                      geminiEls.forEach(el => {
                        const role = el.tagName.toLowerCase() === 'user-query' ? 'user' : 'assistant';
                        const text = el.innerText.trim();
                        if (text) msgs.push({ role, content: text });
                      });
                      if (msgs.length > 0) return { title, messages: msgs };
                    }

                    // DeepSeek
                    const dsAll = [...document.querySelectorAll('[class*="userMessage"], [class*="user-message"], [class*="ds-markdown"], [class*="assistantMessage"]')];
                    if (dsAll.length > 0) {
                      dsAll.forEach(el => {
                        const cls = (el.className || '').toLowerCase();
                        const role = cls.includes('user') ? 'user' : 'assistant';
                        const text = el.innerText.trim();
                        if (text) msgs.push({ role, content: text });
                      });
                      if (msgs.length > 0) return { title, messages: msgs };
                    }

                    return null;
                  }

                  // ── 3. Script tag Uint8Array scanning ───────────────────────
                  function tryScripts() {
                    const msgs = [];
                    const title = document.title;
                    for (const s of document.querySelectorAll('script')) {
                      const text = s.textContent || '';
                      if (!text.includes('Uint8Array') && !text.includes('"role"')) continue;
                      if (text.length > 5000000) continue;

                      const re = /new\s+Uint8Array\(\s*\[([\d,\s]+)\]\s*\)/g;
                      let m;
                      while ((m = re.exec(text)) !== null) {
                        try {
                          const bytes = m[1].split(',').map(n => parseInt(n.trim(), 10));
                          const str = new TextDecoder().decode(new Uint8Array(bytes));
                          deepFindMessages(JSON.parse(str), msgs, 0);
                        } catch (e) {}
                      }
                      if (msgs.length > 0) return { title, messages: msgs };
                    }
                    return null;
                  }

                  const remix = tryRemixContext();
                  if (remix && remix.messages.length > 0) return { done: true, result: remix };

                  const dom = tryDom();
                  if (dom && dom.messages.length > 0) return { done: true, result: dom };

                  const scripts = tryScripts();
                  if (scripts && scripts.messages.length > 0) return { done: true, result: scripts };

                  return { done: false };
                }
              }, (results) => {
                const outcome = results && results[0] && results[0].result;

                if (outcome && outcome.done) {
                  // Success — close tab and respond
                  chrome.tabs.remove(tabId);
                  const r = outcome.result;
                  console.log(`Extracted ${r.messages.length} messages from "${r.title}"`);
                  sendResponse({
                    html: null,
                    structuredMessages: r.messages,
                    title: r.title,
                    success: true,
                  });
                } else {
                  pollCount++;
                  if (pollCount < maxPolls) {
                    // Not ready yet — retry after 500ms
                    setTimeout(tryExtract, 500);
                  } else {
                    // Timed out — grab raw HTML as last resort
                    chrome.scripting.executeScript({
                      target: { tabId: tabId },
                      func: () => document.documentElement.outerHTML,
                    }, (htmlResults) => {
                      chrome.tabs.remove(tabId);
                      const html = htmlResults && htmlResults[0] && htmlResults[0].result;
                      console.warn('Extraction timed out, falling back to raw HTML');
                      sendResponse({
                        html: html || null,
                        structuredMessages: [],
                        title: document.title || '',
                        success: !!html,
                      });
                    });
                  }
                }
              });
            };

            // Start polling after a short initial delay (let inline scripts run)
            setTimeout(tryExtract, 1500);
          }
        };

        chrome.tabs.onUpdated.addListener(listener);
      });

      return true; // async response
    }
  }
);
