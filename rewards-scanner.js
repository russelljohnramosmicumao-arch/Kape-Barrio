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
    .kbr-phone-keypad{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}
    .kbr-qr-sheet .kbr-phone-key{padding:13px 5px;border:1px solid #dcc7b5;border-radius:11px;background:#fff9f1;font-size:1.18rem;font-weight:850;color:#49301f;min-height:48px}
    .kbr-qr-sheet .kbr-phone-key:active{background:#e4d2c0}
    .kbr-qr-sheet .kbr-phone-key.kbr-phone-delete{color:#8d4028}
    .kbr-qr-sheet input.kbr-phone-input{text-transform:none;letter-spacing:1.5px;font-size:1.12rem;font-weight:800;text-align:center}
    .kbr-phone-confirm{border:1px solid #9ccea7;background:#eff9f0;padding:12px;border-radius:12px;margin:10px 0;font-size:.9rem}
    .kbr-phone-confirm strong{display:block;font-size:1.05rem;margin:4px 0}
    .kbr-qr-sheet button.kbr-qr-btn.kbr-confirm-button{background:#267449}
    .kbr-qr-register{border:1px solid #c6b49d;border-radius:12px;padding:12px;background:#fffaf0;margin:12px 0}
    .kbr-qr-register label.kbr-register-consent{display:flex;gap:9px;align-items:flex-start;font-weight:500;font-size:.76rem;line-height:1.4}
    .kbr-qr-register input[type=checkbox]{width:auto;display:inline;margin:2px 0}
    .kbr-qr-sheet button.kbr-register-open{background:#267449}
    .kbr-temp-password{display:block;font-size:1.45rem;letter-spacing:1px;background:#fff2d1;border:1px solid #e5c98f;border-radius:10px;padding:12px;margin:12px 0;overflow-wrap:anywhere}
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
  const phoneButton=el('button',{type:'button',class:'kbr-qr-btn kbr-qr-alt',text:'📱 Enter Phone Number','aria-expanded':'false'});
  const phoneInput=el('input',{id:'kbrRewardsPhone',class:'kbr-phone-input',type:'tel',inputmode:'numeric',maxlength:'13',placeholder:'09XXXXXXXXX',autocomplete:'off'});
  const phoneKeyboard=el('div',{class:'kbr-phone-keypad'});
  const phoneFindButton=el('button',{type:'button',class:'kbr-qr-btn',text:'Find Customer'});
  const phoneConfirm=el('div',{class:'kbr-phone-confirm',hidden:''});
  const phoneConfirmButton=el('button',{type:'button',class:'kbr-qr-btn kbr-confirm-button',text:'Confirm & Link Order'});
  const registerButton=el('button',{type:'button',class:'kbr-qr-btn kbr-register-open',text:'➕ Register New Customer',hidden:''});
  const registerName=el('input',{id:'kbrRegisterCustomerName',type:'text',maxlength:'80',placeholder:'Customer full name',autocomplete:'off'});
  const registerConsent=el('input',{id:'kbrRegisterConsent',type:'checkbox'});
  const registerSubmit=el('button',{type:'button',class:'kbr-qr-btn',text:'Create Account & Link Order'});
  const registerForm=el('div',{class:'kbr-qr-register',hidden:''},[
    el('label',{for:'kbrRegisterCustomerName',text:'Customer name'}),registerName,
    el('label',{class:'kbr-register-consent'},[
      registerConsent,
      el('span',{text:'Customer agrees to KBR Rewards Terms & Conditions and Privacy Policy.'})
    ]),
    registerSubmit
  ]);
  const phonePanel=el('div',{class:'kbr-qr-manual',hidden:''},[
    el('label',{for:'kbrRewardsPhone',text:'Customer mobile number'}),phoneInput,phoneKeyboard,
    phoneFindButton,phoneConfirm,phoneConfirmButton,registerButton,registerForm
  ]);
  let pendingPhoneCustomer=null;
  for(const digit of ['1','2','3','4','5','6','7','8','9','Clear','0','⌫']){
    const key=el('button',{type:'button',class:'kbr-phone-key'+(digit==='⌫'?' kbr-phone-delete':''),text:digit});
    key.addEventListener('click',()=>{
      if(digit==='Clear')phoneInput.value='';
      else if(digit==='⌫')phoneInput.value=phoneInput.value.slice(0,-1);
      else if(phoneInput.value.length<13)phoneInput.value+=digit;
      invalidatePhoneLookup();
      phoneInput.focus();
    });
    phoneKeyboard.append(key);
  }
  const manual=el('div',{class:'kbr-qr-manual',hidden:''},[
    el('label',{for:'kbrQrCustomerCode',text:'Customer code'},[codeInput]),
    linkButton
  ]);
  const video=el('div',{id:'kbrQrVideo'});
  const status=el('p',{id:'kbrQrMessage',role:'status',text:'Choose Scan QR Code, Enter Customer Code, or Enter Phone Number.'});
  sheet.append(header,receipt,phoneButton,phonePanel,scanButton,video,codeButton,manual,status);
  overlay.append(sheet);document.body.append(overlay);
  // Hidden needs to work despite any global styles.
  function manualOpen(value){manual.hidden=!value;manual.style.display=value?'block':'none';codeButton.setAttribute('aria-expanded',String(value));}
  function phoneOpen(value){
    phonePanel.hidden=!value;
    phonePanel.style.display=value?'block':'none';
    phoneButton.setAttribute('aria-expanded',String(value));
    if(value)manualOpen(false);
  }
  function invalidatePhoneLookup(){
    pendingPhoneCustomer=null;
    phoneConfirm.hidden=true;
    phoneConfirm.style.display='none';
    phoneConfirmButton.hidden=true;
    phoneConfirmButton.style.display='none';
    registerButton.hidden=true;registerButton.style.display='none';
    registerForm.hidden=true;registerForm.style.display='none';
  }
  manualOpen(false);
  phoneOpen(false);
  invalidatePhoneLookup();
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
    phoneOpen(false);
    invalidatePhoneLookup();
  }
  function openForOrder(orderNo){
    const value=String(orderNo||'').replace(/\D/g,'');
    if(!/^\d{1,12}$/.test(value)){alert('Select a valid order to scan rewards.');return;}
    selectedOrderNo=value;scanLocked=false;busy=false;
    receipt.textContent='Order #'+value.slice(-3).padStart(3,'0');
    codeInput.value='';manualOpen(false);
    phoneInput.value='';phoneOpen(false);invalidatePhoneLookup();registerName.value='';registerConsent.checked=false;
    status.textContent='Choose Scan QR Code, Enter Customer Code, or Enter Phone Number.';
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
    if(!full&&!short){status.textContent='Enter a valid 12-character customer code or scan their QR.';return false;}
    if(!window.KBRCloud){status.textContent='Sign in to the Barista App first.';return false;}
    busy=true;linkButton.disabled=true;scanButton.disabled=true;phoneFindButton.disabled=true;phoneConfirmButton.disabled=true;
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
      const linkedName=String(result?.customerName||'').trim();
      if(linkedName){
        window.KBRRewardOrderNames?.note(selectedOrderNo,linkedName);
      }
      close();
      codeInput.value='';
      return true;
    }catch(error){status.textContent=error?.message||'Could not link this customer. Please try again.';return false;}
    finally{busy=false;linkButton.disabled=false;scanButton.disabled=false;phoneFindButton.disabled=false;phoneConfirmButton.disabled=false;}
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
    phoneOpen(false);invalidatePhoneLookup();
    manualOpen(show);
    if(show)codeInput.focus();
  };
  phoneButton.onclick=async()=>{
    await stopCamera();
    const show=phonePanel.hidden;
    phoneOpen(show);invalidatePhoneLookup();
    if(show)phoneInput.focus();
  };
  phoneInput.addEventListener('input',()=>{
    phoneInput.value=phoneInput.value.replace(/[^0-9+]/g,'').slice(0,13);
    invalidatePhoneLookup();
  });
  phoneInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();phoneFindButton.click();}});
  phoneFindButton.onclick=async()=>{
    if(busy)return;
    const value=phoneInput.value.trim();
    if(!/^(09\d{9}|(?:\+?63)9\d{9})$/.test(value)){
      status.textContent='Enter a valid 11-digit mobile number, starting with 09.';
      return;
    }
    if(!window.KBRCloud){status.textContent='Sign in to the Barista App first.';return;}
    busy=true;phoneFindButton.disabled=true;invalidatePhoneLookup();
    status.textContent='Looking up KBR Rewards customer…';
    try{
      const customer=await window.KBRCloud.rpc('kbr_lookup_customer_by_phone',{p_phone:value});
      if(!customer?.customerCode)throw Error('Could not verify this customer account.');
      pendingPhoneCustomer={...customer,phone:value,orderNo:selectedOrderNo};
      phoneConfirm.replaceChildren(
        el('span',{text:'Please confirm the customer before linking points:'}),
        el('strong',{text:customer.customerName||'Customer'}),
        el('span',{text:customer.maskedPhone||''})
      );
      phoneConfirm.hidden=false;phoneConfirm.style.display='block';
      phoneConfirmButton.hidden=false;phoneConfirmButton.style.display='block';
      status.textContent='Confirm the customer name, then link the order.';
    }catch(error){
      const message=error?.message||'Customer not found. Please check the phone number.';
      status.textContent=message;
      if(message.includes('No KBR Rewards account found')){
        registerButton.hidden=false;registerButton.style.display='block';
        status.textContent='Customer not registered. You can register them now using their name.';
      }
    }
    finally{busy=false;phoneFindButton.disabled=false;}
  };
  registerButton.onclick=()=>{
    registerForm.hidden=false;registerForm.style.display='block';
    registerName.focus();
  };
  const tempDialog=el('div',{id:'kbrTempPasswordOverlay',role:'dialog','aria-modal':'true','aria-label':'New KBR temporary password'});
  tempDialog.style.cssText='display:none;position:fixed;inset:0;z-index:11000;background:rgba(25,15,10,.8);align-items:center;justify-content:center;padding:14px';
  const tempSheet=el('div',{class:'kbr-qr-sheet'});
  tempDialog.append(tempSheet);document.body.append(tempDialog);
  function showTempPassword(name,password,linked){
    tempSheet.replaceChildren(
      el('h2',{text:'✓ Customer Registered'}),
      el('p',{text:name+' has a new KBR Rewards account.'}),
      el('p',{text:'Give this temporary password directly to the customer. It is shown only now; they must change it at first login.'}),
      el('strong',{class:'kbr-temp-password',text:password}),
      el('p',{text:linked?'Order linked successfully. Points will be credited when the order qualifies.':'Account created, but the order was not linked. Please link the order using the customer phone number.'})
    );
    const done=el('button',{type:'button',class:'kbr-qr-btn',text:'Done — I gave the password to the customer'});
    done.onclick=()=>{tempDialog.style.display='none';tempSheet.replaceChildren();};
    tempSheet.append(done);
    tempDialog.style.display='flex';
  }
  registerSubmit.onclick=async()=>{
    if(busy)return;
    const name=registerName.value.trim(),phone=phoneInput.value.trim();
    if(name.length<2){status.textContent='Enter the customer name.';return;}
    if(!registerConsent.checked){status.textContent='Customer must agree to the Terms and Privacy Policy.';return;}
    const staff=window.KBRCloud?.session?.();
    if(!staff?.access_token){status.textContent='Staff login required. Please sign in again.';return;}
    busy=true;registerSubmit.disabled=true;
    status.textContent='Creating KBR Rewards account…';
    let created=null;
    try{
      const response=await fetch('https://wkyyuyyfauyhpivebrdg.supabase.co/functions/v1/kbr-staff-customer-registration',{
        method:'POST',
        headers:{apikey:window.KBRCloud.config.key,Authorization:'Bearer '+staff.access_token,'Content-Type':'application/json'},
        body:JSON.stringify({action:'register',name,phone,consent:true})
      });
      const body=await response.json().catch(()=>({}));
      if(!response.ok||!body.ok)throw Error(body.error||'Registration failed.');
      created=body;
      status.textContent='Account created. Linking the order…';
    }catch(error){status.textContent=error?.message||'Could not register customer.';}
    finally{busy=false;registerSubmit.disabled=false;}
    if(!created)return;
    const linked=await linkOrder(created.customerCode);
    showTempPassword(created.customerName,created.temporaryPassword,linked);
  };
  phoneConfirmButton.onclick=async()=>{
    if(!pendingPhoneCustomer||busy)return;
    if(pendingPhoneCustomer.phone!==phoneInput.value.trim()||pendingPhoneCustomer.orderNo!==selectedOrderNo){
      invalidatePhoneLookup();
      status.textContent='Phone number or order changed. Please look up the customer again.';
      return;
    }
    const code=pendingPhoneCustomer.customerCode;
    invalidatePhoneLookup();
    await linkOrder(code);
    if(status.textContent.startsWith('✓')){phoneOpen(false);phoneInput.value='';}
  };
  codeInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();linkButton.click();}});
  linkButton.onclick=()=>linkOrder(codeInput.value);
  // Keep linked customer names visible in Barista order headers, including after refresh.
  const linkedNames=new Map();
  let lastNamesFetch=0;
  let loadingNames=false;
  function getLinkedName(orderNo){
    const key=String(orderNo||'').replace(/\D/g,'');
    return linkedNames.get(key)||'';
  }
  function updateOrderHeaders(){
    if(typeof window.renderBaristaOrders==='function')window.renderBaristaOrders();
  }
  function noteLinkedName(orderNo,name){
    const key=String(orderNo||'').replace(/\D/g,'');
    const label=String(name||'').trim();
    if(!key||!label)return;
    linkedNames.set(key,label);
    updateOrderHeaders();
  }
  async function refreshLinkedNames(force=false){
    if(loadingNames||!window.KBRCloud?.rpc)return;
    if(!force&&Date.now()-lastNamesFetch<90000)return;
    loadingNames=true;
    lastNamesFetch=Date.now();
    try{
      const rows=await window.KBRCloud.rpc('kbr_recent_linked_order_customers',{});
      if(Array.isArray(rows)){
        linkedNames.clear();
        for(const row of rows){
          const key=String(row.orderNumber||'').replace(/\D/g,'');
          if(key&&row.customerName)linkedNames.set(key,String(row.customerName));
        }
        updateOrderHeaders();
      }
    }catch(error){
      console.warn('Could not load linked customer names',error?.message||error);
    }finally{loadingNames=false;}
  }
  window.KBRRewardOrderNames={
    get:getLinkedName,
    note:noteLinkedName,
    refresh:refreshLinkedNames
  };
  window.KBRRewardsScanner={openForOrder,close};
})();
