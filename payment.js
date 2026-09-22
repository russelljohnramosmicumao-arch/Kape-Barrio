/* Payment flow updates for Kape' Bar-Rio POS.
   Loaded after index.html's main script so these functions override the
   original payment/checkout behavior without touching the menu logic.
*/

let pendingOrderNo = null;

function renderPaymentOptions(){
  paymentSide.innerHTML=`
    <h2 class="payment-title">Payment</h2>
    <div class="payment-sub">Choose how you would like to pay.</div>
    <div class="payment-options">
      <button class="payment-choice" onclick="showCashPayment()">💵 Pay cash at the counter</button>
      <button class="payment-choice gcash-choice" onclick="showGcashPayment()">📱 Pay thru GCash</button>
      <button class="secondary" style="width:100%;min-height:58px;font-size:16px;font-weight:900" onclick="continueOrdering()">← Continue adding drinks / food</button>
    </div>`;
}

function makeReceipt(){
  if(!cart.length){alert("Add at least one item.");return}

  if(!pendingOrderNo) pendingOrderNo=orderNumber();

  const now=new Date();
  const total=cart.reduce((s,x)=>s+x.qty*x.price,0);
  const date=now.toLocaleDateString("en-PH",{year:"numeric",month:"short",day:"numeric"});
  const time=now.toLocaleTimeString("en-PH",{hour:"numeric",minute:"2-digit"});
  const orderedItems=[...cart].sort((a,b)=>(a.category==='Snackies'?1:0)-(b.category==='Snackies'?1:0));

  currentReceipt={no:pendingOrderNo,date,time,total,items:JSON.parse(JSON.stringify(orderedItems))};
  renderPaymentOptions();
  receiptArea.innerHTML=`<div id="receiptCanvas" class="receipt">
    <div class="center"><h3>KAPE' BAR-RIO</h3><div>SHOP & CAFE</div><div class="receipt-number">Order #${currentReceipt.no}</div><div>${date} · ${time}</div></div>
    <hr>${currentReceipt.items.map(x=>`<div class="receipt-line"><div class="item">${x.qty}× ${x.name}<br><small>${x.type!=='standard'?x.type+' · ':''}${x.size}</small></div><div>${peso(x.qty*x.price)}</div></div>`).join("")}
    <hr><div class="receipt-line"><b>TOTAL</b><b>${peso(total)}</b></div><hr><div class="center">Thank you!</div>
  </div>`;

  closeOrder();
  receiptDrawer.classList.add("open");

  // Keep the cart until payment is actually completed. This allows the
  // customer to go back and add more drinks or food before paying.
  persist();
  renderOrder();
  render();
}

function continueOrdering(){
  closeReceipt();
  // Keep the current cart intact. The customer can add more items, edit
  // quantities, or open the cart again and press Pay when ready.
  render();
  renderOrder();
}

function finishPayment(){
  if(!currentReceipt){closeReceipt();return}

  // Save the transaction only after the customer confirms payment is done.
  saveTransactionToHistory(currentReceipt);

  cart=[];
  persist();
  render();
  renderOrder();

  currentReceipt=null;
  pendingOrderNo=null;
  closeReceipt();
}

function showCashPayment(){
  selectedPayment='cash';
  paymentSide.innerHTML=`
    <h2 class="payment-title">Cash Payment</h2>
    <div class="payment-total"><span>Total</span><b>${peso(currentReceipt?.total||0)}</b></div>
    <div class="cash-note">Please pay cash at the counter.<br>After payment, tap Close.</div>
    <div class="payment-options">
      <button class="primary" style="width:100%;min-height:58px;font-size:17px;font-weight:900" onclick="finishPayment()">Close</button>
    </div>`;
}

function showGcashPayment(){
  selectedPayment='gcash';
  paymentSide.innerHTML=`
    <h2 class="payment-title">GCash Payment</h2>
    <div class="payment-total"><span>Total Amount</span><b>${peso(currentReceipt?.total||0)}</b></div>
    <img class="gcash-card" src="images/gcash-card.png" alt="GCash QR code">
    <div class="gcash-number">GCash Number: 09672365176</div>
    <div class="gcash-help">Scan the QR code or send the exact total to this GCash number.</div>
    <div class="show-receipt-note">After payment, please show your GCash receipt at the counter, then tap Close.</div>
    <div class="payment-options">
      <button class="primary" style="width:100%;min-height:58px;font-size:17px;font-weight:900" onclick="finishPayment()">Close</button>
    </div>`;
}
