'use strict';
(()=>{
  // No background polling or camera use. Scanner is opened per selected order.
  let camera=null,busy=false,selectedOrderNo='',scanLocked=false;
  function el(tag,attrs={},children=[]){
    const node=document.createElement(tag);
    for(const [key,val] of Object.entries(attrs)){
      if(key==='text')node.textContent=val;
      else node.setAttribute(key,val);
    }
    children.forEach(child=>node.append(child));
    return node;
  }
  document.head.append(el('style',{text:`
    #kbrQrOverlay{position:fixed;inset:0;z-index:10000;background:rgba(25,15,10,.76);display:none;align-items:center;justify-content:center;padding:14px}
    #kbrQrOverlay.open{display:flex}
    .kbr-qr-sheet{width:min(440px,100%);background:#fffaf5;color:#38281e;border-radius:18px;padding:20px;max-height:94dvh;overflow:auto}
    .kbr-qr-head{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:10px}
    .kbr-qr-head h2{font-size:1.2rem;margin:0}
    .kbr-qr-close{font-size:1.6rem;background:transparent;border:0;cursor:pointer}
    .kbr-qr-sheet button.kbr-qr-btn{background:#65432d;color:#fff;border:0;border-radius:11px;padding:13px;font-size:.95rem;font-weight:800;width:100%;margin:6px 0;cursor:pointer}
    .kbr-qr-sheet button.kbr-qr-btn:disabled{opacity:.55;cursor:wait}
    .kbr-qr-sheet button.kbr-qr-alt{background:#eee0d4;color:#543923}
    .kbr-qr-sheet label{display:block;font-size:.86rem;font-weight:800;margin:12px 0 5px}
    .kbr-qr-sheet input{box-sizing:border-box;display:block;width:100%;padding:12px;border:1px solid #d8c6b3;border-radius:10px;font-size:1rem;letter-spacing:1px;text-transform:uppercase}
    .kbr-qr-sheet input:focus{outline:2px solid #3478be;outline-offset:1px}
    .kbr-qr-selected-order{display:block;font-size:1.45rem;color:#245a32;margin:8px 0 14px}
    #kbrQrVideo{margin-top:6px;overflow:hidden;border-radius:12px}
    #kbrQrMessage{font-size:.86rem;line-height:1.45;margin:12px 0 0;min-height:20px}
    .kbr-qr-manual{padding:12px;border:1px solid #e5d3c3;border-radius:12px;background:#fff}
  `}));
  const overlay=el('div',{id:'kbrQrOverlay',role:'dialog','aria-modal':'true','aria-label':'KBR rewards'});
  const sheet=el('div',{class:'kbr-qr-sheet'});
  const header=el('div',{class:'kbr-qr-head'},[
    el('h2',{text:'🎟 KBR Rewards QR'}),
    el('button',{type:'button',class:'kbr-qr-close','aria-label':'Close scanner',text:'×'})
  ]);
  const receipt=el('strong',{class:'kbr-qr-selected-order',text:'No order selected'});
  const scanButton=el('button',{type:'button',class:'kbr-qr-btn',text:'📷 Scan QR Code'});
  const codeButton=el('button',{type:'button',class:'kbr-qr-btn kbr-qr-alt',text:'⌨ Enter Customer Code','aria-expanded':'false'});
  const codeInput=el('input',{id:'kbrQrCustomerCode',type:'text',maxlength:'24',placeholder:'XXXX-XXXX-XXXX',autocomplete:'off',spellcheck:'false'});
  const linkButton=el('button',{type:'button',class:'kbr-qr-btn',text:'Link Order'});
  const manual=el('div',{class:'kbr-qr-manual',hidden:''},[
    el('label',{for:'kbrQrCustomerCode',text:'Customer code'},[codeInput]),
    linkButton
  ]);
  const video=el('div',{id:'kbrQrVideo'});
  const status=el('p',{id:'kbrQrMessage',role:'status',text:'Choose Scan QR Code or Enter Customer Code.'});
  sheet.append(header,receipt,scanButton,video,codeButton,manual,status);
  overlay.append(sheet);document.body.append(overlay);
  // Hidden needs to work despite any global styles.
  function manualOpen(value){manual.hidden=!value;manual.style.display=value?'block':'none';codeButton.setAttribute('aria-expanded',String(value));}
  manualOpen(false);
  async function stopCamera(){
    const active=camera;camera=null;
    if(active){try{await active.stop();}catch{}try{await active.clear();}catch{}}
    video.replaceChildren();
    scanButton.textContent='📷 Scan QR Code';
  }
  function close(){
    overlay.classList.remove('open');
    stopCamera();
    manualOpen(false);
  }
  function openForOrder(orderNo){
    const value=String(orderNo||'').replace(/\D/g,'');
    if(!/^\d{1,12}$/.test(value)){alert('Select a valid order to scan rewards.');return;}
    selectedOrderNo=value;scanLocked=false;busy=false;
    receipt.textContent='Order #'+value.slice(-3).padStart(3,'0');
    codeInput.value='';manualOpen(false);
    status.textContent='Choose Scan QR Code or Enter Customer Code.';
    overlay.classList.add('open');
  }
  header.lastChild.onclick=close;
  overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('open'))close();});
  function loadScanner(){
    if(window.Html5Qrcode)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const script=el('script',{src:'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js'});
      script.onload=()=>window.Html5Qrcode?resolve():reject(Error('Camera scanner unavailable.'));
      script.onerror=()=>reject(Error('Could not load scanner. Use Enter Customer Code.'));
      document.head.append(script);
    });
  }
  async function linkOrder(code){
    if(busy)return;
    const value=String(code||'').trim();
    const full=/^KBR-CUSTOMER:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    const short=/^[0-9a-f]{4}(?:-?[0-9a-f]{4}){2}$/i.test(value);
    if(!full&&!short){status.textContent='Enter a valid 12-character customer code or scan their QR.';return;}
    if(!window.KBRCloud){status.textContent='Sign in to the Barista App first.';return;}
    busy=true;linkButton.disabled=true;scanButton.disabled=true;
    status.textContent='Linking customer to order #'+selectedOrderNo+'…';
    try{
      const normalized=full?'KBR-CUSTOMER:'+value.slice(13).toLowerCase():value.replace(/-/g,'').toUpperCase();
      const result=await window.KBRCloud.rpc('kbr_link_customer_qr_to_order',{
        p_order_number:Number(selectedOrderNo),p_qr:normalized
      });
      status.textContent=result.status==='credited'
        ?'✓ '+Number(result.pointsAwarded||0)+' points credited to '+(result.customerName||'customer')+'.'
        :result.status==='already-credited'
        ?'✓ Rewards already credited for this order.'
        :'✓ '+(result.customerName||'Customer')+' linked! Points will be added after the order is paid and completed.';
      manualOpen(false);codeInput.value='';
    }catch(error){status.textContent=error?.message||'Could not link this customer. Please try again.';}
    finally{busy=false;linkButton.disabled=false;scanButton.disabled=false;}
  }
  scanButton.onclick=async()=>{
    if(busy)return;
    if(camera){await stopCamera();return;}
    scanLocked=false;status.textContent='Opening camera…';
    try{
      await loadScanner();
      const scanner=new window.Html5Qrcode('kbrQrVideo');
      camera=scanner;
      await scanner.start({facingMode:'environment'},{fps:8,qrbox:{width:220,height:220}},async value=>{
        if(scanLocked||!/^KBR-CUSTOMER:/i.test(value))return;
        scanLocked=true;
        status.textContent='Customer QR scanned. Linking automatically…';
        await stopCamera();
        await linkOrder(value);
        scanLocked=false;
      },()=>{});
      scanButton.textContent='Stop Camera';
      status.textContent='Point the camera at the customer’s rewards QR.';
    }catch(error){
      await stopCamera();
      status.textContent=error?.message||'Camera unavailable. Enter the customer code instead.';
    }
  };
  codeButton.onclick=async()=>{
    await stopCamera();
    const show=manual.hidden;
    manualOpen(show);
    if(show)codeInput.focus();
  };
  codeInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();linkButton.click();}});
  linkButton.onclick=()=>linkOrder(codeInput.value);
  window.KBRRewardsScanner={openForOrder,close};
})();
