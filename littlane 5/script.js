(function(){
'use strict';

const lerp=(a,b,n)=>a+(b-a)*n;
const clamp=(val,min,max)=>Math.min(Math.max(val,min),max);
const map=(val,iMin,iMax,oMin,oMax)=>((val-iMin)*(oMax-oMin))/(iMax-iMin)+oMin;
const easeOutExpo=t=>t===1?1:1-Math.pow(2,-10*t);
const easeInOutCubic=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

/* ==================== PARTICLES (Rave Mode) ==================== */
class Particles{
    constructor(){
        this.canvas=document.getElementById('particles');
        if(!this.canvas)return;
        this.ctx=this.canvas.getContext('2d');
        this.particles=[];
        this.resize();
        window.addEventListener('resize',()=>this.resize());
        this.createParticles();
        this.animate();
    }
    resize(){this.canvas.width=window.innerWidth;this.canvas.height=window.innerHeight}
    createParticles(){
        const count=80;
        for(let i=0;i<count;i++){
            this.particles.push({
                x:Math.random()*this.canvas.width,
                y:Math.random()*this.canvas.height,
                vx:(Math.random()-.5)*.5,
                vy:(Math.random()-.5)*.5,
                size:Math.random()*2+.5,
                color:['#ff00ff','#00f0ff','#b400ff','#ff2d95','#7b00ff'][Math.floor(Math.random()*5)],
                alpha:Math.random()*.5+.2,
                pulse:Math.random()*Math.PI*2
            });
        }
    }
    animate(){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        const isDark=document.documentElement.dataset.theme==='dark';
        if(isDark){
            this.particles.forEach(p=>{
                p.pulse+=.02;
                p.x+=p.vx;p.y+=p.vy;
                if(p.x<0)p.x=this.canvas.width;if(p.x>this.canvas.width)p.x=0;
                if(p.y<0)p.y=this.canvas.height;if(p.y>this.canvas.height)p.y=0;
                const a=p.alpha*(Math.sin(p.pulse)*.3+.7);
                this.ctx.beginPath();
                this.ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
                this.ctx.fillStyle=p.color;
                this.ctx.globalAlpha=a;
                this.ctx.fill();
                // Glow
                this.ctx.beginPath();
                this.ctx.arc(p.x,p.y,p.size*3,0,Math.PI*2);
                this.ctx.fillStyle=p.color;
                this.ctx.globalAlpha=a*.15;
                this.ctx.fill();
            });
            // Draw lines between close particles
            this.ctx.globalAlpha=.06;
            for(let i=0;i<this.particles.length;i++){
                for(let j=i+1;j<this.particles.length;j++){
                    const dx=this.particles[i].x-this.particles[j].x;
                    const dy=this.particles[i].y-this.particles[j].y;
                    const dist=Math.sqrt(dx*dx+dy*dy);
                    if(dist<120){
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.particles[i].x,this.particles[i].y);
                        this.ctx.lineTo(this.particles[j].x,this.particles[j].y);
                        this.ctx.strokeStyle=this.particles[i].color;
                        this.ctx.lineWidth=.5;
                        this.ctx.stroke();
                    }
                }
            }
        }
        this.ctx.globalAlpha=1;
        requestAnimationFrame(()=>this.animate());
    }
}

/* ==================== TEXT SCRAMBLE ==================== */
class TextScramble{
    constructor(el){
        this.el=el;this.chars='!<>-_\\/[]{}—=+*^?#________';
        this.originalText=el.dataset.text||el.textContent;
        this.frameRequest=null;this.frame=0;this.queue=[];
    }
    setText(newText){
        const oldText=this.el.textContent;const length=Math.max(oldText.length,newText.length);
        this.queue=[];
        for(let i=0;i<length;i++){
            const from=oldText[i]||'';const to=newText[i]||'';
            const start=Math.floor(Math.random()*20);
            const end=start+Math.floor(Math.random()*20);
            this.queue.push({from,to,start,end});
        }
        cancelAnimationFrame(this.frameRequest);
        this.frame=0;
        this.update();
        return new Promise(r=>this.resolve=r);
    }
    update(){
        let output='';let complete=0;
        for(let i=0;i<this.queue.length;i++){
            let{from,to,start,end,char}=this.queue[i];
            if(this.frame>=end){complete++;output+=to}
            else if(this.frame>=start){
                if(!char||Math.random()<.28){char=this.chars[Math.floor(Math.random()*this.chars.length)];this.queue[i].char=char}
                output+=`<span style="opacity:.4;color:var(--accent)">${char}</span>`;
            }else output+=from;
        }
        this.el.innerHTML=output;
        if(complete===this.queue.length){this.resolve?.()}
        else{this.frameRequest=requestAnimationFrame(()=>{this.frame++;this.update()})}
    }
    scrambleOnHover(){
        this.el.addEventListener('mouseenter',()=>{
            this.setText(this.originalText);
        });
    }
}

/* ==================== BOOKING POPUP (FRESHERS TAKEOVER) ==================== */
const FT_PRICING = { female: 2, male: 1 };

class BookingPopup{
    constructor(){
        this.trigger=document.getElementById('eventTrigger');
        this.bookingOverlay = document.getElementById('bookingOverlay');
        this.bookingClose = document.getElementById('bookingClose');
        this.bookingForm = document.getElementById('ticketBookingForm');
        this.totalRateEl = document.getElementById('b_totalRate');
        this.formStep = document.getElementById('bookingFormStep');
        this.successStep = document.getElementById('bookingSuccessStep');
        this.formError = document.getElementById('b_formError');
        this.submitBtn = document.getElementById('b_submitBtn');
        this.submitLabel = document.getElementById('b_submitLabel');
        this.apiBase = window.LITTLANE_API_BASE || 'http://localhost:3000';

        // ==================== EVENT FLYER POPUP ====================
        // Init flyer BEFORE the early return so it always works
        this.flyerOverlay = document.getElementById('flyerOverlay');
        this.flyerImg = document.getElementById('flyerImg');
        
        if (this.flyerOverlay) {
            // Auto open the flyer after 1 second on page load
            setTimeout(() => {
                this.flyerOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }, 1000);

            const closeFlyer = () => {
                this.flyerOverlay.classList.remove('active');
                document.body.style.overflow = '';
            };

            if (this.flyerClose) {
                this.flyerClose.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeFlyer();
                });
            }
            this.flyerOverlay.addEventListener('click', (e) => {
                if (e.target === this.flyerOverlay) closeFlyer();
            });

            if (this.flyerImg) {
                this.flyerImg.addEventListener('click', () => {
                    closeFlyer();
                    setTimeout(() => { this.openBooking(); }, 400);
                });
            }
        }

        if(!this.bookingOverlay)return;

        if(this.trigger){
            this.trigger.addEventListener('click',(e)=>{
                e.preventDefault();
                this.openBooking();
            });
        }

        // Any "Book Now" style CTA across the site opens the booking popup
        document.querySelectorAll('[data-book-trigger]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                this.openBooking();
            });
        });

        this.bookingClose.addEventListener('click', () => this.closeBooking());
        this.bookingOverlay.addEventListener('click', e =>{if(e.target===this.bookingOverlay)this.closeBooking()});

        // Rate calculation logic
        const calculateRate = () => {
            const gender = document.getElementById('b_gender').value;
            const qty = parseInt(document.getElementById('b_quantity').value) || 1;
            const rate = FT_PRICING[gender] || 0;
            this.totalRateEl.textContent = `₹${rate * qty}`;
        };

        document.getElementById('b_gender').addEventListener('change', calculateRate);
        document.getElementById('b_quantity').addEventListener('input', calculateRate);
        calculateRate(); // Initial calc

        this.bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

    }

    showError(msg){
        this.formError.textContent = msg;
        this.formError.style.display = 'block';
    }
    clearError(){
        this.formError.style.display = 'none';
        this.formError.textContent = '';
    }
    setLoading(loading){
        this.submitBtn.disabled = loading;
        this.submitBtn.style.opacity = loading ? '0.7' : '1';
        this.submitLabel.textContent = loading ? 'Processing…' : 'Pay & Get Pass';
    }

    async handleSubmit(){
        this.clearError();
        const formData = new FormData(this.bookingForm);
        const data = Object.fromEntries(formData.entries());
        this.setLoading(true);

        // ---- Step 1: create the order on the server ----
        let order;
        try {
            const res = await fetch(`${this.apiBase}/api/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            order = await res.json();
            if (!res.ok || !order.success) {
                this.showError(order.message || 'Could not start checkout. Please check your details and try again.');
                this.setLoading(false);
                return;
            }
        } catch (err) {
            console.error('[FT] create-order failed:', err);
            this.showError('Could not connect to the booking server. Make sure it is running, then try again.');
            this.setLoading(false);
            return;
        }

        // ---- Step 2: collect payment ----
        if (order.testMode) {
            // No real gateway configured yet — simulate a successful payment
            // so you can test the whole flow end-to-end.
            await this.verifyPayment({ orderId: order.orderId });
            return;
        }

        if (typeof Razorpay === 'undefined') {
            this.showError('Payment gateway failed to load. Check your internet connection and try again.');
            this.setLoading(false);
            return;
        }

        const rzp = new Razorpay({
            key: order.keyId,
            amount: order.amount * 100,
            currency: order.currency,
            name: 'Littlane Entertainment',
            description: `${order.event} — ${data.gender} pass x${data.quantity}`,
            order_id: order.orderId,
            prefill: { name: data.name, email: data.email, contact: data.phone },
            theme: { color: '#A855F7' },
            handler: (response) => {
                this.verifyPayment({
                    orderId: order.orderId,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature
                });
            },
            modal: {
                ondismiss: () => {
                    this.showError('Payment was cancelled. No amount was charged.');
                    this.setLoading(false);
                }
            }
        });

        rzp.on('payment.failed', (response) => {
            this.showError(`Payment failed: ${response.error.description || 'Please try again.'}`);
            this.setLoading(false);
        });

        rzp.open();
    }

    async verifyPayment(payload){
        try {
            const res = await fetch(`${this.apiBase}/api/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (!res.ok || !result.success) {
                this.showError(result.message || 'Payment succeeded but something went wrong issuing your ticket. Contact support.');
                this.setLoading(false);
                return;
            }

            this.showSuccess(result);
        } catch (err) {
            console.error('[FT] verify-payment failed:', err);
            this.showError('Payment may have succeeded, but we could not confirm it. Contact support with your payment details.');
            this.setLoading(false);
        }
    }

    showSuccess(result){
        this.formStep.style.display = 'none';
        this.successStep.style.display = 'block';

        const d = result.details || {};
        const genderLabel = result.gender === 'male' ? 'Male Pass' : 'Female Pass';

        document.getElementById('b_downloadBtn').href = result.downloadUrl;
        document.getElementById('b_qrImg').src = result.qrDataUrl || '';

        document.getElementById('b_pillDate').textContent = d.date || 'TBA';
        document.getElementById('b_pillTime').textContent = d.time || 'TBA';
        document.getElementById('b_pillVenue').textContent = d.venue || 'TBA';

        document.getElementById('b_sumType').textContent = genderLabel;
        document.getElementById('b_sumQty').textContent = result.quantity;
        document.getElementById('b_sumPrice').textContent = `₹${result.amount}`;

        document.getElementById('b_sumTicketId').textContent = result.ticketId;
        document.getElementById('b_sumGeneratedBy').textContent =
            `Generated by ${d.generatedBy || 'Littlane Events'} on ${new Date(result.generatedAt || Date.now()).toLocaleString('en-IN')}`;

        const emailMsg = document.getElementById('b_successEmailMsg');
        const emailErr = document.getElementById('b_emailErrorMsg');
        const emailBox = document.getElementById('b_successEmailBox');
        if (result.emailSent) {
            emailMsg.textContent = `Sent to ${result.email || 'your email'}`;
            emailBox.style.borderColor = '#22c55e';
            emailErr.style.display = 'none';
        } else {
            emailMsg.textContent = 'Ticket ready — email delivery failed';
            emailBox.style.borderColor = '#f87171';
            emailErr.textContent = `Email issue: ${result.emailError || 'unknown error'}. Use the download button below, or contact support with your Ticket ID.`;
            emailErr.style.display = 'block';
        }
    }

    openBooking(){
        this.hasOpened=true;
        this.bookingOverlay.style.display = 'flex';
        // Need a tiny delay for CSS transition to apply if it was display: none
        setTimeout(() => {
            this.bookingOverlay.classList.add('active');
        }, 10);
        document.body.style.overflow='hidden';
    }
    closeBooking(){
        if(this.bookingOverlay) {
            this.bookingOverlay.classList.remove('active');
            setTimeout(() => {
                this.bookingOverlay.style.display = 'none';
                // Reset back to the form for next time
                this.formStep.style.display = 'block';
                this.successStep.style.display = 'none';
                this.clearError();
                this.setLoading(false);
                this.bookingForm.reset();
            }, 400); // match transition duration
        }
        document.body.style.overflow='';
    }
}

