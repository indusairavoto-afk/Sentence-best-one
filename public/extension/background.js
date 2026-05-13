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
            
            // Wait slightly for dynamic React content to render
            setTimeout(() => {
              chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => document.documentElement.outerHTML
              }, (results) => {
                let html = null;
                if (results && results[0] && results[0].result) {
                  html = results[0].result;
                }
                
                // Close the tab
                chrome.tabs.remove(tabId);
                
                // Send response back
                sendResponse({ html: html, success: !!html });
              });
            }, 3000); // Wait 3 seconds for content
          }
        };
        
        chrome.tabs.onUpdated.addListener(listener);
      });
      
      // Return true to indicate we will send a response asynchronously
      return true;
    }
  }
);
