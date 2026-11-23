'use strict';
const cf=location.hostname.endsWith('.pages.dev');
const dest=cf?{
 orderingUrl:'https://kape-barrio.pages.dev/',
 managerUrl:'https://managerspage.pages.dev/'
}:{
 orderingUrl:'https://russelljohnramosmicumao-arch.github.io/Kape-Barrio/',
 managerUrl:'https://russelljohnramosmicumao-arch.github.io/ManagersPage/'
};
window.KBR_APP_LINKS=Object.freeze(dest);
(()=>{for(const a of document.querySelectorAll('[data-app-link]')){const target=dest[a.dataset.appLink];if(!target)continue;const url=new URL(target);if(cf){const home=new URL(location.href).searchParams.get('kbrHome');try{const ref=new URL(home);if(ref.protocol==='https:'&&ref.hostname.endsWith('.pages.dev'))url.searchParams.set('kbrHome',ref.origin+'/');}catch{}}a.href=url.href;}})();
