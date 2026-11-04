'use strict';
(()=>{
  // Loads only when the barista requests QR rewards. No timers or Supabase polling.
  let camera=null,busy=false;
  function el(tag,attrs={},children=[]){
    const e=document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{if(k==='text')e.textContent=v;else e.setAttribute(k,v);});
    for(const child of children)e.append(child);
    return e;
  }
  const css=el('style',{text:`
    #kbrQrOverlay{position:fixed;inset:0;z-index:10000;background:rgba(25,15,10,.76);display:none;align-items:center;justify-content:center;padding:14px}
    #kbrQrOverlay.open{display:flex}
    .kbr-qr-sheet{width:min(440px,100%);background:#fffaf5;color:#38281e;border-radius:18px;padding:20px;max-height:94dvh;overflow:auto}
    .kbr-qr-head{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:12px}
    .kbr-qr-head h2{font-size:1.2rem;margin:0}
    .kbr-qr-close{font-size:1.6rem;background:transparent;border:0}
    .kbr-qr-sheet label{display:block;font-size:.85rem;font-weight:750;margin:12px 0}
    .kbr-qr-sheet input{box-sizing:border-box;display:block;width:100%;padding:12px;border:1px solid #d8c6b3;border-radius:10px;font-size:1rem;margin-top:5px}
    .kbr-qr-sheet button.kbr-qr-btn{background:#65432d;color:#fff;border:0;border-radius:11px;padding:12px;font-size:.9rem;font-weight:bold;width:100%;margin:5px 0}
    #kbrQrVideo{min-height:0;overflow:hidden}
    #kbrQrMessage{font-size:.85rem;line-height:1.45;margin:10px 0}
    .kbr-qr-help{font-size:.8rem;color:#716052}
  `});
  document.head.append(css);
  const overlay=el('div',{id:'kbrQrOverlay',role:'dialog','aria-modal':'true','aria-label':'Credit KBR customer points'});
  const sheet=el('div',{class:'kbr-qr-sheet'});
  const header=el('div',{class:'kbr-qr-head'},[
    el('h2',{text:'🎟 KBR Rewards QR'}),
    el('button',{type:'button',class:'kbr-qr-close','aria-label':'Close rewards scanner',text:'×'})
  ]);
  const receipt=el('input',{id:'kbrQrReceipt',type:'text',inputmode:'numeric',placeholder:'Paid receipt number',autocomplete:'off'});
  const token=el('input',{id:'kbrQrToken',type:'text',placeholder:'Scan QR or paste customer code',autocomplete:'off'});
  const scan=el('button',{type:'button',class:'kbr-qr-btn',text:'📷 Scan Customer QR'});
  const credit=el('button',{type:'button',class:'kbr-qr-btn',text:'Credit Points to Customer'});
  const msg=el('p',{id:'kbrQrMessage',role:'status',text:'Only a paid, completed receipt can earn points. Each receipt can earn once.'});
  const video=el('div',{id:'kbrQrVideo'});
  sheet.append(header,
    el('p',{class:'kbr-qr-help',text:'After completing payment, enter the POS receipt number and scan the customer’s personal QR from My Account.'}),
    el('label',{text:'POS receipt number'},[receipt]),
    el('label',{text:'Customer rewards QR code'},[token]),
    scan,video,credit,msg);
  overlay.append(sheet);document.body.append(overlay);
  async function stopCamera(){
    const active=camera;camera=null;
    if(active){try{await active.stop();}catch{}try{await active.clear();}catch{}}
    video.replaceChildren();
  }
  function close(){
    overlay.classList.remove('open');
    stopCamera();
  }
  function open(){
    const current=window.currentReceipt;
    receipt.value=String(current?.no||'').replace(/[^0-9]/g,'');
    token.value='';msg.textContent='Scan the customer QR for a paid, completed order.';
    overlay.classList.add('open');
    receipt.focus();
  }
  header.lastChild.onclick=close;
  overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('open'))close();});
  function loadScanner(){
    if(window.Html5Qrcode)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const script=el('script',{src:'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js'});
      script.onload=()=>window.Html5Qrcode?resolve():reject(Error('Scanner did not load'));
      script.onerror=()=>reject(Error('Camera scanner unavailable. Enter the customer code manually.'));
      document.head.append(script);
    });
  }
  scan.onclick=async()=>{
    if(camera){await stopCamera();scan.textContent='📷 Scan Customer QR';return;}
    msg.textContent='Requesting camera access…';
    try{
      await loadScanner();
      const scanner=new window.Html5Qrcode('kbrQrVideo');
      camera=scanner;
      await scanner.start({facingMode:'environment'},{fps:8,qrbox:{width:220,height:220}},async value=>{
        if(!String(value).startsWith('KBR-CUSTOMER:'))return;
        token.value=value;
        msg.textContent='Customer QR read. Credit the completed order when ready.';
        scan.textContent='📷 Scan Customer QR';
        await stopCamera();
      },()=>{});
      scan.textContent='Stop Camera';
      msg.textContent='Point the camera at the customer’s KBR QR.';
    }catch(error){
      await stopCamera();scan.textContent='📷 Scan Customer QR';
      msg.textContent=error?.message||'Camera unavailable. Paste the QR code instead.';
    }
  };
  credit.onclick=async()=>{
    if(busy)return;
    const no=receipt.value.trim(), qr=token.value.trim();
    if(!/^\d{1,12}$/.test(no)){msg.textContent='Enter a valid paid POS receipt number.';return;}
    if(!/^KBR-CUSTOMER:[0-9a-f-]{36}$/i.test(qr)){msg.textContent='Scan a valid KBR customer QR first.';return;}
    if(!window.KBRCloud){msg.textContent='The POS is not connected. Sign in and try again.';return;}
    busy=true;credit.disabled=true;msg.textContent='Verifying purchase and adding points…';
    try{
      const result=await window.KBRCloud.rpc('kbr_credit_walkin_qr_points',{
        p_order_number:Number(no),p_qr:qr.toLowerCase().replace('kbr-customer:','KBR-CUSTOMER:')
      });
      msg.textContent='✓ '+result.pointsAwarded+' points added to '+(result.customerName||'customer')+
        ' for receipt #'+result.orderNumber+'.';
      token.value='';
      await stopCamera();
    }catch(error){msg.textContent=error.message||'Could not credit points.';}
    finally{busy=false;credit.disabled=false;}
  };
  function install(){
    const actions=document.querySelector('#baristaDrawer .barista-actions');
    if(!actions||document.getElementById('kbrQrRewardButton'))return false;
    const btn=el('button',{type:'button',id:'kbrQrRewardButton',class:'secondary',text:'🎟 Scan Rewards QR'});
    btn.onclick=open;
    actions.append(btn);
    return true;
  }
  if(!install()){
    const observer=new MutationObserver(()=>{if(install())observer.disconnect();});
    observer.observe(document.body,{childList:true,subtree:true});
  }
})();
