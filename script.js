(function(){
  var KEY='adega-estoque-v1';
  var S={products:[],log:[]};
  var editId=null,moveId=null,delArmed=false;
  var brl=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
  var $=function(id){return document.getElementById(id)};
  var TYPE={in:'Compra',out:'Venda',loss:'Perda'};
  var PAY={pix:'Pix',dinheiro:'Dinheiro',debito:'Débito',credito:'Crédito',boleto:'Boleto'};

  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){alert('Não foi possível salvar os dados neste navegador. Eles serão perdidos ao fechar a página.')}}
  function load(){
    var raw=null;
    try{raw=localStorage.getItem(KEY)}catch(e){}
    if(raw){try{var d=JSON.parse(raw);if(d&&Array.isArray(d.products)){S={products:d.products,log:Array.isArray(d.log)?d.log:[]};return}}catch(e){}}
    S.products=[
       {id:uid(),name:'Malbec Reserva 750 ml',cat:'Vinho tinto',qty:18,min:8,cost:42,price:79.9},
       {id:uid(),name:'Sauvignon Blanc 750 ml',cat:'Vinho branco',qty:5,min:8,cost:36,price:64.9},
       {id:uid(),name:'Espumante Brut 750 ml',cat:'Espumante',qty:12,min:6,cost:48,price:89},
       {id:uid(),name:'Cerveja IPA 355 ml',cat:'Cerveja',qty:96,min:48,cost:7.5,price:14},
       {id:uid(),name:'Gin London Dry 750 ml',cat:'Destilado',qty:0,min:4,cost:85,price:149}
    ];
  }
  function status(p){return p.qty<=0?'out':(p.qty<=p.min?'low':'ok')}
  var LABEL={ok:'Normal',low:'Repor',out:'Esgotado'};

  function renderFinance(){
    var per=$('fPeriod').value,now=new Date(),since=0;
    if(per==='today')since=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();
    else if(per==='30')since=Date.now()-30*864e5;
    var rev=0,buy=0,cogs=0,loss=0;
    S.log.forEach(function(m){
      if(m.t<since)return;
      var tot=m.total||0,c=(m.cost||0)*m.qty;
      if(m.type==='in')buy+=tot;
      else if(m.type==='out'){rev+=tot;cogs+=c}
      else if(m.type==='loss')loss+=c;
    });
    var profit=rev-cogs;
    $('fiRev').textContent=brl.format(rev);
    $('fiBuy').textContent=brl.format(buy);
    $('fiProfit').textContent=brl.format(profit);
    $('fiProfit').style.color=profit<0?'var(--bad)':'';
    $('fiLoss').textContent=brl.format(loss);
  }

  function render(){
    var q=$('q').value.trim().toLowerCase(),cf=$('catFilter').value,sf=$('statusFilter').value;
    var cats=[],seen={};
    S.products.forEach(function(p){if(!seen[p.cat]){seen[p.cat]=1;cats.push(p.cat)}});
    cats.sort();
    $('catFilter').innerHTML='<option value="">Todas as categorias</option>'+cats.map(function(c){return '<option'+(c===cf?' selected':'')+'>'+esc(c)+'</option>'}).join('');
    $('cats').innerHTML=cats.map(function(c){return '<option value="'+esc(c)+'">' }).join('');

    var list=S.products.filter(function(p){
      if(q&&p.name.toLowerCase().indexOf(q)<0)return false;
      if(cf&&p.cat!==cf)return false;
      var st=status(p);
      if(sf==='low'&&st==='ok')return false;
      if(sf==='ok'&&st!=='ok')return false;
      return true;
    }).sort(function(a,b){return a.name.localeCompare(b.name,'pt-BR')});

    $('rows').innerHTML=list.map(function(p){
      var st=status(p),pct=p.min>0?Math.min(100,Math.round(p.qty/(p.min*2)*100)):(p.qty>0?100:0);
      var margin=p.price>0?Math.round((p.price-p.cost)/p.price*100)+'%':'—';
      return '<tr data-id="'+p.id+'">'+
        '<td><strong>'+esc(p.name)+'</strong><div class="cat">'+esc(p.cat)+'</div></td>'+
        '<td><div class="level"><strong>'+p.qty+'</strong><div class="track"><div class="fill '+st+'" style="width:'+pct+'%"></div></div><span class="tag '+st+'">'+LABEL[st]+'</span></div></td>'+
        '<td class="n">'+p.min+'</td>'+
        '<td class="n">'+brl.format(p.price)+'</td>'+
        '<td class="n">'+margin+'</td>'+
        '<td><div class="acts"><button data-act="move">Movimentar</button><button data-act="edit">Editar</button></div></td></tr>';
    }).join('');
    $('empty').hidden=list.length>0;

    var units=0,val=0,low=0;
    S.products.forEach(function(p){units+=p.qty;val+=p.qty*p.cost;if(status(p)!=='ok')low++});
    $('stUnits').textContent=units.toLocaleString('pt-BR');
    $('stValue').textContent=brl.format(val);
    $('stLow').textContent=low;
    $('stLowBox').classList.toggle('alert',low>0);

    renderFinance();

    $('log').innerHTML=S.log.length?S.log.slice(0,8).map(function(m){
      var d=new Date(m.t).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
      var sign=m.type==='in'?'+':'−';
      var money=m.type==='loss'?(m.cost?brl.format(m.cost*m.qty):''):(m.total!=null?brl.format(m.total):'');
      var meta=[TYPE[m.type]||'',m.pay?PAY[m.pay]:'',m.note].filter(Boolean).map(esc).join(' · ');
      return '<li><span><strong>'+sign+m.qty+'</strong> '+esc(m.name)+(meta?' <small>· '+meta+'</small>':'')+'</span>'+
        '<span class="amt '+(m.type==='out'?'ok':(m.type==='in'?'':'out'))+'">'+money+' <small>'+d+'</small></span></li>';
    }).join(''):'<li><small>Nenhuma movimentação registrada ainda.</small></li>';
  }

  function find(id){return S.products.filter(function(p){return p.id===id})[0]}

  function openProduct(id){
    editId=id;delArmed=false;$('pErr').textContent='';
    var p=id?find(id):null;
    $('pTitle').textContent=p?'Editar produto':'Novo produto';
    $('fName').value=p?p.name:'';$('fCat').value=p?p.cat:'';
    $('fQty').value=p?p.qty:0;$('fQty').disabled=!!p;
    $('fMin').value=p?p.min:6;$('fCost').value=p?p.cost:0;$('fPrice').value=p?p.price:0;
    $('delBtn').hidden=!p;$('delBtn').textContent='Excluir produto';
    $('pDlg').showModal();$('fName').focus();
  }

  // Movimentação: valor unitário sugerido conforme o tipo
  function suggestUnit(){
    var p=find(moveId),t=$('mType').value;
    $('mUnit').value=t==='in'?p.cost:(t==='out'?p.price:p.cost);
    $('mUnit').disabled=(t==='loss');
    $('mPayBox').hidden=(t==='loss');
    calcTotal();
  }
  function calcTotal(){
    var q=parseInt($('mQty').value,10)||0,u=parseFloat($('mUnit').value)||0;
    $('mTotal').textContent=brl.format(q*u);
    $('mTotalLabel').textContent=$('mType').value==='loss'?'Custo da perda':'Total';
  }

  $('addBtn').onclick=function(){openProduct(null)};
  $('pCancel').onclick=function(){$('pDlg').close()};
  $('mCancel').onclick=function(){$('mDlg').close()};
  $('mType').addEventListener('change',suggestUnit);
  $('mQty').addEventListener('input',calcTotal);
  $('mUnit').addEventListener('input',calcTotal);
  $('fPeriod').addEventListener('change',renderFinance);

  $('pForm').onsubmit=function(e){
    e.preventDefault();
    var name=$('fName').value.trim(),cat=$('fCat').value.trim();
    var qty=Math.max(0,parseInt($('fQty').value,10)||0),min=Math.max(0,parseInt($('fMin').value,10)||0);
    var cost=Math.max(0,parseFloat($('fCost').value)||0),price=Math.max(0,parseFloat($('fPrice').value)||0);
    if(!name||!cat){$('pErr').textContent='Preencha o nome e a categoria.';return}
    if(price<cost){$('pErr').textContent='O preço de venda está abaixo do custo. Revise os valores.';return}
    if(editId){var p=find(editId);p.name=name;p.cat=cat;p.min=min;p.cost=cost;p.price=price}
    else{S.products.push({id:uid(),name:name,cat:cat,qty:qty,min:min,cost:cost,price:price})}
    save();render();$('pDlg').close();
  };

  $('delBtn').onclick=function(){
    if(!delArmed){delArmed=true;$('delBtn').textContent='Confirmar exclusão';return}
    S.products=S.products.filter(function(p){return p.id!==editId});
    save();render();$('pDlg').close();
  };

  $('rows').onclick=function(e){
    var b=e.target.closest('button[data-act]');if(!b)return;
    var id=b.closest('tr').getAttribute('data-id');
    if(b.getAttribute('data-act')==='edit'){openProduct(id)}
    else{
      moveId=id;var p=find(id);
      $('mTitle').textContent=p.name;$('mType').value=p.qty>0?'out':'in';$('mQty').value=1;$('mNote').value='';$('mErr').textContent='';
      $('mPay').value='pix';
      suggestUnit();
      $('mDlg').showModal();$('mQty').focus();
    }
  };

  $('mForm').onsubmit=function(e){
    e.preventDefault();
    var p=find(moveId),type=$('mType').value,qty=parseInt($('mQty').value,10);
    var unit=type==='loss'?0:(parseFloat($('mUnit').value));
    if(!qty||qty<1){$('mErr').textContent='Informe uma quantidade maior que zero.';return}
    if(type!=='loss'&&(isNaN(unit)||unit<0)){$('mErr').textContent='Informe um valor unitário válido.';return}
    if(type!=='in'&&p.qty===0){$('mErr').textContent='Produto esgotado; Não há unidades em estoque para '+(type==='out'?'vender':'registrar como perda')+'.';return}
    if(type!=='in'&&qty>p.qty){$('mErr').textContent='Só há '+p.qty+' em estoque. Reduza a quantidade.';return}
    if(type==='out'&&unit<p.cost&&!confirm('Este valor está abaixo do custo ('+brl.format(p.cost)+'). Registrar a venda mesmo assim?'))return;
    p.qty+=type==='in'?qty:-qty;
    S.log.unshift({
      t:Date.now(),name:p.name,type:type,qty:qty,note:$('mNote').value.trim(),
      unit:unit,total:Math.round(unit*qty*100)/100,
      cost:p.cost,                      // custo unitário na hora, para calcular o lucro depois
      pay:type==='loss'?'':$('mPay').value
    });
    S.log=S.log.slice(0,2000);
    save();render();$('mDlg').close();
  };

  ['q','catFilter','statusFilter'].forEach(function(id){$(id).addEventListener('input',render)});

  load();render();
})();
