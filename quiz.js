/* 7 Deadly Sins Test — question flow, weighted scoring, ranking and result sharing.
   No backend: questions come from questions.json, answers stay in the browser,
   and a shared result is encoded in the URL fragment (#a=...). */
(function () {
  'use strict';

  var ORDER = ['pride', 'greed', 'lust', 'envy', 'gluttony', 'wrath', 'sloth'];

  var qz = document.querySelector('.qz');
  if (!qz) return;

  var stage = qz.querySelector('#qz-stage');
  var fill = qz.querySelector('.qz-fill');
  var count = qz.querySelector('.qz-count');
  var resultPanel = qz.querySelector('.qz-result');
  var introPanel = qz.querySelector('.qz-intro');
  var toastEl = qz.querySelector('.qz-toast');

  var questions = [];
  var copy = {};
  var picks = [];

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  function panels() {
    return [].slice.call(qz.querySelectorAll('.qz-panel'));
  }

  function show(panel) {
    panels().forEach(function (p) { p.classList.toggle('is-active', p === panel); });
  }

  function progress(n) {
    fill.style.width = Math.round(n / questions.length * 100) + '%';
    count.textContent = n;
  }

  function toast(msg) {
    if (toastEl) toastEl.textContent = msg;
  }

  function build() {
    stage.innerHTML = '';
    questions.forEach(function (q, i) {
      var panel = el('div', 'qz-panel qz-q');
      panel.appendChild(el('p', 'qz-meta', 'Question ' + (i + 1) + ' of ' + questions.length));
      panel.appendChild(el('h2', 'qz-q__title', q.prompt));
      var box = el('div', 'qz-opts');
      q.answers.forEach(function (a, j) {
        var b = el('button', 'qz-opt', a.text);
        b.type = 'button';
        b.setAttribute('data-i', String(i));
        b.setAttribute('data-j', String(j));
        box.appendChild(b);
      });
      panel.appendChild(box);
      stage.appendChild(panel);
    });
  }

  function questionPanel(i) {
    return stage.querySelectorAll('.qz-q')[i];
  }

  /* Scores are recomputed from the current picks, so restoring a shared result
     and re-answering cannot double-count. */
  function score() {
    var scores = {};
    ORDER.forEach(function (k) { scores[k] = 0; });
    picks.forEach(function (j, i) {
      var a = questions[i] && questions[i].answers[j];
      if (!a || !a.weights) return;
      ORDER.forEach(function (k) {
        var v = a.weights[k];
        if (typeof v === 'number' && !isNaN(v)) scores[k] += v;
      });
    });
    return scores;
  }

  function ranked(scores) {
    var sum = 0;
    ORDER.forEach(function (k) { sum += scores[k]; });
    var pct = {};
    ORDER.forEach(function (k) { pct[k] = sum ? Math.round(scores[k] / sum * 100) : 0; });
    var sorted = ORDER.map(function (k) { return { k: k, s: scores[k] }; })
      .sort(function (a, b) { return b.s - a.s || ORDER.indexOf(a.k) - ORDER.indexOf(b.k); });
    var acc = 0;
    ORDER.forEach(function (k) { acc += pct[k]; });
    pct[sorted[0].k] += 100 - acc;
    return { pct: pct, sorted: sorted };
  }

  function render() {
    var r = ranked(score());
    var top = r.sorted[0].k;
    var second = r.sorted[1];

    ORDER.forEach(function (k) {
      var li = qz.querySelector('[data-b="' + k + '"]');
      if (!li) return;
      li.querySelector('i').style.width = Math.max(2, r.pct[k]) + '%';
      li.querySelector('.qz-bp').textContent = r.pct[k] + '%';
      li.classList.toggle('is-top', k === top);
    });

    var info = copy[top] || { name: top, roman: '', verdict: '', text: '' };
    qz.querySelector('[data-n]').textContent = info.name;
    qz.querySelector('[data-rn]').textContent = info.roman || '';
    qz.querySelector('[data-v]').textContent = info.verdict || '';
    qz.querySelector('[data-t]').textContent = info.text || '';
    qz.querySelector('[data-s]').textContent =
      'Second strongest: ' + (copy[second.k] ? copy[second.k].name : second.k) + ', at ' + r.pct[second.k] + ' percent.';

    qz.setAttribute('data-result', top);
    progress(questions.length);
    toast('');
    show(resultPanel);
  }

  function answer(i, j) {
    picks[i] = j;
    if (i + 1 < questions.length) {
      progress(i + 1);
      show(questionPanel(i + 1));
    } else {
      render();
    }
  }

  function shareUrl() {
    return location.origin + location.pathname + '#a=' + picks.join(',');
  }

  function share() {
    var text = 'I got ' + (copy[qz.getAttribute('data-result')] || {}).name + ' on the 7 Deadly Sins Test.';
    text += ' Which one is strongest in you?';
    if (navigator.share) {
      navigator.share({ title: '7 Deadly Sins Test', text: text, url: shareUrl() })['catch'](function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text + ' ' + shareUrl()).then(function () {
        toast('Link copied. Anyone who opens it sees this result.');
      }, function () { toast(shareUrl()); });
      return;
    }
    toast(shareUrl());
  }

  function reset() {
    picks = [];
    qz.removeAttribute('data-result');
    progress(0);
    toast('');
    ORDER.forEach(function (k) {
      var li = qz.querySelector('[data-b="' + k + '"]');
      if (!li) return;
      li.querySelector('i').style.width = '';
      li.querySelector('.qz-bp').textContent = '0%';
      li.classList.remove('is-top');
    });
    qz.querySelector('[data-rn]').textContent = '—';
    qz.querySelector('[data-n]').textContent = 'Your result';
    qz.querySelector('[data-v]').textContent = '';
    qz.querySelector('[data-t]').textContent = '';
    qz.querySelector('[data-s]').textContent = '';
    show(questionPanel(0));
  }

  /* A finished test is shareable as #a=1,0,3,... — one answer index per question. */
  function restore() {
    var m = /(?:^|[#&])a=([0-9,\-]+)/.exec(location.hash || '');
    if (!m) return false;
    var parts = m[1].split(',').map(Number);
    if (parts.length !== questions.length) return false;
    var ok = parts.every(function (v, i) {
      return v >= 0 && v < questions[i].answers.length;
    });
    if (!ok) return false;
    picks = parts;
    render();
    toast('Showing a shared result. Start the test to get your own.');
    return true;
  }

  function ready(data) {
    questions = (data && data.questions) || [];
    copy = (data && data.resultCopy) || {};
    if (!questions.length) {
      var p = introPanel && introPanel.querySelector('.qz-p');
      if (p) p.textContent = 'The question bank could not be loaded. Serve this folder over HTTP rather than opening the file directly.';
      return;
    }
    qz.classList.add('is-js');
    picks = [];
    build();
    progress(0);
    if (!restore()) {
      show(introPanel);
    }
  }

  qz.addEventListener('click', function (e) {
    var t = e.target;
    var opt = t.closest ? t.closest('.qz-opt') : null;
    if (opt) {
      answer(parseInt(opt.getAttribute('data-i'), 10), parseInt(opt.getAttribute('data-j'), 10));
      return;
    }
    if (t.closest && (t.closest('.qz-start') || t.closest('.qz-retake'))) {
      reset();
      return;
    }
    if (t.closest && t.closest('.qz-share')) {
      share();
    }
  });

  fetch('questions.json', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('questions.json: HTTP ' + r.status);
      return r.json();
    })
    .then(ready)
    ['catch'](function (err) {
      var p = introPanel && introPanel.querySelector('.qz-p');
      if (p) p.textContent = 'Could not load the question bank (' + err.message + '). Serve this folder over HTTP, e.g. python3 -m http.server 8000.';
      if (window.console) console.error(err);
    });
})();