/* ==================== THEME TOGGLE ==================== */
class ThemeToggle{
    constructor(){
        this.btn=document.getElementById('themeToggle');
        this.label=document.getElementById('toggleLabel');
        if(!this.btn)return;
        this.isDark=true;
        this.btn.addEventListener('click',()=>this.toggle());
    }
    toggle(){
        this.isDark=!this.isDark;
        document.documentElement.dataset.theme=this.isDark?'dark':'light';
        this.label.textContent=this.isDark?'Sundowner Theme':'Rave Mode';
        // Swap images
        document.querySelectorAll('[data-light][data-dark]').forEach(img=>{
            const src=this.isDark?img.dataset.dark:img.dataset.light;
            img.style.opacity='0';
            setTimeout(()=>{img.src=src;img.style.opacity='1'},400);
        });
    }
}

/* ==================== SMOOTH SCROLL ==================== */
class SmoothScroll{
    constructor(){
        this.current=0;this.target=0;this.ease=.08;
        this.scrollHeight=0;this.wh=window.innerHeight;
        this.isEnabled=window.matchMedia('(min-width:769px)').matches;
        if(this.isEnabled)this.init();
    }
    init(){
        window.addEventListener('wheel',this.onWheel.bind(this),{passive:false});
        window.addEventListener('resize',()=>{this.wh=window.innerHeight;this.scrollHeight=document.documentElement.scrollHeight});
        this.scrollHeight=document.documentElement.scrollHeight;
        this.current=window.scrollY;this.target=window.scrollY;
        this.update();
    }
    onWheel(e){e.preventDefault();this.target+=e.deltaY*.8;this.target=clamp(this.target,0,this.scrollHeight-this.wh)}
    update(){
        this.current=lerp(this.current,this.target,this.ease);
        if(Math.abs(this.current-this.target)<.5)this.current=this.target;
        window.scrollTo(0,this.current);
        this.scrollHeight=document.documentElement.scrollHeight;
        requestAnimationFrame(this.update.bind(this));
    }
    scrollTo(t){this.target=clamp(t,0,this.scrollHeight-this.wh)}
}

