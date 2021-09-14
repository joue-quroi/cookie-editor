'use strict';

const notify = message => chrome.notifications.create({
  type: 'basic',
  iconUrl: '/data/icons/48.png',
  title: chrome.runtime.getManifest().name,
  message
});

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
  };
  chrome.runtime.onStartup.addListener(once);
  chrome.runtime.onInstalled.addListener(once);
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'search') {
    let search;
    const next = () => {
      if (search) {
        chrome.tabs.create({
          url: '/data/popup/index.html?search=' + encodeURIComponent(search)
        });
      }
    };
    if (/Firefox/.test(navigator.userAgent)) {
      chrome.tabs.executeScript({
        code: `window.prompt('Please enter the domain (e.g.: www.google.com)')`,
        runAt: 'document_start'
      }, a => {
        if (chrome.runtime.lastError) {
          notify(chrome.runtime.lastError.message);
        }
        else if (a) {
          search = a[0];
          next();
        }
      });
    }
    else {
      search = window.prompt('Please enter the domain (e.g.: www.google.com)');
      next();
    }
  }
  else if (info.menuItemId === 'open') {
    chrome.tabs.create({
      url: '/data/popup/index.html?tabId=' + encodeURIComponent(tab.id)
    });
  }
});

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install'
            });
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
