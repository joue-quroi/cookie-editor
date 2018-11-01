'use strict';

// context me
{
  const once = () => {
    chrome.contextMenus.create({
      id: 'search',
      title: 'Search Cookies by Domain',
      contexts: ['browser_action']
    });
    chrome.contextMenus.create({
      id: 'open',
      title: 'Open Cookie Editor in new Tab',
      contexts: ['browser_action']
    });
  }
  chrome.runtime.onStartup.addListener(once);
  chrome.runtime.onInstalled.addListener(once);
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'search') {
    const search = window.prompt('Please enter the domain (e.g.: www.google.com)');
    if (search) {
      chrome.tabs.create({
        url: '/data/popup/index.html?search=' + encodeURIComponent(search)
      });
    }
  }
  else if (info.menuItemId === 'open') {
    chrome.tabs.create({
      url: '/data/popup/index.html?tabId=' + encodeURIComponent(tab.id)
    });
  }
});
// FAQs & Feedback
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({
    'version': null,
    'faqs': navigator.userAgent.indexOf('Firefox') === -1,
    'last-update': 0
  }, prefs => {
    const version = chrome.runtime.getManifest().version;

    if (prefs.version ? (prefs.faqs && prefs.version !== version) : true) {
      const now = Date.now();
      const doUpdate = (now - prefs['last-update']) / 1000 / 60 / 60 / 24 > 30;
      chrome.storage.local.set({
        version,
        'last-update': doUpdate ? Date.now() : prefs['last-update']
      }, () => {
        // do not display the FAQs page if last-update occurred less than 30 days ago.
        if (doUpdate) {
          const p = Boolean(prefs.version);
          chrome.tabs.create({
            url: chrome.runtime.getManifest().homepage_url + '?version=' + version +
              '&type=' + (p ? ('upgrade&p=' + prefs.version) : 'install'),
            active: p === false
          });
        }
      });
    }
  });

  {
    const {name, version} = chrome.runtime.getManifest();
    chrome.runtime.setUninstallURL(
      chrome.runtime.getManifest().homepage_url + '?rd=feedback&name=' + name + '&version=' + version
    );
  }
});

