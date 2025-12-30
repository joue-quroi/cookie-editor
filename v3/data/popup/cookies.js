'use strict';

const cookies = {};

cookies.all = domain => chrome.cookies.getAll({domain});

cookies.replace = async (url, oldC, newC) => {
  oldC.path = oldC.path || '/';
  newC.path = newC.path || '/';

  const allowed = [
    'url', 'name', 'value', 'domain', 'path', 'secure',
    'httpOnly', 'sameSite', 'expirationDate', 'storeId', 'hostOnly'
  ];
  Object.keys(newC).filter(key => allowed.indexOf(key) === -1).forEach(key => delete newC[key]);

  // make sure path starts with "/" and is valid
  const o = new URL(newC.path, url);
  Object.assign(newC, {
    url: o.href,
    path: o.pathname
  });

  // Only delete the old cookie if it has a different name than the new one
  // If they have the same name, setting the new cookie already replaced it
  // oldC.replace === false for all new or imported cookies -> no old cookie deletion
  if ((oldC.name !== newC.name || oldC.path !== newC.path) && (oldC.replace !== false)) {
    await chrome.cookies.remove({
      name: oldC.name,
      url: (new URL(oldC.path, url)).href
    });
  }

  const cookie = await chrome.cookies.set(newC);
  if (cookie) {
    return cookie;
  }
  throw new Error('This cookie is deleted (expired)');
};

cookies.remove = (url, cookie) => {
  cookie.path = cookie.path || '/';
  const o = new URL(cookie.path, url);

  return chrome.cookies.remove({
    name: cookie.name,
    url: o.href
  });
};
