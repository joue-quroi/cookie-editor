'use strict';

var editor = {
  element: document.getElementById('editor'),
  cookie: {},
  origin: null,
};

editor.update = (cookie, origin = editor.origin) => {
  editor.origin = origin;
  editor.cookie = cookie;
  if (cookie.domain) {
    document.getElementById('domain').value = cookie.domain;
  }
  document.getElementById('name').value = cookie.name || '';
  document.getElementById('path').value = cookie.path || '/';
  document.getElementById('hostOnly').checked = cookie.hostOnly;
  document.getElementById('httpOnly').checked = cookie.httpOnly;
  document.getElementById('secure').checked = cookie.secure;
  document.getElementById('session').checked = cookie.session;
  if (cookie.session === false) {
    document.getElementById('datetime').valueAsNumber = cookie.expirationDate;
  }
  document.getElementById('session').checked = cookie.session;
  document.getElementById('value').value = cookie.value || '';
  document.getElementById('editor').cookie = cookie;
  document.getElementById('session').dispatchEvent(new Event('change', {
    bubbles: true
  }));
};
editor.isChanged = () => {
  const cookie = editor.cookie;
  let changed = false;
  changed = changed || cookie.name !== document.getElementById('name').value;
  changed = changed || cookie.domain !== document.getElementById('domain').value;
  changed = changed || cookie.path !== document.getElementById('path').value;

  const aHostOnly = cookie.hostOnly || cookie.domain === undefined;
  changed = changed || aHostOnly !== document.getElementById('hostOnly').checked;
  changed = changed || cookie.httpOnly !== document.getElementById('httpOnly').checked;
  changed = changed || cookie.secure !== document.getElementById('secure').checked;
  changed = changed || cookie.session !== document.getElementById('session').checked;
  changed = changed || cookie.value !== document.getElementById('value').value;
  if (document.getElementById('session').checked === false) {
    changed = changed || Math.round(cookie.expirationDate) !== document.getElementById('datetime').valueAsNumber;
  }
  return changed;
};
editor.reset = c => document.getElementById('reset').addEventListener('click', c);
editor.save = c => document.getElementById('editor').addEventListener('submit', e => {
  e.preventDefault();
  c();
});
editor.remove = c => document.getElementById('remove').addEventListener('click', c);

editor.toObject = () => {
  const obj = {
    name: document.getElementById('name').value,
    domain: document.getElementById('domain').value,
    path: document.getElementById('path').value,
    httpOnly: document.getElementById('httpOnly').checked,
    secure: document.getElementById('secure').checked,
    value: document.getElementById('value').value
  };
  if (document.getElementById('hostOnly').checked) {
    delete obj.domain;
  }
  const session = document.getElementById('session').checked;
  if (session === false) {
    obj.expirationDate = document.getElementById('datetime').valueAsNumber;
  }
  return obj;
};

editor.attr = (obj, ...ids) => ids.forEach(id => Object.assign(document.getElementById(id), obj));

// disable datetime element when not applicable
document.getElementById('session').addEventListener('change', ({target}) => {
  document.getElementById('datetime').disabled = target.checked;
});
{
  const a = () => {
    const edited = editor.isChanged();
    editor.element.dataset.edited = edited;
    editor.attr({
      disabled: edited === false
    }, 'save', 'reset');
  };
  document.getElementById('editor').addEventListener('change', a);
  document.getElementById('editor').addEventListener('input', a);
}
