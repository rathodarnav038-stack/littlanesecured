/* Halloween theme: occasional bats crossing the screen. Only runs while the Halloween theme is active. */
(function(){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const layer=document.createElement('div');
    layer.className='hw-bats';
    layer.setAttribute('aria-hidden','true');
    document.body.appendChild(layer);
    const BAT='<svg viewBox="0 0 64 28" width="__W__" fill="currentColor"><path d="M32 8c-3 0-4 4-6 4-3 0-4-6-12-8C8 2 2 6 0 12c4-2 8-1 10 2 2-2 6-2 8 1 2-2 5-1 7 1 1-3 3-4 7-4s6 1 7 4c2-2 5-3 7-1 2-3 6-3 8-1 2-3 6-4 10-2-2-6-8-10-14-8-8 2-9 8-12 8-2 0-3-4-6-4z"/><path d="M28 8l1-6 3 4 3-4 1 6z"/></svg>';
    function spawn(){
        if(document.hidden||document.documentElement.dataset.theme!=='halloween')return;
        const bat=document.createElement('div');
        const w=26+Math.random()*34;
        bat.className='hw-bat';
        bat.innerHTML=BAT.replace('__W__',w.toFixed(0));
        bat.style.top=(8+Math.random()*60)+'vh';
        bat.style.setProperty('--dy',((Math.random()-.5)*160).toFixed(0)+'px');
        const dur=7+Math.random()*7;
        bat.style.animationDuration=dur+'s';
        layer.appendChild(bat);
        setTimeout(()=>bat.remove(),dur*1000+200);
    }
    window.addEventListener('load',()=>{
        for(let i=0;i<3;i++)setTimeout(spawn,2500+i*900);
        setInterval(()=>{const n=1+Math.floor(Math.random()*3);for(let i=0;i<n;i++)setTimeout(spawn,i*500)},5000);
    });
})();