/* ==================== CURSOR ==================== */
class Cursor{
    constructor(){
        this.c=document.getElementById('cursor');this.d=document.getElementById('cursorDot');
        if(!this.c||!this.d||!window.matchMedia('(min-width:769px)').matches)return;
        this.pos={x:0,y:0};this.mouse={x:0,y:0};this.dPos={x:0,y:0};
        document.addEventListener('mousemove',e=>{this.mouse.x=e.clientX;this.mouse.y=e.clientY});
        document.querySelectorAll('a,button,.partner-tag-item,.stat-box,.partner-card,input,select,textarea,.theme-toggle').forEach(el=>{
            el.addEventListener('mouseenter',()=>this.c.classList.add('hovering'));
            el.addEventListener('mouseleave',()=>this.c.classList.remove('hovering'));
        });
        this.render();
    }
    render(){
        this.pos.x=lerp(this.pos.x,this.mouse.x,.12);this.pos.y=lerp(this.pos.y,this.mouse.y,.12);
        this.dPos.x=lerp(this.dPos.x,this.mouse.x,.6);this.dPos.y=lerp(this.dPos.y,this.mouse.y,.6);
        this.c.style.transform=`translate(${this.pos.x-20}px,${this.pos.y-20}px)`;
        this.d.style.transform=`translate(${this.dPos.x-2.5}px,${this.dPos.y-2.5}px)`;
        requestAnimationFrame(this.render.bind(this));
    }
}

