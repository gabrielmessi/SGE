
(function () {
  var KEY = 'adega-estoque-v1';
  var S = { products: [], log: [], cashDays: {} };
  var editId = null;
  var moveId = null;
  var delArmed = false;

  var brl = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  var $ = function (id) {
    return document.getElementById(id);
  };

  var TYPE = {
    in: 'Compra',
    out: 'Venda',
    loss: 'Perda',
    expense: 'Despesa'
  };

  var PAY = {
    pix: 'Pix',
    dinheiro: 'Dinheiro',
    debito: 'Débito',
    credito: 'Crédito',
    boleto: 'Boleto'
  };

  function uid() {
    return Date.now().toString(36) +
      Math.random().toString(36).slice(2, 6);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c];
    });
  }

  function dateKey(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function selectedDate() {
    return $('fDate').value || dateKey(new Date());
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch (e) {
      alert('Não foi possível salvar os dados neste navegador.');
    }
  }

  function load() {
    var raw = null;

    try {
      raw = localStorage.getItem(KEY);
    } catch (e) {}

    if (raw) {
      try {
        var d = JSON.parse(raw);

        if (d && Array.isArray(d.products)) {
          S = {
            products: d.products,
            log: Array.isArray(d.log) ? d.log : [],
            cashDays: d.cashDays &&
              typeof d.cashDays === 'object'
              ? d.cashDays
              : {}
          };
          return;
        }
      } catch (e) {}
    }

    S.products = [
      {
        id: uid(),
        name: 'Malbec Reserva 750 ml',
        cat: 'Vinho tinto',
        qty: 18,
        min: 8,
        cost: 42,
        price: 79.9
      },
      {
        id: uid(),
        name: 'Sauvignon Blanc 750 ml',
        cat: 'Vinho branco',
        qty: 5,
        min: 8,
        cost: 36,
        price: 64.9
      },
      {
        id: uid(),
        name: 'Espumante Brut 750 ml',
        cat: 'Espumante',
        qty: 12,
        min: 6,
        cost: 48,
        price: 89
      },
      {
        id: uid(),
        name: 'Cerveja IPA 355 ml',
        cat: 'Cerveja',
        qty: 96,
        min: 48,
        cost: 7.5,
        price: 14
      },
      {
        id: uid(),
        name: 'Gin London Dry 750 ml',
        cat: 'Destilado',
        qty: 0,
        min: 4,
        cost: 85,
        price: 149
      }
    ];

    S.cashDays = {};
  }

  function status(p) {
    return p.qty <= 0
      ? 'out'
      : (p.qty <= p.min ? 'low' : 'ok');
  }

  var LABEL = {
    ok: 'Normal',
    low: 'Repor',
    out: 'Esgotado'
  };

  function renderFinance() {
    var key = selectedDate();
    var parts = key.split('-').map(Number);

    var start = new Date(
      parts[0],
      parts[1] - 1,
      parts[2]
    ).getTime();

    var end = new Date(
      parts[0],
      parts[1] - 1,
      parts[2] + 1
    ).getTime();

    var rev = 0;
    var buy = 0;
    var cogs = 0;
    var loss = 0;
    var expenses = 0;

    var cashSales = 0;
    var cashPurchases = 0;
    var cashExpenses = 0;

    S.log.forEach(function (m) {
      if (!m.t || m.t < start || m.t >= end) {
        return;
      }

      var total = Number(m.total) || 0;
      var cost = (Number(m.cost) || 0) *
        (Number(m.qty) || 0);

      if (m.type === 'in') {
        buy += total;

        if (m.pay === 'dinheiro') {
          cashPurchases += total;
        }
      } else if (m.type === 'out') {
        rev += total;
        cogs += cost;

        if (m.pay === 'dinheiro') {
          cashSales += total;
        }
      } else if (m.type === 'loss') {
        loss += cost;
      } else if (m.type === 'expense') {
        expenses += total;

        if (m.pay === 'dinheiro') {
          cashExpenses += total;
        }
      }
    });

    var profit = rev - cogs;
    var day = S.cashDays[key] || {};
    var opening = Number(day.opening) || 0;

    var expected = opening +
      cashSales -
      cashPurchases -
      cashExpenses;

    $('fiRev').textContent = brl.format(rev);
    $('fiBuy').textContent = brl.format(buy);
    $('fiProfit').textContent = brl.format(profit);

    $('fiProfit').style.color =
      profit < 0 ? 'var(--bad)' : '';

    $('fiLoss').textContent = brl.format(loss);
    $('fiExpenses').textContent = brl.format(expenses);

    $('cashSales').textContent = brl.format(cashSales);
    $('cashPurchases').textContent =
      brl.format(cashPurchases);

    $('cashExpenses').textContent =
      brl.format(cashExpenses);

    $('cashExpected').textContent =
      brl.format(expected);

    $('cashOpen').value =
      day.opening == null ? '' : day.opening;

    if (day.closing != null && day.closing !== '') {
      var diff = Number(day.closing) - expected;

      $('cashClose').value = day.closing;

      $('cashDifference').textContent =
        (diff > 0 ? '+' : '') + brl.format(diff);

      $('cashDifference').style.color =
        diff === 0 ? 'var(--ok)' : 'var(--bad)';

      $('cashCloseStatus').textContent =
        diff === 0
          ? 'Caixa conferido: sem diferença.'
          : 'Confira a diferença e as movimentações.';
    } else {
      $('cashClose').value = '';

      $('cashDifference').textContent =
        'Ainda não fechado';

      $('cashDifference').style.color = '';

      $('cashCloseStatus').textContent =
        'Informe o dinheiro contado na gaveta para comparar.';
    }

    $('cashDayLabel').textContent =
      key.split('-').reverse().join('/');
  }

  function render() {
    var q = $('q').value.trim().toLowerCase();
    var cf = $('catFilter').value;
    var sf = $('statusFilter').value;

    var cats = [];
    var seen = {};

    S.products.forEach(function (p) {
      if (!seen[p.cat]) {
        seen[p.cat] = true;
        cats.push(p.cat);
      }
    });

    cats.sort();

    $('catFilter').innerHTML =
      '<option value="">Todas as categorias</option>' +
      cats.map(function (c) {
        return '<option value="' + esc(c) + '"' +
          (c === cf ? ' selected' : '') + '>' +
          esc(c) + '</option>';
      }).join('');

    $('cats').innerHTML = cats.map(function (c) {
      return '<option value="' + esc(c) + '"></option>';
    }).join('');

    var list = S.products.filter(function (p) {
      if (q && p.name.toLowerCase().indexOf(q) < 0) {
        return false;
      }

      if (cf && p.cat !== cf) {
        return false;
      }

      var st = status(p);

      if (sf === 'low' && st === 'ok') {
        return false;
      }

      if (sf === 'ok' && st !== 'ok') {
        return false;
      }

      return true;
    }).sort(function (a, b) {
      return a.name.localeCompare(b.name, 'pt-BR');
    });

    $('rows').innerHTML = list.map(function (p) {
      var st = status(p);

      var pct = p.min > 0
        ? Math.min(100, Math.round(
            p.qty / (p.min * 2) * 100
          ))
        : (p.qty > 0 ? 100 : 0);

      var margin = p.price > 0
        ? Math.round(
            (p.price - p.cost) / p.price * 100
          ) + '%'
        : '—';

      return '<tr data-id="' + esc(p.id) + '">' +
        '<td><strong>' + esc(p.name) +
        '</strong><div class="cat">' +
        esc(p.cat) + '</div></td>' +

        '<td><div class="level">' +
        '<strong>' + p.qty + '</strong>' +
        '<div class="track"><div class="fill ' + st +
        '" style="width:' + pct + '%"></div></div>' +
        '<span class="tag ' + st + '">' +
        LABEL[st] + '</span></div></td>' +

        '<td class="n">' + p.min + '</td>' +
        '<td class="n">' + brl.format(p.price) + '</td>' +
        '<td class="n">' + margin + '</td>' +

        '<td><div class="acts">' +
        '<button type="button" data-act="move">Movimentar</button>' +
        '<button type="button" data-act="edit">Editar</button>' +
        '</div></td></tr>';
    }).join('');

    $('empty').hidden = list.length > 0;

    var units = 0;
    var val = 0;
    var low = 0;

    S.products.forEach(function (p) {
      units += Number(p.qty) || 0;
      val += (Number(p.qty) || 0) *
        (Number(p.cost) || 0);

      if (status(p) !== 'ok') {
        low++;
      }
    });

    $('stUnits').textContent =
      units.toLocaleString('pt-BR');

    $('stValue').textContent = brl.format(val);
    $('stLow').textContent = low;

    $('stLowBox').classList.toggle('alert', low > 0);

    renderFinance();

    var key = selectedDate();
    var parts = key.split('-').map(Number);

    var start = new Date(
      parts[0],
      parts[1] - 1,
      parts[2]
    ).getTime();

    var end = new Date(
      parts[0],
      parts[1] - 1,
      parts[2] + 1
    ).getTime();

    var dayLog = S.log.filter(function (m) {
      return m.t >= start && m.t < end;
    });

    $('log').innerHTML = dayLog.length
      ? dayLog.slice(0, 50).map(function (m) {
          var d = new Date(m.t).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });

          var sign = m.type === 'expense'
            ? ''
            : (m.type === 'in' ? '+' : '−');

          var money = m.type === 'loss'
            ? brl.format(
                (Number(m.cost) || 0) *
                (Number(m.qty) || 0)
              )
            : brl.format(Number(m.total) || 0);

          var meta = [
            TYPE[m.type] || '',
            m.pay ? PAY[m.pay] || m.pay : '',
            m.note
          ].filter(Boolean).map(esc).join(' · ');

          return '<li><span>' +
            (m.type === 'expense'
              ? '<strong>Despesa</strong> '
              : '<strong>' + sign + m.qty +
                '</strong> ') +
            esc(m.name) +
            (meta ? ' <small>· ' + meta + '</small>' : '') +
            '</span><span class="amt">' +
            money + ' <small>' + d + '</small>' +
            '</span></li>';
        }).join('')
      : '<li><small>Nenhuma movimentação registrada nesta data.</small></li>';
  }

  function find(id) {
    return S.products.filter(function (p) {
      return p.id === id;
    })[0];
  }

  function openProduct(id) {
    editId = id;
    delArmed = false;

    $('pErr').textContent = '';

    var p = id ? find(id) : null;

    $('pTitle').textContent =
      p ? 'Editar produto' : 'Novo produto';

    $('fName').value = p ? p.name : '';
    $('fCat').value = p ? p.cat : '';
    $('fQty').value = p ? p.qty : 0;
    $('fQty').disabled = !!p;
    $('fMin').value = p ? p.min : 6;
    $('fCost').value = p ? p.cost : 0;
    $('fPrice').value = p ? p.price : 0;

    $('delBtn').hidden = !p;
    $('delBtn').textContent = 'Excluir produto';

    $('pDlg').showModal();
    $('fName').focus();
  }

  function suggestUnit() {
    var p = find(moveId);
    if (!p) return;

    var type = $('mType').value;

    $('mUnit').value = type === 'in'
      ? p.cost
      : (type === 'out' ? p.price : p.cost);

    $('mUnit').disabled = type === 'loss';
    $('mPayBox').hidden = type === 'loss';

    calcTotal();
  }

  function calcTotal() {
    var qty = parseInt($('mQty').value, 10) || 0;
    var unit = parseFloat($('mUnit').value) || 0;

    $('mTotal').textContent = brl.format(qty * unit);

    $('mTotalLabel').textContent =
      $('mType').value === 'loss'
        ? 'Custo da perda'
        : 'Total';
  }

  $('addBtn').onclick = function () {
    openProduct(null);
  };

  $('pCancel').onclick = function () {
    $('pDlg').close();
  };

  $('mCancel').onclick = function () {
    $('mDlg').close();
  };

  $('expenseCancel').onclick = function () {
    $('expenseDlg').close();
  };

  $('expenseBtn').onclick = function () {
    $('expenseErr').textContent = '';
    $('expenseAmount').value = '';
    $('expenseNote').value = '';
    $('expensePay').value = 'dinheiro';

    $('expenseDlg').showModal();
    $('expenseAmount').focus();
  };

  $('mType').addEventListener('change', suggestUnit);
  $('mQty').addEventListener('input', calcTotal);
  $('mUnit').addEventListener('input', calcTotal);

  $('fDate').addEventListener('change', render);

  $('todayBtn').onclick = function () {
    $('fDate').value = dateKey(new Date());
    render();
  };

  $('saveOpening').onclick = function () {
    var value = parseFloat($('cashOpen').value);

    if (!Number.isFinite(value) || value < 0) {
      alert('Informe um fundo inicial válido.');
      return;
    }

    var key = selectedDate();

    S.cashDays[key] = S.cashDays[key] || {};
    S.cashDays[key].opening =
      Math.round(value * 100) / 100;

    save();
    renderFinance();
  };

  $('saveClosing').onclick = function () {
    var value = parseFloat($('cashClose').value);

    if (!Number.isFinite(value) || value < 0) {
      alert('Informe o dinheiro contado no caixa.');
      return;
    }

    var key = selectedDate();

    S.cashDays[key] = S.cashDays[key] || {};
    S.cashDays[key].closing =
      Math.round(value * 100) / 100;

    save();
    renderFinance();
  };

  $('pForm').onsubmit = function (e) {
    e.preventDefault();

    var name = $('fName').value.trim();
    var cat = $('fCat').value.trim();
    var qty = Math.max(
      0,
      parseInt($('fQty').value, 10) || 0
    );
    var min = Math.max(
      0,
      parseInt($('fMin').value, 10) || 0
    );
    var cost = Math.max(
      0,
      parseFloat($('fCost').value) || 0
    );
    var price = Math.max(
      0,
      parseFloat($('fPrice').value) || 0
    );

    if (!name || !cat) {
      $('pErr').textContent =
        'Preencha o nome e a categoria.';
      return;
    }

    if (price < cost) {
      $('pErr').textContent =
        'O preço de venda está abaixo do custo. Revise os valores.';
      return;
    }

    if (editId) {
      var p = find(editId);

      if (!p) {
        $('pErr').textContent =
          'Não foi possível encontrar esse produto.';
        return;
      }

      p.name = name;
      p.cat = cat;
      p.min = min;
      p.cost = cost;
      p.price = price;
    } else {
      S.products.push({
        id: uid(),
        name: name,
        cat: cat,
        qty: qty,
        min: min,
        cost: cost,
        price: price
      });
    }

    save();
    render();
    $('pDlg').close();
  };

  $('delBtn').onclick = function () {
    if (!delArmed) {
      delArmed = true;
      $('delBtn').textContent = 'Confirmar exclusão';
      return;
    }

    S.products = S.products.filter(function (p) {
      return p.id !== editId;
    });

    save();
    render();
    $('pDlg').close();
  };

  $('rows').onclick = function (e) {
    var button = e.target.closest('button[data-act]');
    if (!button) return;

    var row = button.closest('tr');
    if (!row) return;

    var id = row.getAttribute('data-id');

    if (button.getAttribute('data-act') === 'edit') {
      openProduct(id);
      return;
    }

    moveId = id;

    var p = find(id);
    if (!p) return;

    $('mTitle').textContent = p.name;
    $('mType').value = p.qty > 0 ? 'out' : 'in';
    $('mQty').value = 1;
    $('mNote').value = '';
    $('mErr').textContent = '';
    $('mPay').value = 'pix';

    suggestUnit();

    $('mDlg').showModal();
    $('mQty').focus();
  };

  $('mForm').onsubmit = function (e) {
    e.preventDefault();

    var p = find(moveId);
    if (!p) {
      $('mErr').textContent = 'Produto não encontrado.';
      return;
    }

    var type = $('mType').value;
    var qty = parseInt($('mQty').value, 10);
    var unit = type === 'loss'
      ? 0
      : parseFloat($('mUnit').value);

    if (!qty || qty < 1) {
      $('mErr').textContent =
        'Informe uma quantidade maior que zero.';
      return;
    }

    if (
      type !== 'loss' &&
      (!Number.isFinite(unit) || unit < 0)
    ) {
      $('mErr').textContent =
        'Informe um valor unitário válido.';
      return;
    }

    if (type !== 'in' && p.qty === 0) {
      $('mErr').textContent =
        'Produto esgotado; não há unidades em estoque para ' +
        (type === 'out' ? 'vender' : 'registrar como perda') + '.';
      return;
    }

    if (type !== 'in' && qty > p.qty) {
      $('mErr').textContent =
        'Só há ' + p.qty + ' em estoque. Reduza a quantidade.';
      return;
    }

    if (
      type === 'out' &&
      unit < p.cost &&
      !confirm(
        'Este valor está abaixo do custo (' +
        brl.format(p.cost) +
        '). Registrar a venda mesmo assim?'
      )
    ) {
      return;
    }

    p.qty += type === 'in' ? qty : -qty;

    S.log.unshift({
      t: Date.now(),
      name: p.name,
      type: type,
      qty: qty,
      note: $('mNote').value.trim(),
      unit: unit,
      total: Math.round(unit * qty * 100) / 100,
      cost: p.cost,
      pay: type === 'loss' ? '' : $('mPay').value
    });

    S.log = S.log.slice(0, 2000);

    save();
    render();
    $('mDlg').close();
  };

  $('expenseForm').onsubmit = function (e) {
    e.preventDefault();

    var amount = parseFloat($('expenseAmount').value);
    var note = $('expenseNote').value.trim();
    var pay = $('expensePay').value;

    if (!Number.isFinite(amount) || amount <= 0) {
      $('expenseErr').textContent =
        'Informe uma despesa maior que zero.';
      return;
    }

    S.log.unshift({
      t: Date.now(),
      name: note || 'Despesa',
      type: 'expense',
      qty: 1,
      note: note,
      total: Math.round(amount * 100) / 100,
      unit: amount,
      cost: 0,
      pay: pay
    });

    S.log = S.log.slice(0, 2000);

    save();
    render();
    $('expenseDlg').close();
  };

  ['q', 'catFilter', 'statusFilter'].forEach(function (id) {
    $(id).addEventListener('input', render);
  });

  $('fDate').value = dateKey(new Date());

  load();
  render();
})();
