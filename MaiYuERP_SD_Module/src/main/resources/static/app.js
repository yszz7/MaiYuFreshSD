const pages = {
  dashboard: ["Sales Overview", "dashboardPage"],
  orders: ["Sales Orders", "ordersPage"],
  requisitions: ["Store Replenishment", "requisitionsPage"],
  deliveries: ["Outbound Delivery", "deliveriesPage"]
};
const modal = id => bootstrap.Modal.getOrCreateInstance(document.getElementById(id));
const money = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n||0));
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const statusClass = s => String(s||"").toLowerCase().replace(/\s+/g,"");
async function api(url, options={}) {
  const response = await fetch(url,{headers:{"Content-Type":"application/json"},...options});
  if(!response.ok) throw new Error(await response.text() || "Request failed");
  return response.json();
}
function showPage(name){
  Object.values(pages).forEach(([,id])=>document.getElementById(id).classList.add("hidden"));
  document.getElementById(pages[name][1]).classList.remove("hidden");
  document.getElementById("pageTitle").textContent=pages[name][0];
  document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===name));
  document.getElementById("newButton").style.display=name==="dashboard"||name==="orders"?"":"none";
  document.getElementById("newButton").textContent=name==="requisitions"?"＋ New request":name==="deliveries"?"＋ New delivery":"＋ New Sales Order";
  refreshCurrent(name);
}
document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.go)));
document.getElementById("newButton").addEventListener("click",()=>{const active=document.querySelector(".nav-link.active")?.dataset.page;if(active==="requisitions")openReqModal();else if(active==="deliveries")openDeliveryModal();else openOrderModal();});
function refreshCurrent(name){if(name==="dashboard")loadDashboard();if(name==="orders")loadOrders();if(name==="requisitions")loadRequisitions();if(name==="deliveries")loadDeliveries();}
async function loadDashboard(){
 try{
  const d=await api("/api/dashboard");
  document.getElementById("totalOrders").textContent=d.totalOrders;
  document.getElementById("pendingOrders").textContent=d.pendingOrders;
  document.getElementById("replenishments").textContent=d.replenishments;
  document.getElementById("deliveriesCount").textContent=d.deliveries;
  const orders=await api("/api/sales-orders");
  document.getElementById("recentOrders").innerHTML=orders.slice(0,5).map(o=>`<tr><td class="order-number">${esc(o.order_no)}</td><td>${esc(o.store_name)}<br><span class="muted">${esc(o.customer_name)}</span></td><td>${esc(o.order_type)}</td><td>${esc(o.product_name)}</td><td><strong>${money(o.total_amount)}</strong></td><td>${badge(o.order_status)}</td></tr>`).join("")||emptyRow(6,"No sales orders yet");
 }catch(e){notify(e.message);}
}
function badge(s){return `<span class="status ${statusClass(s)}">${esc(s)}</span>`;}
function emptyRow(n,msg){return `<tr><td colspan="${n}" class="text-center py-5 text-secondary">${msg}</td></tr>`;}
async function loadOrders(){
 try{const list=await api("/api/sales-orders");const q=(document.getElementById("orderSearch").value||"").toLowerCase();const filtered=list.filter(o=>[o.order_no,o.store_name,o.customer_name,o.product_name,o.order_type].some(v=>String(v||"").toLowerCase().includes(q)));
 document.getElementById("orderCount").textContent=`${filtered.length} order(s)`;
 document.getElementById("ordersTable").innerHTML=filtered.map(o=>`<tr><td class="order-number">${esc(o.order_no)}</td><td>${esc(o.store_name)}</td><td>${esc(o.customer_name)}</td><td>${esc(o.order_type)}</td><td>${esc(o.product_name)}</td><td>${o.quantity}</td><td><strong>${money(o.total_amount)}</strong></td><td>${badge(o.order_status)}</td><td><button class="btn btn-sm btn-outline-danger" onclick="deleteOrder(${o.id})">Delete</button></td></tr>`).join("")||emptyRow(9,"No matching orders");}
 catch(e){notify(e.message);}
}
document.getElementById("orderSearch").addEventListener("input",loadOrders);
function openOrderModal(){document.getElementById("orderForm").reset();modal("orderModal").show();}
function openReqModal(){document.getElementById("reqForm").reset();modal("reqModal").show();}
function openDeliveryModal(){document.getElementById("deliveryForm").reset();modal("deliveryModal").show();}
function formObject(form){return Object.fromEntries(new FormData(form).entries());}
document.getElementById("orderForm").addEventListener("submit",async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{await api("/api/sales-orders",{method:"POST",body:JSON.stringify(formObject(e.target))});modal("orderModal").hide();notify("Sales order saved");refreshCurrent(document.querySelector(".nav-link.active")?.dataset.page||"dashboard");}catch(err){notify(err.message);}finally{b.disabled=false;}});
async function deleteOrder(id){if(!confirm("Delete this sales order?"))return;try{await api(`/api/sales-orders/${id}`,{method:"DELETE"});notify("Order deleted");loadOrders();}catch(e){notify(e.message);}}
async function loadRequisitions(){try{const rows=await api("/api/requisitions");document.getElementById("reqTable").innerHTML=rows.map(r=>`<tr><td class="order-number">${esc(r.requisition_no)}</td><td>${esc(r.store_name)}</td><td>${esc(r.product_name)}</td><td>${r.quantity}</td><td>${esc(r.notes)}</td><td>${badge(r.status)}</td><td><select class="form-select action-select" onchange="setReqStatus(${r.id},this.value)"><option ${r.status==="Submitted"?"selected":""}>Submitted</option><option ${r.status==="Processing"?"selected":""}>Processing</option><option ${r.status==="Completed"?"selected":""}>Completed</option><option ${r.status==="Rejected"?"selected":""}>Rejected</option></select></td></tr>`).join("")||emptyRow(7,"No replenishment requests");}catch(e){notify(e.message);}}
document.getElementById("reqForm").addEventListener("submit",async e=>{e.preventDefault();try{await api("/api/requisitions",{method:"POST",body:JSON.stringify(formObject(e.target))});modal("reqModal").hide();notify("Replenishment request submitted");loadRequisitions();}catch(err){notify(err.message);}});
async function setReqStatus(id,status){try{await api(`/api/requisitions/${id}/status`,{method:"PUT",body:JSON.stringify({status})});notify("Request status updated");}catch(e){notify(e.message);}}
async function loadDeliveries(){try{const rows=await api("/api/deliveries");document.getElementById("deliveryTable").innerHTML=rows.map(d=>`<tr><td class="order-number">${esc(d.delivery_no)}</td><td>${esc(d.order_no)}</td><td>${esc(d.store_name)}</td><td>${esc(d.carrier)}</td><td>${esc(d.delivery_date||"")}</td><td>${badge(d.delivery_status)}</td><td><select class="form-select action-select" onchange="setDeliveryStatus(${d.id},this.value)"><option ${d.delivery_status==="Preparing"?"selected":""}>Preparing</option><option ${d.delivery_status==="In Transit"?"selected":""}>In Transit</option><option ${d.delivery_status==="Delivered"?"selected":""}>Delivered</option><option ${d.delivery_status==="Cancelled"?"selected":""}>Cancelled</option></select></td></tr>`).join("")||emptyRow(7,"No deliveries yet");}catch(e){notify(e.message);}}
document.getElementById("deliveryForm").addEventListener("submit",async e=>{e.preventDefault();try{await api("/api/deliveries",{method:"POST",body:JSON.stringify(formObject(e.target))});modal("deliveryModal").hide();notify("Delivery created");loadDeliveries();}catch(err){notify(err.message);}});
async function setDeliveryStatus(id,delivery_status){try{await api(`/api/deliveries/${id}/status`,{method:"PUT",body:JSON.stringify({delivery_status})});notify("Delivery status updated");}catch(e){notify(e.message);}}
function notify(message){let n=document.getElementById("toast");if(!n){n=document.createElement("div");n.id="toast";n.style.cssText="position:fixed;right:24px;bottom:24px;background:#183d2c;color:white;padding:13px 18px;border-radius:10px;z-index:9999;box-shadow:0 8px 30px #0002;max-width:360px";document.body.appendChild(n);}n.textContent=message;n.style.display="block";clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>n.style.display="none",3200);}
loadDashboard();