/* ==================== 3D TILT ==================== */
class TiltCard{
    constructor(el){
        this.el=el;this.inner=el.querySelector('.partner-card-inner')||el;
        this.glow=el.querySelector('.partner-card-glow');
        this.rX=0;this.rY=0;this.tX=0;this.tY=0;this.hovering=false;
        el.addEventListener('mouseenter',()=>this.hovering=true);
        el.addEventListener('mouseleave',()=>{this.hovering=false;this.tX=0;this.tY=0});
        el.addEventListener('mousemove',this.onMove.bind(this));
        this.update();
    }
    onMove(e){
        if(!this.hovering)return;
        const r=this.el.getBoundingClientRect();
        this.tX=map(e.clientY-r.top,0,r.height,8,-8);
        this.tY=map(e.clientX-r.left,0,r.width,-8,8);
        if(this.glow){this.glow.style.left=(e.clientX-r.left)+'px';this.glow.style.top=(e.clientY-r.top)+'px'}
    }
    update(){
        this.rX=lerp(this.rX,this.tX,.08);this.rY=lerp(this.rY,this.tY,.08);
        this.inner.style.transform=`perspective(800px) rotateX(${this.rX}deg) rotateY(${this.rY}deg) translateZ(0)`;
        requestAnimationFrame(this.update.bind(this));
    }
}

/* ==================== MAGNETIC ==================== */
class Magnetic{
    constructor(el){
        this.el=el;this.x=0;this.y=0;this.tx=0;this.ty=0;this.str=.3;
        el.addEventListener('mouseleave',()=>{this.tx=0;this.ty=0});
        el.addEventListener('mousemove',e=>{
            const r=el.getBoundingClientRect();
            this.tx=(e.clientX-r.left-r.width/2)*this.str;
            this.ty=(e.clientY-r.top-r.height/2)*this.str;
        });
        this.update();
    }
    update(){
        this.x=lerp(this.x,this.tx,.1);this.y=lerp(this.y,this.ty,.1);
        this.el.style.transform=`translate(${this.x}px,${this.y}px)`;
        requestAnimationFrame(this.update.bind(this));
    }
}

/* ==================== FLIP COUNTER ==================== */
class FlipCounter{
    constructor(){
        document.querySelectorAll('.flip-counter').forEach(c=>{
            const o=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){this.animate(c);o.unobserve(c)}})},{threshold:.3});
            o.observe(c);
        });
    }
    animate(el){
        if(el.dataset.counted)return;el.dataset.counted='true';
        const target=parseInt(el.dataset.flip);const suffix=el.dataset.suffix||'';
        const numEl=el.querySelector('.flip-num');const duration=2200;const start=performance.now();
        const digits=String(target).length;
        numEl.innerHTML='';const slots=[];
        for(let i=0;i<digits;i++){
            const slot=document.createElement('span');
            slot.style.cssText='display:inline-block;overflow:hidden;height:1.05em;vertical-align:bottom;position:relative;';
            const inner=document.createElement('span');
            inner.style.cssText='display:block;will-change:transform;';
            for(let d=0;d<=9;d++){const dEl=document.createElement('span');dEl.style.cssText='display:block;height:1.05em;line-height:1.05em;';dEl.textContent=d;inner.appendChild(dEl)}
            slot.appendChild(inner);numEl.appendChild(slot);slots.push({slot,inner,cur:0});
        }
        if(suffix){const s=document.createElement('span');s.textContent=suffix;s.style.cssText='opacity:0;transition:opacity .4s ease';numEl.appendChild(s);setTimeout(()=>s.style.opacity='1',duration+200)}
        const tick=now=>{
            const elapsed=now-start;const p=Math.min(elapsed/duration,1);const eased=easeOutExpo(p);
            const cur=Math.round(eased*target);const str=String(cur).padStart(digits,'0');
            for(let i=0;i<digits;i++){
                const digit=parseInt(str[i]);
                if(slots[i].cur!==digit){slots[i].cur=digit;slots[i].inner.style.transition='transform .35s cubic-bezier(.16,1,.3,1)';slots[i].inner.style.transform=`translateY(-${digit*1.05}em)`}
            }
            if(p<1)requestAnimationFrame(tick);
            else{const finalStr=String(target);for(let i=0;i<digits;i++){if(i<digits-finalStr.length){slots[i].slot.style.width='0';slots[i].slot.style.overflow='hidden';slots[i].slot.style.transition='width .3s ease'}}}
        };
        requestAnimationFrame(tick);
    }
}

/* ==================== VELOCITY MARQUEE ==================== */
class VelocityMarquee{
    constructor(){
        this.track=document.getElementById('marqueeTrack');
        if(!this.track)return;
        this.velocity=0;this.targetVelocity=0;this.baseSpeed=1;
        this.lastScrollY=window.scrollY;
        window.addEventListener('scroll',()=>{
            const delta=Math.abs(window.scrollY-this.lastScrollY);
            this.targetVelocity=clamp(delta*.08,0,4);
            this.lastScrollY=window.scrollY;
        },{passive:true});
        this.skewTarget=0;this.skew=0;
        this.update();
    }
    update(){
        this.velocity=lerp(this.velocity,this.targetVelocity,.05);
        this.targetVelocity=lerp(this.targetVelocity,0,.02);
        const speed=this.baseSpeed+this.velocity;
        this.skewTarget=clamp(this.velocity*2,-8,8);
        this.skew=lerp(this.skew,this.skewTarget,.06);
        this.track.style.transform=`skewX(${this.skew}deg)`;
        requestAnimationFrame(()=>this.update());
    }
}

/* ==================== IMAGE REVEAL ==================== */
class ImageReveal{
    constructor(){
        document.querySelectorAll('.image-reveal').forEach(el=>{
            const o=new IntersectionObserver(entries=>{entries.forEach(e=>{
                if(e.isIntersecting){e.target.classList.add('revealed');o.unobserve(e.target)}
            })},{threshold:.2});
            o.observe(el);
        });
    }
}

/* ==================== SCROLL REVEALS ==================== */
class ScrollReveal{
    constructor(){this.initSplitLines();this.initRevealTexts();this.initWhyItems();this.initPerkItems();this.initPartnerCards();this.initPartnerTags();this.initStatItems();this.initContactInfo();this.initForm()}
    obs(threshold=.2,rm='0px 0px -50px 0px'){return new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target._onReveal?.()})},{threshold,rootMargin:rm})}
    initSplitLines(){
        const o=this.obs(.25,'0px 0px -30px 0px');
        document.querySelectorAll('.split-line-wrap').forEach(wrap=>{
            const line=wrap.querySelector('.split-line');if(!line)return;
            const siblings=Array.from(wrap.parentElement.querySelectorAll('.split-line-wrap'));
            const idx=siblings.indexOf(wrap);
            wrap._onReveal=()=>{setTimeout(()=>line.classList.add('in-view'),idx*100);o.unobserve(wrap)};
            o.observe(wrap);
        });
    }
    initRevealTexts(){const o=this.obs(.15);document.querySelectorAll('.reveal-text').forEach(el=>{el._onReveal=()=>{el.classList.add('in-view');o.unobserve(el)};o.observe(el)})}
    initWhyItems(){const o=this.obs(.1,'0px 0px -20px 0px');document.querySelectorAll('[data-why-item]').forEach((item,i)=>{item._onReveal=()=>{setTimeout(()=>item.classList.add('in-view'),i*70);o.unobserve(item)};o.observe(item)})}
    initPerkItems(){const o=this.obs(.2);document.querySelectorAll('.perk-item').forEach((item,i)=>{item._onReveal=()=>{setTimeout(()=>item.classList.add('in-view'),i*90);o.unobserve(item)};o.observe(item)})}
    initPartnerCards(){
        const o=this.obs(.15);
        document.querySelectorAll('.partner-card').forEach((card,i)=>{
            card.style.opacity='0';card.style.transform='translateY(50px)';
            card._onReveal=()=>{setTimeout(()=>{card.style.transition='opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)';card.style.opacity='1';card.style.transform='translateY(0)'},i*100);o.unobserve(card)};
            o.observe(card);
        });
    }
    initPartnerTags(){
        const tags=document.querySelectorAll('.partner-tag-item');
        tags.forEach(t=>{t.style.opacity='0';t.style.transform='translateY(20px)'});
        const container=document.querySelector('.partner-tags-grid');if(!container)return;
        const o=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){tags.forEach((t,i)=>{setTimeout(()=>{t.style.transition='opacity .5s cubic-bezier(.16,1,.3,1),transform .5s cubic-bezier(.16,1,.3,1)';t.style.opacity='1';t.style.transform='translateY(0)'},i*50)});o.unobserve(e.target)}})},{threshold:.2});
        o.observe(container);
    }
    initStatItems(){
        const items=document.querySelectorAll('.stat-item');
        items.forEach(i=>{i.style.opacity='0';i.style.transform='translateY(40px)'});
        const o=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){const all=e.target.closest('.stats-grid')?.querySelectorAll('.stat-item')||[];all.forEach((item,i)=>{setTimeout(()=>{item.style.transition='opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)';item.style.opacity='1';item.style.transform='translateY(0)'},i*100)});o.unobserve(e.target)}})},{threshold:.2});
        items.forEach(i=>o.observe(i));
    }
    initContactInfo(){
        const items=document.querySelectorAll('.contact-info-item');
        items.forEach(i=>{i.style.opacity='0';i.style.transform='translateY(20px)'});
        const o=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){const idx=Array.from(e.target.parentElement?.querySelectorAll('.contact-info-item')||[]).indexOf(e.target);setTimeout(()=>{e.target.style.transition='opacity .6s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1)';e.target.style.opacity='1';e.target.style.transform='translateY(0)'},idx*80);o.unobserve(e.target)}})},{threshold:.2});
        items.forEach(i=>o.observe(i));
    }
    initForm(){
        const form=document.querySelector('.contact-form');if(!form)return;
        form.style.opacity='0';form.style.transform='translateY(32px)';
        const o=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){form.style.transition='opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)';form.style.opacity='1';form.style.transform='translateY(0)';o.unobserve(form)}})},{threshold:.1});
        o.observe(form);
    }
}

/* ==================== HERO ANIMATION ==================== */
class HeroAnim{
    constructor(){
        this.lines1=document.querySelectorAll('.js-hero-line-1');this.lines2=document.querySelectorAll('.js-hero-line-2');
        this.lefts1=document.querySelectorAll('.js-hero-left-1');this.lefts2=document.querySelectorAll('.js-hero-left-2');
        this.rights1=document.querySelectorAll('.js-hero-right-1');this.rights2=document.querySelectorAll('.js-hero-right-2');
        this.tag=document.querySelector('.hero-tagline');
        this.cta=document.querySelector('.hero-sub-section .btn-primary');
        this.bg=document.getElementById('heroBgImg');
    }
    play(){
        if(this.bg){this.bg.style.transform='scale(1.12)';this.bg.style.transition='transform 3s cubic-bezier(.16,1,.3,1)';setTimeout(()=>this.bg.style.transform='scale(1.02)',80)}
        [this.lines1,this.lines2].forEach((nl,i)=>{nl.forEach(l=>{l.style.transition='transform 1.3s cubic-bezier(.16,1,.3,1),opacity .8s ease';setTimeout(()=>{l.style.transform='translateY(0) rotateX(0)';l.style.opacity='1'},200+i*180)})});
        [this.lefts1,this.lefts2].forEach((nl,i)=>{nl.forEach(el=>{el.style.transition='transform 1s cubic-bezier(.16,1,.3,1),opacity .7s ease';setTimeout(()=>{el.style.transform='translateY(0)';el.style.opacity='1'},850+i*90)})});
        [this.rights1,this.rights2].forEach((nl,i)=>{nl.forEach(el=>{el.style.transition='transform 1s cubic-bezier(.16,1,.3,1),opacity .7s ease';setTimeout(()=>{el.style.transform='translateY(0)';el.style.opacity='1'},900+i*90)})});
        if(this.tag){this.tag.style.transition='opacity 1s ease,transform 1s cubic-bezier(.16,1,.3,1)';setTimeout(()=>{this.tag.style.opacity='.55';this.tag.style.transform='translateY(0)'},1200)}
        if(this.cta){this.cta.style.opacity='0';this.cta.style.transform='translateY(20px)';this.cta.style.transition='opacity .8s ease,transform .8s cubic-bezier(.16,1,.3,1)';setTimeout(()=>{this.cta.style.opacity='1';this.cta.style.transform='translateY(0)'},1500)}
    }
}

/* ==================== PARALLAX ==================== */
class Parallax{
    constructor(){
        this.heroBg=document.querySelector('.hero-bg');
        this.imgs=document.querySelectorAll('.parallax-img img');
        window.addEventListener('scroll',this.onScroll.bind(this),{passive:true});
    }
    onScroll(){
        const sy=window.scrollY;
        if(this.heroBg&&sy<window.innerHeight*1.5)this.heroBg.style.transform=`translate3d(0,${sy*.2}px,0)`;
        this.imgs.forEach(img=>{
            const r=img.getBoundingClientRect();
            if(r.top<window.innerHeight&&r.bottom>0){
                const off=(r.top-window.innerHeight/2)*.06;
                img.style.transform=`translate3d(0,${off}px,0) scale(1.06)`;
            }
        });
    }
}

/* ==================== HERO MOUSE 3D ==================== */
class HeroMouse{
    constructor(){
        this.hero=document.querySelector('.hero');this.content=document.querySelector('.hero-content');
        if(!this.hero||!this.content||!window.matchMedia('(min-width:769px)').matches)return;
        this.rx=0;this.ry=0;this.tx=0;this.ty=0;
        this.hero.addEventListener('mousemove',e=>{
            const r=this.hero.getBoundingClientRect();
            this.tx=((e.clientY-r.top)/r.height-.5)*-2.5;
            this.ty=((e.clientX-r.left)/r.width-.5)*2.5;
        });
        this.hero.addEventListener('mouseleave',()=>{this.tx=0;this.ty=0});
        this.update();
    }
    update(){
        this.rx=lerp(this.rx,this.tx,.04);this.ry=lerp(this.ry,this.ty,.04);
        this.content.style.transform=`perspective(1200px) rotateX(${this.rx}deg) rotateY(${this.ry}deg)`;
        requestAnimationFrame(this.update.bind(this));
    }
}

/* ==================== FOOTER TEXT PARALLAX ==================== */
class FooterTextParallax{
    constructor(){
        this.el=document.querySelector('.footer-mega-text');if(!this.el)return;
        window.addEventListener('scroll',()=>{
            const r=this.el.getBoundingClientRect();
            if(r.top<window.innerHeight&&r.bottom>0){
                const progress=(window.innerHeight-r.top)/(window.innerHeight+r.height);
                this.el.style.transform=`translateX(${(progress-.5)*-80}px)`;
            }
        },{passive:true});
    }
}

/* ==================== LOADER ==================== */
class Loader{
    constructor(cb){
        this.loader=document.getElementById('loader');this.pct=document.getElementById('loaderPercent');this.cb=cb;
        this.run();
    }
    run(){
        const dur=1800;const start=performance.now();
        const tick=now=>{
            const p=Math.min((now-start)/dur,1);
            this.pct.textContent=Math.round(easeInOutCubic(p)*100);
            if(p<1)requestAnimationFrame(tick);
            else setTimeout(()=>{this.loader.classList.add('done');document.body.style.overflow='';setTimeout(()=>this.cb(),350)},200);
        };
        document.body.style.overflow='hidden';requestAnimationFrame(tick);
    }
}

/* ==================== NAVBAR ==================== */
class Navbar{constructor(){const n=document.getElementById('navbar');window.addEventListener('scroll',()=>n.classList.toggle('scrolled',window.scrollY>50),{passive:true})}}

/* ==================== MOBILE MENU ==================== */
class MobileMenu{
    constructor(){
        const h=document.getElementById('hamburger');const m=document.getElementById('mobileMenu');if(!h||!m)return;
        h.addEventListener('click',()=>{h.classList.toggle('active');m.classList.toggle('active');document.body.style.overflow=m.classList.contains('active')?'hidden':''});
        m.querySelectorAll('.mobile-link,.mobile-cta').forEach(l=>l.addEventListener('click',()=>{h.classList.remove('active');m.classList.remove('active');document.body.style.overflow=''}));
    }
}

/* ==================== FAQ ==================== */
class FAQ{
    constructor(){
        document.querySelectorAll('.faq-question').forEach(btn=>{
            btn.addEventListener('click',()=>{
                const item=btn.closest('.faq-item');const active=item.classList.contains('active');
                document.querySelectorAll('.faq-item.active').forEach(f=>f.classList.remove('active'));
                if(!active)item.classList.add('active');
            });
        });
    }
}

/* ==================== SMOOTH LINKS ==================== */
class SmoothLinks{
    constructor(ss){
        document.querySelectorAll('a[href^="#"]').forEach(a=>{
            a.addEventListener('click',e=>{
                e.preventDefault();const t=document.querySelector(a.getAttribute('href'));
                if(t){const top=t.getBoundingClientRect().top+window.scrollY-80;ss&&ss.isEnabled?ss.scrollTo(top):window.scrollTo({top,behavior:'smooth'})}
            });
        });
    }
}

/* ==================== SCROLL PROGRESS ==================== */
class ScrollProgress{constructor(){this.bar=document.getElementById('scrollProgress');if(!this.bar)return;window.addEventListener('scroll',()=>{const p=(window.scrollY/(document.documentElement.scrollHeight-window.innerHeight))*100;this.bar.style.width=p+'%'},{passive:true})}}

/* ==================== CONTACT FORM ==================== */
class ContactForm{
    constructor(){
        const form=document.getElementById('contactForm');if(!form)return;
        form.addEventListener('submit',e=>{
            const btn=document.getElementById('form-submit');
            const txt=btn.querySelector('.btn-text');const arr=btn.querySelector('.btn-arrow');
            txt.textContent='Redirecting...';arr.textContent='→';btn.disabled=true;btn.style.opacity='.7';
        });
    }
}

/* ==================== SECTION PARALLAX DEPTH ==================== */
class SectionParallaxDepth{
    constructor(){
        this.sections=document.querySelectorAll('.why-section,.stats-section,.faq-section');
        window.addEventListener('scroll',()=>{
            this.sections.forEach(section=>{
                const r=section.getBoundingClientRect();
                if(r.top<window.innerHeight&&r.bottom>0){
                    const progress=(window.innerHeight-r.top)/(window.innerHeight+r.height);
                    const label=section.querySelector('.section-label,.section-label-light');
                    if(label)label.style.transform=`translateX(${(progress-.5)*20}px)`;
                }
            });
        },{passive:true});
    }
}

/* ==================== INIT ==================== */
window.addEventListener('load',()=>{
    const hero=new HeroAnim();
    new Loader(()=>{
        hero.play();
        const ss=new SmoothScroll();
        new Cursor();new ScrollReveal();new FlipCounter();new Parallax();
        new Navbar();new MobileMenu();new FAQ();new SmoothLinks(ss);
        new ContactForm();new ScrollProgress();new HeroMouse();
        new ThemeToggle();new Particles();new VelocityMarquee();new BookingPopup();
        new ImageReveal();new FooterTextParallax();new SectionParallaxDepth();
        document.querySelectorAll('.partner-card[data-tilt]').forEach(el=>new TiltCard(el));
        document.querySelectorAll('.stat-box[data-tilt]').forEach(el=>new TiltCard(el));
        if(window.matchMedia('(min-width:769px)').matches)
            document.querySelectorAll('[data-magnetic]').forEach(el=>new Magnetic(el));
    });
});

})();
